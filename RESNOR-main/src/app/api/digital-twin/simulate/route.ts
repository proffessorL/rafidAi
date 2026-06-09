import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { generateSimulationReasoning } from '@/lib/ai-digital-twin'

type EffectLevel = 'Strong Improvement' | 'Likely Improvement' | 'Minor Improvement' | 'No Significant Impact'

type SimulationScenario =
  | 'STUDY_TWO_MORE_HOURS_WEEKLY'
  | 'REVIEW_BEFORE_QUIZZES'
  | 'TAKE_SHORT_BREAKS'
  | 'MAINTAIN_DAILY_SCHEDULE'
  | 'COMPLETE_MORE_PRACTICE_TESTS'
  | 'FOCUS_ON_WEAK_TOPICS'
  | 'REDUCE_LAST_MINUTE_STUDYING'
  | 'INCREASE_REVISION_FREQUENCY'

interface SimulationImpact {
  area: string
  effect: EffectLevel
}

interface EvidenceMetric {
  label: string
  value: string | number
  highlight?: boolean
  accent?: 'emerald' | 'cyan' | 'amber' | 'muted'
}

interface SimulationEvidence {
  title: string
  metrics: EvidenceMetric[]
  explanation?: string
  dataPoints: number
  period: string
}

interface SimulationResult {
  scenario: SimulationScenario
  scenarioLabel: string
  impacts: SimulationImpact[]
  reasoning: string
  evidence: SimulationEvidence | null
}

const SCENARIO_CONFIG: Record<SimulationScenario, { label: string; impacts: string[] }> = {
  STUDY_TWO_MORE_HOURS_WEEKLY: {
    label: 'Study 2 More Hours Weekly',
    impacts: ['Study Consistency', 'Topic Coverage', 'Retention'],
  },
  REVIEW_BEFORE_QUIZZES: {
    label: 'Review Before Quizzes',
    impacts: ['Quiz Readiness', 'Topic Retention', 'Mistake Reduction'],
  },
  TAKE_SHORT_BREAKS: {
    label: 'Take Short Breaks',
    impacts: ['Focus Quality', 'Session Endurance', 'Information Retention'],
  },
  MAINTAIN_DAILY_SCHEDULE: {
    label: 'Maintain Daily Study Schedule',
    impacts: ['Study Consistency', 'Habit Formation', 'Long-term Retention'],
  },
  COMPLETE_MORE_PRACTICE_TESTS: {
    label: 'Complete More Practice Tests',
    impacts: ['Exam Readiness', 'Weak Topic Identification', 'Score Improvement'],
  },
  FOCUS_ON_WEAK_TOPICS: {
    label: 'Focus On Weak Topics',
    impacts: ['Topic Mastery', 'Mistake Reduction', 'Overall Confidence'],
  },
  REDUCE_LAST_MINUTE_STUDYING: {
    label: 'Reduce Last Minute Studying',
    impacts: ['Retention Quality', 'Stress Reduction', 'Exam Performance'],
  },
  INCREASE_REVISION_FREQUENCY: {
    label: 'Increase Revision Frequency',
    impacts: ['Long-term Retention', 'Study Consistency', 'Topic Mastery'],
  },
}

