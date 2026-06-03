import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const users = await db.user.findMany({ select: { id: true, name: true } })
  for (const u of users) {
    const count = await db.telemetryRecord.count({ where: { studentId: u.id } })
    const sum = await db.telemetryRecord.aggregate({ where: { studentId: u.id }, _sum: { activeSeconds: true } })
    const lastDate = await db.telemetryRecord.findFirst({ where: { studentId: u.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
    const matCount = await db.materialProgress.count({ where: { studentId: u.id } })
    const matSum = await db.materialProgress.aggregate({ where: { studentId: u.id }, _sum: { timeSpent: true } })
    console.log(`${u.name} (${u.id}): telemetry=${count} records, ${Math.floor((sum._sum.activeSeconds || 0) / 60)}min, last=${lastDate?.createdAt?.toISOString()?.slice(0,10) || 'never'}, materialProgress=${matCount} records, ${Math.floor((matSum._sum.timeSpent || 0) / 60)}min`)
  }
}
main().then(() => process.exit(0))
