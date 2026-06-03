import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const courses = await db.course.findMany({
      include: {
        topics: {
          include: {
            materials: true,
            _count: { select: { materials: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Teacher courses error:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, code, description, teacherId, topics } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    const course = await db.course.create({
      data: {
        name,
        code,
        description: description || '',
        teacherId: teacherId || 'teacher_001',
        topics: topics?.length ? {
          create: topics.map((t: any) => ({
            name: t.name,
            materials: t.materials?.length ? {
              create: t.materials.map((m: any) => ({
                title: m.title,
                contentType: m.contentType || 'document',
                contentUrl: m.contentUrl || '',
                estimatedTime: m.estimatedTime || 30,
              })),
            } : undefined,
          })),
        } : undefined,
      },
      include: {
        topics: { include: { materials: true, _count: { select: { materials: true } } } },
        _count: { select: { enrollments: true } },
      },
    })

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Create course error:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}
