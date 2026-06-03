import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const users = await db.user.findMany({ select: { id: true, name: true } })
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const STUDY_PAGE_IDS = ['quiz', 'tutor', 'wellbeing', 'notes', 'gamification','planner', 'forum', 'explain-mistake', 'resources', 'leaderboard']
  for (const u of users) {
    const day = await db.telemetryRecord.aggregate({
      where: { studentId: u.id, tabFocused: true, pageId: { in: STUDY_PAGE_IDS }, createdAt: { gte: todayStart } },
      _sum: { activeSeconds: true },
    })
    const total = await db.telemetryRecord.aggregate({
      where: { studentId: u.id, tabFocused: true, pageId: { in: STUDY_PAGE_IDS } },
      _sum: { activeSeconds: true },
    })
    if ((day._sum.activeSeconds || 0) > 0) {
      console.log(`${u.name}: today=${Math.floor((day._sum.activeSeconds || 0) / 60)}min, total=${Math.floor((total._sum.activeSeconds || 0) / 60)}min`)
    }
  }
}
main().then(() => process.exit(0))
