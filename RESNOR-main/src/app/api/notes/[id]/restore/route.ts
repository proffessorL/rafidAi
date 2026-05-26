import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await db.studyNote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const note = await db.studyNote.update({
      where: { id },
      data: { deletedAt: null },
    })

    return NextResponse.json({
      note: { ...note, tags: JSON.parse(note.tags || '[]') },
    })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json({ error: 'Failed to restore note' }, { status: 500 })
  }
}