const STUDY_PAGE_IDS = [
  'quiz', 'tutor', 'wellbeing', 'notes', 'gamification',
  'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard',
]

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No user found' }, { status: 401 })
    }

    const body = await request.json()
    const { scenario } = body as { scenario: string }

    if (!scenario || !SCENARIO_CONFIG[scenario as SimulationScenario]) {
      return NextResponse.json(
        { success: false, error: 'Invalid scenario. Choose from the predefined options.' },
        { status: 400 }
      )
    }

    const scenarioKey = scenario as SimulationScenario
    const config = SCENARIO_CONFIG[scenarioKey]

    const [quizAttempts, focusSessions, telemetryRecords, misconceptionLogs, engagementScore] =
      await Promise.all([
        db.quizAttempt.findMany({
          where: { studentId: userId },
          orderBy: { completedAt: 'desc' },
          take: 100,
        }).then((rows) => rows.map((q) => ({
          ...q,
          score: q.totalQuestions > 0 ? Math.round((q.correctCount / q.totalQuestions) * 100) : 0,
        }))),
        db.focusSession.findMany({
          where: { studentId: userId },
          orderBy: { startedAt: 'desc' },
          take: 200,
        }),
        db.telemetryRecord.findMany({
          where: { studentId: userId, tabFocused: true, pageId: { in: STUDY_PAGE_IDS } },
          orderBy: { createdAt: 'desc' },
        }),
        db.misconceptionLog.findMany({
          where: { studentId: userId },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        db.engagementScore.findUnique({ where: { studentId: userId } }),
      ])

    const totalDataPoints = quizAttempts.length + focusSessions.length + telemetryRecords.length

    const recentScoreList = quizAttempts.slice(0, 10).map((q) => q.score)
    const standardAvgQuizScore = recentScoreList.length > 0
      ? Math.round(recentScoreList.reduce((s, v) => s + v, 0) / recentScoreList.length)
      : 0

    if (totalDataPoints < 8) {
      return NextResponse.json({
        success: true,
        data: {
          scenario: scenarioKey,
          scenarioLabel: config.label,
          impacts: config.impacts.map((area) => ({
            area,
            effect: 'No Significant Impact' as EffectLevel,
          })),
          reasoning: 'Come back after a few more study sessions — this simulation needs more data to give you a meaningful answer.',
          evidence: null,
        } as SimulationResult,
      })
    }

    const result = simulateScenario(
      scenarioKey,
      config,
      quizAttempts,
      focusSessions,
      telemetryRecords,
      misconceptionLogs,
      totalDataPoints,
      engagementScore?.weeklyActiveHours ?? 0,
      standardAvgQuizScore
    )

    const aiReasoning = await generateSimulationReasoning({
      scenarioLabel: result.scenarioLabel,
      impacts: result.impacts,
      quizCount: quizAttempts.length,
      sessionCount: focusSessions.length,
      avgQuizScore: quizAttempts.length > 0 ? standardAvgQuizScore : null,
      activeDays: new Set(telemetryRecords.map(t => new Date(t.createdAt).toDateString())).size,
      weakTopics: misconceptionLogs.length > 0
        ? [...new Set(misconceptionLogs.map(m => m.conceptNodeId || m.patternDescription || 'unknown'))].slice(0, 5)
        : [],
      dataPoints: totalDataPoints,
    }).catch(() => null)

    return NextResponse.json({ success: true, data: { ...result, reasoning: aiReasoning || result.reasoning } })
  } catch (error) {
    console.error('Digital twin simulate error:', error)
    return NextResponse.json(
      { success: false, error: 'Simulation failed. Please try again.' },
      { status: 500 }
    )
  }
}

