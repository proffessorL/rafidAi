import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const id = 'cmpec46el0000lluetzt1ndq3'
  const STUDY_PAGE_IDS = ['quiz', 'tutor', 'wellbeing', 'notes', 'gamification','planner', 'forum', 'explain-mistake', 'resources', 'leaderboard']
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const records = await db.telemetryRecord.findMany({
    where: { studentId: id, tabFocused: true, pageId: { in: STUDY_PAGE_IDS }, createdAt: { gte: sevenDaysAgo } },
    select: { activeSeconds: true, createdAt: true },
  })
  console.log('Total records in week:', records.length)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayStart = new Date(d)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(d)
    dayEnd.setHours(23, 59, 59, 999)
    const dayMs = records
      .filter(t => {
        const ca = new Date(t.createdAt)
        return ca >= dayStart && ca <= dayEnd
      })
      .reduce((sum, t) => sum + t.activeSeconds, 0)
    console.log(`${dayNames[d.getDay()]} ${d.toISOString().slice(0,10)}: ${Math.floor(dayMs / 60)}min (${dayMs} seconds, ${records.filter(t => { const ca = new Date(t.createdAt); return ca >= dayStart && ca <= dayEnd }).length} records)`)
  }
}
main().then(() => process.exit(0))
