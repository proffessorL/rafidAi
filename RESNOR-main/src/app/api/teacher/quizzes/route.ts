import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const quizzes = await db.quiz.findMany({
      where: { teacherId: { not: null } },
      include: {
        questions: true,
        topic: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error('Teacher quizzes error:', error)
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, topicId, difficulty, timeLimit, dueDate, questions, teacherId } = body

    if (!title || !questions?.length) {
      return NextResponse.json({ error: 'Title and questions are required' }, { status: 400 })
    }

    // Resolve topic — accept either a topic ID or topic name
    let resolvedTopicId = ''
    const topicByName = await db.topic.findFirst({ where: { name: topicId } })
    if (topicByName) {
      resolvedTopicId = topicByName.id
    } else {
      const topicById = await db.topic.findUnique({ where: { id: topicId } })
      if (topicById) {
        resolvedTopicId = topicById.id
      } else {
        const firstCourse = await db.course.findFirst()
        if (topicId && firstCourse) {
          const newTopic = await db.topic.create({ data: { name: topicId, courseId: firstCourse.id } })
          resolvedTopicId = newTopic.id
        } else {
          resolvedTopicId = (await db.topic.findFirst())?.id || ''
        }
      }
    }

    const quiz = await db.quiz.create({
      data: {
        title,
        topicId: resolvedTopicId,
        difficulty: difficulty || 'medium',
        timeLimit: timeLimit || 600,
        dueDate: dueDate ? new Date(dueDate) : null,
        teacherId: teacherId || 'teacher_001',
        questions: {
          create: questions.map((q: any) => ({
            question: q.question,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctKey: q.correctKey,
            explanation: q.explanation || '',
          })),
        },
      },
      include: { questions: true },
    })

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Create quiz error:', error)
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
  }
}
