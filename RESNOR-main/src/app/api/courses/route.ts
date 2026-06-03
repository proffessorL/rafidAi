import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    const courses = await db.course.findMany({
      include: {
        topics: {
          include: {
            materials: true,
            _count: { select: { materials: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enrollments = studentId
      ? await db.enrollment.findMany({ where: { studentId } })
      : []

    const enrolledIds = new Set(enrollments.map(e => e.courseId))
    const enriched = courses.map(c => ({
      ...c,
      isEnrolled: enrolledIds.has(c.id),
      progress: enrollments.find(e => e.courseId === c.id)?.attendance || 0,
    }))

    return NextResponse.json({ courses: enriched })
  } catch (error) {
    console.error('Courses error:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}
