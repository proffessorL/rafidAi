import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { generateProfileSummary, generateProfileLabels } from '@/lib/ai-digital-twin'

interface DigitalTwinProfile {
  learningProfileType: string
  strongestHabit: string
  biggestOpportunity: string
  studyConsistency: number
  revisionFrequency: number
  weakTopics: string[]
  engagementLevel: number
  dataSufficiency: 'sufficient' | 'partial' | 'insufficient'
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No user found' }, { status: 401 })
    }

    const [
      quizAttempts,
      focusSessions,
      telemetryRecords,
      misconceptionLogs,
      earnedBadges,
      quizAttemptsWithTopics,
      materialProgress,
      chatSessions,
      mistakeExplanations,
    ] = await Promise.all([
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
        where: { studentId: userId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      db.misconceptionLog.findMany({
        where: { studentId: userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.earnedBadge.findMany({
        where: { studentId: userId },
        take: 50,
      }),
      db.quizAttempt.findMany({
        where: { studentId: userId },
        select: { id: true, score: true, correctCount: true, totalQuestions: true, completedAt: true, quiz: { select: { id: true, topicId: true, topic: { select: { id: true, name: true } } } } },
        orderBy: { completedAt: 'desc' },
        take: 100,
      }).then((rows) => rows.map((q) => ({
        ...q,
        score: q.totalQuestions > 0 ? Math.round((q.correctCount / q.totalQuestions) * 100) : 0,
      }))),
      db.materialProgress.findMany({
        where: { studentId: userId },
        select: { id: true, material: { select: { topicId: true, topic: { select: { id: true, name: true } } } } },
        take: 200,
      }),
      db.chatSession.findMany({
        where: { studentId: userId, topic: { not: null } },
        select: { id: true, topic: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      db.mistakeExplanation.findMany({
        where: { studentId: userId },
        select: { id: true, conceptLabel: true, errorCategory: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ])

    const totalDataPoints = quizAttempts.length + focusSessions.length + telemetryRecords.length
    const dataSufficiency: 'sufficient' | 'partial' | 'insufficient' =
      totalDataPoints >= 30 ? 'sufficient' : totalDataPoints >= 10 ? 'partial' : 'insufficient'

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentFocusDays = new Set(
      focusSessions
        .filter((s) => new Date(s.startedAt) >= thirtyDaysAgo)
        .map((s) => new Date(s.startedAt).toDateString())
    )

    const recentTelemetryDays = new Set(
      telemetryRecords
        .filter((t) => new Date(t.createdAt) >= thirtyDaysAgo && t.activeSeconds > 0)
        .map((t) => new Date(t.createdAt).toDateString())
    )

    const allActiveDays = new Set([...recentFocusDays, ...recentTelemetryDays])
    const uniqueDayRatio = allActiveDays.size / 30

    const sortedDays = Array.from(allActiveDays)
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime())

    let maxStreak = 0
    let currentStreak = 0
    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        currentStreak = 1
      } else {
        const diffDays = Math.round((sortedDays[i].getTime() - sortedDays[i - 1].getTime()) / 86400000)
        if (diffDays === 1) {
          currentStreak++
        } else {
          currentStreak = 1
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak)
    }
    const streakRatio = maxStreak / 30

    const studyConsistency = Math.min(100, Math.round((uniqueDayRatio * 0.6 + streakRatio * 0.4) * 100))

    const topicVisitCounts: Record<string, { count: number; name: string }> = {}

    focusSessions.forEach((s) => {
      if (s.notes) {
        try {
          const parsed = JSON.parse(s.notes)
          if (parsed.topicId) {
            const key = String(parsed.topicId)
            if (!topicVisitCounts[key]) topicVisitCounts[key] = { count: 0, name: parsed.topicName || key }
            topicVisitCounts[key].count++
          }
        } catch {}
      }
    })

    quizAttemptsWithTopics.forEach((a) => {
      const topicId = a.quiz?.topicId
      if (topicId) {
        const key = String(topicId)
        if (!topicVisitCounts[key]) topicVisitCounts[key] = { count: 0, name: a.quiz.topic?.name || key }
        topicVisitCounts[key].count++
      }
    })

    materialProgress.forEach((mp) => {
      const topicId = mp.material?.topicId
      if (topicId) {
        const key = String(topicId)
        if (!topicVisitCounts[key]) topicVisitCounts[key] = { count: 0, name: mp.material.topic?.name || key }
        topicVisitCounts[key].count++
      }
    })

    chatSessions.forEach((cs) => {
      if (cs.topic) {
        const key = cs.topic.toLowerCase().trim()
        if (!topicVisitCounts[key]) topicVisitCounts[key] = { count: 0, name: cs.topic }
        topicVisitCounts[key].count++
      }
    })

    mistakeExplanations.forEach((me) => {
      const label = me.conceptLabel || me.errorCategory
      if (label) {
        const key = label.toLowerCase().trim()
        if (!topicVisitCounts[key]) topicVisitCounts[key] = { count: 0, name: label }
        topicVisitCounts[key].count++
      }
    })

    const allTopicIds = Object.keys(topicVisitCounts)
    const totalTopics = allTopicIds.length || 1
    const revisitedTopics = allTopicIds.filter((k) => topicVisitCounts[k].count > 1).length
    const reviewRatio = revisitedTopics / totalTopics

    const allTopicActivityDays = new Set<string>()

    focusSessions
      .filter((s) => {
        if (!s.notes) return false
        try { const p = JSON.parse(s.notes); return !!p.topicId } catch { return false }
      })
      .forEach((s) => allTopicActivityDays.add(new Date(s.startedAt).toDateString()))

    quizAttemptsWithTopics
      .filter((a) => a.quiz?.topicId && a.completedAt)
      .forEach((a) => allTopicActivityDays.add(new Date(a.completedAt!).toDateString()))

    materialProgress
      .filter((mp) => mp.material?.topicId)
      .forEach((mp) => allTopicActivityDays.add('material-progress'))

    chatSessions
      .filter((cs) => cs.topic)
      .forEach((cs) => allTopicActivityDays.add(new Date(cs.createdAt).toDateString()))

    mistakeExplanations
      .filter((me) => me.conceptLabel || me.errorCategory)
      .forEach((me) => allTopicActivityDays.add(new Date(me.createdAt).toDateString()))

    const spacedDaysRatio = allTopicActivityDays.size > 1
      ? Math.min(1, allTopicActivityDays.size / 15)
      : 0

    const revisionFrequency = Math.min(
      100,
      Math.round((reviewRatio * 0.6 + spacedDaysRatio * 0.4) * 100)
    )

    const topicWeaknessScore: Record<string, { score: number; count: number; name: string }> = {}

    misconceptionLogs.forEach((m) => {
      const key = m.conceptNodeId || m.patternDescription || 'unknown'
      if (!topicWeaknessScore[key]) topicWeaknessScore[key] = { score: 0, count: 0, name: key }
      topicWeaknessScore[key].count += m.frequencyCounter || 1
      topicWeaknessScore[key].score += (m.frequencyCounter || 1) * 10
    })

    mistakeExplanations.forEach((me) => {
      const label = me.conceptLabel || me.errorCategory
      if (label) {
        const key = label.toLowerCase().trim()
        if (!topicWeaknessScore[key]) topicWeaknessScore[key] = { score: 0, count: 0, name: label }
        topicWeaknessScore[key].count++
        topicWeaknessScore[key].score += 5
      }
    })

    quizAttemptsWithTopics.forEach((a) => {
      const topicId = a.quiz?.topicId
      if (topicId) {
        const key = String(topicId)
        const score = a.score ?? 0
        if (!topicWeaknessScore[key]) topicWeaknessScore[key] = { score: 0, count: 0, name: a.quiz.topic?.name || key }
        topicWeaknessScore[key].count++
        if (score < 60) topicWeaknessScore[key].score += (60 - score) * 2
      }
    })

    const weakTopics = Object.entries(topicWeaknessScore)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 5)
      .map(([_, v]) => v.name)

    if (weakTopics.length === 0 && quizAttempts.length > 0) {
      const avgScore = quizAttempts.reduce((s, a) => s + (a.score ?? 0), 0) / quizAttempts.length
      if (avgScore < 60) weakTopics.push('Low-scoring quiz topics')
    }

    const recentTelemetry = telemetryRecords.filter(
      (t) => new Date(t.createdAt) >= thirtyDaysAgo
    )
    const avgActiveMinutes =
      recentTelemetry.length > 0
        ? recentTelemetry.reduce((sum, t) => sum + t.activeSeconds, 0) / recentTelemetry.length / 60
        : 0
    const avgInteractionRatio =
      recentTelemetry.length > 0
        ? recentTelemetry.reduce((sum, t) => sum + (t.interactionCount > 0 ? 1 : 0), 0) / recentTelemetry.length
        : 0

    const recentQuizDays = new Set(
      quizAttempts
        .filter((a) => a.completedAt && new Date(a.completedAt) >= thirtyDaysAgo)
        .map((a) => new Date(a.completedAt!).toDateString())
    ).size
    const recentSessionDays = new Set(
      focusSessions
        .filter((s) => new Date(s.startedAt) >= thirtyDaysAgo)
        .map((s) => new Date(s.startedAt).toDateString())
    ).size
    const activityDensity = Math.min(1, (recentQuizDays + recentSessionDays) / 30)

    const engagementLevel = Math.min(
      100,
      Math.round(
        (Math.min(avgActiveMinutes / 60, 1) * 0.3 + avgInteractionRatio * 0.3 + activityDensity * 0.4) * 100
      )
    )

    const recentQuizScores = quizAttempts
      .filter((a) => a.score != null)
      .slice(0, 10)
      .map((a) => a.score!)
    const topMisconceptions = Object.entries(topicWeaknessScore)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 5)
      .map(([_, v]) => v.name)
    const topVisitedTopics = Object.entries(topicVisitCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([_, v]) => v.name)

    const aiLabels = await generateProfileLabels(
      [
        { key: 'Total Quizzes Attempted', value: quizAttempts.length },
        { key: 'Total Focus Sessions', value: focusSessions.length },
        { key: 'Average Quiz Score', value: quizAttempts.length > 0 ? `${Math.round(quizAttempts.reduce((s, a) => s + (a.score ?? 0), 0) / quizAttempts.length)}%` : 'N/A' },
        { key: 'Average Focus Session Duration', value: focusSessions.length > 0 ? `${Math.round(focusSessions.reduce((s, x) => s + ((x.actualSeconds ?? x.duration ?? 0) / 60), 0) / focusSessions.length)} min` : 'N/A' },
        { key: 'Unique Session Types', value: new Set(focusSessions.map((s) => s.type)).size },
        { key: 'Average Distraction Score', value: focusSessions.filter((s) => s.distractionScore != null).length > 0 ? (focusSessions.filter((s) => s.distractionScore != null).reduce((s, x) => s + x.distractionScore!, 0) / focusSessions.filter((s) => s.distractionScore != null).length).toFixed(2) : 'N/A' },
        { key: 'Study Consistency', value: `${studyConsistency}%` },
        { key: 'Revision Frequency', value: `${revisionFrequency}%` },
        { key: 'Engagement Level', value: `${engagementLevel}%` },
        { key: 'Active Study Days (last 30)', value: recentFocusDays.size },
        { key: 'Badges Earned', value: earnedBadges.length },
        { key: 'Distinct Topics Studied', value: Object.keys(topicVisitCounts).length },
        { key: 'Topics Revisited', value: revisitedTopics },
        { key: 'Material Progress Entries', value: materialProgress.length },
        { key: 'Chat Sessions (AI Tutor)', value: chatSessions.length },
        { key: 'Mistake Explanations', value: mistakeExplanations.length },
        { key: 'Misconception Logs', value: misconceptionLogs.length },
      ],
      topMisconceptions,
      topVisitedTopics,
      recentQuizScores
    )

    const learningProfileType = aiLabels?.learningProfileType ?? determineLearningProfile(
      focusSessions,
      quizAttempts,
      studyConsistency,
      revisionFrequency,
      engagementLevel
    )

    const strongestHabit = aiLabels?.strongestHabit ?? determineStrongestHabit(
      focusSessions,
      quizAttempts,
      telemetryRecords,
      earnedBadges,
      studyConsistency,
      revisionFrequency
    )

    const biggestOpportunity = aiLabels?.biggestOpportunity ?? determineBiggestOpportunity(
      studyConsistency,
      revisionFrequency,
      engagementLevel,
      weakTopics,
      focusSessions,
      quizAttempts
    )

    const aiWeakTopics = aiLabels?.weakTopics?.filter(Boolean) ?? []
    const finalWeakTopics = aiWeakTopics.length > 0 ? aiWeakTopics : weakTopics

    const profile: DigitalTwinProfile = {
      learningProfileType,
      strongestHabit,
      biggestOpportunity,
      studyConsistency,
      revisionFrequency,
      weakTopics: finalWeakTopics,
      engagementLevel,
      dataSufficiency,
    }

    const aiProfileSummary = await generateProfileSummary({
      learningProfileType,
      strongestHabit,
      biggestOpportunity,
      studyConsistency,
      revisionFrequency,
      engagementLevel,
      weakTopics: finalWeakTopics,
      quizAttemptCount: quizAttempts.length,
      sessionCount: focusSessions.length,
      dataSufficiency,
    }).catch(() => null)

    return NextResponse.json({ success: true, data: { ...profile, aiProfileSummary } })
  } catch (error) {
    console.error('Digital twin profile error:', error)
    return NextResponse.json({
      success: true,
      data: {
        learningProfileType: 'Getting Started',
        strongestHabit: 'Keep using RESNOR to build your profile',
        biggestOpportunity: 'Start by taking quizzes and tracking study sessions',
        studyConsistency: 0,
        revisionFrequency: 0,
        weakTopics: [],
        engagementLevel: 0,
        dataSufficiency: 'insufficient' as const,
      },
    })
  }
}

function determineLearningProfile(
  sessions: Array<{ type: string; distractionScore: number | null; duration: number | null; actualSeconds: number | null }>,
  quizzes: Array<{ score: number | null; timeSpent: number | null }>,
  consistency: number,
  revision: number,
  engagement: number
): string {
  if (sessions.length < 5 && quizzes.length < 3) {
    return 'Developing Profile'
  }

  const avgFocus =
    sessions.filter((s) => s.distractionScore != null).length > 0
      ? sessions
          .filter((s) => s.distractionScore != null)
          .reduce((s, x) => s + (1 - (x.distractionScore ?? 0)), 0) /
        sessions.filter((s) => s.distractionScore != null).length
      : 0.5

  const avgQuizScore =
    quizzes.length > 0
      ? quizzes.reduce((s, a) => s + (a.score ?? 0), 0) / quizzes.length
      : 50

  const avgDuration =
    sessions.length > 0
      ? sessions.reduce((s, x) => s + ((x.actualSeconds ?? x.duration ?? 0) / 60), 0) / sessions.length
      : 30

  const uniqueTypes = new Set(sessions.map((s) => s.type))

  if (avgFocus > 0.7 && avgQuizScore > 70 && consistency > 50) {
    return 'Analytical Learner'
  }

  if (consistency > 65 && revision > 40) {
    return 'Sequential Learner'
  }

  if (uniqueTypes.size >= 2 && avgQuizScore > 65) {
    return 'Practical Learner'
  }

  if (avgDuration < 35 && uniqueTypes.size >= 2) {
    return 'Visual Learner'
  }

  if (uniqueTypes.size >= 2 && avgFocus < 0.6) {
    return 'Exploratory Learner'
  }

  return 'Analytical Learner'
}

function determineStrongestHabit(
  sessions: Array<{ type: string; startedAt: Date }>,
  quizzes: Array<{ score: number | null; completedAt: Date | null }>,
  telemetry: Array<{ activeSeconds: number; interactionCount: number }>,
  badges: Array<{ id: string }>,
  consistency: number,
  revision: number
): string {
  const habits: { label: string; score: number }[] = []

  const quizRate = quizzes.length
  habits.push({ label: 'Consistent Quiz Participation', score: Math.min(quizRate / 10, 1) * 100 })

  habits.push({ label: 'Regular Study Schedule', score: consistency })

  habits.push({ label: 'Active Revision Practice', score: revision })

  const avgEngagement =
    telemetry.length > 0
      ? telemetry.reduce((s, t) => s + t.activeSeconds, 0) / telemetry.length / 60
      : 0
  habits.push({
    label: 'Deep Engagement with Materials',
    score: Math.min(avgEngagement / 45, 1) * 100,
  })

  habits.push({ label: 'Achievement-Oriented Learning', score: Math.min(badges.length / 5, 1) * 100 })

  habits.sort((a, b) => b.score - a.score)
  return habits[0]?.label ?? 'Keep using RESNOR to build your profile'
}

function determineBiggestOpportunity(
  consistency: number,
  revision: number,
  engagement: number,
  weakTopics: string[],
  sessions: Array<{ type: string }>,
  quizzes: Array<{ score: number | null }>
): string {
  const opportunities: { label: string; gap: number }[] = []

  if (consistency < 60) {
    opportunities.push({ label: 'Study Schedule Consistency', gap: 60 - consistency })
  }

  if (revision < 50) {
    opportunities.push({ label: 'Revision Consistency', gap: 50 - revision })
  }

  if (engagement < 50) {
    opportunities.push({ label: 'Active Engagement', gap: 50 - engagement })
  }

  if (weakTopics.length > 0) {
    opportunities.push({ label: `Focus on ${weakTopics[0]}`, gap: weakTopics.length * 15 })
  }

  const practiceCount = sessions.filter(
    (s) => s.type === 'deep_focus' || s.type === 'pomodoro'
  ).length
  if (practiceCount < sessions.length * 0.2 && sessions.length > 5) {
    opportunities.push({ label: 'More Focused Practice', gap: 40 })
  }

  const avgScore =
    quizzes.length > 0
      ? quizzes.reduce((s, a) => s + (a.score ?? 0), 0) / quizzes.length
      : 100
  if (avgScore < 65) {
    opportunities.push({ label: 'Improving Quiz Performance', gap: 65 - avgScore })
  }

  opportunities.sort((a, b) => b.gap - a.gap)
  return opportunities[0]?.label ?? 'Continue building your learning profile'
}
