import { db } from '@/lib/db'

export type InteractionAction = 'opened' | 'dismissed' | 'snoozed' | 'clicked' | 'delivered'

export async function logInteraction(
  notificationId: string,
  studentId: string,
  action: InteractionAction,
) {
  const interaction = await db.notificationInteraction.create({
    data: { notificationId, studentId, action },
  })

  if (action === 'opened' || action === 'clicked') {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const hourOfDay = now.getHours()

    const window = await db.userActivityWindow.upsert({
      where: { studentId_dayOfWeek_hourOfDay: { studentId, dayOfWeek, hourOfDay } },
      update: {
        notificationOpens: { increment: 1 },
        sampleCount: { increment: 1 },
        engagementScore: { increment: 0.02 },
      },
      create: {
        studentId,
        dayOfWeek,
        hourOfDay,
        notificationOpens: 1,
        sampleCount: 1,
        engagementScore: 0.1,
      },
    })

    const totalInWindow = window.notificationOpens + window.notificationDismissals
    const openRate = totalInWindow > 0 ? window.notificationOpens / totalInWindow : 0
    await db.userActivityWindow.update({
      where: { studentId_dayOfWeek_hourOfDay: { studentId, dayOfWeek, hourOfDay } },
      data: { engagementScore: Math.min(1, openRate) },
    })
  }

  if (action === 'dismissed') {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const hourOfDay = now.getHours()

    await db.userActivityWindow.upsert({
      where: { studentId_dayOfWeek_hourOfDay: { studentId, dayOfWeek, hourOfDay } },
      update: {
        notificationDismissals: { increment: 1 },
        sampleCount: { increment: 1 },
        engagementScore: { decrement: 0.01 },
      },
      create: {
        studentId,
        dayOfWeek,
        hourOfDay,
        notificationDismissals: 1,
        sampleCount: 1,
        engagementScore: 0.05,
      },
    })
  }

  return interaction
}

export async function getInteractionStats(studentId: string, days = 7) {
  const since = new Date(Date.now() - days * 86400000)

  const interactions = await db.notificationInteraction.findMany({
    where: { studentId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
  })

  const total = interactions.length
  const opened = interactions.filter((i) => i.action === 'opened').length
  const dismissed = interactions.filter((i) => i.action === 'dismissed').length
  const clicked = interactions.filter((i) => i.action === 'clicked').length

  return {
    total,
    opened,
    dismissed,
    clicked,
    engagementRate: total > 0 ? (opened + clicked) / total : 0,
  }
}

export async function getRecentInteractions(studentId: string, limit = 20) {
  return db.notificationInteraction.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      notification: { select: { title: true, type: true } },
    },
  })
}
