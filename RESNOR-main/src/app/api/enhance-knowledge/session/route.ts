import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
    }

    const session = await db.enhanceKnowledgeSession.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { questionOrder: 'asc' },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const questions = session.questions.map((q) => ({
      id: q.id,
      questionNumber: q.questionOrder,
      question: q.questionText,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correctKey: q.correctKey,
      correctIndex: ['A', 'B', 'C', 'D'].indexOf(q.correctKey),
      difficulty: q.difficulty,
      isRemedial: q.isRemedial,
      parentQuestionId: q.parentQuestionId,
      answeredCorrectly: q.answeredCorrectly,
    }))

    return NextResponse.json({
      id: session.id,
      topic: session.topic,
      totalQuestions: session.totalQuestions,
      totalCorrect: session.totalCorrect,
      totalRemedial: session.totalRemedial,
      completedAt: session.completedAt,
      questions,
    })
  } catch (error) {
    console.error('EnhanceKnowledge session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
