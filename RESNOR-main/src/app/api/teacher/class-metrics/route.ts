import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const totalStudents = await db.user.count({ where: { role: 'student' } })
    const totalMaterials = await db.material.count()

    const materialProgressRecords = await db.materialProgress.findMany({
      select: { completionStatus: true },
    })
    const totalProgressRecords = materialProgressRecords.length
    const doneCount = materialProgressRecords.filter(p => p.completionStatus === 'done').length
    const avgCompletionRate = totalProgressRecords > 0
      ? Math.round((doneCount / totalProgressRecords) * 100)
      : 0

    const allAttempts = await db.quizAttempt.findMany({
      select: { score: true },
    })
    const avgQuizScore = allAttempts.length > 0
      ? Math.round(
          (allAttempts.reduce((s, a) => s + a.score, 0) / allAttempts.length) * 10
        ) / 10
      : 0

    const activeThreshold = new Date(Date.now() - 7 * 86400000)
    const studentIds = await db.user.findMany({
      where: { role: 'student' },
      select: { id: true },
    })
    const studentIdSet = new Set(studentIds.map(s => s.id))

    const activeGroups = await db.telemetryRecord.groupBy({
      by: ['studentId'],
      where: { createdAt: { gte: activeThreshold } },
      _count: true,
    })
    const activeStudents = activeGroups.filter(g => studentIdSet.has(g.studentId)).length

    const topics = await db.topic.findMany({
      include: { materials: true, course: true },
    })

    const topicMetrics = await Promise.all(topics.map(async (topic) => {
      const materialIds = topic.materials.map(m => m.id)
      const topicProgress = materialIds.length > 0
        ? await db.materialProgress.findMany({
            where: { materialId: { in: materialIds } },
            select: { completionStatus: true },
          })
        : []
      const topicDone = topicProgress.filter(p => p.completionStatus === 'done').length
      const topicInProgress = topicProgress.filter(p => p.completionStatus === 'in_progress').length
      const topicPending = topicProgress.length - topicDone - topicInProgress

      return {
        topicName: topic.name,
        courseId: topic.courseId,
        courseName: topic.course.name,
        completed: topicDone,
        inProgress: topicInProgress,
        pending: topicPending,
        total: topicProgress.length,
      }
    }))

    const recentAttempts = await db.quizAttempt.findMany({
      take: 5,
      orderBy: { completedAt: 'desc' },
      include: {
        student: { select: { name: true } },
        quiz: { include: { topic: { select: { name: true } } } },
      },
    })

    const recentActivity = recentAttempts.map(a => ({
      studentName: a.student.name,
      action: `completed quiz "${a.quiz.title}"`,
      topic: a.quiz.topic?.name,
      score: a.score,
      time: a.completedAt,
    }))

    // Score distribution — one student per range based on their avg score
    const attemptsByStudent = await db.quizAttempt.groupBy({
      by: ['studentId'],
      _avg: { score: true },
    })

    const scoreRanges = [
      { range: '0-20', count: 0 }, { range: '20-40', count: 0 },
      { range: '40-60', count: 0 }, { range: '60-80', count: 0 },
      { range: '80-100', count: 0 },
    ]
    for (const g of attemptsByStudent) {
      const avg = g._avg.score ?? 0
      if (avg <= 20) scoreRanges[0].count++
      else if (avg <= 40) scoreRanges[1].count++
      else if (avg <= 60) scoreRanges[2].count++
      else if (avg <= 80) scoreRanges[3].count++
      else scoreRanges[4].count++
    }

    return NextResponse.json({
      overview: { totalStudents, avgCompletionRate, avgQuizScore, activeStudents, totalMaterials },
      topicMetrics,
      recentActivity,
      scoreDistribution: scoreRanges,
    })
  } catch (error) {
    console.error('Class metrics error:', error)
    return NextResponse.json({ error: 'Failed to fetch class metrics' }, { status: 500 })
  }
}
