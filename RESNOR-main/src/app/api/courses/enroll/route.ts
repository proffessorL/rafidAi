import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { courseId, studentId } = body

    if (!courseId || !studentId) {
      return NextResponse.json({ error: 'courseId and studentId are required' }, { status: 400 })
    }

    const existing = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already enrolled' }, { status: 409 })
    }

    const enrollment = await db.enrollment.create({
      data: { studentId, courseId },
    })

    return NextResponse.json({ enrollment })
  } catch (error) {
    console.error('Enroll error:', error)
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
}
