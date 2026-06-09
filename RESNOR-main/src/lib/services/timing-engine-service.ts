import { db } from '@/lib/db'

export interface OptimalTime {
  dayOfWeek: number
  hourOfDay: number
  label: string
  score: number
}

export async function getOptimalDeliveryTime(studentId: string): Promise<OptimalTime | null> {
  const windows = await db.userActivityWindow.findMany({
    where: { studentId, sampleCount: { gte: 2 } },
    orderBy: { engagementScore: 'desc' },
  })

  if (windows.length === 0) return null

  const best = windows[0]

  const now = new Date()
  const currentDay = now.getDay()
  const currentHour = now.getHours()

  const sameDaySoon = windows.find(
    (w) => w.dayOfWeek === currentDay && w.hourOfDay > currentHour && w.hourOfDay <= currentHour + 4,
  )

  const target = sameDaySoon || best

  return {
    dayOfWeek: target.dayOfWeek,
    hourOfDay: target.hourOfDay,
    label: formatTimeWindow(target.dayOfWeek, target.hourOfDay),
    score: target.engagementScore,
  }
}

export async function getTopWindows(studentId: string, limit = 5) {
  return db.userActivityWindow.findMany({
    where: { studentId, sampleCount: { gte: 2 } },
    orderBy: { engagementScore: 'desc' },
    take: limit,
  })
}

export async function getOptimalTimeForType(
  studentId: string,
  type: string,
): Promise<OptimalTime | null> {
  const typeInteractions = await db.notificationInteraction.findMany({
    where: {
      studentId,
      notification: { type },
      action: { in: ['opened', 'clicked', 'dismissed'] },
    },
    select: { createdAt: true, action: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  if (typeInteractions.length < 3) return null

  const hourScores: Record<number, { opens: number; total: number }> = {}

  for (const interaction of typeInteractions) {
    const hour = interaction.createdAt.getHours()
    if (!hourScores[hour]) hourScores[hour] = { opens: 0, total: 0 }
    hourScores[hour].total++
    if (interaction.action !== 'dismissed') hourScores[hour].opens++
  }

  let bestHour = -1
  let bestScore = 0

  for (const [hour, data] of Object.entries(hourScores)) {
    const score = data.total > 0 ? data.opens / data.total : 0
    if (score > bestScore) {
      bestScore = score
      bestHour = parseInt(hour)
    }
  }

  if (bestHour === -1) return null

  return {
    dayOfWeek: new Date().getDay(),
    hourOfDay: bestHour,
    label: formatTimeWindow(new Date().getDay(), bestHour),
    score: bestScore,
  }
}

export async function calculateDeliveryDelay(
  studentId: string,
  type: string,
): Promise<number> {
  const optimal = await getOptimalTimeForType(studentId, type)
  if (!optimal) return 0

  const now = new Date()
  const currentHour = now.getHours()
  const currentDay = now.getDay()

  if (optimal.dayOfWeek === currentDay && optimal.hourOfDay > currentHour) {
    return (optimal.hourOfDay - currentHour) * 3600000
  }

  if (optimal.dayOfWeek === currentDay && optimal.hourOfDay <= currentHour) {
    const todayAtOptimal = new Date(now)
    todayAtOptimal.setHours(optimal.hourOfDay, 0, 0, 0)
    if (now.getTime() < todayAtOptimal.getTime() + 3600000) return 0

    const daysUntilNext = (optimal.dayOfWeek + 7 - currentDay) % 7 || 7
    return daysUntilNext * 86400000 + (optimal.hourOfDay - currentHour) * 3600000
  }

  return 0
}

function formatTimeWindow(dayOfWeek: number, hourOfDay: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const period = hourOfDay >= 12 ? 'PM' : 'AM'
  const hour = hourOfDay > 12 ? hourOfDay - 12 : hourOfDay === 0 ? 12 : hourOfDay
  return `${days[dayOfWeek]} ${hour}${period}`
}
