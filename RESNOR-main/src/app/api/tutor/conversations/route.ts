import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id') || 'stu_001'

  const sessions = await db.chatSession.findMany({
    where: { studentId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { messages: true } },
    },
    take: 50,
  })

  return NextResponse.json({
    conversations: sessions.map((s) => ({
      id: s.id,
      title: s.title || 'New Chat',
      messageCount: s._count.messages,
      mode: s.mode,
      topic: s.topic,
      questionId: s.questionId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, mode, topic, questionId, context, courseId } = body

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    const session = await db.chatSession.create({
      data: {
        studentId,
        title: 'New Chat',
        mode: mode || 'explain',
        topic: topic || null,
        questionId: questionId || null,
        context: context || null,
        courseId: courseId || null,
      },
    })

    return NextResponse.json({ conversation: session })
  } catch (error) {
    console.error('[Conversations POST]', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { sessionId } = await request.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  await db.chatSession.delete({ where: { id: sessionId } })
  return NextResponse.json({ success: true })
}
