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

    const topicScoresRaw: Record<string, { scores: number[]; attempts: { score: number; date: string }[] }> = {}
    for (const a of attempts) {
      const topicName = a.quiz?.topic?.name || 'Unknown'
      if (!topicScoresRaw[topicName]) topicScoresRaw[topicName] = { scores: [], attempts: [] }
      const score = a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0
      topicScoresRaw[topicName].scores.push(score)
      topicScoresRaw[topicName].attempts.push({
        score,
        date: a.completedAt.toISOString().split('T')[0],
      })
    }

    const topicAverages = Object.entries(topicScoresRaw)
      .map(([name, data]) => ({
        name,
        avg: Math.round(data.scores.reduce((s, v) => s + v, 0) / data.scores.length),
        recent: data.attempts.slice(-3).reverse(),
      }))
      .sort((a, b) => a.avg - b.avg)

    const weakest = topicAverages[0] || null
    const secondWeakest = topicAverages[1] || null

    const allProgress = await db.materialProgress.findMany({ where: { studentId: student_id } })
    const totalTime = Math.floor(allProgress.reduce((sum, p) => sum + p.timeSpent, 0) / 60)

    if (!weakest) {
      return NextResponse.json({ analysis: 'Not enough quiz data to analyze weak topics. Complete a few quizzes first!' })
    }

    // Fetch wrong answers on the weakest topic
    const weakTopicAttempts = await db.quizAttempt.findMany({
      where: {
        studentId: student_id,
        quiz: { topic: { name: weakest.name } },
      },
      include: {
        answers: {
          where: { isCorrect: false },
          include: { question: true },
        },
      },
      take: 10,
    })

    const wrongQuestions = weakTopicAttempts
      .flatMap(a => a.answers)
      .slice(0, 8)
      .map(a => a.question.question)

    const prompt = `You are an academic coach. Analyze this student's weakest topic and provide a concise, actionable analysis based on the actual questions they got wrong.

Student: ${user.name}
Weakest Topic: ${weakest.name} (avg score: ${weakest.avg}%)
${secondWeakest ? `Second weakest: ${secondWeakest.name} (avg score: ${secondWeakest.avg}%)` : ''}
Recent attempts on weakest topic: ${JSON.stringify(weakest.recent)}
Total study time: ${totalTime} minutes
Questions they failed to answer correctly: ${JSON.stringify(wrongQuestions)}

Return ONLY valid JSON with this structure (no markdown):
{
  "rootCause": "1-2 sentences explaining why they might be struggling — reference the types of questions they're getting wrong",
  "strategy": "1-2 sentences with a specific study strategy targeting those exact mistake patterns",
  "focusAreas": ["specific concept 1 based on wrong questions", "specific concept 2", "specific concept 3"],
  "estimatedPracticeNeeded": "e.g. '2-3 hours' or '5 practice quizzes'",
  "confidence": "struggling" | "improving" | "needs_consistency"
}`

    let analysis = {
      rootCause: 'Keep practicing! Review the fundamentals and try again.',
      strategy: 'Focus on understanding core concepts before attempting advanced problems.',
      focusAreas: ['Core concepts', 'Practice problems'],
      estimatedPracticeNeeded: '3-5 practice sessions',
      confidence: 'struggling' as const,
    }

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
          if (parsed.rootCause) analysis = { ...analysis, ...parsed }
        }
      } catch (e) {
        console.error('Groq weak topic error:', e)
      }
    }

    return NextResponse.json({
      topic: weakest.name,
      avgScore: weakest.avg,
      analysis,
    })
  } catch (error) {
    console.error('AI weak topic error:', error)
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500 })
  }
}
