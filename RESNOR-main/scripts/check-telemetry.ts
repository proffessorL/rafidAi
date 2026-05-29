import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  const total = await db.telemetryRecord.count()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayCount = await db.telemetryRecord.count({ where: { createdAt: { gte: today } } })
  const newest = await db.telemetryRecord.findFirst({ orderBy: { createdAt: 'desc' } })
  const oldest = await db.telemetryRecord.findFirst({ orderBy: { createdAt: 'asc' } })
  const studyPages = ['quiz', 'tutor', 'wellbeing', 'notes', 'gamification', 'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard']
  const studyCount = await db.telemetryRecord.count({ where: { pageId: { in: studyPages } } })

  console.log('Total telemetry records:', total)
  console.log('Today\'s records:', todayCount)
  console.log('Study page records:', studyCount)
  console.log('Newest record:', newest?.createdAt)
  console.log('Oldest record:', oldest?.createdAt)
  console.log('Date range covers', oldest && newest ? `${Math.round((newest.createdAt.getTime() - oldest.createdAt.getTime()) / 86400000)} days` : 'N/A')
}

main().then(() => db.$disconnect())
