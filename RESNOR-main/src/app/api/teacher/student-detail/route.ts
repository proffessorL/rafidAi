import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const STUDY_PAGE_IDS = [
  'quiz', 'tutor', 'wellbeing', 'notes', 'gamification',
  'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard',
]

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true, studentId: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const [quizAttempts, engagement, wellbeing, cognitive, burnout, misconceptions, academicRisks, semesterSnapshots, studentProgress, recentTelemetry, moodRecords] =
      await Promise.all([
        db.quizAttempt.findMany({
          where: { studentId },
          orderBy: { completedAt: 'desc' },
          take: 10,
          include: { quiz: { select: { title: true, topic: { select: { name: true } } } } },
        }),
        db.engagementScore.findUnique({ where: { studentId } }),
        db.wellbeingAnalytics.findUnique({ where: { studentId } }),
        db.cognitiveProfile.findUnique({ where: { studentId } }),
        db.burnoutPrediction.findFirst({ where: { studentId }, orderBy: { analyzedAt: 'desc' } }),
        db.misconceptionLog.findMany({ where: { studentId }, orderBy: { frequencyCounter: 'desc' }, take: 10 }),
        db.academicRisk.findMany({ where: { studentId }, orderBy: { analyzedAt: 'desc' } }),
        db.semesterSnapshot.findMany({ where: { studentId }, orderBy: { semester: 'desc' } }),
        db.studentProgress.findUnique({ where: { studentId } }),
        db.telemetryRecord.findMany({
          where: { studentId, tabFocused: true, pageId: { in: STUDY_PAGE_IDS }, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
          select: { activeSeconds: true, pageId: true, createdAt: true },
        }),
        db.moodEntry.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' }, take: 7 }),
      ])

    const streakStart = new Date()
    streakStart.setFullYear(streakStart.getFullYear() - 1)
    streakStart.setHours(0, 0, 0, 0)

    const streakRecords = await db.telemetryRecord.findMany({
      where: { studentId, tabFocused: true, pageId: { in: STUDY_PAGE_IDS }, createdAt: { gte: streakStart } },
      select: { activeSeconds: true, createdAt: true },
    })

    const streakDayMap = new Map<string, number>()
    for (const r of streakRecords) {
      const dateKey = toLocalDateStr(r.createdAt)
      streakDayMap.set(dateKey, (streakDayMap.get(dateKey) || 0) + r.activeSeconds)
    }

    const allDates: string[] = []
    const d = new Date(streakStart)
    while (d <= new Date()) {
      allDates.push(toLocalDateStr(d))
      d.setDate(d.getDate() + 1)
    }

    const studied = allDates.map((dateStr) => (streakDayMap.get(dateStr) || 0) >= 300)
    let currentStreak = 0
    for (let i = studied.length - 1; i >= 0; i--) {
      if (studied[i]) currentStreak++
      else break
    }
    let longestStreak = 0
    let run = 0
    for (const s of studied) {
      if (s) { run++; if (run > longestStreak) longestStreak = run }
      else run = 0
    }

    // Engagement summary (privacy-preserving: no per-minute or page-level detail)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthDayTotals = new Map<string, number>()
    for (const r of streakRecords) {
      if (r.createdAt >= startOfMonth) {
        const key = toLocalDateStr(r.createdAt)
        monthDayTotals.set(key, (monthDayTotals.get(key) || 0) + r.activeSeconds)
      }
    }
    const activeDaysThisMonth = [...monthDayTotals.values()].filter(s => s >= 300).length

    const featureTotals = new Map<string, number>()
    for (const r of recentTelemetry) {
      featureTotals.set(r.pageId, (featureTotals.get(r.pageId) || 0) + r.activeSeconds)
    }
    const topFeatures = [...featureTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => ({ pageId: id }))

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyTrend: { day: string; minutes: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayKey = toLocalDateStr(d)
      const totalSec = streakRecords
        .filter(r => toLocalDateStr(r.createdAt) === dayKey)
        .reduce((s, r) => s + r.activeSeconds, 0)
      weeklyTrend.push({ day: dayNames[d.getDay()], minutes: Math.round(totalSec / 60) })
    }

    return NextResponse.json({
      user: { name: user.name, email: user.email, studentId: user.studentId },
      quizAttempts: quizAttempts.map(a => ({
        title: a.quiz?.title || 'Unknown',
        topic: a.quiz?.topic?.name || null,
        score: a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0,
        date: a.completedAt?.toISOString() || null,
      })),
      engagement: engagement ? {
        overallScore: engagement.overallScore,
        consistency: engagement.studyConsistencyRate,
        weeklyHours: engagement.weeklyActiveHours,
        avgSessionDuration: engagement.avgSessionDuration,
        interactionDensity: engagement.interactionDensity,
      } : null,
      streak: { current: currentStreak, longest: longestStreak },
      engagementSummary: {
        weeklyHours: engagement?.weeklyActiveHours || 0,
        consistency: engagement?.studyConsistencyRate || 0,
        activeDaysThisMonth,
        topFeatures,
        weeklyTrend,
      },
      wellbeing: wellbeing ? {
        score: wellbeing.wellbeingScore,
        stress: wellbeing.stressScore,
        productivity: wellbeing.productivityScore,
        burnoutRisk: wellbeing.burnoutRisk,
        consistency: wellbeing.consistencyScore,
        lastMood: wellbeing.lastMood,
        studyBalance: wellbeing.studyBalance,
        moodTrend: moodRecords.reverse().map(m => ({
          day: m.createdAt.toLocaleDateString('en-US', { weekday: 'short' }),
          mood: m.score,
          label: m.mood,
        })),
        stressFactors: [
          { name: 'Study Hours', value: Math.min(100, Math.round((engagement?.weeklyActiveHours || 0) / 40 * 100)) },
          { name: 'Quiz Pressure', value: Math.min(100, Math.round((1 - (engagement?.studyConsistencyRate || 0) / 100) * 70 + 15)) },
          { name: 'Low Mood', value: wellbeing.lastMood === 'stressed' || wellbeing.lastMood === 'burned_out' ? 65 : wellbeing.lastMood === 'anxious' ? 50 : 20 },
          { name: 'Study Balance', value: Math.round(100 - (wellbeing.studyBalance || 50)) },
        ],
      } : null,
      burnout: burnout ? {
        riskPercentage: burnout.riskPercentage,
        riskLevel: burnout.riskLevel,
        factors: burnout.factors,
        recommendations: burnout.recommendations,
      } : null,
      cognitive: cognitive ? {
        strongestAreas: cognitive.strongestAreas,
        weakestAreas: cognitive.weakestAreas,
        recoveryRate: cognitive.recoveryRate,
        dissonanceScore: cognitive.averageDissonanceScore,
        repeatedPatterns: cognitive.repeatedPatterns,
      } : null,
      misconceptions: misconceptions.map(m => {
        const raw = m.patternDescription || m.conceptNodeId
        const readable = raw && raw.length > 20 && raw.startsWith('cmp')
          ? m.mistakeType.replace(/_/g, ' ').toLowerCase()
          : raw
        return {
          concept: readable || m.mistakeType.replace(/_/g, ' ').toLowerCase(),
          frequency: m.frequencyCounter,
          recoveryStatus: m.recoveryStatus,
          mistakeType: m.mistakeType,
        }
      }),
      academicRisks: academicRisks.map(r => ({
        riskType: r.riskType,
        probability: r.probability,
        severity: r.severity,
        indicator: r.indicator,
        recommendation: r.recommendation,
      })),
      semesterSnapshots: semesterSnapshots.map(s => ({
        semester: s.semester,
        cgpa: s.cgpa,
        quizAverage: s.quizAverage,
        studyHours: s.studyHours,
        consistencyRate: s.consistencyRate,
        weakTopics: s.weakTopics,
        attendance: s.attendanceAvg,
      })),
      progress: studentProgress ? { xp: studentProgress.xp, level: studentProgress.level } : null,
    })
  } catch (error) {
    console.error('Student detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch student details' }, { status: 500 })
  }
}
