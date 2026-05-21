import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const students = await db.user.findMany({ where: { role: 'student' } })

    const atRiskStudents = await Promise.all(students.map(async (student) => {
      const engagement = await db.engagementScore.findUnique({ where: { studentId: student.id } })
      const streak = await db.streak.findUnique({ where: { studentId: student.id } })
      const attempts = await db.quizAttempt.findMany({ where: { studentId: student.id } })
      const avgScore = attempts.length > 0 ? attempts.reduce((s, a) => s + a.score, 0) / attempts.length : 0

      const engagementScore = engagement?.overallScore || 0
      const lastActive = streak?.lastActiveDate || new Date(0)
      const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

      // Determine risk level
      let status = 'OK'
      let statusColor = 'green'
      if (engagementScore < 40 || daysSinceActive > 5 || avgScore < 40) {
        status = 'At Risk'
        statusColor = 'red'
      } else if (engagementScore < 60 || daysSinceActive > 3 || avgScore < 55) {
        status = 'Warning'
        statusColor = 'amber'
      }

      return {
        id: student.id,
        name: student.name || 'Unknown',
        email: student.email,
        lastActive: lastActive.toISOString(),
        daysSinceActive,
        quizAverage: Math.round(avgScore * 10) / 10,
        engagementScore: Math.round(engagementScore),
        streak: streak?.currentStreak || 0,
        status,
        statusColor,
      }
    }))

    // Sort: at-risk first, then warning, then OK
    const statusOrder = { 'At Risk': 0, Warning: 1, OK: 2 }
    atRiskStudents.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

    return NextResponse.json({ students: atRiskStudents })
  } catch (error) {
    console.error('At-risk students error:', error)
    return NextResponse.json({ error: 'Failed to fetch at-risk students' }, { status: 500 })
  }
}
