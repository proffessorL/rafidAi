import { db } from '@/lib/db'
import { createNotification } from './notification-service'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

interface UserContext {
  recentActivity: string
  streak: number
  engagementTrend: string
  upcomingExams: string
  quizPerformance: string
  burnoutRisk: string
  studyHabits: string
  totalXp: number
  level: number
}

async function buildUserContext(studentId: string): Promise<UserContext> {
  const [user, recentQuizzes, streak, engagement, burnout, studyNotes] = await Promise.all([
    db.user.findUnique({ where: { id: studentId }, select: { name: true, semester: true, studentId: true } }),

    db.quizAttempt.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { score: true, completedAt: true },
    }),

    db.streak.findUnique({ where: { studentId }, select: { currentStreak: true } }),

    db.engagementScore.findUnique({ where: { studentId }, select: { overallScore: true } }),

    db.burnoutPrediction.findFirst({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      select: { riskLevel: true },
    }),

    db.studyNote.count({ where: { studentId } }),
  ])

  const hasRecentQuiz = recentQuizzes.length > 0
  const quizPerf = hasRecentQuiz
    ? recentQuizzes.map((q) => `${q.score}%`).join(', ')
    : 'No quizzes taken yet'

  const avgScore = hasRecentQuiz
    ? Math.round(recentQuizzes.reduce((sum, q) => sum + q.score, 0) / recentQuizzes.length)
    : 0

  return {
    recentActivity: hasRecentQuiz
      ? `Last ${recentQuizzes.length} quizzes: ${quizPerf}`
      : 'No recent quiz activity',
    streak: streak?.currentStreak || 0,
    engagementTrend: engagement?.overallScore ? (engagement.overallScore > 60 ? 'improving' : 'declining') : 'stable',
    upcomingExams: user?.semester ? `Semester ${user.semester}` : 'Ongoing studies',
    quizPerformance: avgScore > 0 ? `Average score ${avgScore}%` : 'No data yet',
    burnoutRisk: burnout?.riskLevel || 'low',
    studyHabits: `${studyNotes} study notes created`,
    totalXp: 0,
    level: 1,
  }
}

interface ProactiveNotificationSuggestion {
  title: string
  message: string
  type: 'info' | 'warning' | 'achievement' | 'reminder' | 'proactive'
  actionUrl?: string
  priorityScore: number
}

export async function generateProactiveNotifications(
  studentId: string,
): Promise<ProactiveNotificationSuggestion[]> {
  const ctx = await buildUserContext(studentId)

  const prompt = `You are an AI learning assistant that generates smart, proactive notifications for a student.

STUDENT CONTEXT:
- Recent quiz performance: ${ctx.recentActivity}
- Current streak: ${ctx.streak} days
- Engagement trend: ${ctx.engagementTrend}
- Study context: ${ctx.upcomingExams}
- Burnout risk: ${ctx.burnoutRisk}
- Study habits: ${ctx.studyHabits}

Based on this data, generate 3 proactive, personalized notifications that would genuinely help the student.
Each notification should be ONE of these types:
- "reminder": gentle nudge about something they should do
- "achievement": encouragement celebrating progress
- "info": useful insight about their learning pattern
- "warning": heads-up about a potential issue (only if burnout risk is moderate+)

Rules:
- Be specific and personal — reference their actual data
- Suggest an actionUrl (one of: /quiz, /gamification, /planner, /wellbeing, /dashboard)
- Assign a priorityScore from 1-10 (10 = most urgent)
- Don't be generic or repetitive
- Output ONLY valid JSON: { "notifications": [ { "title": "...", "message": "...", "type": "...", "actionUrl": "...", "priorityScore": 5 } ] }`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2048,
    })

    const text = completion.choices[0]?.message?.content || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed.notifications)) return []

    return parsed.notifications.map((n: any) => ({
      title: n.title || 'Learning Insight',
      message: n.message || '',
      type: n.type || 'info',
      actionUrl: n.actionUrl || '/dashboard',
      priorityScore: Math.max(1, Math.min(10, n.priorityScore || 5)),
    }))
  } catch (err) {
    console.error('[proactive-notification] Groq call failed:', err)
    return []
  }
}

export async function generateAndSaveProactiveNotifications(
  studentId: string,
): Promise<number> {
  const suggestions = await generateProactiveNotifications(studentId)
  if (suggestions.length === 0) return 0

  const recentProactive = await db.notification.count({
    where: { studentId, isProactive: true, createdAt: { gte: new Date(Date.now() - 86400000) } },
  })

  const maxPerDay = 3
  const slot = Math.max(0, maxPerDay - recentProactive)

  const toCreate = suggestions.slice(0, slot)

  for (const s of toCreate) {
    await db.notification.create({
      data: {
        studentId,
        title: s.title,
        message: s.message,
        type: s.type,
        actionUrl: s.actionUrl,
        source: 'proactive',
        isProactive: true,
        priorityScore: s.priorityScore,
      },
    })
  }

  return toCreate.length
}

export async function getProactiveHistory(studentId: string, days = 7) {
  const since = new Date(Date.now() - days * 86400000)
  return db.notification.findMany({
    where: { studentId, isProactive: true, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
}
