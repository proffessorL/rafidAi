import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

const EXAM_TEMPLATES = [
  { course: 'CSE 201', title: 'Data Structures & Algorithms I', topics: ['Arrays & Linked Lists', 'Recursion', 'Big-O Complexity'] },
  { course: 'CSE 203', title: 'Data Structures & Algorithms II', topics: ['Trees & BST', 'Hash Tables', 'Sorting Algorithms'] },
  { course: 'CSE 301', title: 'Advanced Algorithms', topics: ['Graphs & Traversal', 'Dynamic Programming'] },
  { course: 'CSE 202', title: 'Discrete Mathematics', topics: ['Mathematical Logic', 'Set Theory', 'Graph Theory'] },
]

function getExamRoutine() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find the next Wednesday
  const dayOfWeek = today.getDay()
  const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7
  const firstExam = new Date(today)
  firstExam.setDate(firstExam.getDate() + daysUntilWednesday)

  const examDates = [firstExam]
  const gaps = [2, 3, 3]
  for (let i = 0; i < gaps.length; i++) {
    const prev = new Date(examDates[i])
    prev.setDate(prev.getDate() + gaps[i])
    examDates.push(prev)
  }

  return EXAM_TEMPLATES.map((t, i) => {
    const d = examDates[i]
    const daysUntil = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return {
      ...t,
      date: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      daysUntil,
      isoDate: d.toISOString().split('T')[0],
    }
  })
}

export async function POST(request: Request) {
  try {
    const { student_id } = await request.json()
    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: student_id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const allProgress = await db.materialProgress.findMany({
      where: { studentId: student_id },
      include: { material: { include: { topic: true } } },
    })

    const pending = allProgress.filter(p => p.completionStatus === 'pending')
    const inProgress = allProgress.filter(p => p.completionStatus === 'in_progress')
    const completed = allProgress.filter(p => p.completionStatus === 'done')

    const pendingByTopic: Record<string, { title: string; materialCount: number }> = {}
    const unfinished = [...pending, ...inProgress]
    for (const p of unfinished) {
      const topicName = p.material?.topic?.name || 'Unknown'
      if (!pendingByTopic[topicName]) {
        pendingByTopic[topicName] = { title: topicName, materialCount: 0 }
      }
      pendingByTopic[topicName].materialCount++
    }

    if (unfinished.length === 0) {
      return NextResponse.json({
        suggestions: [],
        routine: [],
        summary: { completed: completed.length, inProgress: inProgress.length, pending: 0, total: allProgress.length },
      })
    }

    const streak = await db.streak.findUnique({ where: { studentId: student_id } })
    const engagement = await db.engagementScore.findUnique({ where: { studentId: student_id } })

    const routine = getExamRoutine()

    const prompt = `You are an academic priority coach. Based on the student's material progress and upcoming exam schedule, generate prioritized study suggestions.

Student: ${user.name}
Current streak: ${streak?.currentStreak || 0} days
Engagement score: ${engagement?.overallScore || 0}

Upcoming exams (days until = countdown):
${routine.map(e => `- ${e.course} (${e.title}) on ${e.date} (${e.daysUntil} days away): topics [${e.topics.join(', ')}]`).join('\n')}

Completed materials count: ${completed.length}
In-progress materials count: ${inProgress.length}
Unfinished materials by topic: ${JSON.stringify(pendingByTopic)}

Return ONLY valid JSON with this structure (no markdown):
{"suggestions":[{"topic":"Topic Name","reason":"one sentence explaining why — mention the exam name and how many days left","priority":"high|medium|low","estimatedTime":"e.g. 2 hours"}]}

Rules:
- High priority = exam in ≤7 days with unfinished materials for that topic
- Medium priority = exam in 8-14 days
- Low priority = no exam pressure or >14 days away
- Include 2-4 suggestions sorted by priority (highest first)
- Only include topics the student has unfinished materials for`

    let suggestions = buildFallbackSuggestions(pendingByTopic, routine)

    if (groq.apiKey) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are a helpful academic coach. Return only valid JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        })

        const content = completion.choices[0]?.message?.content || ''
        const match = content.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          if (parsed.suggestions && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
            suggestions = parsed.suggestions
          }
        }
      } catch (e) {
        console.error('Groq material priority error:', e)
      }
    }

    return NextResponse.json({
      suggestions,
      routine: routine.map(r => ({ course: r.course, title: r.title, date: r.date, daysUntil: r.daysUntil, topics: r.topics })),
      summary: {
        completed: completed.length,
        inProgress: inProgress.length,
        pending: pending.length,
        total: allProgress.length,
      },
    })
  } catch (error) {
    console.error('AI material priority error:', error)
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 })
  }
}

function buildFallbackSuggestions(
  pendingByTopic: Record<string, { title: string; materialCount: number }>,
  routine: ReturnType<typeof getExamRoutine>
) {
  const topics = Object.values(pendingByTopic)
  if (topics.length === 0) return []

  return topics.map(t => {
    const examMatch = routine.find(e =>
      e.topics.some(topic => t.title.toLowerCase().includes(topic.toLowerCase()))
    )
    const priority = examMatch
      ? examMatch.daysUntil <= 7 ? 'high' : examMatch.daysUntil <= 14 ? 'medium' : 'low'
      : 'low'

    const totalMinutes = t.materialCount * 30
    let estimatedTime: string
    if (examMatch && examMatch.daysUntil <= 7) {
      const daysLeft = examMatch.daysUntil
      const sessionsNeeded = Math.ceil(totalMinutes / 45)
      estimatedTime = `${sessionsNeeded} session${sessionsNeeded > 1 ? 's' : ''} of 45 min over ${Math.min(daysLeft, sessionsNeeded)} day${Math.min(daysLeft, sessionsNeeded) > 1 ? 's' : ''}`
    } else if (examMatch && examMatch.daysUntil <= 14) {
      estimatedTime = `~${totalMinutes} min total — spread over ${Math.ceil(totalMinutes / 60)} day${Math.ceil(totalMinutes / 60) > 1 ? 's' : ''}`
    } else {
      estimatedTime = `~${totalMinutes} min`
    }

    return {
      topic: t.title,
      reason: examMatch
        ? `${examMatch.course} is ${examMatch.daysUntil} days away — ${t.materialCount} material${t.materialCount > 1 ? 's' : ''} still unfinished.`
        : `${t.materialCount} material${t.materialCount > 1 ? 's' : ''} unfinished — start early to stay ahead.`,
      priority,
      estimatedTime,
    }
  }).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })
}
