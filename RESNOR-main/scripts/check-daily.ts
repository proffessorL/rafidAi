import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  const STUDY_PAGES = ['quiz', 'tutor', 'wellbeing', 'notes', 'gamification', 'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard']
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 86400000)

  const student = await db.user.findFirst({ where: { role: 'student' } })
  if (!student) { console.log('No student found'); return }

  const records = await db.telemetryRecord.findMany({
    where: { studentId: student.id, pageId: { in: STUDY_PAGES }, createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Student: ${student.name}`)
  console.log(`Total study records: ${records.length}\n`)

  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayEnd = new Date(day.getTime() + 86400000)
    const dayRecords = records.filter((r) => r.createdAt >= day && r.createdAt < dayEnd)
    const totalSec = dayRecords.reduce((s, r) => s + r.activeSeconds, 0)
    const count = dayRecords.length
    console.log(`${day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${count} records, ${Math.round(totalSec / 60)}min total`)
  }
}

main().then(() => db.$disconnect())
