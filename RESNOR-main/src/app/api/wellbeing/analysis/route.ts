import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { predict } from '@/lib/services/burnout-engine'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id') || 'stu_001'

    const now = Date.now()
    const sevenDaysAgo = new Date(now - 7 * 86400000)
    const twentyEightDaysAgo = new Date(now - 28 * 86400000)

    // Parallel: all independent DB queries at once (9 queries + predict sub-queries)
    const [
      moodEntries,
      engagement,
      streak,
      focusSessions,
      latestBurnout,
      journalCount,
      recentTelemetry,
      quizAttempts,
    ] = await Promise.all([
      db.moodEntry.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' }, take: 14 }),
      db.engagementScore.findUnique({ where: { studentId } }),
      db.streak.findUnique({ where: { studentId } }),
      db.focusSession.findMany({ where: { studentId }, orderBy: { startedAt: 'desc' }, take: 100 }),
      db.burnoutPrediction.findFirst({ where: { studentId }, orderBy: { analyzedAt: 'desc' } }),
      db.wellbeingJournal.count({ where: { studentId, createdAt: { gte: sevenDaysAgo } } }),
      db.telemetryRecord.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' }, take: 100 }),
      db.quizAttempt.findMany({ where: { studentId }, orderBy: { completedAt: 'desc' }, take: 10 }),
    ])

    // --- Compute wellbeing score (no DB queries left) ---
    const avgMood = moodEntries.length
      ? moodEntries.reduce((s, e) => s + e.score, 0) / moodEntries.length
      : 5
    const moodScore = Math.round((avgMood / 10) * 100)

    const moodVariance = moodEntries.length > 1
      ? moodEntries.reduce((s, e) => s + (e.score - avgMood) ** 2, 0) / moodEntries.length
      : 0
    const moodStability = Math.max(0, 100 - Math.round(moodVariance * 3))

    let moodTrendDelta = 0
    if (moodEntries.length >= 4) {
      const half = Math.floor(moodEntries.length / 2)
      const firstHalf = moodEntries.slice(half).reduce((s, e) => s + e.score, 0)
      const secondHalf = moodEntries.slice(0, half).reduce((s, e) => s + e.score, 0)
      moodTrendDelta = firstHalf && half ? Math.round(((secondHalf / half) - (firstHalf / half)) / 10 * 50) : 0
    }

    let recoveryScore = 100
    if (moodEntries.length >= 3) {
      const lowDays = moodEntries.filter(e => e.score <= 4)
      recoveryScore = lowDays.length === 0 ? 100 : Math.max(30, 100 - lowDays.length * 10)
    }

    const engagementScore = engagement?.overallScore || 50
    const weeklyHours = engagement?.weeklyActiveHours || 0

    const consistencyScore = streak
      ? Math.min(100, Math.round((streak.currentStreak / 30) * 100))
      : 30

    const recentFocus20 = focusSessions.slice(0, 20)
    const focusTotal = recentFocus20.length
    const focusCompleted = recentFocus20.filter(s => s.completed).length
    const focusCompletionRate = focusTotal > 0 ? Math.round((focusCompleted / focusTotal) * 100) : 0
    const focusMinutes = recentFocus20.reduce((s, e) => s + Math.round(e.actualSeconds / 60), 0)
    const focusScore = focusTotal > 0
      ? Math.round(focusCompletionRate * 0.6 + Math.min(focusMinutes / 10, 40))
      : 30

    const burnoutRisk = latestBurnout
      ? Math.round(latestBurnout.riskPercentage)
      : weeklyHours > 25 ? Math.min(80, Math.round((weeklyHours / 40) * 100)) : 15

    const journalScore = Math.min(100, journalCount * 15)
    const uniquePages = new Set(recentTelemetry.map(r => r.pageId)).size
    const diversityScore = Math.min(100, uniquePages * 12)

    const recentQuizScores = quizAttempts.slice(0, 5).map(a => a.score)
    const avgQuiz = recentQuizScores.length ? recentQuizScores.reduce((s, e) => s + e, 0) / recentQuizScores.length : 50
    const academicScore = Math.round(avgQuiz)

    const wellbeingScore = Math.round(
      (moodScore * 0.12) + (moodStability * 0.05) +
      (Math.max(0, 50 + moodTrendDelta) * 0.05) + (recoveryScore * 0.08) +
      (engagementScore * 0.18) + (consistencyScore * 0.12) +
      (focusScore * 0.10) + ((100 - burnoutRisk) * 0.10) +
      (journalScore * 0.05) + (diversityScore * 0.05) + (academicScore * 0.10)
    )

    // --- KNN prediction (parallel with Groq) ---
    const knnPromise = predict(studentId).catch(() => null)

    // Groq AI insight with 5s timeout
    let aiInsight: string | null = null
    if (groq.apiKey && moodEntries.length > 0) {
      const groqPromise = groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are a wellbeing analyst. Given student data, provide ONE concise insight (under 30 words) about their wellbeing patterns. Be direct and specific. No JSON, just plain text.' },
          { role: 'user', content: `Wellbeing: ${wellbeingScore}/100, Stress: ${burnoutRisk}/100, Burnout: ${burnoutRisk}%, Consistency: ${consistencyScore}%. Weekly hours: ${weeklyHours}. Streak: ${streak?.currentStreak || 0}d. Avg mood: ${Math.round(avgMood)}/10. Focus sessions: ${focusTotal} (${focusMinutes}min).` },
        ],
        temperature: 0.5,
        max_tokens: 100,
      })
      try {
        const result = await Promise.race([
          groqPromise,
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ])
        aiInsight = result?.choices?.[0]?.message?.content?.trim() || null
      } catch { /* timeout or error — skip AI insight */ }
    }

    // --- Chart data (all from already-fetched arrays, no DB hits) ---
    const moodEntriesAsc = [...moodEntries].reverse().filter(e => e.createdAt >= sevenDaysAgo)
    const focusSessions7d = focusSessions.filter(s => new Date(s.startedAt) >= sevenDaysAgo)
    const focusSessions28d = focusSessions.filter(s => new Date(s.startedAt) >= twentyEightDaysAgo)

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const moodTrend = dayLabels.map((_, i) => {
      const date = new Date(now - (6 - i) * 86400000).toDateString()
      const dayMoods = moodEntriesAsc.filter(e => new Date(e.createdAt).toDateString() === date)
      const avgMoodDay = dayMoods.length ? dayMoods.reduce((s, e) => s + e.score, 0) / dayMoods.length : 0
      const daySessions = focusSessions7d.filter(s => new Date(s.startedAt).toDateString() === date)
      const totalMin = daySessions.reduce((s, e) => s + e.actualSeconds, 0) / 60
      return {
        day: dayLabels[i],
        mood: avgMoodDay || 0,
        stress: avgMoodDay > 0 ? Math.round(10 - avgMoodDay) : 0,
        energy: totalMin > 0 ? Math.min(10, Math.round(totalMin / 30)) : 0,
      }
    })

    const productivityTrend = []
    for (let w = 3; w >= 0; w--) {
      const ws = new Date(now - (w * 7 + 7) * 86400000)
      const we = new Date(now - w * 7 * 86400000)
      const weekSessions = focusSessions28d.filter(s => {
        const d = new Date(s.startedAt)
        return d >= ws && d < we
      })
      const total = weekSessions.length
      const completed = weekSessions.filter(s => s.completed).length
      const totalHours = weekSessions.reduce((s, e) => s + e.actualSeconds, 0) / 3600
      productivityTrend.push({
        week: `W${4 - w}`,
        focus: total > 0 ? Math.round((completed / total) * 100) : 0,
        study: Math.min(100, Math.round((totalHours / 20) * 100)),
        break: total > 0 ? Math.min(100, Math.round((total / 7) * 50) + 20) : 0,
      })
    }

    const sleeplessNights = focusSessions28d.filter(s => new Date(s.startedAt).getHours() < 6).length
    const lateNightPct = focusSessions28d.length ? Math.round((sleeplessNights / focusSessions28d.length) * 100) : 0
    const quizScoreDecline = quizAttempts.length >= 4 && quizAttempts[0].score < quizAttempts[quizAttempts.length - 1].score
    const lowMoodCount = moodEntries.filter(e => e.score <= 4).length
    const stressFactors = [
      { name: 'Study Hours', value: Math.min(35, Math.round((weeklyHours / 40) * 35)), color: '#8b5cf6' },
      { name: 'Quiz Pressure', value: quizScoreDecline ? 25 : quizAttempts.length >= 2 ? 15 : 5, color: '#f59e0b' },
      { name: 'Sleep Disruption', value: Math.min(25, Math.round((lateNightPct / 100) * 25)), color: '#06b6d4' },
      { name: 'Low Mood', value: Math.min(20, lowMoodCount * 7), color: '#ef4444' },
      { name: 'Workload Spike', value: weeklyHours > 30 ? 15 : weeklyHours > 20 ? 8 : 3, color: '#10b981' },
    ]

    // --- KNN results ---
    const knnResult = await knnPromise
    const knnMessage = knnResult?.message || ''
    const knnStressMessage = knnResult?.stressMessage || ''
    const knnBurnoutRisk = knnResult?.totalNeighbors >= 3
      ? Math.round((knnResult.burnoutNeighbors / knnResult.totalNeighbors) * 100)
      : 0
    const knnStressScore = knnResult?.totalNeighbors >= 3
      ? Math.min(100, Math.round((knnResult.stressedNeighbors / knnResult.totalNeighbors) * 100))
      : 0

    const recentMood = moodEntries[0] || null
    const studyBalance = Math.round(100 - Math.min(40, Math.round((weeklyHours / 40) * 40)))

    return NextResponse.json({
      wellbeingScore,
      stressScore: knnStressScore || burnoutRisk,
      productivityScore: engagementScore,
      burnoutRisk,
      consistencyScore,
      lastMood: recentMood?.mood || 'normal',
      studyBalance,
      knnMessage,
      knnStressMessage,
      knnBurnoutRisk,
      knnStressScore,
      moodTrend,
      productivityTrend,
      stressFactors,
      aiInsight,
    })
  } catch (error) {
    console.error('Wellbeing analysis error:', error)
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 })
  }
}
