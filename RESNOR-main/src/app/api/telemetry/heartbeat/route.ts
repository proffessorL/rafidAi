import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const STUDY_PAGE_IDS = [
  'quiz', 'tutor', 'wellbeing', 'notes', 'gamification',
  'planner', 'forum', 'explain-mistake', 'resources', 'leaderboard',
]

export async function POST(request: Request) {
  try {
    const { student_id, page_id, active_seconds, scroll_percentage, interaction_count, tab_focused } = await request.json()

    const sid = student_id || 'stu_001'

    const record = await db.telemetryRecord.create({
      data: {
        studentId: sid,
        pageId: page_id || 'unknown',
        activeSeconds: active_seconds || 0,
        scrollPercentage: scroll_percentage || 0,
        interactionCount: interaction_count || 0,
        tabFocused: tab_focused !== false,
      },
    })

    // Calculate engagement score
    const recentRecords = await db.telemetryRecord.findMany({
      where: { studentId: sid },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const avgActive = recentRecords.reduce((s, r) => s + r.activeSeconds, 0) / recentRecords.length
    const avgScroll = recentRecords.reduce((s, r) => s + r.scrollPercentage, 0) / recentRecords.length
    const avgInteractions = recentRecords.reduce((s, r) => s + r.interactionCount, 0) / recentRecords.length
    const focusRate = recentRecords.filter(r => r.tabFocused).length / recentRecords.length

    const engagementScore = Math.min(100,
      (avgActive / 1200) * 30 + // Up to 30 pts for 20min sessions
      (avgScroll / 100) * 25 +   // Up to 25 pts for full scroll
      Math.min(avgInteractions, 20) * 2.5 + // Up to 25 pts for 10+ interactions
      focusRate * 20             // Up to 20 pts for focus
    )

    // Compute weekly study hours from telemetry (last 7 days, study pages)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const weeklyTelemetry = await db.telemetryRecord.findMany({
      where: { studentId: sid, createdAt: { gte: sevenDaysAgo }, pageId: { in: STUDY_PAGE_IDS } },
      select: { activeSeconds: true },
    })
    const totalWeeklySeconds = weeklyTelemetry.reduce((s, t) => s + t.activeSeconds, 0)
    const weeklyActiveHours = Math.round((totalWeeklySeconds / 3600) * 10) / 10

    // Update engagement score
    await db.engagementScore.upsert({
      where: { studentId: sid },
      create: {
        studentId: sid,
        overallScore: Math.round(engagementScore),
        studyConsistencyRate: Math.round(focusRate * 100),
        avgSessionDuration: Math.round(avgActive),
        weeklyActiveHours,
        interactionDensity: Math.round(avgInteractions),
      },
      update: {
        overallScore: Math.round(engagementScore),
        studyConsistencyRate: Math.round(focusRate * 100),
        avgSessionDuration: Math.round(avgActive),
        weeklyActiveHours,
        interactionDensity: Math.round(avgInteractions),
        lastCalculated: new Date(),
      },
    })

    return NextResponse.json({ success: true, engagementScore: Math.round(engagementScore) })
  } catch (error) {
    console.error('Telemetry error:', error)
    return NextResponse.json({ error: 'Failed to record telemetry' }, { status: 500 })
  }
}
