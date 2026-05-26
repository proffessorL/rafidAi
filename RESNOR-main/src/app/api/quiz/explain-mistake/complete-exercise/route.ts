import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { exerciseId, studentId } = body

    if (!exerciseId || !studentId) {
      return NextResponse.json({ error: 'exerciseId and studentId are required' }, { status: 400 })
    }

    const exercise = await db.remediationExercise.update({
      where: { id: exerciseId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    })

    if (exercise.conceptNodeId) {
      const misconception = await db.misconceptionLog.findUnique({
        where: {
          studentId_conceptNodeId: {
            studentId,
            conceptNodeId: exercise.conceptNodeId,
          },
        },
      })
      if (misconception && misconception.recoveryStatus === 'IN_PROGRESS') {
        await db.misconceptionLog.update({
          where: { id: misconception.id },
          data: { recoveryStatus: 'PRACTICING' },
        })
      }
    }

    return NextResponse.json({ exercise })
  } catch (error) {
    console.error('Complete exercise error:', error)
    return NextResponse.json({ error: 'Failed to complete exercise' }, { status: 500 })
  }
}
