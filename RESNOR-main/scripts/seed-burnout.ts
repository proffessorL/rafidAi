import { db } from '../src/lib/db'

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 3600000)
}

interface Fingerprint {
  avgHoursPerDay: number
  avgMood: number
  lowMoodRatio: number
  lateNightRatio: number
  quizScoreTrend: number
}

function makeFingerprintJson(fp: Fingerprint): string {
  return JSON.stringify(fp)
}

async function ensureCourseTopicQuiz() {
  const existing = await db.quiz.findFirst({ where: { title: 'Weekly Assessment' } })
  if (existing) return existing

  const course = await db.course.create({
    data: { name: 'Introduction to Programming', code: 'CSE-101', teacherId: 'seed' },
  })
  const topic = await db.topic.create({
    data: { name: 'Algorithms & Data Structures', courseId: course.id },
  })
  const quiz = await db.quiz.create({
    data: { title: 'Weekly Assessment', topicId: topic.id, difficulty: 'medium', timeLimit: 600 },
  })
  return quiz
}

async function main() {
  console.log('Seeding burnout data...\n')

  const quiz = await ensureCourseTopicQuiz()

  const students = await db.user.findMany({ where: { role: 'student' } })
  if (students.length === 0) {
    console.log('No students found. Run `npm run seed:auth` first.')
    return
  }
  console.log(`Found ${students.length} students\n`)

  // Clear only burnout-specific data (leave telemetry/moods/sessions/quizzes intact)
  const allIds = students.map(s => s.id)
  await db.burnoutCheckIn.deleteMany({ where: { studentId: { in: allIds } } })
  await db.burnoutPrediction.deleteMany({ where: { studentId: { in: allIds } } })
  console.log('Cleared existing burnout data\n')

  const allCheckIns: any[] = []
  const allPredictions: any[] = []

  for (let i = 0; i < students.length; i++) {
    const sid = students[i].id
    const isHigh = i % 2 === 0

    // Burnout check-ins (14 daily check-ins over the last 14 days)
    for (let j = 0; j < 14; j++) {
      const fp: Fingerprint = isHigh
        ? {
            avgHoursPerDay: randomInt(40, 100) / 10,
            avgMood: randomInt(2, 4),
            lowMoodRatio: Math.random() > 0.4 ? 1 : 0,
            lateNightRatio: Math.random() > 0.5 ? 1 : 0,
            quizScoreTrend: 1,
          }
        : {
            avgHoursPerDay: randomInt(10, 40) / 10,
            avgMood: randomInt(7, 9),
            lowMoodRatio: 0,
            lateNightRatio: 0,
            quizScoreTrend: 0,
          }
      allCheckIns.push({
        studentId: sid,
        rating: isHigh ? randomInt(4, 5) : randomInt(1, 2),
        stressRating: isHigh ? randomInt(4, 5) : randomInt(1, 2),
        fingerprint: makeFingerprintJson(fp),
        createdAt: hoursAgo(j * 24 + randomInt(1, 8)),
      })
    }

    // Burnout predictions (5 for trend history)
    for (let j = 4; j >= 0; j--) {
      const pct = isHigh ? randomInt(45, 80) : randomInt(5, 18)
      allPredictions.push({
        studentId: sid,
        riskPercentage: pct,
        riskLevel: pct < 20 ? 'low' : pct < 40 ? 'moderate' : pct < 65 ? 'high' : 'severe',
        factors: JSON.stringify([
          { name: 'Study Hours', impact: isHigh ? randomInt(20, 35) : randomInt(5, 12) },
          { name: 'Mood', impact: isHigh ? randomInt(15, 25) : randomInt(2, 8) },
          { name: 'Low Mood Days', impact: isHigh ? randomInt(10, 20) : randomInt(0, 3) },
          { name: 'Late Nights', impact: isHigh ? randomInt(8, 15) : randomInt(0, 3) },
          { name: 'Workload Balance', impact: isHigh ? randomInt(8, 10) : randomInt(2, 4) },
        ]),
        recommendations: JSON.stringify(isHigh
          ? ['Take a full rest day', 'Reduce study sessions to 3 max', 'Practice mindfulness 10 min', 'Sleep 7-8 hours']
          : ['Keep maintaining your balance!', 'Continue regular breaks', 'Stay hydrated and active']),
        analyzedAt: hoursAgo(j * 72 + 24),
      })
    }
  }

  console.log(`Inserting ${allCheckIns.length} burnout check-ins...`)
  await db.burnoutCheckIn.createMany({ data: allCheckIns })

  console.log(`Inserting ${allPredictions.length} burnout predictions...`)
  await db.burnoutPrediction.createMany({ data: allPredictions })

  console.log(`\n✅ Burnout seed complete for ${students.length} students`)
  console.log('Open Wellbeing > Burnout to see personalized AI predictions.')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => void db.$disconnect())
