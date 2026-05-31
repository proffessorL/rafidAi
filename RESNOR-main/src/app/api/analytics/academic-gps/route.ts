import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function computeCGPA(avgScore: number, completionRate: number, consistencyRate: number, weeklyHours: number) {
  let raw = (avgScore * 0.5 + completionRate * 100 * 0.3 + consistencyRate * 0.2)
  let cgpa = 2.0 + (raw / 100) * 2.0
  cgpa = Math.min(4.0, Math.max(2.0, cgpa))
  if (weeklyHours > 10) cgpa += 0.1
  if (consistencyRate > 80) cgpa += 0.05
  return Math.min(4.0, Math.round(cgpa * 100) / 100)
}

function computeRange(avgScore: number, completionRate: number, consistencyRate: number, weeklyHours: number) {
  const base = computeCGPA(avgScore, completionRate, consistencyRate, weeklyHours)
  const uncertainty = 0.15 + (1 - Math.min(1, (weeklyHours + consistencyRate) / 200)) * 0.15
  return {
    min: Math.max(2.0, Math.round((base - uncertainty) * 100) / 100),
    max: Math.min(4.0, Math.round((base + uncertainty) * 100) / 100),
    mostLikely: base,
  }
}

export async function GET(req: NextRequest) {
  try {
    const studentId = 'stu_001'
    const url = new URL(req.url)
    const targetParam = url.searchParams.get('target')
    const targetCGPA = targetParam ? parseFloat(targetParam) : null

    const [attempts, progress, engagement] = await Promise.all([
      db.quizAttempt.findMany({
        where: { studentId },
        orderBy: { completedAt: 'asc' },
      }),
      db.materialProgress.findMany({ where: { studentId } }),
      db.engagementScore.findUnique({ where: { studentId } }),
    ])

    const completionRate = progress.length > 0
      ? progress.filter(p => p.completionStatus === 'done').length / progress.length
      : 0

    const recentScores = attempts.slice(-5)
    const avgRecentScore = recentScores.length > 0
      ? recentScores.reduce((s, a) => s + a.score, 0) / recentScores.length
      : 0

    const consistencyRate = engagement?.studyConsistencyRate || 50
    const weeklyHours = engagement?.weeklyActiveHours || 5
    const interactionDensity = engagement?.interactionDensity || 0

    const predictedRange = computeRange(avgRecentScore, completionRate, consistencyRate, weeklyHours)
    const confidence = Math.min(95, 40 + attempts.length * 8 + progress.length * 2)

    // ─── PEER ANALYSIS (used for both comparison & scenarios) ───────────────

    const allEngagements = await db.engagementScore.findMany({
      where: { studentId: { not: studentId } },
    })

    const peerStudentIds = allEngagements
      .filter(e => {
        const hours = e.weeklyActiveHours || 0
        const consistent = e.studyConsistencyRate || 0
        return (
          hours >= Math.max(0, weeklyHours - 5) &&
          hours <= weeklyHours + 10 &&
          consistent >= Math.max(0, consistencyRate - 15) &&
          consistent <= Math.min(100, consistencyRate + 15)
        )
      })
      .map(e => e.studentId)

    const peerAttempts = peerStudentIds.length > 0
      ? await db.quizAttempt.findMany({
          where: { studentId: { in: peerStudentIds } },
        })
      : []

    const peerDataMap: Record<string, { attempts: typeof attempts; engagement: typeof allEngagements[0] | undefined }> = {}
    for (const pid of peerStudentIds) {
      peerDataMap[pid] = { attempts: [], engagement: allEngagements.find(e => e.studentId === pid) }
    }
    for (const a of peerAttempts) {
      if (peerDataMap[a.studentId]) peerDataMap[a.studentId].attempts.push(a)
    }

    // Compute each peer's stats
    let peerSum = 0, peerCount = 0, peerHoursSum = 0, peerConsistencySum = 0
    const peerCGPAValues: number[] = []
    type PeerStats = { hours: number; consistency: number; quizAvg: number; cgpa: number }
    const allPeerStats: PeerStats[] = []

    for (const [, pd] of Object.entries(peerDataMap)) {
      const eng = pd.engagement
      if (!eng) continue
      const pHours = eng.weeklyActiveHours || 0
      const pConsistency = eng.studyConsistencyRate || 50
      const pAvg = pd.attempts.length > 0
        ? pd.attempts.reduce((s, a) => s + a.score, 0) / pd.attempts.length
        : 50
      const pCGPA = computeCGPA(pAvg, 0.5, pConsistency, pHours)
      peerSum += pCGPA
      peerCount++
      peerHoursSum += pHours
      peerConsistencySum += pConsistency
      peerCGPAValues.push(pCGPA)
      allPeerStats.push({ hours: pHours, consistency: pConsistency, quizAvg: pAvg, cgpa: pCGPA })
    }

    peerCGPAValues.sort((a, b) => b - a)
    const top10Count = Math.max(1, Math.ceil(peerCGPAValues.length * 0.1))
    const top10Avg = peerCGPAValues.slice(0, top10Count).reduce((s, v) => s + v, 0) / top10Count

    const avgPeerCGPA = peerCount > 0 ? Math.round((peerSum / peerCount) * 100) / 100 : 0
    const avgPeerHours = peerCount > 0 ? Math.round((peerHoursSum / peerCount) * 10) / 10 : 0
    const avgPeerConsistency = peerCount > 0 ? Math.round(peerConsistencySum / peerCount) : 0

    // ─── SCENARIOS BASED ON REAL PEER DATA ─────────────────────────────────

    // Among similar peers, find those who outperform the student
    const currentCGPA = predictedRange.mostLikely
    const outperformingPeers = allPeerStats.filter(p => p.cgpa > currentCGPA)

    // Default fallback (when no outperforming peers exist)
    let moderateHours = Math.round(weeklyHours + 4)
    let moderateQuizAvg = Math.min(100, avgRecentScore + 8)
    let moderateConsistency = Math.min(100, consistencyRate + 15)
    let moderatePeerCount = 0

    let highHours = Math.round(weeklyHours + 10)
    let highQuizAvg = Math.min(100, avgRecentScore + 18)
    let highConsistency = Math.min(100, consistencyRate + 30)

    if (outperformingPeers.length > 0) {
      // Moderate path = what the average outperforming peer does
      const avgOutperformHours = outperformingPeers.reduce((s, p) => s + p.hours, 0) / outperformingPeers.length
      const avgOutperformQuiz = outperformingPeers.reduce((s, p) => s + p.quizAvg, 0) / outperformingPeers.length
      const avgOutperformConsistency = outperformingPeers.reduce((s, p) => s + p.consistency, 0) / outperformingPeers.length

      moderateHours = Math.round(Math.max(weeklyHours, avgOutperformHours))
      moderateQuizAvg = Math.min(100, Math.round(Math.max(avgRecentScore, avgOutperformQuiz)))
      moderateConsistency = Math.min(100, Math.round(Math.max(consistencyRate, avgOutperformConsistency)))
      moderatePeerCount = outperformingPeers.length

      // High path = top quartile of outperforming peers
      const sorted = [...outperformingPeers].sort((a, b) => b.cgpa - a.cgpa)
      const topQuartileCount = Math.max(1, Math.ceil(sorted.length * 0.25))
      const topQuartile = sorted.slice(0, topQuartileCount)

      highHours = Math.round(topQuartile.reduce((s, p) => s + p.hours, 0) / topQuartileCount)
      highQuizAvg = Math.min(100, Math.round(topQuartile.reduce((s, p) => s + p.quizAvg, 0) / topQuartileCount))
      highConsistency = Math.min(100, Math.round(topQuartile.reduce((s, p) => s + p.consistency, 0) / topQuartileCount))
    }

    // Build scenario tags with peer context
    const moderateTag = moderatePeerCount > 0
      ? `Like ${moderatePeerCount} peers who improved • ~${moderateHours}h`
      : `~${moderateHours}h/week • ${moderateConsistency}% consistency`

    const highTag = `~${highHours}h/week • ${highConsistency}% consistency`

    // Determine which scenario to recommend based on gain-per-effort
    const currentCGPAVal = currentCGPA
    const moderateCGPA = computeCGPA(moderateQuizAvg, completionRate, moderateConsistency, moderateHours)
    const highCGPA = computeCGPA(highQuizAvg, Math.min(1, completionRate + 0.3), highConsistency, highHours)

    const moderateGain = moderateCGPA - currentCGPAVal
    const highGain = highCGPA - currentCGPAVal
    const moderateEffortDelta = moderateHours - weeklyHours + (moderateConsistency - consistencyRate) / 20
    const highEffortDelta = highHours - weeklyHours + (highConsistency - consistencyRate) / 20

    const moderateEfficiency = moderateEffortDelta > 0 ? moderateGain / moderateEffortDelta : 0
    const highEfficiency = highEffortDelta > 0 ? highGain / highEffortDelta : 0

    let recommendedIndex = 1
    if (moderateGain <= 0.05) recommendedIndex = 0
    else if (highEfficiency > moderateEfficiency * 1.3 && highGain > moderateGain + 0.1) recommendedIndex = 2

    const scenarios = [
      {
        label: 'Current effort',
        tag: 'Where you are now',
        hours: weeklyHours,
        consistency: consistencyRate,
        range: predictedRange,
        recommended: recommendedIndex === 0,
      },
      {
        label: 'Moderate increase',
        tag: moderateTag,
        hours: moderateHours,
        consistency: moderateConsistency,
        range: computeRange(moderateQuizAvg, completionRate, moderateConsistency, moderateHours),
        recommended: recommendedIndex === 1,
      },
      {
        label: 'Significant increase',
        tag: highTag,
        hours: highHours,
        consistency: highConsistency,
        range: computeRange(highQuizAvg, Math.min(1, completionRate + 0.3), highConsistency, highHours),
        recommended: recommendedIndex === 2,
      },
    ]

    // ─── OBSERVATIONS ───────────────────────────────────────────────────────

    const observations: Array<{ type: 'tip' | 'insight' | 'nudge'; message: string }> = []

    if (attempts.length >= 4) {
      const half = Math.floor(attempts.length / 2)
      const recentAvg = attempts.slice(half).reduce((s, a) => s + a.score, 0) / (attempts.length - half)
      const earlyAvg = attempts.slice(0, half).reduce((s, a) => s + a.score, 0) / half
      const drop = earlyAvg - recentAvg
      if (drop > 10) {
        observations.push({
          type: 'nudge',
          message: `Your recent quiz scores dipped ${Math.round(drop)}%. Reviewing those topics could turn this around quickly.`,
        })
      } else if (drop > 5) {
        observations.push({
          type: 'nudge',
          message: `Your quiz scores dipped slightly (${Math.round(drop)}%). A quick review of recent topics may help.`,
        })
      } else if (recentAvg > earlyAvg + 5) {
        observations.push({
          type: 'insight',
          message: `Your quiz scores are trending up (${Math.round(recentAvg - earlyAvg)}% improvement). Keep it going!`,
        })
      }
    }

    if (weeklyHours < 8) {
      observations.push({
        type: 'tip',
        message: `Adding ${Math.round(8 - weeklyHours)} more study hours per week could noticeably improve your progress. Most students aiming higher study 12-16 hrs.`,
      })
    }

    if (consistencyRate < 50) {
      observations.push({
        type: 'tip',
        message: `Studying more consistently (even ${Math.min(100, 100 - consistencyRate)}% more) could boost retention significantly. Try a fixed daily schedule.`,
      })
    }

    if (peerCount > 0 && currentCGPA < avgPeerCGPA - 0.15) {
      observations.push({
        type: 'insight',
        message: `Students with similar stats who study ${avgPeerHours}h/week (vs your ${weeklyHours}h) average around ${avgPeerCGPA.toFixed(2)}. Small increases can close this gap.`,
      })
    }

    if (outperformingPeers.length > 0) {
      observations.push({
        type: 'insight',
        message: `${outperformingPeers.length} students with similar starting stats achieved higher CGPAs. They averaged ${moderateHours}h/week and ${moderateConsistency}% consistency.`,
      })
    }

    // ─── TARGET ANALYSIS ────────────────────────────────────────────────────

    let targetAnalysis: {
      targetCGPA: number
      effortLevel: 'moderate' | 'significant' | 'ambitious'
      closestScenario: typeof scenarios[0]
      gap: number
      note: string
    } | null = null

    if (targetCGPA && targetCGPA > 0) {
      const gap = targetCGPA - currentCGPA
      const closestScenario = scenarios.slice(1).reduce((best, s) =>
        Math.abs(s.range.mostLikely - targetCGPA) < Math.abs(best.range.mostLikely - targetCGPA) ? s : best
      , scenarios[1])

      let effortLevel: 'moderate' | 'significant' | 'ambitious'
      let note: string

      if (gap <= 0.15) {
        effortLevel = 'moderate'
        note = 'A small increase in study hours and consistency could get you there.'
      } else if (gap <= 0.4) {
        effortLevel = 'significant'
        note = `${outperformingPeers.length > 0 ? `${outperformingPeers.length} peers with your stats reached this range. They` : 'Students who reach this level'} typically study ${closestScenario.hours}h/week with ${closestScenario.consistency}% consistency.`
      } else {
        effortLevel = 'ambitious'
        note = `This is an ambitious goal — it would require ${closestScenario.hours}h/week and ${closestScenario.consistency}% consistency. Even getting partway there would be great progress.`
      }

      targetAnalysis = {
        targetCGPA,
        effortLevel,
        closestScenario,
        gap: Math.round(gap * 100) / 100,
        note,
      }
    }

    // ─── WEEKLY PLAN ────────────────────────────────────────────────────────

    const recommended = scenarios.find(s => s.recommended) || scenarios[1]
    const weeklyPlan: Array<{ action: string; current: string; target: string }> = []

    if (weeklyHours < recommended.hours) {
      weeklyPlan.push({
        action: `Study ${recommended.hours} hrs/week`,
        current: `${weeklyHours} hrs`,
        target: `${recommended.hours} hrs`,
      })
    }
    if (attempts.length < 3) {
      weeklyPlan.push({
        action: 'Take 2-3 practice quizzes',
        current: `${attempts.length} taken`,
        target: '3 this week',
      })
    }
    if (consistencyRate < recommended.consistency) {
      weeklyPlan.push({
        action: 'Study on a fixed daily schedule',
        current: `${consistencyRate}% consistency`,
        target: `${recommended.consistency}%`,
      })
    }
    if (weeklyPlan.length === 0) {
      weeklyPlan.push({
        action: 'Maintain your current momentum',
        current: 'On track',
        target: 'Keep it up!',
      })
    }

    const midRange = Math.round(((recommended.range.min + recommended.range.max) / 2) * 100) / 100

    return NextResponse.json({
      currentCGPA: 3.15,
      predictedRange,
      confidence,
      metrics: {
        quizAverage: avgRecentScore ? Math.round(avgRecentScore * 10) / 10 : 0,
        completionRate: Math.round(completionRate * 100),
        studyConsistency: consistencyRate,
        weeklyHours,
        interactionDensity,
      },
      peerData: {
        similarStudentCount: peerCount,
        you: {
          studyHours: weeklyHours,
          consistency: consistencyRate,
          predictedCGPA: currentCGPA,
        },
        avgPeer: {
          studyHours: avgPeerHours,
          consistency: avgPeerConsistency,
          predictedCGPA: avgPeerCGPA,
        },
        top10: {
          studyHours: Math.round(avgPeerHours * 1.3),
          consistency: Math.min(100, Math.round(avgPeerConsistency * 1.15)),
          predictedCGPA: top10Avg,
        },
      },
      scenarios,
      observations,
      targetAnalysis,
      weeklyPlan,
      projectedImpact: {
        range: recommended.range,
        improvement: Math.round((midRange - currentCGPA) * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Academic GPS error:', error)
    return NextResponse.json({ error: 'Failed to load Academic GPS data' }, { status: 500 })
  }
}
