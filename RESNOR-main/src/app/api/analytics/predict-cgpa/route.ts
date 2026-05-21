import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const studentId = 'stu_001'

    // Get quiz attempts for trend analysis
    const attempts = await db.quizAttempt.findMany({
      where: { studentId },
      orderBy: { completedAt: 'asc' },
    })

    // Get material progress
    const progress = await db.materialProgress.findMany({ where: { studentId } })
    const completionRate = progress.length > 0
      ? progress.filter(p => p.completionStatus === 'done').length / progress.length
      : 0

    // Get engagement
    const engagement = await db.engagementScore.findUnique({ where: { studentId } })

    // Calculate CGPA prediction using weighted trend
    const recentScores = attempts.slice(-5)
    const avgRecentScore = recentScores.length > 0
      ? recentScores.reduce((s, a) => s + a.score, 0) / recentScores.length
      : 0

    const consistencyRate = engagement?.studyConsistencyRate || 50
    const weeklyHours = engagement?.weeklyActiveHours || 5

    // DIU CGPA Scale: 80-100 = 4.0, 75-79 = 3.75, 70-74 = 3.5, etc.
    const predictedScore = avgRecentScore * 0.5 + completionRate * 100 * 0.3 + consistencyRate * 0.2
    let predictedCGPA = 2.0 + (predictedScore / 100) * 2.0
    predictedCGPA = Math.min(4.0, Math.max(2.0, predictedCGPA))

    // Add consistency bonus
    if (weeklyHours > 10) predictedCGPA += 0.1
    if (consistencyRate > 80) predictedCGPA += 0.05
    predictedCGPA = Math.min(4.0, predictedCGPA)

    // Confidence based on data points
    const confidence = Math.min(95, 40 + attempts.length * 8 + progress.length * 2)

    return NextResponse.json({
      predictedCGPA: Math.round(predictedCGPA * 100) / 100,
      confidence: Math.round(confidence),
      metrics: {
        quizAverage: avgRecentScore ? Math.round(avgRecentScore * 10) / 10 : 0,
        completionRate: Math.round(completionRate * 100),
        studyConsistency: consistencyRate,
        weeklyHours,
        interactionDensity: engagement?.interactionDensity || 0,
      },
      gradeBreakdown: [
        { subject: 'Data Structures', predicted: 3.5, trend: 'up' },
        { subject: 'Algorithms', predicted: 3.25, trend: 'stable' },
        { subject: 'Database Systems', predicted: 3.75, trend: 'up' },
        { subject: 'Software Engineering', predicted: 3.0, trend: 'down' },
        { subject: 'Operating Systems', predicted: 3.5, trend: 'stable' },
        { subject: 'Computer Networks', predicted: 3.25, trend: 'up' },
      ],
      studyTip: 'Focus on Software Engineering concepts — your quiz scores there have room for improvement. Increasing weekly study hours by 2-3 could boost your CGPA by approximately 0.15 points.',
    })
  } catch (error) {
    console.error('CGPA prediction error:', error)
    return NextResponse.json({ error: 'Failed to predict CGPA' }, { status: 500 })
  }
}
