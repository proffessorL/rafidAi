import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    const notifications = await db.notification.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })

    const unreadCount = notifications.filter(n => !n.isRead).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { student_id, title, message, type, action_url } = await request.json()

    if (!student_id || !title || !message || !type) {
      return NextResponse.json({ error: 'student_id, title, message, and type are required' }, { status: 400 })
    }

    const validTypes = ['info', 'warning', 'achievement', 'reminder']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    const notification = await db.notification.create({
      data: {
        studentId: student_id,
        title,
        message,
        type,
        actionUrl: action_url || null,
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Notification create error:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { notification_ids, mark_all, student_id } = await request.json()
    if (!student_id) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    if (mark_all) {
      await db.notification.updateMany({
        where: { studentId: student_id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    if (notification_ids?.length) {
      await db.notification.updateMany({
        where: { id: { in: notification_ids } },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'No action specified' }, { status: 400 })
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { notification_id } = await request.json()
    if (!notification_id) return NextResponse.json({ error: 'notification_id is required' }, { status: 400 })

    await db.notification.delete({ where: { id: notification_id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification delete error:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
