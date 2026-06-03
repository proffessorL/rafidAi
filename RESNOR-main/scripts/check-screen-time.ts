import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const id = 'cmpec46el0000lluetzt1ndq3'
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  // Screen-time API style: all records today (no tabFocused filter, no page filter)
  const allToday = await db.telemetryRecord.findMany({
    where: { studentId: id, createdAt: { gte: todayStart } },
    select: { activeSeconds: true, tabFocused: true, interactionCount: true },
  })
  const totalActive = allToday.filter(r => r.interactionCount >= 3 && r.tabFocused).reduce((s, r) => s + r.activeSeconds, 0)
  const totalPassive = allToday.reduce((s, r) => s + r.activeSeconds, 0) - totalActive
  const allTotal = allToday.reduce((s, r) => s + r.activeSeconds, 0)
  console.log('All records today:', allToday.length)
  console.log('Total active+passive:', Math.floor(allTotal / 60), 'min')
  console.log('Active only:', Math.floor(totalActive / 60), 'min')
  console.log('Passive only:', Math.floor(totalPassive / 60), 'min')
  // Also check what screen-time would show with STUDY_PAGES filter
  const STUDY_PAGES = ['quiz', 'tutor', 'wellbeing', 'notes', 'gamification', 'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard']
  const studyToday = allToday.filter(r => true) // screen-time already filters in query
  // Wait, screen-time filters in the DB query, not after. Let me do it properly.
  const studyRecords = await db.telemetryRecord.findMany({
    where: { studentId: id, pageId: { in: STUDY_PAGES }, createdAt: { gte: todayStart } },
    select: { activeSeconds: true, tabFocused: true, interactionCount: true, pageId: true },
  })
  const studyActive = studyRecords.filter(r => r.interactionCount >= 3 && r.tabFocused).reduce((s, r) => s + r.activeSeconds, 0)
  const studyPassive = studyRecords.reduce((s, r) => s + r.activeSeconds, 0) - studyActive
  const studyTotal = studyRecords.reduce((s, r) => s + r.activeSeconds, 0)
  console.log('')
  console.log('Study pages today:', studyRecords.length)
  console.log('Study active:', Math.floor(studyActive / 60), 'min')
  console.log('Study passive:', Math.floor(studyPassive / 60), 'min')
  console.log('Study total:', Math.floor(studyTotal / 60), 'min')
  console.log('')
  // Per-page breakdown
  const pages = new Map<string, number>()
  for (const r of studyRecords) {
    pages.set(r.pageId, (pages.get(r.pageId) || 0) + r.activeSeconds)
  }
  for (const [page, sec] of pages) {
    console.log(`  ${page}: ${Math.floor(sec / 60)}min`)
  }
}
main().then(() => process.exit(0))
