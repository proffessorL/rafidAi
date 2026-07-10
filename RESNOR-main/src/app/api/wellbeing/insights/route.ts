import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id') || 'stu_001'

    const [analytics, recentMoods, journals, burnoutPredictions, focusSessions, streak, engagement] = await Promise.all([
      db.wellbeingAnalytics.findUnique({ where: { studentId } }),
      db.moodEntry.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' }, take: 14 }),
      db.wellbeingJournal.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      db.burnoutPrediction.findMany({ where: { studentId }, orderBy: { analyzedAt: 'desc' }, take: 6 }),
      db.focusSession.findMany({ where: { studentId, completed: true }, orderBy: { completedAt: 'desc' }, take: 30 }),
      db.streak.findUnique({ where: { studentId } }),
      db.engagementScore.findUnique({ where: { studentId } }),
    ])

    const totalFocusMinutes = focusSessions.reduce((s, e) => s + Math.round(e.actualSeconds / 60), 0)
    const avgMood = recentMoods.length
      ? Math.round(recentMoods.reduce((s, e) => s + e.score, 0) / recentMoods.length)
      : 0

    const moodTrend = recentMoods.length >= 7
      ? recentMoods.slice(0, 7).reduce((s, e) => s + e.score, 0) >=
        recentMoods.slice(-7).reduce((s, e) => s + e.score, 0)
        ? 'improving'
        : 'declining'
      : 'stable'

    const riskTrend = burnoutPredictions.length >= 2
      ? burnoutPredictions[0].riskPercentage > burnoutPredictions[burnoutPredictions.length - 1].riskPercentage
        ? 'increasing'
        : 'decreasing'
      : 'stable'

    return NextResponse.json({
      wellbeingScore: analytics?.wellbeingScore || 70,
      stressScore: analytics?.stressScore || 30,
      burnoutRisk: analytics?.burnoutRisk || 10,
      consistencyScore: analytics?.consistencyScore || 60,
      avgMood,
      moodTrend,
      riskTrend,
      totalFocusMinutes,
      totalFocusSessions: focusSessions.length,
      journalCount: journals.length,
      streakDays: streak?.currentStreak || 0,
      weeklyHours: engagement?.weeklyActiveHours || 0,
      lastUpdated: new Date(),
    })
  } catch (error) {
    console.error('Insights fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
  }
}
