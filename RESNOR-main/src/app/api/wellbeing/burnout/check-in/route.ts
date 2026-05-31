import { NextResponse } from 'next/server'
import { storeCheckIn } from '@/lib/services/burnout-engine'

export async function POST(request: Request) {
  try {
    const { student_id, rating, stress_rating } = await request.json()
    const sid = student_id || 'stu_001'

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }
    const sr = stress_rating || 3

    const fingerprint = await storeCheckIn(sid, rating, sr)

    return NextResponse.json({ success: true, fingerprint })
  } catch (error) {
    console.error('Burnout check-in error:', error)
    return NextResponse.json({ error: 'Failed to submit check-in' }, { status: 500 })
  }
}
