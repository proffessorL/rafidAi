import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [studentCount, courseCount, satisfactionData] = await Promise.all([
      db.user.count({ where: { role: 'student' } }),
      db.course.count(),
      db.wellbeingAnalytics.aggregate({
        _avg: { wellbeingScore: true },
      }),
    ])

    const satisfaction = satisfactionData._avg.wellbeingScore ?? 0

    return NextResponse.json({
      students: studentCount,
      courses: courseCount,
      satisfaction: Math.round(satisfaction),
    })
  } catch {
    return NextResponse.json(
      { students: 0, courses: 0, satisfaction: 0 },
      { status: 500 }
    )
  }
}
