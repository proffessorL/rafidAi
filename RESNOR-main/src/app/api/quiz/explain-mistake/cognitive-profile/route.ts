import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id is required' }, { status: 400 })

    const profile = await db.cognitiveProfile.findUnique({
      where: { studentId },
    })

    if (!profile) {
      return NextResponse.json({
        profile: null,
        message: 'No cognitive profile found. Complete a quiz to generate one.',
      })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Cognitive profile error:', error)
    return NextResponse.json({ error: 'Failed to fetch cognitive profile' }, { status: 500 })
  }
}
