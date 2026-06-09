import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { getAIProvider } from '@/ai/providers'

interface GradeBreakdown {
  subject: string
  predicted: number
  trend: 'up' | 'down' | 'stable'
  currentMark: number | null
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No user found' }, { status: 401 })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [attempts, progress, enrollments, focusSessions, telemetryRecords, misconceptionLogs, engagement] = await Promise.all([
      db.quizAttempt.findMany({
        where: { studentId: userId },
        orderBy: { completedAt: 'asc' },
      }),
      db.materialProgress.findMany({ where: { studentId: userId } }),
      db.enrollment.findMany({
        where: { studentId: userId },
        include: { course: true },
      }),
      db.focusSession.findMany({
        where: { studentId: userId },
        orderBy: { startedAt: 'desc' },
        take: 200,
      }),
      db.telemetryRecord.findMany({
        where: { studentId: userId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      db.misconceptionLog.findMany({
        where: { studentId: userId, recoveryStatus: { not: 'MASTERED' } },
        orderBy: { frequencyCounter: 'desc' },
        take: 10,
      }),
      db.engagementScore.findUnique({ where: { studentId: userId } }),
    ])

    // --- Quiz metrics ---
    const recentAttempts = attempts.slice(-10)
    const recentScores = recentAttempts.map((a) =>
      a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0
    )
    const avgRecentScore = recentScores.length > 0
      ? recentScores.reduce((s, v) => s + v, 0) / recentScores.length
      : 0
    const quizScoreTrend = recentScores
    const quizCount = attempts.length

    // --- Completion rate ---
    const completionRate = progress.length > 0
      ? progress.filter(p => p.completionStatus === 'done').length / progress.length
      : 0

    // --- Study hours from canonical source (heartbeat writes to engagementScore) ---
    const weeklyActiveHours = engagement?.weeklyActiveHours ?? 0

    // --- Consistency (same DT hybrid formula) ---
    const recentFocusDays = new Set(
      focusSessions
        .filter((s) => new Date(s.startedAt) >= thirtyDaysAgo)
        .map((s) => new Date(s.startedAt).toDateString())
    )
    const recentTelemetryDays = new Set(
      telemetryRecords
        .filter((t) => new Date(t.createdAt) >= thirtyDaysAgo && t.activeSeconds > 0)
        .map((t) => new Date(t.createdAt).toDateString())
    )
    const allActiveDays = new Set([...recentFocusDays, ...recentTelemetryDays])
    const uniqueDayRatio = allActiveDays.size / 30

    const sortedDays = Array.from(allActiveDays)
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime())
    let maxStreak = 0
    let currentStreak = 0
    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) { currentStreak = 1 } else {
        const diffDays = Math.round((sortedDays[i].getTime() - sortedDays[i - 1].getTime()) / 86400000)
        currentStreak = diffDays === 1 ? currentStreak + 1 : 1
      }
      maxStreak = Math.max(maxStreak, currentStreak)
    }
    const streakRatio = maxStreak / 30
    const studyConsistency = Math.min(100, Math.round((uniqueDayRatio * 0.6 + streakRatio * 0.4) * 100))

    // --- Interaction density from Telemetry ---
    const recentTelemetry = telemetryRecords.filter(
      (t) => new Date(t.createdAt) >= thirtyDaysAgo
    )
    const interactionDensity = recentTelemetry.length > 30
      ? Math.round((recentTelemetry.reduce((s, t) => s + t.interactionCount, 0) / recentTelemetry.length) * 10) / 10
      : 0

    // --- CGPA prediction ---
    const predictedScore = avgRecentScore * 0.5 + completionRate * 100 * 0.3 + studyConsistency * 0.2
    let predictedCGPA = 2.0 + (predictedScore / 100) * 2.0
    predictedCGPA = Math.min(4.0, Math.max(2.0, predictedCGPA))
    if (weeklyActiveHours > 10) predictedCGPA += 0.1
    if (studyConsistency > 70) predictedCGPA += 0.05
    predictedCGPA = Math.min(4.0, Math.round(predictedCGPA * 100) / 100)

    // --- Baseline CGPA (from first attempts) ---
    const firstScores = attempts.slice(0, 3)
    const baselineScore = firstScores.length > 0
      ? firstScores.reduce((s, a) => s + a.score, 0) / firstScores.length
      : avgRecentScore
    let baselineCGPA = 2.0 + (baselineScore / 100) * 2.0
    baselineCGPA = Math.min(4.0, Math.max(2.0, Math.round(baselineCGPA * 100) / 100))

    // --- Confidence ---
    const confidence = Math.min(95, 40 + attempts.length * 6 + progress.length * 2 + focusSessions.length * 1)

    // --- Grade breakdown from course enrollments ---
    const gradeBreakdown: GradeBreakdown[] = enrollments.map((e) => {
      const marks = [e.assignmentMark, e.presentationMark, e.midMark, e.finalMark]
      const validMarks = marks.filter((m): m is number => m !== null)
      const avgMark = validMarks.length > 0
        ? validMarks.reduce((s, m) => s + m, 0) / validMarks.length
        : null
      let predicted = 3.0
      if (avgMark !== null) {
        if (avgMark >= 80) predicted = 4.0
        else if (avgMark >= 75) predicted = 3.75
        else if (avgMark >= 70) predicted = 3.5
        else if (avgMark >= 65) predicted = 3.25
        else if (avgMark >= 60) predicted = 3.0
        else if (avgMark >= 55) predicted = 2.75
        else if (avgMark >= 50) predicted = 2.5
        else predicted = 2.0
      }
      return {
        subject: e.course.name,
        predicted,
        trend: 'stable' as const,
        currentMark: avgMark !== null ? Math.round(avgMark) : null,
      }
    })

    // --- AI study tip ---
    const weakTopicsStr = misconceptionLogs.length > 0
      ? misconceptionLogs.map((m) => m.conceptNodeId || m.patternDescription).join(', ')
      : ''

    let studyTip = 'Keep up the consistent work! Focus on completing pending materials and taking more quizzes.'
    try {
      const provider = getAIProvider('groq')
      const tipPrompt = `Student: QuizAvg=${Math.round(avgRecentScore)}%, Completion=${Math.round(completionRate * 100)}%, Consistency=${studyConsistency}%, WeeklyHours=${weeklyActiveHours}h.
Weak topics: ${weakTopicsStr || 'None'}
Courses: ${enrollments.map(e => `${e.course.name} (avg ${e.assignmentMark || e.midMark || 'N/A'})`).join(', ') || 'None'}
Generate ONE concise study tip (max 2 sentences) referencing their actual numbers to help improve their CGPA.`
      const tipResponse = await provider.complete({
        messages: [
          { role: 'system', content: 'You give short, data-driven study tips.' },
          { role: 'user', content: tipPrompt },
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.5,
        maxTokens: 100,
      })
      if (tipResponse) studyTip = tipResponse.trim()
    } catch { /* use default tip */ }

    return NextResponse.json({
      success: true,
      data: {
        predictedCGPA,
        baselineCGPA,
        metrics: {
          quizAverage: Math.round(avgRecentScore),
          quizCount,
          weeklyActiveHours,
          studyConsistency,
          interactionDensity,
          completionRate: Math.round(completionRate * 100),
          quizScoreTrend,
        },
        confidence,
        gradeBreakdown,
        studyTip,
      },
    })
  } catch (error) {
    console.error('CGPA prediction error:', error)
    return NextResponse.json({ success: false, error: 'Failed to predict CGPA' }, { status: 500 })
  }
}
