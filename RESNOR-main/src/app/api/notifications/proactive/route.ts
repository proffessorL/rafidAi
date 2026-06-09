import { NextResponse } from 'next/server'
import { generateAndSaveProactiveNotifications, getProactiveHistory } from '@/lib/services/proactive-notification-service'

export async function POST(req: Request) {
  try {
    const { studentId } = await req.json()
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    const count = await generateAndSaveProactiveNotifications(studentId)
    return NextResponse.json({ created: count })
  } catch (error) {
    console.error('Proactive notification error:', error)
    return NextResponse.json({ error: 'Failed to generate proactive notifications' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('student_id')
    const days = parseInt(searchParams.get('days') || '7')

    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    const history = await getProactiveHistory(studentId, days)
    return NextResponse.json({ notifications: history })
  } catch (error) {
    console.error('Proactive history error:', error)
    return NextResponse.json({ error: 'Failed to fetch proactive history' }, { status: 500 })
  }
}
