import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const studentId = 'stu_001'

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

export async function PUT(request: Request) {
  try {
    const { notification_ids, mark_all } = await request.json()
    const studentId = 'stu_001'

    if (mark_all) {
      await db.notification.updateMany({
        where: { studentId, isRead: false },
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
