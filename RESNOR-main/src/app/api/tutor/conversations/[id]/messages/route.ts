import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { role, content } = body as { role: 'user' | 'assistant'; content: string }

    if (!role || !content) {
      return NextResponse.json({ error: 'role and content are required' }, { status: 400 })
    }

    if (!['user', 'assistant'].includes(role)) {
      return NextResponse.json({ error: 'role must be "user" or "assistant"' }, { status: 400 })
    }

    const session = await db.chatSession.findUnique({
      where: { id },
      select: { id: true, title: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const messageCount = await db.chatMessage.count({
      where: { sessionId: id },
    })

    const message = await db.chatMessage.create({
      data: {
        sessionId: id,
        role,
        content,
      },
    })

    if (messageCount === 0 && role === 'user') {
      const title = content.length > 60 ? content.slice(0, 60) + '...' : content
      await db.chatSession.update({
        where: { id },
        data: { title },
      })
    }

    return NextResponse.json({
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: new Date(message.createdAt).getTime(),
      },
    })
  } catch (error) {
    console.error('[Messages POST]', error)
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
  }
}
