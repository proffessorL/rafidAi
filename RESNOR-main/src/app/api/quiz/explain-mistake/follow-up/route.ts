import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, attemptId, questionId, message } = body

    if (!studentId || !message) {
      return NextResponse.json({ error: 'studentId and message are required' }, { status: 400 })
    }

    const followUp = await db.followUpMessage.create({
      data: {
        studentId,
        attemptId: attemptId || null,
        questionId: questionId?.toString() || null,
        message,
        source: 'explain-mistake',
      },
    })

    return NextResponse.json({ followUp }, { status: 201 })
  } catch (error) {
    console.error('Follow-up error:', error)
    return NextResponse.json({ error: 'Failed to save follow-up' }, { status: 500 })
  }
}
