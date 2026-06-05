import { db } from '../src/lib/db'
import { createHash } from 'crypto'

const NOW = Date.now()
const DAY_MS = 86400000
const PAGE_IDS = ['quiz', 'tutor', 'notes', 'resources', 'leaderboard', 'planner', 'wellbeing', 'explain-mistake', 'forum', 'gamification', 'courses', 'pomodoro', 'dashboard', 'grades']
const STUDY_PAGE_IDS = ['quiz', 'tutor', 'notes', 'resources', 'leaderboard', 'planner', 'wellbeing', 'explain-mistake', 'forum', 'gamification']
const MOODS = ['happy', 'normal', 'stressed', 'anxious', 'burned_out']
const SESSION_TYPES = ['pomodoro', 'deep_focus', 'quick']
const MISTAKE_TYPES = ['CONCEPT_MISUNDERSTANDING', 'FALSE_ASSUMPTION', 'FORMULA_MISUSE', 'ALGEBRAIC_ERROR', 'CALCULATION_FLOW_EXCEPTION', 'LOGIC_ERROR', 'SEQUENTIAL_REASONING_FAILURE', 'SYNTAX_ERROR', 'CARELESS_MISTAKE', 'KNOWLEDGE_GAP']

function hashPassword(password: string): string {
  return createHash('sha256').update(password + '_resnor_salt_2024').digest('hex')
}

function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function pickN<T>(arr: T[], n: number): T[] { const s = [...arr].sort(() => Math.random() - 0.5); return s.slice(0, n) }

function hoursAgo(hours: number): Date { return new Date(NOW - hours * 3600000) }

function daysAgo(days: number): Date { return new Date(NOW - days * DAY_MS) }

// Define student profiles for meaningful data
interface StudentProfile {
  name: string; email: string; studentId: string; semester: string
  engagementLevel: 'high' | 'medium' | 'low' | 'struggling' | 'inconsistent'
  baseXp: number; baseStreak: number
  avgMoodScore: number; baseQuizScore: number
  studyHoursPerDay: number; consistencyRate: number
}

const STUDENTS: StudentProfile[] = [
  { name: 'Ayesha Rahman', email: 'ayesha@diu.edu.bd', studentId: 'CSE-401', semester: '7th', engagementLevel: 'high', baseXp: 15800, baseStreak: 21, avgMoodScore: 8, baseQuizScore: 88, studyHoursPerDay: 5.5, consistencyRate: 90 },
  { name: 'Farhan Islam', email: 'farhan@diu.edu.bd', studentId: 'CSE-402', semester: '7th', engagementLevel: 'high', baseXp: 14200, baseStreak: 18, avgMoodScore: 7, baseQuizScore: 82, studyHoursPerDay: 5.0, consistencyRate: 85 },
  { name: 'Sakib Hasan', email: 'sakib@diu.edu.bd', studentId: 'CSE-403', semester: '5th', engagementLevel: 'medium', baseXp: 11200, baseStreak: 14, avgMoodScore: 7, baseQuizScore: 75, studyHoursPerDay: 4.0, consistencyRate: 72 },
  { name: 'Maliha Tabassum', email: 'maliha@diu.edu.bd', studentId: 'CSE-404', semester: '5th', engagementLevel: 'medium', baseXp: 12300, baseStreak: 16, avgMoodScore: 7, baseQuizScore: 78, studyHoursPerDay: 4.2, consistencyRate: 78 },
  { name: 'Tahmina Akter', email: 'tahmina@diu.edu.bd', studentId: 'CSE-405', semester: '5th', engagementLevel: 'medium', baseXp: 9500, baseStreak: 12, avgMoodScore: 6, baseQuizScore: 70, studyHoursPerDay: 3.5, consistencyRate: 65 },
  { name: 'Imran Hossain', email: 'imran@diu.edu.bd', studentId: 'CSE-406', semester: '3rd', engagementLevel: 'inconsistent', baseXp: 7200, baseStreak: 8, avgMoodScore: 6, baseQuizScore: 65, studyHoursPerDay: 3.0, consistencyRate: 55 },
  { name: 'Sumaiya Islam', email: 'sumaiya@diu.edu.bd', studentId: 'CSE-407', semester: '3rd', engagementLevel: 'low', baseXp: 5800, baseStreak: 6, avgMoodScore: 5, baseQuizScore: 58, studyHoursPerDay: 2.5, consistencyRate: 45 },
  { name: 'Arif Uddin', email: 'arif@diu.edu.bd', studentId: 'CSE-408', semester: '3rd', engagementLevel: 'medium', baseXp: 10500, baseStreak: 13, avgMoodScore: 7, baseQuizScore: 72, studyHoursPerDay: 3.8, consistencyRate: 70 },
  { name: 'Sharmin Sultana', email: 'sharmin@diu.edu.bd', studentId: 'CSE-409', semester: '5th', engagementLevel: 'low', baseXp: 8200, baseStreak: 9, avgMoodScore: 5, baseQuizScore: 60, studyHoursPerDay: 2.8, consistencyRate: 50 },
  { name: 'Rakibul Islam', email: 'rakibul@diu.edu.bd', studentId: 'CSE-410', semester: '3rd', engagementLevel: 'struggling', baseXp: 4200, baseStreak: 4, avgMoodScore: 4, baseQuizScore: 45, studyHoursPerDay: 2.0, consistencyRate: 35 },
  { name: 'Nadia Afrin', email: 'nadia@diu.edu.bd', studentId: 'CSE-411', semester: '5th', engagementLevel: 'high', baseXp: 13500, baseStreak: 19, avgMoodScore: 8, baseQuizScore: 85, studyHoursPerDay: 5.2, consistencyRate: 88 },
  { name: 'Tanvir Ahmed', email: 'tanvir.ahmed@diu.edu.bd', studentId: 'CSE-412', semester: '7th', engagementLevel: 'high', baseXp: 14800, baseStreak: 20, avgMoodScore: 8, baseQuizScore: 86, studyHoursPerDay: 5.0, consistencyRate: 85 },
  { name: 'Karim Hossain', email: 'karim@diu.edu.bd', studentId: 'CSE-413', semester: '3rd', engagementLevel: 'struggling', baseXp: 3800, baseStreak: 3, avgMoodScore: 3, baseQuizScore: 38, studyHoursPerDay: 1.5, consistencyRate: 28 },
  { name: 'Fatima Akter', email: 'fatima.akter@diu.edu.bd', studentId: 'CSE-414', semester: '1st', engagementLevel: 'medium', baseXp: 2500, baseStreak: 5, avgMoodScore: 7, baseQuizScore: 68, studyHoursPerDay: 3.2, consistencyRate: 60 },
  { name: 'Nusrat Jahan', email: 'nusrat@diu.edu.bd', studentId: 'CSE-332', semester: '5th', engagementLevel: 'medium', baseXp: 10200, baseStreak: 11, avgMoodScore: 6, baseQuizScore: 72, studyHoursPerDay: 3.5, consistencyRate: 68 },
]

