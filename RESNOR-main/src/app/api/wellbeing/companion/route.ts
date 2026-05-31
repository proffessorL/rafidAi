import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id') || 'stu_001'

    const streak = await db.streak.findUnique({ where: { studentId } })
    const recentInteractions = await db.companionInteraction.findMany({
      where: { studentId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    const recentMoods = await db.moodEntry.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })

    const avgMood = recentMoods.length
      ? Math.round(recentMoods.reduce((s, e) => s + e.score, 0) / recentMoods.length)
      : 0

    let encouragement = ''
    if (streak && streak.currentStreak >= 7) {
      encouragement = `🌟 Amazing ${streak.currentStreak}-day streak! You're on fire! Keep that momentum going!`
    } else if (streak && streak.currentStreak >= 3) {
      encouragement = `🔥 ${streak.currentStreak}-day streak! You're building great habits!`
    } else if (avgMood >= 7) {
      encouragement = '😊 You seem to be in great spirits today! Keep shining!'
    } else if (avgMood >= 4) {
      encouragement = '💪 Every day is a new opportunity. You\'ve got this!'
    } else {
      encouragement = '🌻 Take it one step at a time. You\'re stronger than you think!'
    }

    return NextResponse.json({
      streak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      unreadInteractions: recentInteractions,
      encouragement,
      avgMood,
    })
  } catch (error) {
    console.error('Companion error:', error)
    return NextResponse.json({ error: 'Failed to fetch companion data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { student_id, type, message } = await request.json()
    const sid = student_id || 'stu_001'

    const interaction = await db.companionInteraction.create({
      data: {
        studentId: sid,
        interactionType: type || 'encouragement',
        message: message || 'Keep going! You\'re doing great!',
      },
    })

    return NextResponse.json({ interaction })
  } catch (error) {
    console.error('Companion interaction error:', error)
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 })
  }
}
