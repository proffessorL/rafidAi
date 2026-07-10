import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { notifyBadgeEarned } from '@/lib/services/notification-service'

const BADGE_DEFS = [
  {
    name: "First Quiz", description: "Complete your very first quiz", icon: "🎯", category: "quiz",
    check: async (sid: string) => {
      const first = await db.quizAttempt.findFirst({ where: { studentId: sid }, orderBy: { createdAt: 'asc' } })
      const count = await db.quizAttempt.count({ where: { studentId: sid } })
      return { earned: count >= 1, detail: first ? `Score: ${first.score}%` : 'Not attempted yet' }
    }
  },
  {
    name: "Perfect Score", description: "Score 100% on any quiz", icon: "🌟", category: "quiz",
    check: async (sid: string) => {
      const count = await db.quizAttempt.count({ where: { studentId: sid, score: 100 } })
      return { earned: count >= 1, detail: `Perfect scores: ${count}` }
    }
  },
  {
    name: "Quiz Master", description: "Score 100% on 5 quizzes", icon: "🏆", category: "quiz",
    check: async (sid: string) => {
      const count = await db.quizAttempt.count({ where: { studentId: sid, score: 100 } })
      return { earned: count >= 5, detail: `Perfect scores: ${count}/5` }
    }
  },
  {
    name: "Quiz Collector", description: "Complete 10 quizzes", icon: "💎", category: "quiz",
    check: async (sid: string) => {
      const count = await db.quizAttempt.count({ where: { studentId: sid } })
      return { earned: count >= 10, detail: `Quizzes taken: ${count}/10` }
    }
  },
  {
    name: "Week Warrior", description: "Study every day for a full week", icon: "🔥", category: "streak",
    check: async (sid: string) => {
      const s = await db.streak.findUnique({ where: { studentId: sid } })
      const cur = s?.currentStreak ?? 0
      return { earned: cur >= 7, detail: `Current streak: ${cur}/7 days` }
    }
  },
  {
    name: "Consistency King", description: "Maintain a 14-day study streak", icon: "👑", category: "streak",
    check: async (sid: string) => {
      const s = await db.streak.findUnique({ where: { studentId: sid } })
      const longest = s?.longestStreak ?? 0
      return { earned: longest >= 14, detail: `Longest streak: ${longest}/14 days` }
    }
  },
  {
    name: "Bookworm", description: "Complete 10 study materials", icon: "📚", category: "study",
    check: async (sid: string) => {
      const count = await db.materialProgress.count({ where: { studentId: sid, completionStatus: 'done' } })
      return { earned: count >= 10, detail: `Materials completed: ${count}/10` }
    }
  },
  {
    name: "Century", description: "Answer 100 questions across all quizzes", icon: "💯", category: "quiz",
    check: async (sid: string) => {
      const count = await db.quizAnswer.count({ where: { attempt: { studentId: sid } } })
      return { earned: count >= 100, detail: `Questions answered: ${count}/100` }
    }
  },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

    await Promise.all(BADGE_DEFS.map(def =>
      db.badge.upsert({
        where: { name: def.name },
        update: { description: def.description, icon: def.icon, category: def.category },
        create: { name: def.name, description: def.description, icon: def.icon, category: def.category, thresholdType: 'custom', thresholdValue: 0 },
      })
    ))

    const [badges, earnedBadges] = await Promise.all([
      db.badge.findMany(),
      db.earnedBadge.findMany({ where: { studentId }, include: { badge: true } }),
    ])
    const earnedMap = new Map(earnedBadges.map((e) => [e.badge.name, e]))

    const badgeNameToId = new Map(badges.map(b => [b.name, b.id]))

    const checkResults = await Promise.all(BADGE_DEFS.map(async (def) => {
      const existing = earnedMap.get(def.name)
      const alreadyEarned = !!existing
      const result = await def.check(studentId)
      return { def, alreadyEarned, earned: alreadyEarned || result.earned, detail: result.detail }
    }))

    const awardOps = checkResults
      .filter(r => r.earned && !r.alreadyEarned)
      .map(r => {
        const badgeId = badgeNameToId.get(r.def.name)
        if (!badgeId) return Promise.resolve()
        return db.earnedBadge.create({ data: { studentId, badgeId } }).then(() => {
          notifyBadgeEarned({ studentId, badgeName: r.def.name, badgeIcon: r.def.icon, description: r.def.description }).catch(() => {})
        })
      })

    const earnedLookupOps = checkResults
      .filter(r => r.earned)
      .map(r =>
        db.earnedBadge.findUnique({
          where: { studentId_badgeId: { studentId, badgeId: badgeNameToId.get(r.def.name)! } },
        })
      )

    const [awarded, earnedRecords] = await Promise.all([
      Promise.all(awardOps),
      Promise.all(earnedLookupOps),
    ])

    const earnedAtMap = new Map<string, string | null>()
    for (let i = 0; i < checkResults.length; i++) {
      const r = checkResults[i]
      earnedAtMap.set(r.def.name, earnedRecords[i]?.earnedAt?.toISOString() || null)
    }

    const results = checkResults.map(r => ({
      name: r.def.name,
      description: r.def.description,
      icon: r.def.icon,
      category: r.def.category,
      earned: r.earned,
      earnedAt: earnedAtMap.get(r.def.name),
      progressDetail: r.detail,
    }))

    return NextResponse.json({ badges: results })
  } catch (error) {
    console.error('Badges error:', error)
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
  }
}
