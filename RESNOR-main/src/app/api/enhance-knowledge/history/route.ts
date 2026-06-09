import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) {
      return NextResponse.json({ error: 'Missing student_id' }, { status: 400 })
    }

    const sessions = await db.enhanceKnowledgeSession.findMany({
      where: { studentId },
      orderBy: { completedAt: 'desc' },
      include: {
        questions: {
          orderBy: { questionOrder: 'asc' },
          select: {
            id: true,
            difficulty: true,
            isRemedial: true,
            answeredCorrectly: true,
          },
        },
      },
    })

    const result = sessions.map((s) => {
      const mainQuestions = s.questions.filter((q) => !q.isRemedial)
      const correctMain = mainQuestions.filter((q) => q.answeredCorrectly === true).length
      const totalMain = mainQuestions.length
      return {
        id: s.id,
        topic: s.topic,
        totalQuestions: s.totalQuestions,
        totalCorrect: s.totalCorrect,
        totalRemedial: s.totalRemedial,
        correctMain,
        totalMain,
        completedAt: s.completedAt,
        score: totalMain > 0 ? Math.round((correctMain / totalMain) * 100) : 0,
      }
    })

    return NextResponse.json({ sessions: result })
  } catch (error) {
    console.error('EnhanceKnowledge history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
