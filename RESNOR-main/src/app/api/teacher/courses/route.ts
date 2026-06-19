import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { ragService } from '@/ai/rag/rag-service'
import { vectorStore } from '@/ai/vector-store/vector-store'

async function indexCourseMaterials(courseId: string, materials: { id: string; content: string | null }[]) {
  for (const material of materials) {
    if (material.content) {
      await ragService.indexDocument(
        material.content,
        `course-${courseId}-material-${material.id}`
      )
    }
  }
}

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
                content: m.content || null,
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

    const allMaterials = course.topics.flatMap(t => t.materials)
    await indexCourseMaterials(course.id, allMaterials)

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Create course error:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    const existing = await db.course.findUnique({
      where: { id },
      include: { topics: { include: { materials: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const oldMaterialIds = new Set(
      existing.topics.flatMap(t => t.materials.map(m => m.id))
    )
    for (const matId of oldMaterialIds) {
      await vectorStore.deleteSource(`course-${id}-material-${matId}`)
    }

    const body = await request.json()
    const { name, code, description, teacherId, topics } = body

    await db.topic.deleteMany({ where: { courseId: id } })

    const course = await db.course.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        code: code ?? existing.code,
        description: description !== undefined ? description : existing.description,
        teacherId: teacherId ?? existing.teacherId,
        topics: topics?.length ? {
          create: topics.map((t: any) => ({
            name: t.name,
            materials: t.materials?.length ? {
              create: t.materials.map((m: any) => ({
                title: m.title,
                contentType: m.contentType || 'document',
                contentUrl: m.contentUrl || '',
                content: m.content || null,
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

    const allMaterials = course.topics.flatMap(t => t.materials)
    await indexCourseMaterials(course.id, allMaterials)

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Update course error:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}
