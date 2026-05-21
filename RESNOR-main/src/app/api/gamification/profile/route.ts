import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const studentId = 'stu_001'

    const streak = await db.streak.findUnique({ where: { studentId } })
    const badges = await db.badge.findMany()
    const earnedBadges = await db.earnedBadge.findMany({
      where: { studentId },
      include: { badge: true },
    })

    const earnedIds = new Set(earnedBadges.map(e => e.badgeId))

    const allBadges = badges.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      category: b.category,
      earned: earnedIds.has(b.id),
      earnedAt: earnedBadges.find(e => e.badgeId === b.id)?.earnedAt || null,
    }))

    // Calculate level
    const totalXP = earnedBadges.length * 100 + (streak?.totalActiveDays || 0) * 10
    const currentLevel = Math.floor(totalXP / 200) + 1
    const levelProgress = (totalXP % 200) / 200 * 100
    const levelTitles = ['', 'Beginner', 'Learner', 'Scholar', 'Expert', 'Master', 'Legend']
    const levelTitle = levelTitles[Math.min(currentLevel, levelTitles.length - 1)]

    return NextResponse.json({
      streak: streak ? {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        totalDays: streak.totalActiveDays,
        lastActive: streak.lastActiveDate,
      } : { current: 0, longest: 0, totalDays: 0 },
      badges: allBadges,
      level: {
        current: currentLevel,
        title: levelTitle,
        totalXP,
        nextLevelXP: (currentLevel + 1) * 200,
        progress: Math.round(levelProgress),
      },
    })
  } catch (error) {
    console.error('Gamification error:', error)
    return NextResponse.json({ error: 'Failed to fetch gamification data' }, { status: 500 })
  }
}