function xpForLevel(level: number) { return 500 * level * (level - 1) / 2 }

function findLevel(totalXp: number) {
  let lv = 1
  while (totalXp >= xpForLevel(lv + 1)) lv++
  return lv
}

function makeFingerprintJson(avgHoursPerDay: number, avgMood: number, lowMoodRatio: number, lateNightRatio: number, quizScoreTrend: number): string {
  return JSON.stringify({ avgHoursPerDay, avgMood, lowMoodRatio, lateNightRatio, quizScoreTrend })
}

const BADGE_DEFS = [
  { name: 'First Steps', description: 'Earn your first 500 XP', icon: '🌟', category: 'study', thresholdType: 'xp', thresholdValue: 500 },
  { name: 'Dedicated Learner', description: 'Earn 5000 total XP', icon: '🔥', category: 'study', thresholdType: 'xp', thresholdValue: 5000 },
  { name: 'Knowledge Seeker', description: 'Earn 10000 total XP', icon: '📚', category: 'study', thresholdType: 'xp', thresholdValue: 10000 },
  { name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', thresholdType: 'streak_days', thresholdValue: 7 },
  { name: 'Consistency King', description: 'Maintain a 14-day streak', icon: '👑', category: 'streak', thresholdType: 'streak_days', thresholdValue: 14 },
  { name: 'Quiz Ace', description: 'Score 90%+ on a quiz', icon: '🎯', category: 'quiz', thresholdType: 'quiz_score', thresholdValue: 90 },
  { name: 'Study Marathon', description: 'Maintain a 21-day streak', icon: '🏃', category: 'streak', thresholdType: 'streak_days', thresholdValue: 21 },
  { name: 'First Quiz', description: 'Complete your first quiz', icon: '🎯', category: 'quiz', thresholdType: 'quiz_count', thresholdValue: 1 },
  { name: 'Quiz Master', description: 'Complete 5 quizzes', icon: '⚡', category: 'quiz', thresholdType: 'quiz_count', thresholdValue: 5 },
  { name: 'Material Explorer', description: 'Complete 10 materials', icon: '📚', category: 'study', thresholdType: 'materials_done', thresholdValue: 10 },
  { name: 'Bookworm', description: 'Complete 5 materials', icon: '📖', category: 'study', thresholdType: 'materials_done', thresholdValue: 5 },
  { name: 'Perfect Score', description: 'Score 100% on a quiz', icon: '💯', category: 'quiz', thresholdType: 'quiz_score', thresholdValue: 100 },
  { name: 'Engagement Pro', description: 'Reach 80% engagement score', icon: '💎', category: 'engagement', thresholdType: 'engagement_score', thresholdValue: 80 },
]

async function main() {
  console.log('🌱 Starting comprehensive seed...\n')

  // ─── CLEAR EXISTING DATA (order matters for FK) ───
  console.log('Clearing existing data...')
  const tables = [
    'remediationExercise', 'mistakeExplanation', 'followUpMessage', 'studyNote', 'voiceInteraction',
    'companionInteraction', 'mentorMessage', 'focusSession', 'wellbeingJournal', 'moodEntry',
    'burnoutCheckIn', 'burnoutPrediction', 'wellbeingAnalytics', 'wellbeingCheckin',
    'chatMessage', 'chatSession', 'telemetryRecord', 'interventionRecord',
    'quizAnswer', 'quizAttempt', 'notification', 'earnedBadge',
    'materialProgress', 'quizQuestion', 'quiz', 'material', 'topic',
    'semesterSnapshot', 'academicRisk', 'cognitiveProfile', 'misconceptionLog', 'revisionPlan',
    'engagementScore', 'streak', 'studentProgress', 'authSession',
    'enrollment', 'course', 'studyGroupMember', 'studyGroup', 'pomodoroSession', 'pomodoroSettings',
  ]
  for (const t of tables) {
    try { await (db as any)[t].deleteMany() } catch { /* skip if not exists */ }
  }
  await db.resource.deleteMany()
  await db.badge.deleteMany()
  await db.user.deleteMany()
  console.log('  Done clearing\n')

  // ─── CREATE TEACHERS ───
  console.log('Creating teachers...')
  const teacher1 = await db.user.create({
    data: {
      email: 'dr.kamal@diu.edu.bd', name: 'Dr. Md. Kamal Hossain', role: 'teacher',
      passwordHash: hashPassword('demo123'), institution: 'Department of CSE, DIU',
      phone: '01711111111', bio: 'Professor of Software Engineering & AI',
    }
  })
  const teacher2 = await db.user.create({
    data: {
      email: 'prof.shahnaz@diu.edu.bd', name: 'Prof. Shahnaz Parvin', role: 'teacher',
      passwordHash: hashPassword('demo123'), institution: 'Department of CSE, DIU',
      phone: '01711111112', bio: 'Professor of Database Systems & Networks',
    }
  })
  const teachers = [teacher1, teacher2]
  console.log(`  Created ${teachers.length} teachers\n`)

  // ─── CREATE STUDENTS ───
  console.log('Creating students...')
  const studentMap: Record<string, Awaited<ReturnType<typeof db.user.create>>> = {}
  for (const s of STUDENTS) {
    const user = await db.user.create({
      data: {
        email: s.email, name: s.name, role: 'student', studentId: s.studentId,
        institution: 'Daffodil International University', phone: `017${randomInt(10000000, 99999999)}`,
        semester: s.semester, passwordHash: hashPassword('demo123'),
      }
    })
    studentMap[s.email] = user
  }
  const students = Object.values(studentMap)
  console.log(`  Created ${students.length} students\n`)

  // ─── CREATE COURSES ───
  console.log('Creating courses...')
  const courseData = [
    { name: 'Software Engineering', code: 'CSE-401', description: 'Software development life cycle, methodologies, and project management', teacherId: teacher1.id },
    { name: 'Artificial Intelligence', code: 'CSE-403', description: 'Search algorithms, neural networks, and intelligent systems', teacherId: teacher1.id },
    { name: 'Computer Networks', code: 'CSE-405', description: 'Network protocols, architecture, and security fundamentals', teacherId: teacher2.id },
    { name: 'Database Systems', code: 'CSE-331', description: 'Relational databases, SQL, normalization, and query optimization', teacherId: teacher2.id },
  ]
  const courses: any[] = []
  for (const c of courseData) {
    courses.push(await db.course.create({ data: c }))
  }
  console.log(`  Created ${courses.length} courses\n`)

  // ─── CREATE TOPICS & MATERIALS ───
  console.log('Creating topics and materials...')
  const topicNamesByCourse: Record<string, string[]> = {
    [courses[0].id]: ['Requirements Engineering', 'Software Design Patterns', 'Testing & QA', 'Agile Methodologies'],
    [courses[1].id]: ['Search Algorithms', 'Machine Learning Fundamentals', 'Neural Networks', 'Natural Language Processing'],
    [courses[2].id]: ['Network Topologies & OSI Model', 'TCP/IP Protocol Suite', 'Network Security', 'Routing Algorithms'],
    [courses[3].id]: ['ER Modeling & Schema Design', 'SQL & Query Optimization', 'Normalization & Transactions', 'NoSQL Databases'],
  }
  const allTopics: any[] = []
  const allMaterials: any[] = []
  const contentTypes = ['document', 'video', 'slide']
  const materialTitles = ['Lecture Notes', 'Video Tutorial', 'Slide Deck', 'Practice Problems', 'Reference Guide']

  for (const course of courses) {
    const topicNames = topicNamesByCourse[course.id]
    for (let ti = 0; ti < topicNames.length; ti++) {
      const topic = await db.topic.create({ data: { name: topicNames[ti], courseId: course.id } })
      allTopics.push(topic)
      // 3 materials per topic
      for (let mi = 0; mi < 3; mi++) {
        const mat = await db.material.create({
          data: {
            title: `${topicNames[ti]} - ${materialTitles[mi % materialTitles.length]}`,
            topicId: topic.id, contentType: contentTypes[mi % 3],
            estimatedTime: [30, 45, 20, 40, 25][mi],
          }
        })
        allMaterials.push(mat)
      }
    }
  }
  console.log(`  Created ${allTopics.length} topics, ${allMaterials.length} materials\n`)

  // ─── CREATE QUIZZES & QUESTIONS ───
  console.log('Creating quizzes...')
  const quizTemplates = [
    { q: 'What is the primary goal of requirements engineering?', a: 'Define system functionality', b: 'Write code', c: 'Test the system', d: 'Deploy the product', key: 'A' },
    { q: 'Which design pattern provides a way to create objects without specifying the exact class?', a: 'Singleton', b: 'Factory Method', c: 'Observer', d: 'Strategy', key: 'B' },
    { q: 'What does the OSI model physical layer define?', a: 'Data encryption', b: 'Electrical signals', c: 'IP addressing', d: 'Session management', key: 'B' },
    { q: 'In SQL, which clause is used to filter groups?', a: 'WHERE', b: 'HAVING', c: 'FILTER', d: 'GROUP BY', key: 'B' },
    { q: 'What is the time complexity of binary search?', a: 'O(n)', b: 'O(n²)', c: 'O(log n)', d: 'O(1)', key: 'C' },
  ]
  const allQuizzes: any[] = []
  const allQuizQuestions: any[] = []

  for (let ci = 0; ci < courses.length; ci++) {
    const courseTopics = allTopics.filter(t => t.courseId === courses[ci].id)
    for (let ti = 0; ti < Math.min(2, courseTopics.length); ti++) {
      const topic = courseTopics[ti]
      const quiz = await db.quiz.create({
        data: {
          topicId: topic.id, title: `${topic.name} Assessment`,
          difficulty: ti === 0 ? 'easy' : 'medium', timeLimit: 600,
          teacherId: teachers[ci % 2].id,
        }
      })
      allQuizzes.push(quiz)
      // 5 questions per quiz
      for (let qi = 0; qi < 5; qi++) {
        const t = quizTemplates[(ci + ti + qi) % quizTemplates.length]
        const q = await db.quizQuestion.create({
          data: {
            quizId: quiz.id, question: t.q,
            optionA: t.a, optionB: t.b, optionC: t.c, optionD: t.d,
            correctKey: t.key, explanation: `The correct answer is ${t.key}: ${[t.a, t.b, t.c, t.d][t.key.charCodeAt(0) - 65]}.`,
          }
        })
        allQuizQuestions.push(q)
      }
    }
  }
  console.log(`  Created ${allQuizzes.length} quizzes, ${allQuizQuestions.length} questions\n`)

  // ─── ENROLL ALL STUDENTS ───
  console.log('Enrolling students...')
  let enrollmentCount = 0
  for (const student of students) {
    for (const course of courses) {
      await db.enrollment.create({
        data: {
          studentId: student.id, courseId: course.id,
          attendance: randomInt(65, 100), assignmentMark: randomInt(55, 100),
          presentationMark: randomInt(60, 100), midMark: randomInt(40, 95), finalMark: randomInt(45, 95),
          status: 'enrolled',
        }
      })
      enrollmentCount++
    }
  }
  console.log(`  Created ${enrollmentCount} enrollments\n`)

  // ─── GENERATE 7 DAYS OF DATA PER STUDENT ───
  console.log('Generating 7 days of historical data per student...\n')

  const allTelemetry: any[] = []
  const allMoods: any[] = []
  const allFocusSessions: any[] = []
  const allQuizAttempts: any[] = []
  const allQuizAnswers: any[] = []
  const allMaterialProgress: any[] = []
  const allBurnoutCheckIns: any[] = []
  const allBurnoutPredictions: any[] = []
  const allNotifications: any[] = []
  const allAcademicRisks: any[] = []
  const allCognitiveProfiles: any[] = []
  const allMisconceptionLogs: any[] = []
  const allMistakeExplanations: any[] = []
  const allStudyNotes: any[] = []
  const allCompanionInteractions: any[] = []

  for (const sp of STUDENTS) {
    const user = studentMap[sp.email]
    const sid = user.id
    const name = user.name || ''
    const moodVariation = sp.avgMoodScore

    // ── Telemetry (multiple per day per page, last 7 days) ──
    for (let day = 7; day >= 0; day--) {
      const sessionsPerDay = sp.engagementLevel === 'high' ? randomInt(5, 8)
        : sp.engagementLevel === 'medium' ? randomInt(3, 6)
        : sp.engagementLevel === 'low' ? randomInt(2, 4)
        : sp.engagementLevel === 'struggling' ? randomInt(1, 3)
        : randomInt(2, 5)

      for (let s = 0; s < sessionsPerDay; s++) {
        const pageId = pick(STUDY_PAGE_IDS)
        const heartbeats = randomInt(3, 6)
        const isFocused = sp.engagementLevel === 'high' ? Math.random() < 0.85
          : sp.engagementLevel === 'struggling' ? Math.random() < 0.3
          : Math.random() < 0.6

        for (let h = 0; h < heartbeats; h++) {
          const activeSec = isFocused ? randomInt(40, 200) : randomInt(5, 40)
          allTelemetry.push({
            studentId: sid, pageId,
            activeSeconds: activeSec,
            scrollPercentage: isFocused ? randomInt(35, 100) : randomInt(0, 30),
            interactionCount: isFocused ? randomInt(5, 25) : randomInt(0, 4),
            tabFocused: isFocused ? Math.random() > 0.1 : Math.random() > 0.7,
            createdAt: hoursAgo(day * 24 + randomInt(1, 23)),
          })
        }
      }
    }

    // ── Mood Entries (1 per day, last 7 days) ──
    for (let day = 7; day >= 0; day--) {
      const scoreVariation = randomInt(-2, 2)
      const score = Math.max(1, Math.min(10, moodVariation + scoreVariation))
      let mood: string
      if (score <= 3) mood = 'burned_out'
      else if (score <= 4) mood = 'anxious'
      else if (score <= 5) mood = 'stressed'
      else if (score <= 7) mood = 'normal'
      else mood = 'happy'

      const moodNotes: Record<string, string[]> = {
        happy: ['Great study session today!', 'Understood the topic well', 'Very productive day', 'Feeling confident about exams'],
        normal: ['Regular study day', 'Average progress', 'Standard session', 'Decent focus today'],
        stressed: ['Exam pressure building', 'Too much to cover', 'Falling behind schedule', 'Need to catch up'],
        anxious: ['Worried about upcoming exams', 'Nervous about results', "Can't focus properly", 'Feeling overwhelmed'],
        burned_out: ['Completely exhausted', 'Need a break', 'Overwhelmed with workload', 'Cannot study anymore today'],
      }
      allMoods.push({
        studentId: sid, mood, score,
        note: pick(moodNotes[mood] || ['Regular day']),
        createdAt: daysAgo(day),
      })
    }

    // ── Focus Sessions (1-4 per day, last 7 days) ──
    for (let day = 7; day >= 0; day--) {
      const count = sp.engagementLevel === 'high' ? randomInt(3, 5)
        : sp.engagementLevel === 'struggling' ? randomInt(0, 2)
        : randomInt(1, 3)
      for (let i = 0; i < count; i++) {
        const duration = randomInt(15, 60)
        const completed = Math.random() > 0.2
        allFocusSessions.push({
          studentId: sid, type: pick(SESSION_TYPES),
          duration, actualSeconds: completed ? duration * 60 : randomInt(60, duration * 60 - 60),
          completed, distractionScore: completed ? null : randomInt(1, 8) / 10,
          startedAt: hoursAgo(day * 24 + randomInt(7, 23)),
          completedAt: completed ? hoursAgo(day * 24 + randomInt(7, 23) - Math.ceil(duration / 60)) : null,
        })
      }
    }

    // ── Quiz Attempts (across different quizzes, spread over days) ──
    const numQuizAttempts = sp.engagementLevel === 'high' ? randomInt(6, 10)
      : sp.engagementLevel === 'struggling' ? randomInt(2, 4)
      : randomInt(3, 7)
    for (let i = 0; i < numQuizAttempts; i++) {
      const quiz = pick(allQuizzes)
      const questions = allQuizQuestions.filter(q => q.quizId === quiz.id)
      if (questions.length === 0) continue

      // Score varies based on student profile
      const scoreVariation = randomInt(-15, 15)
      const rawScore = Math.max(10, Math.min(100, sp.baseQuizScore + scoreVariation))
      const correctCount = Math.round(rawScore / 100 * questions.length)
      const attempt = {
        studentId: sid, quizId: quiz.id,
        score: rawScore, totalQuestions: questions.length,
        correctCount: Math.min(correctCount, questions.length),
        timeSpent: randomInt(180, 900),
        completedAt: hoursAgo(i * 20 + randomInt(1, 12)),
      }
      allQuizAttempts.push(attempt)
      // We'll store quiz answers later after inserting
    }

    // ── Material Progress (mark some materials as done/in_progress) ──
    const doneCount = Math.round(allMaterials.length * (sp.consistencyRate / 100))
    for (let mi = 0; mi < allMaterials.length; mi++) {
      const status = mi < doneCount ? 'done' : mi < doneCount + 4 ? 'in_progress' : 'pending'
      allMaterialProgress.push({
        studentId: sid, materialId: allMaterials[mi].id,
        completionStatus: status,
        timeSpent: status === 'done' ? randomInt(600, 3600) : status === 'in_progress' ? randomInt(120, 1800) : 0,
        lastAccessedAt: hoursAgo(randomInt(0, 168)),
      })
    }

    // ── Burnout Check-Ins (14 days) ──
    const isBurnoutProne = sp.engagementLevel === 'struggling' || sp.avgMoodScore <= 4
    for (let j = 0; j < 14; j++) {
      const fp = isBurnoutProne
        ? { avgHoursPerDay: randomInt(40, 100) / 10, avgMood: randomInt(2, 4), lowMoodRatio: Math.random() > 0.4 ? 1 : 0, lateNightRatio: Math.random() > 0.5 ? 1 : 0, quizScoreTrend: 1 }
        : sp.engagementLevel === 'low' || sp.engagementLevel === 'inconsistent'
        ? { avgHoursPerDay: randomInt(15, 50) / 10, avgMood: randomInt(4, 6), lowMoodRatio: Math.random() > 0.6 ? 1 : 0, lateNightRatio: Math.random() > 0.7 ? 1 : 0, quizScoreTrend: Math.random() > 0.5 ? 1 : 0 }
        : { avgHoursPerDay: randomInt(10, 40) / 10, avgMood: randomInt(7, 9), lowMoodRatio: 0, lateNightRatio: 0, quizScoreTrend: 0 }
      allBurnoutCheckIns.push({
        studentId: sid, rating: isBurnoutProne ? randomInt(4, 5) : randomInt(1, 3),
        stressRating: isBurnoutProne ? randomInt(4, 5) : randomInt(1, 3),
        fingerprint: makeFingerprintJson(fp.avgHoursPerDay, fp.avgMood, fp.lowMoodRatio, fp.lateNightRatio, fp.quizScoreTrend),
        createdAt: hoursAgo(j * 24 + randomInt(1, 8)),
      })
    }

    // ── Burnout Predictions (5 for trend) ──
    for (let j = 4; j >= 0; j--) {
      const pct = isBurnoutProne ? randomInt(45, 80) : sp.engagementLevel === 'low' ? randomInt(25, 50) : randomInt(5, 20)
      allBurnoutPredictions.push({
        studentId: sid, riskPercentage: pct,
        riskLevel: pct < 20 ? 'low' : pct < 40 ? 'moderate' : pct < 65 ? 'high' : 'severe',
        factors: JSON.stringify([
          { name: 'Study Hours', impact: isBurnoutProne ? randomInt(20, 35) : randomInt(5, 12) },
          { name: 'Mood', impact: isBurnoutProne ? randomInt(15, 25) : randomInt(2, 8) },
          { name: 'Low Mood Days', impact: isBurnoutProne ? randomInt(10, 20) : randomInt(0, 3) },
          { name: 'Late Nights', impact: isBurnoutProne ? randomInt(8, 15) : randomInt(0, 3) },
          { name: 'Workload Balance', impact: isBurnoutProne ? randomInt(8, 10) : randomInt(2, 4) },
        ]),
        recommendations: JSON.stringify(isBurnoutProne
          ? ['Take a full rest day', 'Reduce study sessions to 3 max', 'Practice mindfulness 10 min', 'Sleep 7-8 hours']
          : ['Keep maintaining your balance!', 'Continue regular breaks', 'Stay hydrated and active']),
        analyzedAt: hoursAgo(j * 72 + 24),
      })
    }

    // ── Notifications ──
    const notifTypes = ['info', 'achievement', 'warning', 'reminder']
    const notifTemplates = [
      { title: 'Great Progress!', message: 'You completed 3 materials this week. Keep it up!', type: 'achievement' },
      { title: 'Quiz Available', message: 'New quiz on your topic is now available.', type: 'info' },
      { title: 'Streak Warning', message: 'Study today to maintain your streak!', type: 'warning' },
      { title: 'New Badge Earned', message: 'You earned a new badge! Check your profile.', type: 'achievement' },
      { title: 'Study Reminder', message: 'You have pending materials to complete.', type: 'reminder' },
      { title: 'Weekly Report', message: 'Your study time this week compared to last week.', type: 'info' },
      { title: 'Wellbeing Check', message: 'Take a moment to check in on your wellbeing.', type: 'info' },
    ]
    for (let i = 0; i < randomInt(3, 6); i++) {
      const t = pick(notifTemplates)
      allNotifications.push({
        studentId: sid, title: t.title, message: t.message, type: t.type,
        isRead: Math.random() > 0.5,
        createdAt: hoursAgo(randomInt(0, 168)),
      })
    }

    // ── Academic Risks ──
    if (sp.engagementLevel === 'struggling' || sp.engagementLevel === 'low') {
      allAcademicRisks.push({
        studentId: sid, riskType: pick(['cgpa_decline', 'attendance', 'exam_failure', 'productivity']),
        probability: randomInt(45, 85), severity: randomInt(40, 80) > 60 ? 'high' : 'moderate',
        indicator: 'Low quiz scores and reduced engagement detected',
        recommendation: 'Schedule a meeting with academic advisor and create a structured study plan',
        analyzedAt: hoursAgo(randomInt(24, 168)),
      })
    }

    // ── Cognitive Profile ──
    allCognitiveProfiles.push({
      studentId: sid,
      totalEvaluations: randomInt(5, 20), totalExplanations: randomInt(3, 15),
      strongestAreas: JSON.stringify(pickN(['Algorithms', 'Data Structures', 'SQL', 'Networking', 'OOP', 'Mathematics'], 2)),
      weakestAreas: JSON.stringify(pickN(['Compiler Design', 'Computer Architecture', 'Digital Logic', 'Probability'], 2)),
      repeatedPatterns: JSON.stringify(pick(['Algebraic errors in calculations', 'Misunderstanding recursion', 'Off-by-one errors', 'Join condition mistakes'], 1)),
      recoveryRate: sp.engagementLevel === 'high' ? randomInt(60, 85) / 100 : randomInt(25, 55) / 100,
      averageDissonanceScore: sp.engagementLevel === 'high' ? randomInt(10, 30) / 100 : randomInt(35, 70) / 100,
    })

    // ── Misconception Logs ──
    const numMisconceptions = sp.engagementLevel === 'high' ? randomInt(1, 3) : randomInt(3, 6)
    for (let i = 0; i < numMisconceptions; i++) {
      allMisconceptionLogs.push({
        studentId: sid, conceptNodeId: pick(['recursion', 'pointers', 'normalization', 'tcp-handshake', 'dynamic-programming', 'polymorphism', 'indexing', 'deadlock']),
        frequencyCounter: randomInt(1, 8), lastTriggeredAt: hoursAgo(randomInt(0, 168)),
        recoveryStatus: pick(['NOT_STARTED', 'IN_PROGRESS', 'PRACTICING', 'MASTERED']),
        mistakeType: pick(MISTAKE_TYPES) as any,
        patternDescription: pick(['Incorrect application of concept', 'Fails to identify base case', 'Confuses related concepts', 'Relies on memorization without understanding']),
      })
    }

    // ── Mistake Explanations (2-4 per student) ──
    for (let i = 0; i < randomInt(2, 5); i++) {
      allMistakeExplanations.push({
        studentId: sid, mistakeType: pick(MISTAKE_TYPES) as any,
        correctnessLevel: pick(['INCORRECT', 'PARTIALLY_CORRECT', 'CONCEPTUALLY_INCOMPLETE']) as any,
        mistakeSummary: pick(['Applied wrong formula', 'Misunderstood the problem constraints', 'Made an algebraic error', 'Used incorrect data structure']),
        rootCauseAnalysis: 'The student attempted to apply a memorized pattern without understanding the underlying principle.',
        correctConcept: 'Review the fundamental theorem and practice with varied examples to build intuition.',
        simplifiedAnalogy: pick(['Think of it like organizing a bookshelf', 'Like following a recipe - order matters', 'Similar to sorting mail by zip code']),
        stepByStepCorrection: '1. Identify the input type\n2. Choose the appropriate approach\n3. Verify each step\n4. Test with examples',
        preventionTips: 'Practice with diverse problem sets and explain your reasoning out loud.',
        modelUsed: 'cognitive-coach-v1', tokenCount: randomInt(100, 500), latencyMs: randomInt(500, 3000),
      })
    }

    // ── Study Notes ──
    for (let i = 0; i < randomInt(1, 4); i++) {
      allStudyNotes.push({
        studentId: sid, title: pick(['Quick Sort Notes', 'SQL Joins Summary', 'Network Layers', 'Design Patterns Review', 'Binary Trees']),
        content: pick(['Key concepts and pseudocode for Quick Sort algorithm...', 'INNER JOIN, LEFT JOIN, RIGHT JOIN explained with examples...', 'OSI Model layers and their functions in detail...', 'Singleton, Factory, Observer pattern implementations...', 'BST operations: insert, delete, traverse, search...']),
        category: pick(['General', 'Algorithms', 'Database', 'Networking', 'Programming']),
        tags: JSON.stringify([pick(['important', 'exam-prep', 'review', 'new']), pick(['easy', 'medium', 'hard'])]),
      })
    }

    // ── Companion Interactions ──
    const companionTypes = ['greeting', 'encouragement', 'achievement', 'streak', 'reminder']
    const companionMessages = {
      greeting: ['Ready for another day of learning?', 'Hi there! Let\'s make progress today!'],
      encouragement: ['You\'re doing great! Keep going!', 'Every step counts towards your goal!'],
      achievement: ['Amazing progress this week!', 'You just leveled up! Congratulations!'],
      streak: ['Awesome streak! Keep it burning!', 'Don\'t break your streak - study today!'],
      reminder: ['Time to review your revision plan', 'Don\'t forget to take breaks too!'],
    }
    for (let i = 0; i < randomInt(3, 6); i++) {
      const ct = pick(companionTypes)
      allCompanionInteractions.push({
        studentId: sid, interactionType: ct,
        message: pick(companionMessages[ct]),
        isRead: Math.random() > 0.4,
        createdAt: hoursAgo(randomInt(0, 168)),
      })
    }
  }

  // ── BATCH INSERTS ──
  console.log('  Telemetry...')
  for (let i = 0; i < allTelemetry.length; i += 500) { await db.telemetryRecord.createMany({ data: allTelemetry.slice(i, i + 500) }) }

  console.log('  Mood entries...')
  for (let i = 0; i < allMoods.length; i += 500) { await db.moodEntry.createMany({ data: allMoods.slice(i, i + 500) }) }

  console.log('  Focus sessions...')
  for (let i = 0; i < allFocusSessions.length; i += 500) { await db.focusSession.createMany({ data: allFocusSessions.slice(i, i + 500) }) }

  console.log('  Material progress...')
  for (let i = 0; i < allMaterialProgress.length; i += 500) { await db.materialProgress.createMany({ data: allMaterialProgress.slice(i, i + 500) }) }

  console.log('  Burnout check-ins...')
  for (let i = 0; i < allBurnoutCheckIns.length; i += 500) { await db.burnoutCheckIn.createMany({ data: allBurnoutCheckIns.slice(i, i + 500) }) }

  console.log('  Burnout predictions...')
  for (let i = 0; i < allBurnoutPredictions.length; i += 500) { await db.burnoutPrediction.createMany({ data: allBurnoutPredictions.slice(i, i + 500) }) }

  console.log('  Quiz attempts...')
  const attemptIdMap: Record<string, string> = {}
  for (let i = 0; i < allQuizAttempts.length; i += 500) {
    const batch = allQuizAttempts.slice(i, i + 500)
    const created = await db.quizAttempt.createManyAndReturn({ data: batch })
    for (const a of created) {
      attemptIdMap[`${a.studentId}_${a.quizId}_${a.completedAt.getTime()}`] = a.id
    }
  }

  console.log('  Quiz answers...')
  // For each attempt, create answers
  for (const attemptBatch of chunkArray(Object.entries(attemptIdMap), 10)) {
    for (const [key, attemptId] of attemptBatch) {
      const [studentId, quizId] = key.split('_')
      const questions = allQuizQuestions.filter(q => q.quizId === quizId)
      const attempt = allQuizAttempts.find(a => a.studentId === studentId && a.quizId === quizId)
      if (!attempt || questions.length === 0) continue
      for (const q of questions) {
        const isCorrect = Math.random() < (attempt.score / 100)
        const selectedKey = isCorrect ? q.correctKey : pick(['A', 'B', 'C', 'D'].filter(k => k !== q.correctKey))
        await db.quizAnswer.create({
          data: { attemptId, questionId: q.id, selectedKey, isCorrect }
        })
      }
    }
  }

  console.log('  Notifications...')
  for (let i = 0; i < allNotifications.length; i += 500) { await db.notification.createMany({ data: allNotifications.slice(i, i + 500) }) }

  console.log('  Academic risks...')
  for (let i = 0; i < allAcademicRisks.length; i += 500) { await db.academicRisk.createMany({ data: allAcademicRisks.slice(i, i + 500) }) }

  console.log('  Cognitive profiles...')
  for (let i = 0; i < allCognitiveProfiles.length; i += 500) { await db.cognitiveProfile.createMany({ data: allCognitiveProfiles.slice(i, i + 500) }) }

  console.log('  Misconception logs...')
  for (let i = 0; i < allMisconceptionLogs.length; i += 500) { await db.misconceptionLog.createMany({ data: allMisconceptionLogs.slice(i, i + 500) }) }

  console.log('  Mistake explanations...')
  for (let i = 0; i < allMistakeExplanations.length; i += 500) { await db.mistakeExplanation.createMany({ data: allMistakeExplanations.slice(i, i + 500) }) }

  console.log('  Study notes...')
  for (let i = 0; i < allStudyNotes.length; i += 500) { await db.studyNote.createMany({ data: allStudyNotes.slice(i, i + 500) }) }

  console.log('  Companion interactions...')
  for (let i = 0; i < allCompanionInteractions.length; i += 500) { await db.companionInteraction.createMany({ data: allCompanionInteractions.slice(i, i + 500) }) }

  console.log(`\n  All batch inserts complete!\n`)

  // ─── STREAKS & STUDENT PROGRESS ───
  console.log('Creating streaks and progress...')
  for (const sp of STUDENTS) {
    const user = studentMap[sp.email]
    const xp = sp.baseXp
    const level = findLevel(xp)
    await db.studentProgress.create({
      data: { studentId: user.id, xp, level, previousRank: randomInt(1, 15) }
    })
    await db.streak.create({
      data: {
        studentId: user.id, currentStreak: sp.baseStreak,
        longestStreak: Math.max(sp.baseStreak, Math.floor(xp / 800) + 3),
        totalActiveDays: Math.floor(xp / 300) + sp.baseStreak,
        lastActiveDate: daysAgo(sp.engagementLevel === 'high' || sp.engagementLevel === 'medium' ? 0 : randomInt(0, 2)),
      }
    })
  }
  // Reassign previousRank with shuffle
  const allProgress = await db.studentProgress.findMany({ orderBy: { xp: 'desc' } })
  const ranks = Array.from({ length: allProgress.length }, (_, i) => i + 1)
  for (let i = ranks.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ranks[i], ranks[j]] = [ranks[j], ranks[i]] }
  for (let i = 0; i < allProgress.length; i++) {
    await db.studentProgress.update({ where: { studentId: allProgress[i].studentId }, data: { previousRank: ranks[i] } })
  }
  console.log(`  Created progress & streaks for ${STUDENTS.length} students\n`)

  // ─── ENGAGEMENT SCORES ───
  console.log('Creating engagement scores...')
  for (const sp of STUDENTS) {
    const user = studentMap[sp.email]
    await db.engagementScore.create({
      data: {
        studentId: user.id,
        overallScore: sp.engagementLevel === 'high' ? randomInt(72, 92)
          : sp.engagementLevel === 'medium' ? randomInt(50, 72)
          : sp.engagementLevel === 'low' ? randomInt(30, 50)
          : sp.engagementLevel === 'struggling' ? randomInt(15, 35)
          : randomInt(40, 65),
        studyConsistencyRate: sp.consistencyRate + randomInt(-10, 10),
        avgSessionDuration: sp.studyHoursPerDay * 60 / Math.max(1, sp.engagementLevel === 'high' ? 4 : 3),
        weeklyActiveHours: sp.studyHoursPerDay * 5 + randomInt(0, 5),
        interactionDensity: sp.engagementLevel === 'high' ? randomInt(65, 90)
          : sp.engagementLevel === 'struggling' ? randomInt(10, 30)
          : randomInt(30, 65),
      }
    })
  }
  console.log(`  Created engagement scores for ${STUDENTS.length} students\n`)

  // ─── WELLBEING ANALYTICS ───
  console.log('Creating wellbeing analytics...')
  for (const sp of STUDENTS) {
    const user = studentMap[sp.email]
    const isStruggling = sp.engagementLevel === 'struggling'
    await db.wellbeingAnalytics.create({
      data: {
        studentId: user.id,
        wellbeingScore: isStruggling ? randomInt(25, 45) : randomInt(55, 90),
        stressScore: isStruggling ? randomInt(60, 90) : randomInt(10, 45),
        productivityScore: isStruggling ? randomInt(20, 40) : randomInt(55, 90),
        burnoutRisk: isStruggling ? randomInt(55, 85) : randomInt(5, 30),
        consistencyScore: Math.round(sp.consistencyRate),
        lastMood: isStruggling ? 'stressed' : 'normal',
        studyBalance: isStruggling ? randomInt(20, 40) : randomInt(50, 85),
      }
    })
  }
  console.log(`  Created wellbeing analytics for ${STUDENTS.length} students\n`)

  // ─── BADGES ───
  console.log('Creating badges...')
  const createdBadges: any[] = []
  for (const b of BADGE_DEFS) {
    createdBadges.push(await db.badge.upsert({
      where: { name: b.name }, update: {}, create: b,
    }))
  }
  // Award badges based on student profiles
  for (const sp of STUDENTS) {
    const user = studentMap[sp.email]
    const badgeNames: string[] = []
    if (sp.baseXp >= 500) badgeNames.push('First Steps')
    if (sp.baseXp >= 5000) badgeNames.push('Dedicated Learner')
    if (sp.baseXp >= 10000) badgeNames.push('Knowledge Seeker')
    if (sp.baseStreak >= 7) badgeNames.push('Week Warrior')
    if (sp.baseStreak >= 14) badgeNames.push('Consistency King')
    if (sp.baseQuizScore >= 85) badgeNames.push('Quiz Ace')
    if (sp.baseStreak >= 21) badgeNames.push('Study Marathon')
    badgeNames.push('First Quiz')
    if (numQuizAttemptsFor(sp) >= 5) badgeNames.push('Quiz Master')
    if (sp.consistencyRate >= 70) badgeNames.push('Material Explorer')
    if (sp.consistencyRate >= 50) badgeNames.push('Bookworm')
    if (sp.consistencyRate >= 80) badgeNames.push('Engagement Pro')

    for (const bName of [...new Set(badgeNames)]) {
      const badge = createdBadges.find(b => b.name === bName)
      if (!badge) continue
      try {
        await db.earnedBadge.create({ data: { studentId: user.id, badgeId: badge.id } })
      } catch { /* duplicate - skip */ }
    }
  }
  console.log(`  Created ${createdBadges.length} badges, awarded to students\n`)

  // ─── SEMESTER SNAPSHOTS ───
  console.log('Creating semester snapshots...')
  const weakTopicsPool = ['Data Structures', 'Algorithms', 'Calculus', 'Linear Algebra', 'Probability', 'Database Systems', 'Computer Networks', 'Operating Systems', 'Software Engineering', 'OOP', 'Discrete Mathematics', 'Compiler Design']
  for (const sp of STUDENTS) {
    const user = studentMap[sp.email]
    const numSemesters = sp.semester === '1st' ? 1 : sp.semester === '3rd' ? 2 : sp.semester === '5th' ? 4 : 6
    let cgpa = sp.engagementLevel === 'high' ? randomInt(32, 38) / 10
      : sp.engagementLevel === 'medium' ? randomInt(28, 34) / 10
      : sp.engagementLevel === 'low' ? randomInt(24, 30) / 10
      : sp.engagementLevel === 'struggling' ? randomInt(18, 26) / 10
      : randomInt(26, 32) / 10

    for (let sem = 1; sem <= numSemesters; sem++) {
      cgpa = Math.min(4.0, Math.max(2.0, cgpa + (Math.random() - 0.4) * 0.4))
      const studyHrs = Math.round(sp.studyHoursPerDay * sem + randomInt(5, 20))
      await db.semesterSnapshot.create({
        data: {
          studentId: user.id, studentName: sp.name, semester: sem,
          cgpa: Math.round(cgpa * 100) / 100,
          quizAverage: Math.round((sp.baseQuizScore + randomInt(-10, 5)) * 10) / 10,
          quizCount: randomInt(5, 15), studyHours: studyHrs,
          consistencyRate: Math.round(Math.max(20, Math.min(100, sp.consistencyRate * (0.7 + sem * 0.05)))),
          interactionDensity: Math.round(Math.max(0.1, Math.min(1, sp.consistencyRate / 100 * (0.5 + sem * 0.08))) * 100) / 100,
          completionRate: Math.round(Math.max(30, Math.min(100, sp.consistencyRate * (0.6 + sem * 0.06)))),
          weakTopics: JSON.stringify(pickN(weakTopicsPool, Math.max(1, Math.round(5 - sem * 0.5)))),
          courseCount: Math.max(4, Math.min(6, Math.round(6 - sem * 0.3))),
          attendanceAvg: Math.round(Math.max(40, Math.min(100, 60 + sem * 4 + randomInt(-10, 10)))),
        }
      })
    }
  }
  console.log(`  Created semester snapshots\n`)

  // ─── CHAT SESSIONS & MENTOR MESSAGES ───
  console.log('Creating chat & mentor data...')
  for (const sp of STUDENTS.slice(0, 8)) {
    const user = studentMap[sp.email]
    const session = await db.chatSession.create({
      data: { studentId: user.id, courseId: pick(courses).id, title: `${pick(['Study Help', 'Doubt Solving', 'Topic Review', 'Exam Prep'])} - ${sp.name}` }
    })
    await db.chatMessage.create({ data: { sessionId: session.id, role: 'user', content: pick(['Can you explain this concept?', 'How does this algorithm work?', 'What is the difference between these two?', 'I need help understanding this topic']) } })
    await db.chatMessage.create({ data: { sessionId: session.id, role: 'assistant', content: pick(['Let me break this down for you step by step...', 'This is a great question! The key idea is...', 'Think of it this way - it is similar to...', 'Here is a simple way to understand this...']) } })
    await db.chatMessage.create({ data: { sessionId: session.id, role: 'user', content: 'Can you give me an example?' } })
    await db.chatMessage.create({ data: { sessionId: session.id, role: 'assistant', content: 'Sure! Here is a practical example: when you sort a deck of cards by suit, you are essentially applying...' } })

    // Mentor messages
    await db.mentorMessage.create({ data: { studentId: user.id, role: 'user', content: pick(['I am feeling stressed about exams', 'How can I improve my focus?', 'What study technique works best?', 'I need motivation to keep studying']), category: 'support' } })
    await db.mentorMessage.create({ data: { studentId: user.id, role: 'mentor', content: pick(['Take deep breaths. Break your study into 25-minute chunks with 5-minute breaks.', 'Try the Pomodoro technique - 25 min focus, 5 min break. It works wonders!', 'Consistency beats intensity. Study a little every day rather than cramming.', 'You have made great progress already! Look at how far you have come.']), category: 'advice' } })
  }
  console.log('  Created chat sessions & mentor messages\n')

  // ─── WELLBEING CHECK-INS & FOLLOW-UP MESSAGES ───
  console.log('Creating wellbeing check-ins...')
  for (const sp of STUDENTS) {
    const user = studentMap[sp.email]
    const isStruggling = sp.engagementLevel === 'struggling'
    await db.wellbeingCheckin.create({
      data: {
        studentId: user.id, checkinType: 'motivational',
        title: isStruggling ? 'Take a moment to breathe' : "You're doing amazing!",
        content: isStruggling
          ? 'It is okay to have tough days. Remember that learning is a journey, not a race. Take a short break and come back refreshed.'
          : 'Your consistent effort is paying off! Research shows that regular study habits lead to better long-term retention.',
      }
    })
    await db.wellbeingCheckin.create({
      data: {
        studentId: user.id, checkinType: 'break_reminder',
        title: 'Time for a break!',
        content: 'You have been studying for a while. Step away, stretch, and hydrate. Your brain needs rest to absorb information effectively.',
      }
    })
  }
  console.log('  Created wellbeing check-ins\n')

  // ─── Study Groups ───
  console.log('Creating study groups...')
  const group1 = await db.studyGroup.create({
    data: { name: 'AI Study Circle', description: 'Group for AI and ML enthusiasts', topic: 'Artificial Intelligence', maxMembers: 5, createdBy: studentMap[STUDENTS[0].email].id }
  })
  const group2 = await db.studyGroup.create({
    data: { name: 'Database Masters', description: 'SQL and database design study group', topic: 'Database Systems', maxMembers: 5, createdBy: studentMap[STUDENTS[3].email].id }
  })
  for (let i = 0; i < 5; i++) {
    await db.studyGroupMember.create({ data: { groupId: group1.id, studentId: students[i].id, role: i === 0 ? 'creator' : 'member' } })
    await db.studyGroupMember.create({ data: { groupId: group2.id, studentId: students[(i + 3) % students.length].id, role: i === 0 ? 'creator' : 'member' } })
  }
  console.log('  Created study groups\n')

  // ─── Intervention Records ───
  console.log('Creating intervention records...')
  for (const sp of STUDENTS.filter(s => s.engagementLevel === 'struggling')) {
    const user = studentMap[sp.email]
    await db.interventionRecord.create({
      data: {
        teacherId: teacher1.id, studentId: user.id, courseId: pick(courses).id,
        reason: 'Low quiz scores and declining engagement detected',
        status: pick(['draft', 'sent', 'acknowledged']),
        message: `Dear ${sp.name}, I noticed you have been struggling with recent quizzes. Would you like to schedule a meeting to discuss how we can help you get back on track?`,
      }
    })
  }
  console.log('  Created intervention records\n')

  // ─── Voice Interactions ───
  console.log('Creating voice interactions...')
  for (const sp of STUDENTS.slice(0, 5)) {
    const user = studentMap[sp.email]
    await db.voiceInteraction.create({
      data: { studentId: user.id, query: pick(['How productive was I today?', 'Check my burnout risk', 'What should I study next?', 'How is my focus this week?']), response: pick(['You have been very productive today!', 'Your burnout risk is low. Keep it up!', 'Focus on your weak topics first.', 'Your focus has been improving this week.']), intent: pick(['productivity_check', 'burnout_check', 'subject_focus', 'wellbeing']) }
    })
  }
  console.log('  Created voice interactions\n')

  // ─── Revision Plans ───
  console.log('Creating revision plans...')
  for (const sp of STUDENTS) {
    const user = studentMap[sp.email]
    const topics = pickN(allTopics, 3)
    for (const topic of topics) {
      await db.revisionPlan.create({
        data: {
          studentId: user.id, topicId: topic.id, topicName: topic.name,
          nextReview: daysAgo(randomInt(-2, 7)),
          interval: randomInt(1, 7),
          difficulty: Math.round(randomInt(2, 8) * 10) / 100,
        }
      })
    }
  }
  console.log('  Created revision plans\n')

  // ─── RESOURCES ───
  console.log('Creating resources...')
  const resourcesData = [
    { title: 'Data Structures in C++', type: 'Document', subject: 'Computer Science', authorName: 'Dr. Kamal Hossain', url: 'https://example.com/dsa-book', downloads: 234, rating: 4.5 },
    { title: 'SQL Practice Problems', type: 'Document', subject: 'Database', authorName: 'Prof. Shahnaz Parvin', url: 'https://example.com/sql-practice', downloads: 189, rating: 4.2 },
    { title: 'Algorithm Visualization', type: 'Video', subject: 'Algorithms', authorName: 'CSE Department', url: 'https://example.com/algo-vis', downloads: 312, rating: 4.8 },
    { title: 'Network Security Basics', type: 'Video', subject: 'Networking', authorName: 'CSE Department', url: 'https://example.com/net-sec', downloads: 156, rating: 4.0 },
    { title: 'Design Patterns Reference', type: 'Document', subject: 'Software Engineering', authorName: 'Dr. Kamal Hossain', url: 'https://example.com/design-patterns', downloads: 278, rating: 4.6 },
    { title: 'Machine Learning Crash Course', type: 'Video', subject: 'AI', authorName: 'Google AI', url: 'https://example.com/ml-course', downloads: 445, rating: 4.9 },
  ]
  for (const r of resourcesData) {
    await db.resource.create({ data: { ...r, authorId: pick(teachers).id } })
  }
  console.log('  Created resources\n')

  // ─── Pomodoro Settings (default for all students) ───
  console.log('Creating pomodoro settings...')
  for (const sp of STUDENTS) {
    const user = studentMap[sp.email]
    await db.pomodoroSettings.create({
      data: { studentId: user.id, focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, autoStart: false, soundEnabled: true }
    })
  }
  console.log('  Created pomodoro settings\n')

  console.log('✅ COMPREHENSIVE SEED COMPLETE!')
  console.log(`   • ${teachers.length} teachers`)
  console.log(`   • ${students.length} students`)
  console.log(`   • ${courses.length} courses`)
  console.log(`   • ${allTopics.length} topics, ${allMaterials.length} materials`)
  console.log(`   • ${allQuizzes.length} quizzes, ${allQuizQuestions.length} questions`)
  console.log(`   • ${allTelemetry.length} telemetry records (7 days)`)
  console.log(`   • ${allMoods.length} mood entries`)
  console.log(`   • ${allFocusSessions.length} focus sessions`)
  console.log(`   • ${allQuizAttempts.length} quiz attempts`)
  console.log(`   • ${allMaterialProgress.length} material progress records`)
  console.log(`   • ${allBurnoutCheckIns.length} burnout check-ins`)
  console.log(`   • ${allBurnoutPredictions.length} burnout predictions`)
  console.log(`   • ${allNotifications.length} notifications`)
  console.log(`   • ${createdBadges.length} badges`)
  console.log(`   • ${allStudyNotes.length} study notes`)
  console.log(`   • ${allCompanionInteractions.length} companion interactions`)
  console.log(`   • ${allMisconceptionLogs.length} misconception logs`)
  console.log()
  console.log('Login credentials:')
  console.log('   Students: any email / demo123')
  console.log('   Teachers: dr.kamal@diu.edu.bd / demo123')
  console.log('             prof.shahnaz@diu.edu.bd / demo123')
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

function numQuizAttemptsFor(sp: StudentProfile): number {
  if (sp.engagementLevel === 'high') return 8
  if (sp.engagementLevel === 'struggling') return 3
  return 5
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1) })
  .finally(() => db.$disconnect())
