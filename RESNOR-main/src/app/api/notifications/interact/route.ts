import { NextResponse } from 'next/server'
import { logInteraction, getInteractionStats } from '@/lib/services/notification-interaction-service'

export async function POST(req: Request) {
  try {
    const { notificationId, studentId, action } = await req.json()

    if (!notificationId || !studentId || !action) {
      return NextResponse.json({ error: 'notificationId, studentId, and action are required' }, { status: 400 })
    }

    const validActions = ['opened', 'dismissed', 'snoozed', 'clicked', 'delivered']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `action must be one of: ${validActions.join(', ')}` }, { status: 400 })
    }

    await logInteraction(notificationId, studentId, action)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Interaction log error:', error)
    return NextResponse.json({ error: 'Failed to log interaction' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('student_id')
    const days = parseInt(searchParams.get('days') || '7')

    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    const stats = await getInteractionStats(studentId, days)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Interaction stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
