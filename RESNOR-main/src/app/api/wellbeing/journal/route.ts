import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id') || 'stu_001'

    const entries = await db.wellbeingJournal.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Journal fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch journals' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { student_id, title, content, emotion_tag } = await request.json()
    const sid = student_id || 'stu_001'

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
    }

    const entry = await db.wellbeingJournal.create({
      data: {
        studentId: sid,
        title,
        content,
        emotionTag: emotion_tag || 'neutral',
      },
    })

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Journal save error:', error)
    return NextResponse.json({ error: 'Failed to save journal' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await db.wellbeingJournal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Journal delete error:', error)
    return NextResponse.json({ error: 'Failed to delete journal' }, { status: 500 })
  }
}
