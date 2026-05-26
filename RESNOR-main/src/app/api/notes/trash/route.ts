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
      where: { studentId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    })

    const mapped = notes.map((n) => ({
      ...n,
      tags: JSON.parse(n.tags || '[]'),
    }))

    return NextResponse.json({ notes: mapped })
  } catch (error) {
    console.error('Trash fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch trashed notes' }, { status: 500 })
  }
}
