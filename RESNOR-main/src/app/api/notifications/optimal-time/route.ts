import { NextResponse } from 'next/server'
import { getOptimalDeliveryTime, getTopWindows } from '@/lib/services/timing-engine-service'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    const optimalTime = await getOptimalDeliveryTime(studentId)
    const topWindows = await getTopWindows(studentId, 5)

    return NextResponse.json({ optimalTime, topWindows })
  } catch (error) {
    console.error('Optimal time error:', error)
    return NextResponse.json({ error: 'Failed to get optimal time' }, { status: 500 })
  }
}
