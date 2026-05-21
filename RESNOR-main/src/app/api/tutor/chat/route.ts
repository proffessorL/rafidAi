import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: Request) {
  try {
    const { student_id, course_id, message_text } = await request.json()
    if (!message_text) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    const sid = student_id || 'stu_001'

    let session = await db.chatSession.findFirst({
      where: { studentId: sid, courseId: course_id || null },
      orderBy: { updatedAt: 'desc' },
    })
    if (!session) {
      session = await db.chatSession.create({
        data: { studentId: sid, courseId: course_id || null, title: 'New Chat' },
      })
    }

    await db.chatMessage.create({
      data: { sessionId: session.id, role: 'user', content: message_text },
    })

    let courseContext = ''
    if (course_id) {
      const course = await db.course.findUnique({
        where: { id: course_id },
        include: { topics: { include: { materials: true } } },
      })
      if (course) {
        courseContext = `Course: ${course.name} (${course.code}). Topics: ${course.topics.map(t => t.name).join(', ')}.`
      }
    }

    const recentMessages = await db.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const zai = await ZAI.create()
    const systemPrompt = `You are an AI Tutor for RESNOR, a student learning platform at DIU (Daffodil International University). ${courseContext}

Your role:
- Provide clear, simplified explanations of academic concepts
- Use examples and analogies to make complex topics understandable
- Be encouraging and supportive
- Guide students to think critically
- Reference specific course topics when relevant
- Format responses with markdown for readability
- Keep responses concise but thorough`

    const messages = [
      { role: 'assistant' as const, content: systemPrompt },
      ...recentMessages.reverse().map(m => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const completion = await zai.chat.completions.create({ messages, thinking: { type: 'disabled' } })
    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.'

    await db.chatMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: aiResponse },
    })

    return NextResponse.json({ response: aiResponse, session_id: session.id })
  } catch (error) {
    console.error('Tutor chat error:', error)
    return NextResponse.json({ error: 'Failed to process chat message' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'session_id is required' }, { status: 400 })

  const messages = await db.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ messages })
}
