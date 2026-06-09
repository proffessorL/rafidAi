import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const STUDY_PAGE_IDS = [
  'quiz', 'tutor', 'wellbeing', 'notes', 'gamification',
  'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard',
]

function tzDateKey(date: Date, tzMs: number): string {
  const local = new Date(date.getTime() + tzMs)
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}-${String(local.getUTCDate()).padStart(2, '0')}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    const tzOffset = parseInt(searchParams.get('tz') || '0')
    const tzMs = tzOffset * 60000
    const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear()
    const month = parseInt(searchParams.get('month') || '') || new Date().getMonth() + 1

    // --- Month calendar data ---
    const monthStart = new Date(Date.UTC(year, month - 1, 1) - tzMs)
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999) - tzMs)

    const records = await db.telemetryRecord.findMany({
      where: {
        studentId,
        tabFocused: true,
        pageId: { in: STUDY_PAGE_IDS },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { activeSeconds: true, createdAt: true },
    })

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const dayMap = new Map<string, number>()
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      dayMap.set(dateStr, 0)
    }

    for (const r of records) {
      const dateKey = tzDateKey(r.createdAt, tzMs)
      if (dayMap.has(dateKey)) {
        dayMap.set(dateKey, dayMap.get(dateKey)! + r.activeSeconds)
      }
    }

    const days = Array.from(dayMap.entries()).map(([date, totalSeconds]) => ({
      date,
      active: totalSeconds >= 300,
    }))

    // --- Streak stats: look back up to 365 days ---
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

    // Build boolean array: did they study on each day?
    const studied = allDates.map((dateStr) => (streakDayMap.get(dateStr) || 0) >= 300)

    // Current streak: count consecutive true days from today backwards
    let currentStreak = 0
    for (let i = studied.length - 1; i >= 0; i--) {
      if (studied[i]) currentStreak++
      else break
    }

    // Best streak: longest consecutive true run
    let bestStreak = 0
    let run = 0
    for (const s of studied) {
      if (s) {
        run++
        if (run > bestStreak) bestStreak = run
      } else {
        run = 0
      }
    }

    return NextResponse.json({
      year,
      month,
      daysInMonth,
      days,
      currentStreak,
      bestStreak,
    })
  } catch (error) {
    console.error('Streak calendar error:', error)
    return NextResponse.json({ error: 'Failed to fetch streak data' }, { status: 500 })
  }
}
