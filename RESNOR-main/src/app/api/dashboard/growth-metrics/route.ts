import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const STUDY_PAGE_IDS = [
  'quiz', 'tutor', 'wellbeing', 'notes', 'gamification',
  'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard',
]

function tzDateKey(date: Date, tzMs: number): string {
  const local = new Date(date.getTime() + tzMs)
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}-${String(local.getUTCDate()).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    const tzOffset = parseInt(searchParams.get('tz') || '0')
    const tzMs = tzOffset * 60000

    // 1. User info
    const user = await db.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true, studentId: true, institution: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // 2. Student progress (XP / level)
    const progress = await db.studentProgress.findUnique({ where: { studentId } })

    // 3. Material progress
    const allProgress = await db.materialProgress.findMany({
      where: { studentId },
      include: { material: { include: { topic: true } } },
    })
    const total = allProgress.length
    const done = allProgress.filter(p => p.completionStatus === 'done').length
    const inProgress = allProgress.filter(p => p.completionStatus === 'in_progress').length
    const pending = total - done - inProgress

    // 4. Quiz attempts
    const attempts = await db.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: { include: { topic: true } } },
      orderBy: { completedAt: 'desc' },
    })
    const recentAttempts = attempts.slice(0, 10)
    const avgScore = recentAttempts.length > 0
      ? Math.round(recentAttempts.reduce((sum, a) => sum + (a.correctCount / a.totalQuestions) * 100, 0) / recentAttempts.length * 10) / 10
      : 0
    const highScoreQuizCount = attempts.filter(a => a.totalQuestions > 0 && (a.correctCount / a.totalQuestions) >= 0.8).length

    // 5. Streak (computed on-the-fly from telemetry, same as gamification calendar)
    const now = new Date()
    const userNow = new Date(now.getTime() + tzMs)
    const streakStart = new Date(Date.UTC(userNow.getUTCFullYear() - 1, userNow.getUTCMonth(), userNow.getUTCDate()) - tzMs)

    const streakRecords = await db.telemetryRecord.findMany({
      where: {
        studentId,
        tabFocused: true,
        pageId: { in: STUDY_PAGE_IDS },
        createdAt: { gte: streakStart },
      },
      select: { activeSeconds: true, createdAt: true },
    })

    const streakDayMap = new Map<string, number>()
    for (const r of streakRecords) {
      const dateKey = tzDateKey(r.createdAt, tzMs)
      streakDayMap.set(dateKey, (streakDayMap.get(dateKey) || 0) + r.activeSeconds)
    }

    const allDates: string[] = []
    const d = new Date(streakStart)
    const todayKey = tzDateKey(now, tzMs)
    while (tzDateKey(d, tzMs) <= todayKey) {
      allDates.push(tzDateKey(d, tzMs))
      d.setDate(d.getDate() + 1)
    }

    const studied = allDates.map((dateStr) => (streakDayMap.get(dateStr) || 0) >= 300)

    let currentStreak = 0
    for (let i = studied.length - 1; i >= 0; i--) {
      if (studied[i]) currentStreak++
      else break
    }

    let longestStreak = 0
    let run = 0
    for (const s of studied) {
      if (s) {
        run++
        if (run > longestStreak) longestStreak = run
      } else {
        run = 0
      }
    }

    const totalActiveDays = studied.filter(Boolean).length

    // 6. Engagement
    const engagement = await db.engagementScore.findUnique({ where: { studentId } })

    // 7. Total study time (seconds -> minutes) — from telemetry (study pages only)
    const totalTelemetry = await db.telemetryRecord.aggregate({
      where: { studentId, pageId: { in: STUDY_PAGE_IDS } },
      _sum: { activeSeconds: true },
    })
    const totalTimeMinutes = Math.floor((totalTelemetry._sum.activeSeconds || 0) / 60)

    // 8. Topic performance over time (weekly bins)
    const topicScoresRaw: Record<string, { score: number; date: string; correctCount: number; totalQuestions: number; quizTitle: string }[]> = {}
    for (const a of attempts) {
      const topicName = a.quiz?.topic?.name || 'Unknown'
      if (!topicScoresRaw[topicName]) topicScoresRaw[topicName] = []
      topicScoresRaw[topicName].push({
        score: a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0,
        date: a.completedAt.toISOString().split('T')[0],
        correctCount: a.correctCount,
        totalQuestions: a.totalQuestions,
        quizTitle: a.quiz?.title || 'Unknown Quiz',
      })
    }

    // 9. Weekly activity (last 7 days) — from telemetry (study pages only)
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const weekTelemetry = await db.telemetryRecord.findMany({
      where: { studentId, pageId: { in: STUDY_PAGE_IDS }, createdAt: { gte: sevenDaysAgo } },
      select: { activeSeconds: true, createdAt: true },
    })
    const weeklyActivity: { day: string; hours: number }[] = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayStart = new Date(d)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(d)
      dayEnd.setHours(23, 59, 59, 999)
      const dayMs = weekTelemetry
        .filter(t => {
          const ca = new Date(t.createdAt)
          return ca >= dayStart && ca <= dayEnd
        })
        .reduce((sum, t) => sum + t.activeSeconds, 0)
      weeklyActivity.push({ day: dayNames[d.getDay()], hours: Math.round(dayMs / 3600 * 10) / 10 })
    }

    // 10. Materials completed today (for welcome banner)
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)
    const materialsToday = allProgress.filter(p => {
      const la = new Date(p.lastAccessedAt)
      return la >= todayStart && la <= todayEnd && p.completionStatus === 'done'
    }).length

    const bestQuizScore = attempts.length > 0
      ? Math.round(Math.max(...attempts.map(a => a.totalQuestions > 0 ? (a.correctCount / a.totalQuestions) * 100 : 0)))
      : 0

    return NextResponse.json({
      user: { name: user.name, email: user.email, studentId: user.studentId, institution: user.institution },
      progress: progress ? { xp: progress.xp, level: progress.level } : null,
      materialProgress: { total, done, inProgress, pending },
      quizAttempts: attempts.slice(0, 5).map(a => ({
        id: a.id,
        title: a.quiz?.title || 'Unknown Quiz',
        score: a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0,
        date: a.completedAt.toISOString().split('T')[0],
      })),
      averageQuizScore: avgScore,
      bestQuizScore,
      totalQuizAttempts: attempts.length,
      highScoreQuizCount,
      streak: { current: currentStreak, longest: longestStreak, totalDays: totalActiveDays },
      totalTimeMinutes,
      materialsToday,
      weeklyActivity,
      topicScores: topicScoresRaw,
      engagement: engagement
        ? {
            overallScore: engagement.overallScore,
            consistency: engagement.studyConsistencyRate,
            avgSession: engagement.avgSessionDuration,
            weeklyHours: engagement.weeklyActiveHours,
            interactionDensity: engagement.interactionDensity,
          }
        : null,
    })
  } catch (error) {
    console.error('Growth metrics error:', error)
    return NextResponse.json({ error: 'Failed to fetch growth metrics' }, { status: 500 })
  }
}
