import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const PAGE_IDS = [
  'quiz', 'tutor', 'notes', 'resources', 'courses',
  'pomodoro', 'planner', 'gamification', 'leaderboard', 'forum',
  'explain-mistake', 'dashboard', 'wellbeing', 'grades',
]

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 3600000)
}

async function main() {
  console.log('Seeding telemetry data for all students...\n')

  const students = await db.user.findMany({ where: { role: 'student' } })
  if (students.length === 0) {
    console.log('No students found.')
    return
  }
  console.log(`Found ${students.length} students\n`)

  // Clear old telemetry
  await db.telemetryRecord.deleteMany({})

  let totalRecords = 0

  for (const student of students) {
    const sid = student.id
    const records: any[] = []

    // Each student gets 4-8 days of data
    const days = randomInt(4, 8)
    const engagementProfile = randomInt(0, 3) // 0=active, 1=mixed, 2=passive, 3=inconsistent

    for (let day = days - 1; day >= 0; day--) {
      // Number of sessions per day varies by profile
      let sessionsPerDay: number
      switch (engagementProfile) {
        case 0: sessionsPerDay = randomInt(4, 7); break  // active
        case 1: sessionsPerDay = randomInt(2, 5); break  // mixed
        case 2: sessionsPerDay = randomInt(1, 3); break  // passive
        default: sessionsPerDay = randomInt(1, 6); break // inconsistent
      }

      for (let s = 0; s < sessionsPerDay; s++) {
        const pageId = PAGE_IDS[randomInt(0, PAGE_IDS.length - 1)]
        const sessionHour = randomInt(7, 23)
        const heartbeats = randomInt(2, 6)

        for (let h = 0; h < heartbeats; h++) {
          // Active students have high interaction + focus
          // Passive students have low interaction + tab unfocused
          const isActiveSession = Math.random() < (engagementProfile === 0 ? 0.8 : engagementProfile === 2 ? 0.2 : 0.5)
          const isInconsistent = engagementProfile === 3 && Math.random() > 0.6

          const tabFocused = isActiveSession ? Math.random() > 0.1 : isInconsistent ? Math.random() > 0.5 : Math.random() > 0.65
          const interactionCount = isActiveSession ? randomInt(4, 20) : randomInt(0, 3)
          const scrollPercentage = isActiveSession ? randomInt(40, 100) : randomInt(0, 35)
          const activeSeconds = isActiveSession ? randomInt(30, 180) : randomInt(5, 40)

          records.push({
            studentId: sid,
            pageId,
            activeSeconds,
            scrollPercentage,
            interactionCount,
            tabFocused,
            createdAt: hoursAgo(day * 24 + (24 - sessionHour) + h * 0.15),
          })
        }
      }
    }

    await db.telemetryRecord.createMany({ data: records })
    totalRecords += records.length
    console.log(`  ${(student.name || student.id).padEnd(20)} ${records.length} records (profile: ${['active', 'mixed', 'passive', 'inconsistent'][engagementProfile]})`)
  }

  console.log(`\n✅ Total: ${totalRecords} telemetry records across ${students.length} students`)
  console.log('Open the Engagement Tracker to see screen time data.')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
