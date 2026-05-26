import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.studyNote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.content !== undefined) updateData.content = body.content
    if (body.category !== undefined) updateData.category = body.category
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags)
    updateData.deletedAt = null

    const note = await db.studyNote.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      note: { ...note, tags: JSON.parse(note.tags || '[]') },
    })
  } catch (error) {
    console.error('Notes update error:', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    const existing = await db.studyNote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    if (permanent) {
      await db.studyNote.delete({ where: { id } })
    } else {
      await db.studyNote.update({ where: { id }, data: { deletedAt: new Date() } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notes delete error:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
