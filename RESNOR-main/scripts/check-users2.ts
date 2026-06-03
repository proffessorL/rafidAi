import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const users = await db.user.findMany({ select: { id: true, name: true, email: true, studentId: true } })
  for (const u of users) {
    const matSum = await db.materialProgress.aggregate({ where: { studentId: u.id }, _sum: { timeSpent: true } })
    const matCount = await db.materialProgress.count({ where: { studentId: u.id } })
    console.log(`${u.name} | ${u.email} | sid=${u.studentId} | id=${u.id} | materialProgress: ${matCount} records, ${Math.floor((matSum._sum.timeSpent || 0) / 60)}min`)
  }
}
main().then(() => process.exit(0))
