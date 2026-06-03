import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const id = 'cmpec46el0000lluetzt1ndq3'
  const STUDY_PAGE_IDS = ['quiz', 'tutor', 'wellbeing', 'notes', 'gamification','planner', 'forum', 'explain-mistake', 'resources', 'leaderboard']
  // Aggregate: study pages only (no tabFocused)
  const totalAgg = await db.telemetryRecord.aggregate({ where: { studentId: id, pageId: { in: STUDY_PAGE_IDS } }, _sum: { activeSeconds: true } })
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const todayAgg = await db.telemetryRecord.aggregate({ where: { studentId: id, pageId: { in: STUDY_PAGE_IDS }, createdAt: { gte: todayStart } }, _sum: { activeSeconds: true } })
  console.log('Total study pages (all time):', Math.floor((totalAgg._sum.activeSeconds || 0) / 60), 'min')
  console.log('Today study pages:', Math.floor((todayAgg._sum.activeSeconds || 0) / 60), 'min')
}
main().then(() => process.exit(0))
