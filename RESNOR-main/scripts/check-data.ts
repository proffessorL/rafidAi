import { db } from '../src/lib/db'

async function main() {
  const students = await db.user.findMany({ where: { role: 'student' }, select: { id: true, name: true } })
  console.log(`Total students: ${students.length}`)

  for (const s of students.slice(0, 3)) {
    const focus = await db.focusSession.count({ where: { studentId: s.id } })
    const quiz = await db.quizAttempt.count({ where: { studentId: s.id } })
    const mood = await db.moodEntry.count({ where: { studentId: s.id } })
    const tele = await db.telemetryRecord.count({ where: { studentId: s.id } })
    const burnoutChecks = await db.burnoutCheckIn.count({ where: { studentId: s.id } })
    console.log(`${s.name}: focus=${focus} quiz=${quiz} mood=${mood} tele=${tele} burnoutCheckin=${burnoutChecks}`)
  }

  await db.$disconnect()
}

main().catch(console.error).finally(() => process.exit(0))
