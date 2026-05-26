import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    const notes = await db.studyNote.findMany({
      where: { studentId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    })

    const mapped = notes.map((n) => ({
      ...n,
      tags: JSON.parse(n.tags || '[]'),
    }))

    return NextResponse.json({ notes: mapped })
  } catch (error) {
    console.error('Notes fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, title, content, category, tags } = body

    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    const note = await db.studyNote.create({
      data: {
        studentId,
        title: title || '',
        content: content || '',
        category: category || 'General',
        tags: JSON.stringify(tags || []),
      },
    })

    return NextResponse.json({
      note: { ...note, tags: JSON.parse(note.tags || '[]') },
    })
  } catch (error) {
    console.error('Notes create error:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}
