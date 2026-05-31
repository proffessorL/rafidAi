import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id') || 'stu_001'

    const entries = await db.moodEntry.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 14,
    })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEntry = await db.moodEntry.findFirst({
      where: { studentId, createdAt: { gte: todayStart } },
    })

    const streak = todayEntry ? 1 : 0

    return NextResponse.json({ entries: entries.reverse(), streak, hasLoggedToday: !!todayEntry })
  } catch (error) {
    console.error('Mood fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch moods' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { student_id, mood, score, note } = await request.json()
    const sid = student_id || 'stu_001'

    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 })
    }

    const entry = await db.moodEntry.create({
      data: {
        studentId: sid,
        mood,
        score: score || 5,
        note: note || null,
      },
    })

    await db.wellbeingAnalytics.upsert({
      where: { studentId: sid },
      update: { lastMood: mood, updatedAt: new Date() },
      create: {
        studentId: sid,
        wellbeingScore: Math.round((score / 10) * 100),
        stressScore: 100 - Math.round((score / 10) * 100),
        lastMood: mood,
      },
    })

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Mood save error:', error)
    return NextResponse.json({ error: 'Failed to save mood' }, { status: 500 })
  }
}
