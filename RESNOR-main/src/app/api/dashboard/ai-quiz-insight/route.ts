import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

export async function POST(request: Request) {
  try {
    const { student_id } = await request.json()
    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: student_id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const attempts = await db.quizAttempt.findMany({
      where: { studentId: student_id },
      include: { quiz: { include: { topic: true } } },
      orderBy: { completedAt: 'desc' },
      take: 30,
    })

    if (attempts.length === 0) {
      return NextResponse.json({ avgScore: 0, totalQuizzes: 0, insights: [] })
    }

    const avgScore = Math.round(
      attempts.reduce((sum, a) => sum + (a.totalQuestions > 0 ? (a.correctCount / a.totalQuestions) * 100 : 0), 0) /
        attempts.length
    )

    const topicScoresRaw: Record<string, number[]> = {}
    for (const a of attempts) {
      const topicName = a.quiz?.topic?.name || 'Unknown'
      if (!topicScoresRaw[topicName]) topicScoresRaw[topicName] = []
      const score = a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0
      topicScoresRaw[topicName].push(score)
    }

    const topicAverages = Object.entries(topicScoresRaw)
      .map(([name, scores]) => ({
        name,
        avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
      }))
      .sort((a, b) => a.avg - b.avg)

    const weakest = topicAverages[0] || null
    const strongest = topicAverages[topicAverages.length - 1] || null
    const baseline = strongest ? strongest.avg : avgScore

    const allProgress = await db.materialProgress.findMany({ where: { studentId: student_id } })
    const totalTimeMinutes = Math.floor(allProgress.reduce((sum, p) => sum + p.timeSpent, 0) / 60)

    let insights = buildFallbackInsights(topicAverages, baseline, avgScore)

    if (groq.apiKey) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a quiz performance coach. Generate insights for a student based on their quiz data.

Return ONLY valid JSON with this exact structure (no markdown):
{"insights":[{"topic":"Topic Name","gain":8},{"topic":"Another Topic","gain":5}]}

Rules:
- topic must be the exact topic name
- gain is the estimated percentage improvement if they focus on this topic (integer 1-20)
- Sort by gain descending (highest gain first)
- Include 2-4 topics (the ones with biggest improvement potential)
- Only include topics where gain > 0`,
            },
            {
              role: 'user',
              content: JSON.stringify({
                name: user.name,
                averageQuizScore: avgScore,
                totalQuizzes: attempts.length,
                topics: topicAverages.map(t => ({ name: t.name, avgScore: t.avg })),
                strongestTopicAvg: baseline,
                totalStudyMinutes: totalTimeMinutes,
              }),
            },
          ],
          temperature: 0.7,
          max_tokens: 512,
        })

        const content = completion.choices[0]?.message?.content || ''
        const match = content.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          if (parsed.insights && Array.isArray(parsed.insights) && parsed.insights.length > 0) {
            insights = parsed.insights
          }
        }
      } catch (e) {
        console.error('Groq quiz insight error:', e)
      }
    }

    return NextResponse.json({ avgScore, totalQuizzes: attempts.length, insights })
  } catch (error) {
    console.error('AI quiz insight error:', error)
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 })
  }
}

function buildFallbackInsights(
  topics: { name: string; avg: number }[],
  baseline: number,
  avgScore: number
) {
  if (topics.length === 0) return []

  return topics
    .filter(t => t.avg < baseline)
    .map(t => ({
      topic: t.name,
      gain: Math.min(Math.round(((baseline - t.avg) / baseline) * 100 * 0.6), 20),
    }))
    .filter(t => t.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 4)
}