function simulateScenario(
  scenario: SimulationScenario,
  config: { label: string; impacts: string[] },
  quizzes: Array<{ score: number | null; completedAt: Date | null; timeSpent: number | null }>,
  sessions: Array<{ type: string; startedAt: Date; duration: number | null; actualSeconds: number | null; distractionScore: number | null }>,
  telemetry: Array<{ createdAt: Date; activeSeconds: number }>,
  misconceptions: Array<{ conceptNodeId: string; frequencyCounter: number; mistakeType: string; patternDescription: string | null }>,
  totalData: number,
  weeklyActiveHours: number,
  standardAvgQuizScore: number
): SimulationResult {
  switch (scenario) {
    case 'REVIEW_BEFORE_QUIZZES':
      return simulateReviewBeforeQuizzes(quizzes, sessions)
    case 'STUDY_TWO_MORE_HOURS_WEEKLY':
      return simulateStudyMoreHours(sessions, telemetry, quizzes, weeklyActiveHours, standardAvgQuizScore)
    case 'TAKE_SHORT_BREAKS':
      return simulateShortBreaks(sessions)
    case 'MAINTAIN_DAILY_SCHEDULE':
      return simulateDailySchedule(telemetry)
    case 'COMPLETE_MORE_PRACTICE_TESTS':
      return simulatePracticeTests(quizzes, sessions, standardAvgQuizScore)
    case 'FOCUS_ON_WEAK_TOPICS':
      return simulateFocusWeakTopics(misconceptions, quizzes, standardAvgQuizScore)
    case 'REDUCE_LAST_MINUTE_STUDYING':
      return simulateReduceCramming(quizzes, sessions)
    case 'INCREASE_REVISION_FREQUENCY':
      return simulateIncreaseRevision(sessions, quizzes, telemetry)
    default:
      return {
        scenario,
        scenarioLabel: config.label,
        impacts: config.impacts.map((area) => ({
          area,
          effect: 'Minor Improvement' as EffectLevel,
        })),
        reasoning: 'This scenario could have a positive impact on your learning outcomes.',
        evidence: null,
      }
  }
}

function simulateReviewBeforeQuizzes(
  quizzes: Array<{ score: number | null; completedAt: Date | null }>,
  sessions: Array<{ type: string; startedAt: Date }>
): SimulationResult {
  const focusDates = new Set(
    sessions.map((s) => new Date(s.startedAt).toDateString())
  )

  const quizWithFocus = quizzes.filter(
    (q) => q.completedAt && focusDates.has(new Date(q.completedAt).toDateString())
  )
  const quizWithoutFocus = quizzes.filter(
    (q) => q.completedAt && !focusDates.has(new Date(q.completedAt).toDateString())
  )

  const avgWith = quizWithFocus.length > 0
    ? quizWithFocus.reduce((s, q) => s + (q.score ?? 0), 0) / quizWithFocus.length
    : null
  const avgWithout = quizWithoutFocus.length > 0
    ? quizWithoutFocus.reduce((s, q) => s + (q.score ?? 0), 0) / quizWithoutFocus.length
    : null

  let quizReadinessEffect: EffectLevel
  let retentionEffect: EffectLevel
  let mistakeEffect: EffectLevel

  if (avgWith !== null && avgWithout !== null) {
    const diff = avgWith - avgWithout
    if (diff > 15) {
      quizReadinessEffect = 'Strong Improvement'
      retentionEffect = 'Likely Improvement'
      mistakeEffect = 'Likely Improvement'
    } else if (diff > 7) {
      quizReadinessEffect = 'Likely Improvement'
      retentionEffect = 'Minor Improvement'
      mistakeEffect = 'Minor Improvement'
    } else if (diff > 0) {
      quizReadinessEffect = 'Minor Improvement'
      retentionEffect = 'Minor Improvement'
      mistakeEffect = 'Minor Improvement'
    } else {
      quizReadinessEffect = 'No Significant Impact'
      retentionEffect = 'Minor Improvement'
      mistakeEffect = 'No Significant Impact'
    }
  } else {
    quizReadinessEffect = 'Likely Improvement'
    retentionEffect = 'Minor Improvement'
    mistakeEffect = 'Minor Improvement'
  }

  const reasoning = ''

  const metrics: EvidenceMetric[] = []
  if (avgWith !== null) {
    metrics.push({ label: 'With Focus Sessions', value: `${Math.round(avgWith)}%`, highlight: true, accent: 'emerald' })
  }
  if (avgWithout !== null) {
    metrics.push({ label: 'Without Focus', value: `${Math.round(avgWithout)}%`, accent: 'muted' })
  }
  if (metrics.length === 0) {
    metrics.push(
      { label: 'Focus Sessions Logged', value: sessions.length, accent: 'cyan' },
      { label: 'Quizzes Taken', value: quizzes.length, accent: 'muted' }
    )
  }

  const totalQuizzes = quizWithFocus.length + quizWithoutFocus.length

  return {
    scenario: 'REVIEW_BEFORE_QUIZZES',
    scenarioLabel: 'Review Before Quizzes',
    impacts: [
      { area: 'Quiz Readiness', effect: quizReadinessEffect },
      { area: 'Topic Retention', effect: retentionEffect },
      { area: 'Mistake Reduction', effect: mistakeEffect },
    ],
    reasoning,
    evidence: {
      title: 'Focus & Quiz Performance',
      metrics,
      explanation: avgWith !== null && avgWithout !== null && avgWith > avgWithout
        ? `Focused study scored ${Math.round(avgWith - avgWithout)} points higher on average`
        : undefined,
      dataPoints: totalQuizzes > 0 ? totalQuizzes : quizzes.length,
      period: 'Last 30 Days',
    },
  }
}

