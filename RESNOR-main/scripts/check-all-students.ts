import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  const STUDY_PAGES = ['quiz', 'tutor', 'wellbeing', 'notes', 'gamification', 'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard']
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 86400000)

  const students = await db.user.findMany({ where: { role: 'student' }, select: { id: true, name: true } })
  console.log(`Total students: ${students.length}`)

  for (const s of students) {
    const count = await db.telemetryRecord.count({
      where: { studentId: s.id, pageId: { in: STUDY_PAGES }, createdAt: { gte: sevenDaysAgo } },
    })
    const todayCount = await db.telemetryRecord.count({
      where: { studentId: s.id, pageId: { in: STUDY_PAGES }, createdAt: { gte: todayStart } },
    })
    console.log(`  ${s.name.padEnd(20)} ${String(count).padStart(3)} study records (${String(todayCount).padStart(2)} today)`)
  }
}

main().then(() => db.$disconnect())
