import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { student_id, type, duration, actual_seconds, completed, distraction_score, notes } = await request.json()
    const sid = student_id || 'stu_001'

    const session = await db.focusSession.create({
      data: {
        studentId: sid,
        type: type || 'pomodoro',
        duration: duration || 25,
        actualSeconds: actual_seconds || 0,
        completed: completed || false,
        distractionScore: distraction_score || null,
        notes: notes || null,
        startedAt: new Date(),
        completedAt: completed ? new Date() : null,
      },
    })

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Focus session error:', error)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id') || 'stu_001'

    const sessions = await db.focusSession.findMany({
      where: { studentId },
      orderBy: { startedAt: 'desc' },
      take: 30,
    })

    const totalMinutes = sessions.reduce((s, e) => s + Math.round(e.actualSeconds / 60), 0)
    const completedSessions = sessions.filter((s) => s.completed).length
    const avgDuration = sessions.length
      ? Math.round(sessions.reduce((s, e) => s + e.actualSeconds, 0) / sessions.length / 60)
      : 0

    return NextResponse.json({
      sessions,
      totalMinutes,
      completedSessions,
      avgDuration,
      totalSessions: sessions.length,
    })
  } catch (error) {
    console.error('Focus fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
