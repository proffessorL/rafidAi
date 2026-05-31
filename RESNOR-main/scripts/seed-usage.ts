import { db } from '../src/lib/db'

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 3600000)
}

const MOODS = ['happy', 'normal', 'stressed', 'anxious', 'burned_out']
const MOOD_NOTES: Record<string, string[]> = {
  happy: ['Great study session today!', 'Understood the topic well', 'Productive day'],
  normal: ['Regular study day', 'Average progress', 'Standard session'],
  stressed: ['Exam pressure building', 'Too much to cover', 'Falling behind schedule'],
  anxious: ['Worried about upcoming exams', 'Nervous about results', 'Can\'t focus properly'],
  burned_out: ['Completely exhausted', 'Need a break', 'Overwhelmed with workload'],
}

const SESSION_TYPES = ['pomodoro', 'deep_focus', 'quick']

async function ensureQuiz() {
  let quiz = await db.quiz.findFirst()
  if (!quiz) {
    const course = await db.course.create({
      data: { name: 'Introduction to Programming', code: 'CSE-101', teacherId: 'seed' },
    })
    const topic = await db.topic.create({
      data: { name: 'Algorithms & Data Structures', courseId: course.id },
    })
    quiz = await db.quiz.create({
      data: { title: 'Weekly Assessment', topicId: topic.id, difficulty: 'medium', timeLimit: 600 },
    })
  }
  return quiz
}

async function main() {
  console.log('Seeding focus sessions, mood entries, and quiz attempts...\n')

  const quiz = await ensureQuiz()

  const students = await db.user.findMany({ where: { role: 'student' }, select: { id: true, name: true } })
  if (students.length === 0) {
    console.log('No students found.')
    return
  }
  console.log(`Found ${students.length} students\n`)

  // Clear existing data (it's all fake from burnout seed anyway)
  for (const s of students) {
    const attempts = await db.quizAttempt.findMany({ where: { studentId: s.id }, select: { id: true } })
    for (const a of attempts) {
      await db.quizAnswer.deleteMany({ where: { attemptId: a.id } })
    }
  }
  await db.quizAttempt.deleteMany({})
  await db.focusSession.deleteMany({})
  await db.moodEntry.deleteMany({})
  console.log('Cleared existing focus/mood/quiz data\n')

  const allSessions: any[] = []
  const allMoods: any[] = []
  const allQuizzes: any[] = []

  for (const s of students) {
    const name = s.name || 'Unknown'

    // Focus sessions — 14 days, 1-4 per day
    for (let day = 13; day >= 0; day--) {
      const count = randomInt(1, 4)
      for (let i = 0; i < count; i++) {
        const startHour = randomInt(7, 23)
        const duration = randomInt(20, 90)
        const completed = Math.random() > 0.15
        allSessions.push({
          studentId: s.id,
          type: SESSION_TYPES[randomInt(0, 2)],
          duration,
          actualSeconds: completed ? duration * 60 : randomInt(60, duration * 60 - 60),
          completed,
          distractionScore: Math.random() > 0.7 ? randomInt(1, 8) / 10 : null,
          startedAt: hoursAgo(day * 24 + (23 - startHour)),
          completedAt: completed ? hoursAgo(day * 24 + (23 - startHour) - Math.ceil(duration / 60)) : null,
        })
      }
    }

    // Mood entries — 14 days, 1 per day
    for (let day = 13; day >= 0; day--) {
      const score = randomInt(3, 10)
      const mood = score <= 4 ? 'stressed' : score <= 6 ? 'normal' : 'happy'
      const notes = MOOD_NOTES[mood] || ['Regular day']
      allMoods.push({
        studentId: s.id,
        mood,
        score,
        note: notes[randomInt(0, notes.length - 1)],
        createdAt: hoursAgo(day * 24 + randomInt(8, 22)),
      })
    }

    // Quiz attempts — 10 per student, various scores
    for (let i = 0; i < 10; i++) {
      const score = randomInt(30, 95)
      const correct = Math.round(score / 10)
      allQuizzes.push({
        studentId: s.id,
        quizId: quiz.id,
        score,
        totalQuestions: 10,
        correctCount: Math.min(correct, 10),
        timeSpent: randomInt(180, 900),
        completedAt: hoursAgo(i * 30 + randomInt(1, 12)),
      })
    }

    console.log(`  ${name.padEnd(25)} ${14 * 4}+ sessions, 14 moods, 10 quizzes`)
  }

  console.log(`\nInserting ${allSessions.length} focus sessions...`)
  for (let i = 0; i < allSessions.length; i += 500) {
    await db.focusSession.createMany({ data: allSessions.slice(i, i + 500) })
  }

  console.log(`Inserting ${allMoods.length} mood entries...`)
  await db.moodEntry.createMany({ data: allMoods })

  console.log(`Inserting ${allQuizzes.length} quiz attempts...`)
  for (let i = 0; i < allQuizzes.length; i += 500) {
    await db.quizAttempt.createMany({ data: allQuizzes.slice(i, i + 500) })
  }

  console.log(`\n✅ Done! Focus time, quiz history, and mood data regenerated for ${students.length} students.`)
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => void db.$disconnect())