function simulateStudyMoreHours(
  sessions: Array<{ startedAt: Date; actualSeconds: number | null; duration: number | null }>,
  telemetry: Array<{ createdAt: Date; activeSeconds: number }>,
  quizzes: Array<{ score: number | null }>,
  weeklyActiveHours: number,
  standardAvgQuizScore: number
): SimulationResult {
  const avgQuizScore = quizzes.length > 0 ? standardAvgQuizScore : null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysSoFar = Math.floor((now.getTime() - startOfMonth.getTime()) / 86400000) + 1

  const dayTotals = new Map<string, number>()
  for (const t of telemetry) {
    if (new Date(t.createdAt) >= startOfMonth) {
      const key = new Date(t.createdAt).toDateString()
      dayTotals.set(key, (dayTotals.get(key) || 0) + t.activeSeconds)
    }
  }
  const activeDays = [...dayTotals.values()].filter(s => s >= 300).length
  const inactiveDays = Math.max(0, daysSoFar - activeDays)

  const consistencyEffect: EffectLevel =
    weeklyActiveHours < 2 ? 'Strong Improvement' : weeklyActiveHours < 4 ? 'Likely Improvement' : 'Minor Improvement'
  const coverageEffect: EffectLevel =
    sessions.length < 20 ? 'Likely Improvement' : 'Minor Improvement'
  const retentionEffect: EffectLevel =
    avgQuizScore !== null && avgQuizScore < 70 ? 'Likely Improvement' : 'Minor Improvement'

  const reasoning = ''

  const metrics: EvidenceMetric[] = [
    { label: 'Current Weekly Study', value: `${weeklyActiveHours}h`, accent: weeklyActiveHours < 2 ? 'amber' : 'emerald' },
    { label: 'Active Study Days', value: activeDays, highlight: true, accent: 'emerald' },
    { label: 'Inactive Days', value: inactiveDays, accent: 'muted' },
  ]
  if (avgQuizScore !== null) {
    metrics.push({
      label: 'Average Quiz Score',
      value: `${Math.round(avgQuizScore)}%`,
      accent: avgQuizScore >= 70 ? 'emerald' : 'amber',
    })
  }

  return {
    scenario: 'STUDY_TWO_MORE_HOURS_WEEKLY',
    scenarioLabel: 'Study 2 More Hours Weekly',
    impacts: [
      { area: 'Study Consistency', effect: consistencyEffect },
      { area: 'Topic Coverage', effect: coverageEffect },
      { area: 'Retention', effect: retentionEffect },
    ],
    reasoning,
    evidence: {
      title: 'Study Volume',
      metrics,
      explanation: `Adding 2 hours weekly would bring you to ~${weeklyActiveHours + 2}h per week`,
      dataPoints: telemetry.length,
      period: `This Month (${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]} ${now.getFullYear()})`,
    },
  }
}

