import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { student_id, subject, message, status } = await request.json()
    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    const fullMessage = subject ? `Subject: ${subject}\n\n${message}` : message || ''

    const record = await db.interventionRecord.create({
      data: {
        teacherId: 'teacher_001',
        studentId: student_id,
        status: status || 'draft',
        reason: 'teacher_outreach',
        message: fullMessage,
      },
    })

    return NextResponse.json({ success: true, id: record.id })
  } catch (error) {
    console.error('Intervention create error:', error)
    return NextResponse.json({ error: 'Failed to save intervention' }, { status: 500 })
  }
}
