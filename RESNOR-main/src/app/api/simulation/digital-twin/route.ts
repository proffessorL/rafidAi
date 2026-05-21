import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { weekly_hours, quiz_target, consistency, engagement, break_freq } = await request.json()

    const baselineCGPA = 3.2
    const weeks = 8

    // Simulation formula
    const computeWeekCGPA = (week: number) => {
      const rampFactor = 1 - Math.exp(-week * 0.3) // Sigmoid-like ramp-up
      const deltaCGPA =
        (weekly_hours / 40) * 0.5 * rampFactor +
        ((quiz_target - 60) / 100) * 0.3 * rampFactor +
        (consistency / 100) * 0.4 * rampFactor +
        (engagement / 100) * 0.2 * rampFactor -
        ((break_freq - 3) / 10) * 0.1

      return Math.min(4.0, Math.max(2.0, baselineCGPA + deltaCGPA))
    }

    const projectedTrajectory = []
    const baselineTrajectory = []

    for (let w = 0; w <= weeks; w++) {
      projectedTrajectory.push({
        week: w,
        cgpa: Math.round(computeWeekCGPA(w) * 100) / 100,
      })
      // Baseline: current trajectory without changes
      baselineTrajectory.push({
        week: w,
        cgpa: Math.round((baselineCGPA + w * 0.02) * 100) / 100,
      })
    }

    const finalCGPA = projectedTrajectory[weeks].cgpa
    const baselineFinal = baselineTrajectory[weeks].cgpa
    const improvement = Math.round((finalCGPA - baselineFinal) * 100) / 100

    return NextResponse.json({
      projectedTrajectory,
      baselineTrajectory,
      expectedFinalCGPA: finalCGPA,
      improvement,
      summary: improvement > 0
        ? `Your changes could improve your CGPA by ${improvement} points over ${weeks} weeks.`
        : `Consider adjusting your study habits — the current settings may not improve your trajectory.`,
    })
  } catch (error) {
    console.error('Digital twin error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}