function simulateShortBreaks(
  sessions: Array<{ actualSeconds: number | null; distractionScore: number | null }>
): SimulationResult {
  const sessionsWithData = sessions.filter((s) => s.actualSeconds != null && s.distractionScore != null)

  const longSessions = sessionsWithData.filter((s) => (s.actualSeconds ?? 0) > 5400)
  const shortSessions = sessionsWithData.filter((s) => (s.actualSeconds ?? 0) > 0 && (s.actualSeconds ?? 0) <= 5400)

  const avgFocusLong = longSessions.length > 0
    ? longSessions.reduce((s, x) => s + (1 - (x.distractionScore ?? 0)), 0) / longSessions.length
    : null
  const avgFocusShort = shortSessions.length > 0
    ? shortSessions.reduce((s, x) => s + (1 - (x.distractionScore ?? 0)), 0) / shortSessions.length
    : null

  let focusEffect: EffectLevel
  let enduranceEffect: EffectLevel
  let retentionEffect: EffectLevel

  if (avgFocusLong !== null && avgFocusShort !== null && avgFocusShort > avgFocusLong) {
    const diff = avgFocusShort - avgFocusLong
    focusEffect = diff > 0.2 ? 'Strong Improvement' : diff > 0.1 ? 'Likely Improvement' : 'Minor Improvement'
    enduranceEffect = 'Likely Improvement'
    retentionEffect = diff > 0.15 ? 'Likely Improvement' : 'Minor Improvement'
  } else {
    focusEffect = 'Likely Improvement'
    enduranceEffect = 'Likely Improvement'
    retentionEffect = 'Minor Improvement'
  }

  const reasoning = ''

  const metrics: EvidenceMetric[] = []
  if (avgFocusShort !== null) {
    metrics.push({ label: 'Short Session Focus', value: `${Math.round(avgFocusShort * 100)}%`, highlight: true, accent: 'emerald' })
  }
  if (avgFocusLong !== null) {
    metrics.push({ label: 'Long Session Focus', value: `${Math.round(avgFocusLong * 100)}%`, accent: 'muted' })
  }
  if (metrics.length === 0) {
    metrics.push(
      { label: 'Sessions Under 90min', value: shortSessions.length, accent: 'cyan' },
      { label: 'Sessions Over 90min', value: longSessions.length, accent: 'amber' }
    )
  }

  const diffValue = avgFocusShort !== null && avgFocusLong !== null
    ? Math.round((avgFocusShort - avgFocusLong) * 100)
    : null

  return {
    scenario: 'TAKE_SHORT_BREAKS',
    scenarioLabel: 'Take Short Breaks',
    impacts: [
      { area: 'Focus Quality', effect: focusEffect },
      { area: 'Session Endurance', effect: enduranceEffect },
      { area: 'Information Retention', effect: retentionEffect },
    ],
    reasoning,
    evidence: {
      title: 'Focus Comparison',
      metrics,
      explanation: diffValue !== null && diffValue > 0
        ? `Shorter sessions show ${diffValue}% higher focus on average`
        : 'Taking breaks helps maintain focus throughout study sessions',
      dataPoints: sessionsWithData.length,
      period: 'Last 30 Days',
    },
  }
}

