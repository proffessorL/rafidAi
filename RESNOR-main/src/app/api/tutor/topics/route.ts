import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    const enrollments = await db.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            topics: {
              select: { id: true, name: true },
              orderBy: { name: 'asc' },
            },
          },
        },
      },
      orderBy: { course: { code: 'asc' } },
    })

    const topics = enrollments.flatMap((enrollment) => {
      const courseTopics = enrollment.course.topics
      if (courseTopics.length > 0) {
        return courseTopics.map((topic) => ({
          id: topic.id,
          name: topic.name,
          category: enrollment.course.name,
          courseId: enrollment.course.id,
          courseCode: enrollment.course.code,
        }))
      }
      return [{
        id: enrollment.course.id,
        name: enrollment.course.name,
        category: enrollment.course.code,
        courseId: enrollment.course.id,
        courseCode: enrollment.course.code,
      }]
    })

    return NextResponse.json({ topics, courses: enrollments.map(e => ({ id: e.course.id, name: e.course.name, code: e.course.code })) })
  } catch (error) {
    console.error('[Tutor Topics] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
  }
}
