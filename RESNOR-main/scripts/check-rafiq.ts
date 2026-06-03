import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const id = 'cmpec46el0000lluetzt1ndq3'
  const count = await db.telemetryRecord.count({ where: { studentId: id } })
  const sum = await db.telemetryRecord.aggregate({ where: { studentId: id }, _sum: { activeSeconds: true } })
  const last = await db.telemetryRecord.findFirst({ where: { studentId: id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true, pageId: true, activeSeconds: true } })
  const matSum = await db.materialProgress.aggregate({ where: { studentId: id }, _sum: { timeSpent: true } })
  console.log('Rafiq Ahmed telemetry:', count, 'records,', Math.floor((sum._sum.activeSeconds || 0) / 60), 'min, last:', last?.createdAt?.toISOString(), last?.pageId)
  console.log('Rafiq Ahmed materialProgress:', Math.floor((matSum._sum.timeSpent || 0) / 60), 'min')
}
main().then(() => process.exit(0))