function simulateDailySchedule(
  telemetry: Array<{ createdAt: Date; activeSeconds: number }>
): SimulationResult {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysSoFar = Math.floor((now.getTime() - startOfMonth.getTime()) / 86400000) + 1

  const dayTotals = new Map<string, number>()
  for (const t of telemetry) {
    if (new Date(t.createdAt) >= startOfMonth) {
      const key = new Date(t.createdAt).toDateString()
      dayTotals.set(key, (dayTotals.get(key) || 0) + t.activeSeconds)
    }
  }
  const recentActiveDays = [...dayTotals.values()].filter(s => s >= 300).length
  const recentInactiveDays = Math.max(0, daysSoFar - recentActiveDays)

  const activeRatio = daysSoFar > 0 ? recentActiveDays / daysSoFar : 0

  const consistencyEffect: EffectLevel =
    activeRatio < 0.3 ? 'Strong Improvement' : activeRatio < 0.6 ? 'Likely Improvement' : 'Minor Improvement'
  const habitEffect: EffectLevel =
    activeRatio < 0.4 ? 'Likely Improvement' : 'Minor Improvement'
  const retentionEffect: EffectLevel =
    activeRatio < 0.3 ? 'Likely Improvement' : 'Minor Improvement'

  const reasoning = ''

  return {
    scenario: 'MAINTAIN_DAILY_SCHEDULE',
    scenarioLabel: 'Maintain Daily Study Schedule',
    impacts: [
      { area: 'Study Consistency', effect: consistencyEffect },
      { area: 'Habit Formation', effect: habitEffect },
      { area: 'Long-term Retention', effect: retentionEffect },
    ],
    reasoning,
    evidence: {
      title: 'Study Consistency',
      metrics: [
        { label: 'Active Study Days', value: recentActiveDays, highlight: true, accent: activeRatio >= 0.6 ? 'emerald' : 'amber' },
        { label: 'Inactive Days', value: recentInactiveDays, accent: 'muted' },
      ],
      explanation: activeRatio < 0.3
        ? 'Daily study could more than double your active learning time'
        : 'Consistent daily study strengthens long-term memory retention',
      dataPoints: daysSoFar,
      period: `This Month (${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]} ${now.getFullYear()})`,
    },
  }
}

function simulatePracticeTests(
  quizzes: Array<{ score: number | null }>,
  sessions: Array<{ type: string }>,
  standardAvgQuizScore: number
): SimulationResult {
  const practiceCount = sessions.filter((s) => s.type === 'deep_focus' || s.type === 'pomodoro').length
  const avgQuizScore = quizzes.length > 0 ? standardAvgQuizScore : null

  const readinessEffect: EffectLevel =
    practiceCount < 3 ? 'Strong Improvement' : practiceCount < 8 ? 'Likely Improvement' : 'Minor Improvement'
  const identificationEffect: EffectLevel =
    practiceCount < 5 ? 'Likely Improvement' : 'Minor Improvement'
  const scoreEffect: EffectLevel =
    avgQuizScore !== null && avgQuizScore < 70 ? 'Likely Improvement' : 'Minor Improvement'

  const reasoning = ''

  const metrics: EvidenceMetric[] = [
    { label: 'Practice Sessions', value: practiceCount, highlight: true, accent: practiceCount < 3 ? 'amber' : 'emerald' },
    { label: 'Total Study Sessions', value: sessions.length, accent: 'muted' },
  ]
  if (avgQuizScore !== null) {
    metrics.push({
      label: 'Average Quiz Score',
      value: `${Math.round(avgQuizScore)}%`,
      accent: avgQuizScore >= 70 ? 'emerald' : 'amber',
    })
  }

  return {
    scenario: 'COMPLETE_MORE_PRACTICE_TESTS',
    scenarioLabel: 'Complete More Practice Tests',
    impacts: [
      { area: 'Exam Readiness', effect: readinessEffect },
      { area: 'Weak Topic Identification', effect: identificationEffect },
      { area: 'Score Improvement', effect: scoreEffect },
    ],
    reasoning,
    evidence: {
      title: 'Practice Activity',
      metrics,
      explanation: practiceCount < 3
        ? 'Very few practice sessions logged — more practice correlates with better exam readiness'
        : 'More practice helps identify knowledge gaps before real exams',
      dataPoints: sessions.length,
      period: 'Last 30 Days',
    },
  }
}

