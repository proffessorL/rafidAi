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
          include: { topics: true },
        },
      },
    })

    const categories: { name: string; type: 'course' | 'topic'; courseName: string }[] = []

    for (const enrollment of enrollments) {
      const course = enrollment.course
      categories.push({ name: course.name, type: 'course', courseName: course.name })

      for (const topic of course.topics) {
        if (topic.name !== course.name) {
          categories.push({ name: topic.name, type: 'topic', courseName: course.name })
        }
      }
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Notes categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
