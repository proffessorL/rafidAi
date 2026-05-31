import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) {
      return NextResponse.json({ error: 'student_id required' }, { status: 400 })
    }

    const [enrollments, allAttempts, engagement] = await Promise.all([
      db.enrollment.findMany({
        where: { studentId },
        include: { course: true },
      }),
      db.quizAttempt.findMany({
        where: { studentId },
        include: { quiz: { include: { topic: { include: { course: true } } } } },
        orderBy: { completedAt: 'desc' },
      }),
      db.engagementScore.findUnique({ where: { studentId } }),
    ])

    const myCourseIds = enrollments.map(e => e.course.id)

    // Peer quiz averages per course
    const peerAttempts = await db.quizAttempt.findMany({
      where: {
        studentId: { not: studentId },
        quiz: { topic: { courseId: { in: myCourseIds } } },
      },
      select: { score: true, quiz: { select: { topic: { select: { courseId: true } } } } },
    })

    const peerQuizByCourse: Record<string, number[]> = {}
    for (const pa of peerAttempts) {
      const cId = pa.quiz.topic.courseId
      if (!peerQuizByCourse[cId]) peerQuizByCourse[cId] = []
      peerQuizByCourse[cId].push(pa.score)
    }
    const peerQuizAvgByCourse: Record<string, number> = {}
    for (const [cId, scores] of Object.entries(peerQuizByCourse)) {
      peerQuizAvgByCourse[cId] = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    }

    // Peer count
    const peerEnrollments = await db.enrollment.findMany({
      where: { courseId: { in: myCourseIds }, studentId: { not: studentId } },
      select: { studentId: true },
    })
    const uniquePeerIds = new Set(peerEnrollments.map(e => e.studentId)).size

    // Group my quiz attempts by course + topic
    const quizByCourse: Record<string, { attempts: typeof allAttempts; avgScore: number; topicScores: Record<string, number> }> = {}
    for (const a of allAttempts) {
      const courseId = a.quiz.topic.course.id
      if (!quizByCourse[courseId]) quizByCourse[courseId] = { attempts: [], avgScore: 0, topicScores: {} }
      quizByCourse[courseId].attempts.push(a)
      const topicName = a.quiz.topic.name
      const existing = quizByCourse[courseId].topicScores[topicName] ?? 0
      quizByCourse[courseId].topicScores[topicName] = existing === 0 ? a.score : (existing + a.score) / 2
    }
    for (const cId of Object.keys(quizByCourse)) {
      const scores = quizByCourse[cId].attempts.map(a => a.score)
      quizByCourse[cId].avgScore = scores.length > 0
        ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
        : 0
    }

    const weeklyHours = engagement?.weeklyActiveHours ?? 0
    const consistency = engagement?.studyConsistencyRate ?? 0

    // ── Build per-subject data ──
    const subjects = enrollments.map(e => {
      const courseId = e.course.id
      const qd = quizByCourse[courseId]
      const quizAvg = qd?.avgScore ?? 0
      const quizCount = qd?.attempts.length ?? 0
      const recentQuiz = qd?.attempts[0]

      // Marks from enrollment (may be null)
      const marks = {
        assignment: e.assignmentMark ?? null,
        presentation: e.presentationMark ?? null,
        mid: e.midMark ?? null,
        final: e.finalMark ?? null,
      }
      const availableMarks = [marks.assignment, marks.presentation, marks.mid].filter(m => m !== null) as number[]
      const hasRealMarks = availableMarks.length > 0

      // Readiness: blend quiz + engagement (0-100)
      const quizReadiness = quizCount >= 3 ? Math.min(100, quizAvg + 10) : quizAvg
      const engagementReadiness = Math.min(100, (weeklyHours / 10) * 50 + (consistency / 100) * 50)
      const readiness = hasRealMarks
        ? Math.round((availableMarks.reduce((a, b) => a + b, 0) / availableMarks.length) * 10) / 10
        : Math.round((quizReadiness * 0.6 + engagementReadiness * 0.4) * 10) / 10

      // Inferred grade (only shown if marks exist)
      const gradeThresholds = [
        { grade: 'A', min: 80, gp: 4.0 }, { grade: 'A-', min: 75, gp: 3.75 },
        { grade: 'B+', min: 70, gp: 3.5 }, { grade: 'B', min: 65, gp: 3.0 },
        { grade: 'B-', min: 60, gp: 2.75 }, { grade: 'C+', min: 55, gp: 2.5 },
        { grade: 'C', min: 50, gp: 2.0 }, { grade: 'F', min: 0, gp: 0.0 },
      ]
      let grade: string | null = null
      let gradePoint: number | null = null
      if (hasRealMarks) {
        for (const t of gradeThresholds) {
          if (readiness >= t.min) { grade = t.grade; gradePoint = t.gp; break }
        }
      }

      // Final target (only meaningful with marks)
      let finalNeeded: number | null = null
      let finalTarget: string | null = null
      if (marks.final === null && hasRealMarks) {
        const nextUp = gradeThresholds.filter(t => t.min > readiness && t.min <= 80)
        if (nextUp.length > 0) {
          finalTarget = nextUp[nextUp.length - 1].grade
          const currentAvg = availableMarks.reduce((a, b) => a + b, 0) / availableMarks.length
          const fw = 0.3
          const needed = Math.round(((nextUp[nextUp.length - 1].min - currentAvg * (1 - fw)) / fw) * 10) / 10
          finalNeeded = Math.min(100, Math.max(0, needed))
        }
      }

      // Trend from recent quiz trajectory
      const trend = recentQuiz && qd && qd.attempts.length >= 2
        ? recentQuiz.score > qd.avgScore + 5 ? 'up' : recentQuiz.score < qd.avgScore - 5 ? 'down' : 'stable'
        : 'stable'

      // Topic-level weak spots
      const weakTopics = qd
        ? Object.entries(qd.topicScores)
            .filter(([, score]) => score < 65)
            .map(([name]) => name)
        : []

      // vs peers on quizzes
      const peerQuizAvg = peerQuizAvgByCourse[courseId] ?? null
      const vsPeerQuiz = peerQuizAvg !== null ? Math.round((quizAvg - peerQuizAvg) * 10) / 10 : null

      // Priority: higher = needs more attention now
      const priority = Math.round(
        (100 - Math.min(100, readiness)) * 0.4 +
        (100 - Math.min(100, (weeklyHours / 12) * 100)) * 0.2 +
        (100 - consistency) * 0.2 +
        (100 - Math.min(100, (quizCount / 6) * 100)) * 0.2
      )

      return {
        courseId, courseName: e.course.name, courseCode: e.course.code,
        marks,
        quizAvg, quizCount, recentQuizScore: recentQuiz?.score ?? null,
        weakTopics,
        readiness, hasMarks: hasRealMarks,
        grade, gradePoint,
        finalNeeded, finalTarget,
        vsPeerQuiz, peerQuizAvg,
        trend, priority,
        attendance: e.attendance,
      }
    })

    // ── Global insights ──
    const focusSubject = subjects.length > 0
      ? subjects.reduce((a, b) => a.priority > b.priority ? a : b)
      : null

    const weakQuizSubjects = subjects.filter(s => s.quizCount >= 2 && s.quizAvg < 65)
    const lowConsistency = consistency < 60

    // Recommendations based on actual gaps
    const recommendations: { icon: string; text: string }[] = []
    if (weakQuizSubjects.length > 0) {
      recommendations.push({
        icon: 'brain',
        text: `You're scoring below 65% on quizzes in ${weakQuizSubjects.map(s => s.courseName).join(', ')}. Try reviewing topic notes before attempting quizzes.`,
      })
    }
    if (weeklyHours < 6) {
      recommendations.push({
        icon: 'clock',
        text: `Only ${weeklyHours}h/week studied. Set a daily 1h slot — consistency matters more than cramming.`,
      })
    } else if (lowConsistency) {
      recommendations.push({
        icon: 'target',
        text: `Study consistency is ${consistency}%. Even ${weeklyHours}h/week spread evenly beats long weekend sessions.`,
      })
    }
    if (focusSubject && focusSubject.quizCount < 3) {
      recommendations.push({
        icon: 'brain',
        text: `Take at least 3 quizzes in ${focusSubject.courseName} before the mid to identify weak topics.`,
      })
    }
    if (uniquePeerIds > 0 && subjects.every(s => s.quizCount < 2)) {
      recommendations.push({
        icon: 'chart',
        text: `You've taken fewer quizzes than most peers. Regular quizzing is the #1 predictor of exam scores.`,
      })
    }

    return NextResponse.json({
      subjects,
      focus: focusSubject ? {
        subject: focusSubject.courseName,
        reason: focusSubject.readiness < 50 ? 'Low readiness' : focusSubject.quizCount < 2 ? 'Not enough practice' : 'Most room to improve',
        priority: focusSubject.priority,
      } : null,
      weakQuizSubjects: weakQuizSubjects.length,
      lowConsistency,
      recommendations,
      engagement: {
        weeklyHours, consistency, totalQuizzes: allAttempts.length, peerCount: uniquePeerIds,
      },
    })
  } catch (error) {
    console.error('Subject insights error:', error)
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }
}
