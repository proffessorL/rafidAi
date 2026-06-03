import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { predict } from '@/lib/services/burnout-engine'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id') || 'stu_001'

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Run all independent DB queries + KNN prediction in parallel
    const [
      history,
      engagement,
      telemetry7d,
      recentMoods,
      focusSessions,
      quizAttempts,
      knnPrediction,
    ] = await Promise.all([
      db.burnoutPrediction.findMany({ where: { studentId }, orderBy: { analyzedAt: 'asc' }, take: 10 }),
      db.engagementScore.findUnique({ where: { studentId } }),
      db.telemetryRecord.findMany({
        where: { studentId, createdAt: { gte: sevenDaysAgo } },
        select: { activeSeconds: true, createdAt: true },
      }),
      db.moodEntry.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' }, take: 7 }),
      db.focusSession.findMany({ where: { studentId }, orderBy: { startedAt: 'desc' }, take: 50 }),
      db.quizAttempt.findMany({ where: { studentId }, orderBy: { completedAt: 'desc' }, take: 3 }),
      predict(studentId),
    ])

    const weeklyHours = engagement?.weeklyActiveHours ?? 0
    const avgMood = recentMoods.length
      ? recentMoods.reduce((s, e) => s + e.score, 0) / recentMoods.length
      : 0

    const lowMoodDays = recentMoods.filter((m) => m.score <= 4).length

    const lateNightPct = focusSessions.length
      ? Math.round((focusSessions.filter((s) => new Date(s.startedAt).getHours() < 6).length / focusSessions.length) * 100)
      : 0

    // Cramming detection
    const dailyStudyHours: Record<string, number> = {}
    for (let i = 0; i < 7; i++) {
      dailyStudyHours[new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString()] = 0
    }
    telemetry7d.forEach((record) => {
      const dateStr = new Date(record.createdAt).toDateString()
      if (dailyStudyHours[dateStr] !== undefined) {
        dailyStudyHours[dateStr] += record.activeSeconds / 3600
      }
    })

    const dailyHoursArray = Object.values(dailyStudyHours)
    const avgDailyHours = dailyHoursArray.reduce((a, b) => a + b, 0) / 7

    let crammingAlert = false
    let crammingMessage = ''
    let maxStudyDayHours = 0
    let maxStudyDayName = ''

    for (const [dateStr, hours] of Object.entries(dailyStudyHours)) {
      if (hours > maxStudyDayHours) {
        maxStudyDayHours = hours
        maxStudyDayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' })
      }
    }

    if (maxStudyDayHours > 6) {
      crammingAlert = true
      crammingMessage = `Cramming Alert: You studied for ${maxStudyDayHours.toFixed(1)} hours on ${maxStudyDayName}. This is highly draining and leads to rapid fatigue.`
    } else if (avgDailyHours > 0.5 && maxStudyDayHours > avgDailyHours * 1.8) {
      crammingAlert = true
      crammingMessage = `Workload Spike: You studied for ${maxStudyDayHours.toFixed(1)} hours on ${maxStudyDayName}, which is ${(maxStudyDayHours / avgDailyHours * 100).toFixed(0)}% higher than your daily average of ${avgDailyHours.toFixed(1)}h. Spacing out study sessions is much healthier!`
    }

    // Fallback rule-based calculation
    let riskPercentage = 10
    if (weeklyHours > 30) riskPercentage += 25
    else if (weeklyHours > 25) riskPercentage += 15
    else if (weeklyHours > 20) riskPercentage += 5

    if (avgMood > 0 && avgMood < 4) riskPercentage += 20
    else if (avgMood > 0 && avgMood < 6) riskPercentage += 10

    if (lowMoodDays >= 3) riskPercentage += 15

    if (quizAttempts.length >= 3) {
      const scores = quizAttempts.map((a) => a.score)
      if (scores[0] > scores[scores.length - 1]) riskPercentage += 10
    }

    if (lateNightPct > 50) riskPercentage += 15
    else if (lateNightPct > 25) riskPercentage += 8

    riskPercentage = Math.min(100, Math.max(5, riskPercentage))

    const hasKnnData = knnPrediction.totalNeighbors >= 3
    if (hasKnnData) {
      riskPercentage = Math.round((knnPrediction.burnoutNeighbors / knnPrediction.totalNeighbors) * 100)
    }

    let stressPercentage = 30
    if (hasKnnData) {
      stressPercentage = Math.round((knnPrediction.stressedNeighbors / knnPrediction.totalNeighbors) * 100)
    }

    const riskLevel = riskPercentage < 20 ? 'low' : riskPercentage < 40 ? 'moderate' : riskPercentage < 65 ? 'high' : 'severe'

    const factors = [
      { name: `Study Hours (${Math.round(weeklyHours)}h/wk)`, impact: Math.min(35, Math.round((weeklyHours / 40) * 35)) },
      { name: `Mood (${avgMood > 0 ? Math.round(avgMood) : 'N/A'}/10)`, impact: avgMood > 0 ? Math.round((1 - avgMood / 10) * 25) : 0 },
      { name: `Low Mood Days (${lowMoodDays}/7)`, impact: Math.round((lowMoodDays / 7) * 20) },
      { name: `Late Nights (${lateNightPct}% sessions)`, impact: Math.round((lateNightPct / 100) * 15) },
      { name: 'Workload Balance', impact: weeklyHours > 30 ? 10 : weeklyHours > 20 ? 7 : 3 },
    ]

    const trend = [
      ...history.map((h) => ({
        week: new Date(h.analyzedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        risk: h.riskPercentage,
      })),
      { week: 'Now', risk: riskPercentage },
    ]

    const recommendations = riskPercentage >= 40
      ? [
          'Take a full rest day this weekend — no studying at all',
          'Reduce daily study sessions to 3 max (45 min each)',
          'Practice mindfulness or meditation for 10 minutes daily',
          'Ensure 7-8 hours of sleep every night',
          'Talk to a counselor or trusted person about your stress',
        ]
      : riskPercentage >= 20
        ? [
            'Incorporate a 15-min break every 2 hours of study',
            'Maintain 7-8 hours of sleep daily',
            'Include light physical activity between sessions',
            'Practice mindfulness for 5 minutes before studying',
            'Alternate between difficult and easy subjects',
          ]
        : [
            'Keep maintaining your healthy study balance!',
            'Continue taking regular breaks',
            'Stay hydrated and active',
            'Your current routine is working well',
          ]

    await db.burnoutPrediction.deleteMany({ where: { studentId, analyzedAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } })
    await db.burnoutPrediction.create({
      data: {
        studentId,
        riskPercentage,
        riskLevel,
        factors: JSON.stringify(factors),
        recommendations: JSON.stringify(recommendations),
      },
    })

    return NextResponse.json({
      riskPercentage,
      riskLevel,
      factors,
      recommendations,
      trend,
      crammingAlert,
      crammingMessage,
      stressPercentage,
      knnPrediction: {
        message: knnPrediction.message,
        stressMessage: knnPrediction.stressMessage,
        hasKnnData,
        burnoutNeighbors: knnPrediction.burnoutNeighbors,
        fineNeighbors: knnPrediction.fineNeighbors,
        stressedNeighbors: knnPrediction.stressedNeighbors,
        calmNeighbors: knnPrediction.calmNeighbors,
        totalNeighbors: knnPrediction.totalNeighbors,
      },
      analyzedAt: new Date(),
    })
  } catch (error) {
    console.error('Burnout analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze burnout' }, { status: 500 })
  }
}
