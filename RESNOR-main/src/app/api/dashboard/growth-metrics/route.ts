import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const studentId = 'stu_001'

    const allProgress = await db.materialProgress.findMany({
      where: { studentId },
      include: { material: { include: { topic: true } } },
    })

    const total = allProgress.length
    const done = allProgress.filter(p => p.completionStatus === 'done').length
    const inProgress = allProgress.filter(p => p.completionStatus === 'in_progress').length
    const pending = total - done - inProgress

    const attempts = await db.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: { include: { topic: true } } },
      orderBy: { completedAt: 'desc' },
    })

    const avgScore = attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length : 0

    const streak = await db.streak.findUnique({ where: { studentId } })
    const totalTimeSeconds = allProgress.reduce((sum, p) => sum + p.timeSpent, 0)

    const topicScores: Record<string, { score: number; date: string }[]> = {}
    for (const attempt of attempts) {
      const topicName = attempt.quiz?.topic?.name || 'Unknown'
      if (!topicScores[topicName]) topicScores[topicName] = []
      topicScores[topicName].push({
        score: attempt.score,
        date: attempt.completedAt.toISOString().split('T')[0],
      })
    }

    const engagement = await db.engagementScore.findUnique({ where: { studentId } })

    return NextResponse.json({
      materialProgress: { total, done, inProgress, pending },
      quizAttempts: attempts,
      averageQuizScore: Math.round(avgScore * 10) / 10,
      streak: streak ? { current: streak.currentStreak, longest: streak.longestStreak, totalDays: streak.totalActiveDays } : null,
      totalTimeMinutes: Math.floor(totalTimeSeconds / 60),
      topicScores,
      engagement: engagement ? {
        overallScore: engagement.overallScore,
        consistency: engagement.studyConsistencyRate,
        avgSession: engagement.avgSessionDuration,
        weeklyHours: engagement.weeklyActiveHours,
        interactionDensity: engagement.interactionDensity,
      } : null,
    })
  } catch (error) {
    console.error('Growth metrics error:', error)
    return NextResponse.json({ error: 'Failed to fetch growth metrics' }, { status: 500 })
  }
}
