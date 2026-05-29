import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const STUDY_PAGES = ['quiz', 'tutor', 'wellbeing', 'notes', 'gamification', 'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard']

function classifyRecord(interactionCount: number, tabFocused: boolean): 'active' | 'passive' {
  return interactionCount >= 3 && tabFocused ? 'active' : 'passive'
}

async function main() {
  const student = await db.user.findFirst({ where: { role: 'student' } })
  if (!student) { console.log('No student'); return }

  const studentId = student.id
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 86400000)

  console.log('now:', now.toISOString())
  console.log('todayStart:', todayStart.toISOString())
  console.log('sevenDaysAgo:', sevenDaysAgo.toISOString())
  console.log('Student:', student.name, studentId)
  console.log('')

  const records = await db.telemetryRecord.findMany({
    where: { studentId, pageId: { in: STUDY_PAGES }, createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Total records fetched: ${records.length}`)
  console.log(`Date range: ${records[0]?.createdAt.toISOString()} to ${records[records.length-1]?.createdAt.toISOString()}`)
  console.log('')

  // Check daily totals the same way API does
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayEnd = new Date(day.getTime() + 86400000)
    const dayRecords = records.filter((r) => r.createdAt >= day && r.createdAt < dayEnd)
    const dayActive = dayRecords.filter((r) => classifyRecord(r.interactionCount, r.tabFocused) === 'active')
      .reduce((s, r) => s + r.activeSeconds, 0)
    const dayPassive = dayRecords.filter((r) => classifyRecord(r.interactionCount, r.tabFocused) === 'passive')
      .reduce((s, r) => s + r.activeSeconds, 0)

    console.log(`  ${day.toISOString().split('T')[0]}: ${dayRecords.length} records, active=${Math.round(dayActive/60)}min, passive=${Math.round(dayPassive/60)}min, total=${Math.round((dayActive+dayPassive)/60)}min`)
  }
}

main().then(() => db.$disconnect())
