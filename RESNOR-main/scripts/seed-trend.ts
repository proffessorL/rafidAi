import { db } from '../src/lib/db'

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3600000)
}

async function main() {
  const students = await db.user.findMany({ where: { role: 'student' }, select: { id: true } })
  if (students.length === 0) { console.log('No students'); return }

  await db.burnoutPrediction.deleteMany({})

  const predictions: any[] = []
  for (const s of students) {
    const isHigh = Math.random() > 0.5
    for (let j = 14; j >= 0; j--) {
      const pct = isHigh ? 40 + Math.floor(Math.random() * 35) : 5 + Math.floor(Math.random() * 18)
      predictions.push({
        studentId: s.id,
        riskPercentage: pct,
        riskLevel: pct < 20 ? 'low' : pct < 40 ? 'moderate' : pct < 65 ? 'high' : 'severe',
        factors: '[]',
        recommendations: '[]',
        analyzedAt: hoursAgo(j * 24 + Math.floor(Math.random() * 8)),
      })
    }
  }

  await db.burnoutPrediction.createMany({ data: predictions })
  console.log(`Seeded ${predictions.length} predictions for ${students.length} students`)
  await db.$disconnect()
}

main().catch(console.error)
