import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { enhanceInsight } from '@/lib/ai-digital-twin'

interface TwinInsight {
  id: string
  text: string
  category: 'timing' | 'retention' | 'consistency' | 'topic' | 'method'
  confidence: 'high' | 'medium' | 'low'
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
    ] = await Promise.all([
      db.quizAttempt.findMany({
        where: { studentId: userId },
        orderBy: { completedAt: 'desc' },
        take: 100,
      }),
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
    ])

    const totalDataPoints = quizAttempts.length + focusSessions.length + telemetryRecords.length

    if (totalDataPoints < 5) {
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'insight-insufficient',
            text: 'Not enough data yet. Continue using RESNOR to build your Digital Twin and unlock personalized insights.',
            category: 'consistency' as const,
            confidence: 'low' as const,
          },
        ] as TwinInsight[],
      })
    }

    const insights: TwinInsight[] = []
    let insightId = 0

    if (quizAttempts.length >= 5 && focusSessions.length >= 5) {
      const quizDates = quizAttempts.map((a) => ({
        date: a.completedAt ? new Date(a.completedAt).toDateString() : '',
        score: a.score ?? 0,
      }))

      const focusDates = new Set(
        focusSessions.map((s) => new Date(s.startedAt).toDateString())
      )

      const withFocus = quizDates.filter((q) => focusDates.has(q.date))
      const withoutFocus = quizDates.filter((q) => !focusDates.has(q.date))

      if (withFocus.length >= 2 && withoutFocus.length >= 2) {
        const avgWith = withFocus.reduce((s, q) => s + q.score, 0) / withFocus.length
        const avgWithout = withoutFocus.reduce((s, q) => s + q.score, 0) / withoutFocus.length

        if (avgWith > avgWithout + 5) {
          insights.push({
            id: `insight-${insightId++}`,
            text: `You perform better on quizzes taken on days with focus sessions. Your average with focus is ${Math.round(avgWith)}% vs ${Math.round(avgWithout)}% without.`,
            category: 'retention',
            confidence: withFocus.length >= 5 ? 'high' : 'medium',
          })
        }
      }
    }

    if (focusSessions.length >= 5) {
      const sessionsWithData = focusSessions.filter(
        (s) => s.distractionScore != null && s.actualSeconds != null
      )

      if (sessionsWithData.length >= 3) {
        const longSessions = sessionsWithData.filter(
          (s) => (s.actualSeconds ?? 0) > 5400
        )
        const shortSessions = sessionsWithData.filter(
          (s) => (s.actualSeconds ?? 0) > 0 && (s.actualSeconds ?? 0) <= 5400
        )

        if (longSessions.length >= 2 && shortSessions.length >= 2) {
          const avgDistractionLong =
            longSessions.reduce((s, x) => s + (x.distractionScore ?? 0), 0) /
            longSessions.length
          const avgDistractionShort =
            shortSessions.reduce((s, x) => s + (x.distractionScore ?? 0), 0) /
            shortSessions.length
          const avgFocusLong = 1 - avgDistractionLong
          const avgFocusShort = 1 - avgDistractionShort

          if (avgFocusShort > avgFocusLong + 0.1) {
            insights.push({
              id: `insight-${insightId++}`,
              text: `Shorter focus sessions show better concentration than longer ones. Your average focus in sessions under 90 minutes is ${Math.round(avgFocusShort * 100)}% vs ${Math.round(avgFocusLong * 100)}% for longer sessions.`,
              category: 'method',
              confidence: longSessions.length >= 5 ? 'high' : 'medium',
            })
          }
        }
      }
    }

    if (misconceptionLogs.length >= 3) {
      const topicCounts: Record<string, number> = {}
      misconceptionLogs.forEach((m) => {
        const topic = m.conceptNodeId || m.patternDescription || 'unknown'
        topicCounts[topic] = (topicCounts[topic] || 0) + (m.frequencyCounter || 1)
      })

      const topWeakTopic = Object.entries(topicCounts).sort(
        (a, b) => b[1] - a[1]
      )[0]

      if (topWeakTopic && topWeakTopic[1] >= 2) {
        insights.push({
          id: `insight-${insightId++}`,
          text: `You may benefit from spending more time on ${topWeakTopic[0]}. This concept has appeared in ${topWeakTopic[1]} of your misconception analyses.`,
          category: 'topic',
          confidence: topWeakTopic[1] >= 4 ? 'high' : 'medium',
        })
      }
    }

    if (quizAttempts.length >= 5 && focusSessions.length >= 5) {
      const morningSessions = focusSessions.filter((s) => {
        const h = new Date(s.startedAt).getHours()
        return h >= 6 && h < 12
      })
      const eveningSessions = focusSessions.filter((s) => {
        const h = new Date(s.startedAt).getHours()
        return h >= 17 && h < 22
      })

      if (morningSessions.length >= 2 && eveningSessions.length >= 2) {
        const morningFocus =
          morningSessions.filter((s) => s.distractionScore != null).length > 0
            ? morningSessions
                .filter((s) => s.distractionScore != null)
                .reduce((s, x) => s + (1 - (x.distractionScore ?? 0)), 0) /
              morningSessions.filter((s) => s.distractionScore != null).length
            : 0
        const eveningFocus =
          eveningSessions.filter((s) => s.distractionScore != null).length > 0
            ? eveningSessions
                .filter((s) => s.distractionScore != null)
                .reduce((s, x) => s + (1 - (x.distractionScore ?? 0)), 0) /
              eveningSessions.filter((s) => s.distractionScore != null).length
            : 0

        if (morningFocus > eveningFocus + 0.15) {
          insights.push({
            id: `insight-${insightId++}`,
            text: 'Your morning focus sessions show higher concentration than evening sessions. Consider scheduling challenging topics earlier in the day.',
            category: 'timing',
            confidence: morningSessions.length >= 5 ? 'high' : 'medium',
          })
        } else if (eveningFocus > morningFocus + 0.15) {
          insights.push({
            id: `insight-${insightId++}`,
            text: 'You tend to focus better during evening sessions. Your most challenging material may benefit from evening study times.',
            category: 'timing',
            confidence: eveningSessions.length >= 5 ? 'high' : 'medium',
          })
        }
      }
    }

    if (telemetryRecords.length >= 7 && quizAttempts.length >= 5) {
      const highEngagementDays = telemetryRecords.filter(
        (t) => t.activeSeconds > 1800
      ).length
      const totalDays = telemetryRecords.length
      const consistencyRatio = highEngagementDays / totalDays

      const recentQuizzes = quizAttempts.slice(0, Math.min(10, quizAttempts.length))
      const avgRecentScore =
        recentQuizzes.reduce((s, a) => s + (a.score ?? 0), 0) / recentQuizzes.length

      if (consistencyRatio > 0.6 && avgRecentScore > 70) {
        insights.push({
          id: `insight-${insightId++}`,
          text: 'Your consistent study activity is paying off. On days with over 30 minutes of active study, you tend to score above 70% on quizzes.',
          category: 'consistency',
          confidence: totalDays >= 14 ? 'high' : 'medium',
        })
      } else if (consistencyRatio < 0.3) {
        insights.push({
          id: `insight-${insightId++}`,
          text: 'Building a more consistent daily study habit could improve your performance. You currently have active study days less than 30% of the time.',
          category: 'consistency',
          confidence: 'medium',
        })
      }
    }

    if (focusSessions.length >= 10) {
      const uniqueTypes = new Set(focusSessions.map((s) => s.type))
      if (uniqueTypes.size <= 1) {
        const types = Array.from(uniqueTypes).join(' and ')
        insights.push({
          id: `insight-${insightId++}`,
          text: `You primarily use ${types} sessions. Mixing in other focus methods could improve retention through varied engagement.`,
          category: 'method',
          confidence: 'medium',
        })
      }
    }

    if (insights.length === 0) {
      insights.push({
        id: `insight-${insightId++}`,
        text: 'Your learning patterns are still developing. Keep using RESNOR consistently and more insights will emerge from your activity data.',
        category: 'consistency',
        confidence: 'low',
      })
    }

    const finalInsights = insights.slice(0, 5)

    const aiEnhanced = await Promise.all(
      finalInsights.map(async (insight) => {
        const aiText = await enhanceInsight({
          category: insight.category,
          rawText: insight.text,
          supportingData: {
            category: insight.category,
            confidence: insight.confidence,
            totalInsights: finalInsights.length,
          },
        }).catch(() => null)
        return aiText ? { ...insight, text: aiText, aiEnhanced: true } : insight
      })
    )

    return NextResponse.json({ success: true, data: aiEnhanced })
  } catch (error) {
    console.error('Digital twin insights error:', error)
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'insight-fallback',
          text: 'Not enough data yet. Continue using RESNOR to build your Digital Twin.',
          category: 'consistency' as const,
          confidence: 'low' as const,
        },
      ] as TwinInsight[],
    })
  }
}
