import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const resources = await db.resource.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ resources })
  } catch (error) {
    console.error('Resources error:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, type, subject, description, authorId, authorName, url } = body

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 })
    }

    const resource = await db.resource.create({
      data: {
        title,
        type,
        subject: subject || '',
        description: description || '',
        authorId: authorId || null,
        authorName: authorName || '',
        url: url || '',
      },
    })

    return NextResponse.json({ resource })
  } catch (error) {
    console.error('Create resource error:', error)
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
  }
}