function simulateFocusWeakTopics(
  misconceptions: Array<{ conceptNodeId: string; frequencyCounter: number; mistakeType: string; patternDescription: string | null }>,
  quizzes: Array<{ score: number | null }>,
  standardAvgQuizScore: number
): SimulationResult {
  const topicMistakeCount: Record<string, number> = {}
  misconceptions.forEach((m) => {
    const topic = m.conceptNodeId || m.patternDescription || 'unknown'
    topicMistakeCount[topic] = (topicMistakeCount[topic] || 0) + (m.frequencyCounter || 1)
  })

  const mistakeTypeCounts: Record<string, number> = {}
  misconceptions.forEach((m) => {
    mistakeTypeCounts[m.mistakeType] = (mistakeTypeCounts[m.mistakeType] || 0) + 1
  })

  const topMistakeType = Object.entries(mistakeTypeCounts).sort((a, b) => b[1] - a[1])[0]
  const topWeakTopic = Object.entries(topicMistakeCount).sort((a, b) => b[1] - a[1])[0]
  const avgQuizScore = quizzes.length > 0 ? standardAvgQuizScore : null

  const masteryEffect: EffectLevel =
    misconceptions.length >= 5 ? 'Strong Improvement' : misconceptions.length >= 2 ? 'Likely Improvement' : 'Minor Improvement'
  const mistakeEffect: EffectLevel =
    topMistakeType && topMistakeType[1] >= 3 ? 'Likely Improvement' : 'Minor Improvement'
  const confidenceEffect: EffectLevel =
    avgQuizScore !== null && avgQuizScore < 65 ? 'Likely Improvement' : 'Minor Improvement'

  const reasoning = ''

  const metrics: EvidenceMetric[] = []
  if (topWeakTopic) {
    metrics.push({ label: topWeakTopic[0], value: `${topWeakTopic[1]} mistakes`, highlight: true, accent: 'amber' })
  }
  if (topMistakeType) {
    metrics.push({ label: 'Main Mistake Type', value: topMistakeType[0].toLowerCase().replace(/_/g, ' '), accent: 'cyan' })
  }
  metrics.push({ label: 'Total Misconceptions', value: misconceptions.length, accent: 'muted' })
  if (avgQuizScore !== null) {
    metrics.push({
      label: 'Average Quiz Score',
      value: `${Math.round(avgQuizScore)}%`,
      accent: avgQuizScore >= 70 ? 'emerald' : 'amber',
    })
  }

  const weakTopicCount = Object.keys(topicMistakeCount).length

  return {
    scenario: 'FOCUS_ON_WEAK_TOPICS',
    scenarioLabel: 'Focus On Weak Topics',
    impacts: [
      { area: 'Topic Mastery', effect: masteryEffect },
      { area: 'Mistake Reduction', effect: mistakeEffect },
      { area: 'Overall Confidence', effect: confidenceEffect },
    ],
    reasoning,
    evidence: {
      title: topWeakTopic ? topWeakTopic[0] : 'Topic Weakness',
      metrics,
      explanation: weakTopicCount > 0
        ? `${weakTopicCount} ${weakTopicCount === 1 ? 'topic' : 'topics'} with repeated mistakes identified`
        : undefined,
      dataPoints: misconceptions.length > 0 ? misconceptions.length : quizzes.length,
      period: 'Last 30 Days',
    },
  }
}

function simulateReduceCramming(
  quizzes: Array<{ score: number | null; completedAt: Date | null; timeSpent: number | null }>,
  sessions: Array<{ startedAt: Date; actualSeconds: number | null }>
): SimulationResult {
  const quizDates = new Set(
    quizzes
      .filter((q) => q.completedAt)
      .map((q) => new Date(q.completedAt!).toDateString())
  )

  let crammingSessionCount = 0
  let steadySessionCount = 0

  sessions.forEach((s) => {
    const dayBefore = new Date(s.startedAt)
    dayBefore.setDate(dayBefore.getDate() + 1)
    const isNearQuiz = quizDates.has(dayBefore.toDateString()) || quizDates.has(new Date(s.startedAt).toDateString())
    const isLongSession = (s.actualSeconds ?? 0) > 7200

    if (isNearQuiz && isLongSession) {
      crammingSessionCount++
    } else {
      steadySessionCount++
    }
  })

  const retentionEffect: EffectLevel =
    crammingSessionCount > 2 ? 'Likely Improvement' : 'Minor Improvement'
  const stressEffect: EffectLevel =
    crammingSessionCount > 0 ? 'Likely Improvement' : 'Minor Improvement'
  const examEffect: EffectLevel = 'Minor Improvement'

  const reasoning = ''

  return {
    scenario: 'REDUCE_LAST_MINUTE_STUDYING',
    scenarioLabel: 'Reduce Last Minute Studying',
    impacts: [
      { area: 'Retention Quality', effect: retentionEffect },
      { area: 'Stress Reduction', effect: stressEffect },
      { area: 'Exam Performance', effect: examEffect },
    ],
    reasoning,
    evidence: {
      title: 'Cramming Detection',
      metrics: [
        { label: 'Cramming Sessions', value: crammingSessionCount, highlight: crammingSessionCount > 0, accent: crammingSessionCount > 2 ? 'amber' : 'muted' },
        { label: 'Steady Sessions', value: steadySessionCount, accent: 'emerald' },
      ],
      explanation: crammingSessionCount > 0
        ? `${crammingSessionCount} long sessions detected right before assessments`
        : 'No cramming detected — steady study patterns support better retention',
      dataPoints: sessions.length,
      period: 'Last 30 Days',
    },
  }
}

