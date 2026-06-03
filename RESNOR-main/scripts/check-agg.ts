import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const id = 'cmpec46el0000lluetzt1ndq3'
  const STUDY_PAGE_IDS = ['quiz', 'tutor', 'wellbeing', 'notes', 'gamification','planner', 'forum', 'explain-mistake', 'resources', 'leaderboard']

  // Query 1: aggregate total (no date filter)
  const totalAgg = await db.telemetryRecord.aggregate({
    where: { studentId: id, tabFocused: true, pageId: { in: STUDY_PAGE_IDS } },
    _sum: { activeSeconds: true },
  })
  console.log('AGGREGATE total (no date):', totalAgg._sum.activeSeconds, 'seconds =', Math.floor((totalAgg._sum.activeSeconds || 0) / 60), 'min')

  // Query 2: findMany total (no date filter)
  const totalRecords = await db.telemetryRecord.findMany({
    where: { studentId: id, tabFocused: true, pageId: { in: STUDY_PAGE_IDS } },
    select: { activeSeconds: true },
  })
  const totalSum = totalRecords.reduce((s, t) => s + t.activeSeconds, 0)
  console.log('findMany total (no date):', totalSum, 'seconds =', Math.floor(totalSum / 60), 'min (records:', totalRecords.length, ')')

  // Query 3: findMany last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const weekRecords = await db.telemetryRecord.findMany({
    where: { studentId: id, tabFocused: true, pageId: { in: STUDY_PAGE_IDS }, createdAt: { gte: sevenDaysAgo } },
    select: { activeSeconds: true, createdAt: true },
  })
  const weekSum = weekRecords.reduce((s, t) => s + t.activeSeconds, 0)
  console.log('findMany last 7 days:', weekSum, 'seconds =', Math.floor(weekSum / 60), 'min (records:', weekRecords.length, ')')

  // Query 4: aggregate last 7 days
  const weekAgg = await db.telemetryRecord.aggregate({
    where: { studentId: id, tabFocused: true, pageId: { in: STUDY_PAGE_IDS }, createdAt: { gte: sevenDaysAgo } },
    _sum: { activeSeconds: true },
  })
  console.log('AGGREGATE last 7 days:', weekAgg._sum.activeSeconds, 'seconds =', Math.floor((weekAgg._sum.activeSeconds || 0) / 60), 'min')
}
main().then(() => process.exit(0))
