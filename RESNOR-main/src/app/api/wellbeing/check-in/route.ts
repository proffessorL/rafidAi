import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const studentId = 'stu_001'

    const engagement = await db.engagementScore.findUnique({ where: { studentId } })
    const streak = await db.streak.findUnique({ where: { studentId } })

    // Check if student qualifies for a wellbeing check-in
    let shouldCheckin = false
    let checkinType = 'motivational'

    if (engagement && engagement.overallScore < 40) {
      shouldCheckin = true
      checkinType = 'motivational'
    } else if (streak && streak.currentStreak >= 7) {
      shouldCheckin = true
      checkinType = 'motivational'
    } else if (engagement && engagement.weeklyActiveHours > 25) {
      shouldCheckin = true
      checkinType = 'balance_tip'
    }

    // Check for existing non-dismissed checkin
    const existingCheckin = await db.wellbeingCheckin.findFirst({
      where: { studentId, isDismissed: false },
      orderBy: { createdAt: 'desc' },
    })

    if (existingCheckin) {
      return NextResponse.json({ checkin: existingCheckin, shouldCheckin: true })
    }

    if (!shouldCheckin) {
      return NextResponse.json({ checkin: null, shouldCheckin: false })
    }

    // Create check-in
    const checkinMessages = {
      motivational: {
        title: streak?.currentStreak ? `Amazing ${streak.currentStreak}-day streak!` : "You're doing great!",
        content: streak?.currentStreak
          ? `You've been consistently studying for ${streak.currentStreak} days! That kind of dedication builds real knowledge. Take a moment to appreciate your effort — consistency is the key to mastery.`
          : `Every step forward counts. You're making progress, even when it doesn't feel like it. Keep going!`,
      },
      balance_tip: {
        title: 'Time for a balanced approach?',
        content: 'We noticed you\'ve been putting in extra hours. While dedication is admirable, taking regular breaks actually improves learning retention. Consider the Pomodoro technique: 25 minutes of focused study followed by a 5-minute break.',
      },
    }

    const template = checkinMessages[checkinType as keyof typeof checkinMessages] || checkinMessages.motivational

    const checkin = await db.wellbeingCheckin.create({
      data: {
        studentId,
        checkinType,
        title: template.title,
        content: template.content,
      },
    })

    return NextResponse.json({ checkin, shouldCheckin: true })
  } catch (error) {
    console.error('Wellbeing checkin error:', error)
    return NextResponse.json({ error: 'Failed to fetch wellbeing data' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { checkin_id, dismissed } = await request.json()
    if (!checkin_id) return NextResponse.json({ error: 'checkin_id required' }, { status: 400 })

    await db.wellbeingCheckin.update({
      where: { id: checkin_id },
      data: { isDismissed: dismissed !== false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wellbeing update error:', error)
    return NextResponse.json({ error: 'Failed to update wellbeing' }, { status: 500 })
  }
}