function simulateIncreaseRevision(
  sessions: Array<{ type: string; startedAt: Date; distractionScore: number | null }>,
  quizzes: Array<{ score: number | null; completedAt: Date | null }>,
  _telemetry: Array<{ createdAt: Date; activeSeconds: number }>
): SimulationResult {
  const reviewRatio = sessions.length > 0 ? 1 : 0

  const focusDates = new Set(
    sessions.map((s) => new Date(s.startedAt).toDateString())
  )

  const quizzesWithFocus = quizzes.filter(
    (q) => q.completedAt && focusDates.has(new Date(q.completedAt).toDateString())
  )
  const quizzesWithoutFocus = quizzes.filter(
    (q) => q.completedAt && !focusDates.has(new Date(q.completedAt).toDateString())
  )

  const avgWith = quizzesWithFocus.length > 0
    ? quizzesWithFocus.reduce((s, q) => s + (q.score ?? 0), 0) / quizzesWithFocus.length
    : null
  const avgWithout = quizzesWithoutFocus.length > 0
    ? quizzesWithoutFocus.reduce((s, q) => s + (q.score ?? 0), 0) / quizzesWithoutFocus.length
    : null

  const retentionEffect: EffectLevel =
    sessions.length < 10 ? 'Strong Improvement' : sessions.length < 20 ? 'Likely Improvement' : 'Minor Improvement'
  const consistencyEffect: EffectLevel =
    sessions.length < 5 ? 'Likely Improvement' : 'Minor Improvement'
  const masteryEffect: EffectLevel =
    avgWith !== null && avgWithout !== null && avgWith > avgWithout + 5
      ? 'Likely Improvement'
      : 'Minor Improvement'

  const reasoning = ''

  const metrics: EvidenceMetric[] = [
    { label: 'Total Focus Sessions', value: sessions.length, highlight: true, accent: sessions.length > 10 ? 'emerald' : 'amber' },
  ]
  if (avgWith !== null && avgWithout !== null) {
    metrics.push(
      { label: 'With Focus', value: `${Math.round(avgWith)}%`, accent: 'emerald' },
      { label: 'Without Focus', value: `${Math.round(avgWithout)}%`, accent: 'muted' }
    )
  }

  return {
    scenario: 'INCREASE_REVISION_FREQUENCY',
    scenarioLabel: 'Increase Revision Frequency',
    impacts: [
      { area: 'Long-term Retention', effect: retentionEffect },
      { area: 'Study Consistency', effect: consistencyEffect },
      { area: 'Topic Mastery', effect: masteryEffect },
    ],
    reasoning,
    evidence: {
      title: 'Focus Activity',
      metrics,
      explanation: 'More frequent focus sessions strengthen long-term memory retention',
      dataPoints: sessions.length,
      period: 'Last 30 Days',
    },
  }
}
