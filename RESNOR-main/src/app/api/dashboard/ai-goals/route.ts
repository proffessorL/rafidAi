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

    const allProgress = await db.materialProgress.findMany({ where: { studentId: student_id } })
    const total = allProgress.length
    const done = allProgress.filter(p => p.completionStatus === 'done').length
    const inProgress = allProgress.filter(p => p.completionStatus === 'in_progress').length
    const pending = total - done - inProgress

    const attempts = await db.quizAttempt.findMany({
      where: { studentId: student_id },
      include: { quiz: { include: { topic: true } } },
      orderBy: { completedAt: 'desc' },
      take: 10,
    })
    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.correctCount / Math.max(a.totalQuestions, 1)) * 100, 0) / attempts.length * 10) / 10
      : 0
    const highScoreQuizCount = attempts.filter(a => a.totalQuestions > 0 && (a.correctCount / a.totalQuestions) >= 0.8).length

    const streak = await db.streak.findUnique({ where: { studentId: student_id } })
    const progress = await db.studentProgress.findUnique({ where: { studentId: student_id } })
    const engagement = await db.engagementScore.findUnique({ where: { studentId: student_id } })

    const totalTimeMinutes = Math.floor(allProgress.reduce((sum, p) => sum + p.timeSpent, 0) / 60)

    const topicScoresRaw: Record<string, number[]> = {}
    for (const a of attempts) {
      const topicName = a.quiz?.topic?.name || 'Unknown'
      if (!topicScoresRaw[topicName]) topicScoresRaw[topicName] = []
      topicScoresRaw[topicName].push(a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0)
    }
    const topicAverages = Object.entries(topicScoresRaw).map(([name, scores]) => ({
      name,
      avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
      scores,
    })).sort((a, b) => a.avg - b.avg)

    const metricsSummary = {
      name: user.name,
      materials: { total, done, inProgress, pending, completionPercent: total > 0 ? Math.round((done / total) * 100) : 0 },
      quizAttempts: attempts.length,
      averageQuizScore: avgScore,
      highScoreQuizCount,
      streak: streak ? { current: streak.currentStreak, longest: streak.longestStreak, totalDays: streak.totalActiveDays } : { current: 0, longest: 0, totalDays: 0 },
      totalStudyMinutes: totalTimeMinutes,
      level: progress?.level || 1,
      xp: progress?.xp || 0,
      engagementScore: engagement?.overallScore || 0,
      weakestTopics: topicAverages.slice(0, 3),
      strongestTopics: topicAverages.slice(-3).reverse(),
    }

    let goals = getFallbackGoals(metricsSummary)

    if (groq.apiKey) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a student success coach. Generate exactly 4 personalized SMART goals for a student based on their performance data.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{"goals":[{"id":"goal_1","label":"short actionable label","description":"one sentence why","target":80,"current":50,"unit":"%","icon":"target"}]}

Rules:
- id must be goal_1 through goal_4
- label must be concise (max 50 chars), action-oriented, measurable
- description is one short sentence explaining why this goal matters
- current and target are numeric values representing progress
- unit is the measurement unit string like "%", "h", "quiz", "day"
- icon must be one of: target, book, brain, clock, flame, award, star, zap
- Generate diverse goals covering study consistency, quiz performance, weak topics, and engagement
- Make targets challenging but achievable (+15-30% from current)`,
            },
            {
              role: 'user',
              content: `Generate 4 personalized SMART goals for this student: ${JSON.stringify(metricsSummary)}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        })

        const content = completion.choices[0]?.message?.content || ''
        const match = content.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          if (parsed.goals && parsed.goals.length === 4) {
            goals = parsed.goals
          }
        }
      } catch (aiError) {
        console.error('Groq AI goals error:', aiError)
      }
    }

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('AI goals error:', error)
    return NextResponse.json({ error: 'Failed to generate goals' }, { status: 500 })
  }
}

function getFallbackGoals(metrics: any) {
  const studyHoursTarget = Math.max(Math.ceil(metrics.totalStudyMinutes / 60 * 1.3), 10)
  const quizTarget = Math.max(metrics.highScoreQuizCount + 2, 3)
  const streakTarget = Math.max(metrics.streak.current + 3, 7)
  const scoreTarget = Math.min(Math.ceil(metrics.averageQuizScore * 1.15 / 5) * 5, 95) || 75

  return [
    { id: 'goal_1', label: `Study ${studyHoursTarget} hours this week`, description: 'Consistent study time builds strong habits', current: Math.round(metrics.totalStudyMinutes / 60), target: studyHoursTarget, unit: 'h', icon: 'clock' },
    { id: 'goal_2', label: `Score ${scoreTarget}%+ on quizzes`, description: 'Improving accuracy deepens understanding', current: Math.round(metrics.averageQuizScore), target: scoreTarget, unit: '%', icon: 'target' },
    { id: 'goal_3', label: `Complete ${quizTarget} high-scoring quizzes`, description: 'Aim for 80%+ to master each topic', current: metrics.highScoreQuizCount, target: quizTarget, unit: 'quiz', icon: 'brain' },
    { id: 'goal_4', label: `Maintain a ${streakTarget}-day streak`, description: 'Daily learning keeps knowledge fresh', current: metrics.streak.current, target: streakTarget, unit: 'day', icon: 'flame' },
  ]
}
