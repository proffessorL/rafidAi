import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { notifyQuizCompleted } from '@/lib/services/notification-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { quizId, studentId, answers, timeSpent } = body

    if (!quizId || !studentId || !answers) {
      return NextResponse.json({ error: 'quizId, studentId, and answers are required' }, { status: 400 })
    }

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    })
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    let correctCount = 0
    const answerRecords = quiz.questions.map(q => {
      const selected = answers[q.id] || ''
      const isCorrect = selected === q.correctKey
      if (isCorrect) correctCount++
      return {
        questionId: q.id,
        selectedKey: selected,
        isCorrect,
      }
    })

    const totalQuestions = quiz.questions.length
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0

    const attempt = await db.quizAttempt.create({
      data: {
        studentId,
        quizId,
        score,
        totalQuestions,
        correctCount,
        timeSpent: timeSpent || 0,
        answers: { create: answerRecords },
      },
      include: { answers: true },
    })

    notifyQuizCompleted({
      studentId,
      score,
      correctCount,
      totalQuestions,
      quizTitle: quiz.title,
    }).catch(() => {})

    return NextResponse.json({ attempt, score, correctCount, totalQuestions })
  } catch (error) {
    console.error('Quiz submit error:', error)
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 })
  }
}
