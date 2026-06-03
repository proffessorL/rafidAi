import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const user = await db.user.findFirst({ select: { id: true, name: true } })
  if (!user) { console.log('No user found'); return }
  const count = await db.telemetryRecord.count({ where: { studentId: user.id } })
  const last5 = await db.telemetryRecord.findMany({ where: { studentId: user.id }, orderBy: { createdAt: 'desc' }, take: 5, select: { pageId: true, activeSeconds: true, tabFocused: true, createdAt: true } })
  const totalActive = await db.telemetryRecord.aggregate({ where: { studentId: user.id }, _sum: { activeSeconds: true } })
  console.log('User:', user.name, user.id)
  console.log('Total telemetry records:', count)
  console.log('Total activeSeconds:', totalActive._sum.activeSeconds, '=', Math.floor((totalActive._sum.activeSeconds || 0) / 60), 'minutes')
  console.log('Last 5:', JSON.stringify(last5, null, 2))
}
main().then(() => process.exit(0))
