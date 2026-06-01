import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('student_id')
    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    const [attempts, progress, engagement, misconceptions, enrollments, wellbeing, recentMoods] = await Promise.all([
      db.quizAttempt.findMany({
        where: { studentId },
        orderBy: { completedAt: 'asc' },
      }),
      db.materialProgress.findMany({ where: { studentId } }),
      db.engagementScore.findUnique({ where: { studentId } }),
      db.misconceptionLog.findMany({
        where: { studentId, recoveryStatus: { not: 'MASTERED' } },
        orderBy: { frequencyCounter: 'desc' },
        take: 10,
      }),
      db.enrollment.findMany({
        where: { studentId },
        include: { course: true },
      }),
      db.wellbeingAnalytics.findUnique({ where: { studentId } }),
      db.moodEntry.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    const completionRate = progress.length > 0
      ? progress.filter(p => p.completionStatus === 'done').length / progress.length
      : 0

    const recentScores = attempts.slice(-5)
    const avgRecentScore = recentScores.length > 0
      ? recentScores.reduce((s, a) => s + a.score, 0) / recentScores.length
      : 0

    const quizCount = attempts.length
    const consistencyRate = engagement?.studyConsistencyRate || 50
    const weeklyHours = engagement?.weeklyActiveHours || 5
    const interactionDensity = engagement?.interactionDensity || 0

    const weakTopics = misconceptions.map(m => ({
      topic: m.conceptNodeId,
      frequency: m.frequencyCounter,
      mistakeType: m.mistakeType,
      description: m.patternDescription,
    }))

    const currentCourses = enrollments.map(e => ({
      name: e.course.name,
      code: e.course.code,
      attendance: e.attendance,
      marks: {
        assignment: e.assignmentMark,
        presentation: e.presentationMark,
        mid: e.midMark,
        final: e.finalMark,
      },
    }))

    const moodData = recentMoods.map(m => ({
      mood: m.mood,
      score: m.score,
    }))

    const userProfile = {
      quizAverage: Math.round(avgRecentScore),
      quizCount,
      studyHours: Math.round(weeklyHours * 4 * 4.5),
      consistencyRate: Math.round(consistencyRate),
      interactionDensity,
      completionRate: Math.round(completionRate * 100),
      weakTopics,
      currentCourses,
      wellbeing: wellbeing ? {
        stressScore: wellbeing.stressScore,
        burnoutRisk: wellbeing.burnoutRisk,
        lastMood: wellbeing.lastMood,
        studyBalance: wellbeing.studyBalance,
      } : null,
      recentMoods: moodData,
    }

    const snapshots = await db.semesterSnapshot.findMany({
      orderBy: [{ studentId: 'asc' }, { semester: 'asc' }],
    })

    const studentMap = new Map<string, typeof snapshots>()
    for (const s of snapshots) {
      if (!studentMap.has(s.studentId)) studentMap.set(s.studentId, [])
      studentMap.get(s.studentId)!.push(s)
    }

    const seniorProfiles = Array.from(studentMap.entries()).map(([sid, sems]) => ({
      studentId: sid,
      studentName: sems[0].studentName,
      semesterCount: sems.length,
      trajectory: sems.map(s => ({
        semester: s.semester,
        cgpa: s.cgpa,
        quizAverage: s.quizAverage,
        quizCount: s.quizCount,
        studyHours: s.studyHours,
        consistencyRate: s.consistencyRate,
        interactionDensity: s.interactionDensity,
        completionRate: s.completionRate,
        weakTopics: (() => { try { return s.weakTopics ? JSON.parse(s.weakTopics) : [] } catch { return [] } })(),
        courseCount: s.courseCount,
        attendanceAvg: s.attendanceAvg,
      })),
      startCGPA: sems[0].cgpa,
      endCGPA: sems[sems.length - 1].cgpa,
      improvement: sems[sems.length - 1].cgpa - sems[0].cgpa,
    }))

    const allScored = findSimilarLocal(userProfile, seniorProfiles, seniorProfiles.length)
    const topImproved = allScored.filter(s => s.improvement > 0).slice(0, 5)
    const stagnant = allScored.filter(s => s.improvement <= 0).slice(0, 1)

    function computeDeltas(traj: { quizAverage: number; consistencyRate: number; studyHours: number; completionRate: number; cgpa: number; weakTopics?: string[]; semester: number }[]) {
      if (traj.length < 2) return { quizDelta: 0, consistencyDelta: 0, hoursDelta: 0, completionDelta: 0 }
      const f = traj[0], l = traj[traj.length - 1]
      return {
        quizDelta: l.quizAverage - f.quizAverage,
        consistencyDelta: l.consistencyRate - f.consistencyRate,
        hoursDelta: l.studyHours - f.studyHours,
        completionDelta: l.completionRate - f.completionRate,
      }
    }

    function pick<T>(arr: T[], index: number) { return arr[index % arr.length] }

    function generateStudyPath(traj: { quizAverage: number; consistencyRate: number; studyHours: number; completionRate: number; cgpa: number; weakTopics?: string[]; semester: number }[], cautionary: boolean, styleIndex: number) {
      if (traj.length < 2) return ['Keep building consistent study habits']
      const f = traj[0], l = traj[traj.length - 1]
      const deltas = computeDeltas(traj)

      const semDeltas = traj.slice(1).map((t, i) => ({
        from: traj[i],
        to: t,
        cgpaDelta: t.cgpa - traj[i].cgpa,
        quizDelta: t.quizAverage - traj[i].quizAverage,
        hoursDelta: t.studyHours - traj[i].studyHours,
      }))
      const bestSem = semDeltas.reduce((a, b) => a.cgpaDelta > b.cgpaDelta ? a : b)
      const worstSem = semDeltas.reduce((a, b) => a.cgpaDelta < b.cgpaDelta ? a : b)

      const changes: { label: string; from: number; to: number; delta: number; unit: string }[] = [
        { label: 'quiz avg', from: f.quizAverage, to: l.quizAverage, delta: deltas.quizDelta, unit: '%' },
        { label: 'consistency', from: f.consistencyRate, to: l.consistencyRate, delta: deltas.consistencyDelta, unit: '%' },
        { label: 'study hours', from: f.studyHours, to: l.studyHours, delta: deltas.hoursDelta, unit: 'h' },
        { label: 'completion', from: f.completionRate, to: l.completionRate, delta: deltas.completionDelta, unit: '%' },
      ]
      const absSorted = [...changes].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      const topChange = absSorted[0]
      const secondChange = absSorted[1]
      const steadyClimb = semDeltas.every(d => d.cgpaDelta >= 0)
      const lateSurge = semDeltas.slice(-2).some(d => d.cgpaDelta > 0.2)
      const hasWeakTopics = traj[0]?.weakTopics && traj[0].weakTopics.length > 0

      const m1SemIdx = semDeltas.findIndex(d =>
        (topChange.label === 'quiz avg' && Math.abs(d.quizDelta) > Math.abs(topChange.delta) * 0.5) ||
        (topChange.label === 'study hours' && Math.abs(d.hoursDelta) > Math.abs(topChange.delta) * 0.5)
      )
      const m1Sem = m1SemIdx >= 0 ? semDeltas[m1SemIdx] : null

      if (cautionary) {
        const worsen = [...changes].filter(c => c.delta < 0).sort((a, b) => a.delta - b.delta)
        const worstTwo = worsen.slice(0, 2)

        const m1Opts = [
          () => worstTwo.length > 0
            ? `${worstTwo[0].label} dropped from ${worstTwo[0].from}${worstTwo[0].unit} in sem ${f.semester} to ${worstTwo[0].to}${worstTwo[0].unit} — a ${Math.abs(worstTwo[0].delta)}${worstTwo[0].unit} decline that kept compounding because they never fixed the root cause`
            : `CGPA dropped from ${f.cgpa.toFixed(1)} to ${l.cgpa.toFixed(1)} — once the downward trend started, it became the new normal`,
          () => worstTwo.length > 0
            ? `First sign of trouble: ${worstTwo[0].label} went from ${worstTwo[0].from}${worstTwo[0].unit} down to ${worstTwo[0].to}${worstTwo[0].unit}. That ${Math.abs(worstTwo[0].delta)}${worstTwo[0].unit} gap never closed`
            : `CGPA started at ${f.cgpa.toFixed(1)} and ended at ${l.cgpa.toFixed(1)} — the early declines were dismissed as bad terms, but each one made the next harder`,
          () => worstTwo.length > 0
            ? `They lost ${Math.abs(worstTwo[0].delta)}${worstTwo[0].unit} in ${worstTwo[0].label} between sem ${f.semester} and ${l.semester}. Small slips early on became big gaps later`
            : `The decline started between sem ${f.semester} and ${f.semester + 1}. A small dip they ignored turned into a pattern`,
        ]

        const m2Opts = [
          () => worstTwo.length > 1
            ? `${worstTwo[1].label} fell from ${worstTwo[1].from}${worstTwo[1].unit} to ${worstTwo[1].to}${worstTwo[1].unit} over the same period — when multiple metrics slip together, it signals a breakdown in routine rather than a one-time issue`
            : `${traj[0]?.weakTopics?.slice(0, 2).join(' and ') || 'Key weak topics'} were never revisited — each semester's new material built on shaky foundations, making later courses feel impossible`,
          () => worstTwo.length > 1
            ? `${worstTwo[1].label} went the same direction: ${worstTwo[1].from}${worstTwo[1].unit} → ${worstTwo[1].to}${worstTwo[1].unit}. A single metric slipping could be bad luck, but two means the system is broken`
            : `The weak spots (${traj[0]?.weakTopics?.slice(0, 2).join(', ') || 'core concepts'}) were never addressed. Each term stacked new material on top of old gaps`,
          () => worstTwo.length > 1
            ? `${worstTwo[1].label} didn't recover either — it dropped from ${worstTwo[1].from}${worstTwo[1].unit} to ${worstTwo[1].to}${worstTwo[1].unit}. Multiple declines mean study habits, not bad luck`
            : `${traj[0]?.weakTopics?.slice(0, 1).join('') || 'Old weak topics'} carried over into the next semester unresolved — ignoring gaps doesn't make them disappear`,
        ]

        const m3Opts = [
          () => deltas.consistencyDelta < -5
            ? `Consistency dropped from ${f.consistencyRate}% to ${l.consistencyRate}% — studying became irregular and reactive (cramming before exams) instead of preventive and steady. After just a few weeks of inconsistency, CGPA started slipping`
            : `Study hours shrank from ${f.studyHours}h to ${l.studyHours}h (lost ${Math.abs(Math.round(deltas.hoursDelta))}h per term) — when weekly study time drops below a threshold, it is nearly impossible to keep up with course pacing`,
          () => deltas.consistencyDelta < -5
            ? `${f.consistencyRate}% → ${l.consistencyRate}% in consistency. They studied when they had to, not when they planned to. That reactive mode works for a term, then backfires`
            : `Study hours went from ${f.studyHours}h down to ${l.studyHours}h. Less time in = less knowledge out. Each term covered less material`,
          () => deltas.consistencyDelta < -5
            ? `Consistency fell off a cliff: ${f.consistencyRate}% → ${l.consistencyRate}%. Without a steady routine, they ended up cramming right before exams`
            : `They lost ${Math.abs(Math.round(deltas.hoursDelta))} study hours per term. When your weekly input drops, your output follows`,
        ]

        const cgpaDeclinedMost = semDeltas.filter(d => d.cgpaDelta < 0).length >= semDeltas.length / 2
        const m4Opts = [
          () => cgpaDeclinedMost
            ? `CGPA fell in ${semDeltas.filter(d => d.cgpaDelta < 0).length} out of ${semDeltas.length} semester transitions — this was not a single bad exam but a pattern of disengagement. Each decline made catching up harder for the next term`
            : `The steepest drop was in sem ${worstSem.from.semester}→${worstSem.to.semester} (${worstSem.cgpaDelta.toFixed(2)}) when quiz avg dipped ${Math.abs(Math.round(worstSem.quizDelta))}% and study hours fell by ${Math.abs(Math.round(worstSem.hoursDelta))}h — a bad term is survivable, but ignoring why it happened guarantees a repeat`,
          () => cgpaDeclinedMost
            ? `${semDeltas.filter(d => d.cgpaDelta < 0).length} of ${semDeltas.length} terms had CGPA drops. This wasn't one bad exam or one tough course — it was the system breaking down`
            : `The worst term was sem ${worstSem.from.semester}→${worstSem.to.semester} (${worstSem.cgpaDelta.toFixed(2)}). Quiz scores dropped ${Math.abs(Math.round(worstSem.quizDelta))}% and study hours fell ${Math.abs(Math.round(worstSem.hoursDelta))}h. One bad term is not the end, but repeating the same mistakes is`,
          () => cgpaDeclinedMost
            ? `CGPA trended down in ${semDeltas.filter(d => d.cgpaDelta < 0).length}/${semDeltas.length} semesters. The pattern is clear: each decline reduced their ability to bounce back the next term`
            : `Sem ${worstSem.from.semester}→${worstSem.to.semester} was the low point (${worstSem.cgpaDelta.toFixed(2)}). A single bad term can be overcome, but only if you change what caused it`,
        ]

        return [
          pick(m1Opts, styleIndex)(),
          pick(m2Opts, styleIndex + 1)(),
          pick(m3Opts, styleIndex + 2)(),
          pick(m4Opts, styleIndex + 3)(),
        ]
      }

      const m1Opts = [
        () => m1Sem
          ? `Between sem ${m1Sem.from.semester} and ${m1Sem.to.semester}, their ${topChange.label} jumped from ${topChange.from}${topChange.unit} to ${topChange.to}${topChange.unit} — a ${Math.abs(Math.round(topChange.delta))}${topChange.unit} shift that pulled their CGPA up by ${m1Sem.cgpaDelta.toFixed(2)}. Add one focused ${topChange.label.includes('quiz') ? 'quiz session' : 'study block'} on your weakest day each week to copy this`
          : `Their ${topChange.label} went from ${topChange.from}${topChange.unit} to ${topChange.to}${topChange.unit} (${topChange.delta >= 0 ? '+' : ''}${Math.round(topChange.delta)}${topChange.unit}) over ${traj.length} semesters. The turning point? They started tracking progress daily — what gets measured gets improved`,
        () => m1Sem
          ? `Their biggest win: ${topChange.label} climbed ${Math.abs(Math.round(topChange.delta))}${topChange.unit} from sem ${m1Sem.from.semester} to ${m1Sem.to.semester}. That single change added ${m1Sem.cgpaDelta.toFixed(2)} to their CGPA. Focus on your ${topChange.label} first`
          : `${topChange.label} improved by ${topChange.delta >= 0 ? '+' : ''}${Math.round(topChange.delta)}${topChange.unit} (${topChange.from}${topChange.unit} → ${topChange.to}${topChange.unit}). This was their main driver. Start tracking yours to see similar movement`,
        () => m1Sem
          ? `What moved the needle most? ${topChange.label}. It went ${topChange.from}${topChange.unit} → ${topChange.to}${topChange.unit} between sem ${m1Sem.from.semester} and ${m1Sem.to.semester}, lifting CGPA by ${m1Sem.cgpaDelta.toFixed(2)}. Pick your weakest ${topChange.label.includes('quiz') ? 'subject' : 'metric'} and do the same`
          : `${topChange.label}: ${topChange.from}${topChange.unit} → ${topChange.to}${topChange.unit} (${topChange.delta >= 0 ? '+' : ''}${Math.round(topChange.delta)}${topChange.unit}). Every other metric improved because this one got attention first`,
        () => m1Sem
          ? `They added ${Math.abs(Math.round(topChange.delta))}${topChange.unit} to their ${topChange.label} between sem ${m1Sem.from.semester} and ${m1Sem.to.semester} — and their CGPA responded with a ${m1Sem.cgpaDelta.toFixed(2)} boost. That's the leverage point you should attack first`
          : `Over ${traj.length} semesters, ${topChange.label} moved from ${topChange.from}${topChange.unit} to ${topChange.to}${topChange.unit}. This was the foundation everything else built on`,
      ]

      const m2Opts = [
        () => semDeltas.length > 1
          ? `In sem ${bestSem.from.semester}→${bestSem.to.semester}, they gained ${bestSem.cgpaDelta.toFixed(2)} CGPA points — their best single-term improvement. This coincided with ${bestSem.quizDelta > 5 ? `quiz scores rising ${Math.round(bestSem.quizDelta)}%` : `study hours increasing by ${Math.round(bestSem.hoursDelta)}h`}. Protect ${Math.round(bestSem.hoursDelta > 0 ? bestSem.hoursDelta : 4)} focused hours daily using the Pomodoro Timer`
          : `${secondChange.label} improved from ${secondChange.from}${secondChange.unit} to ${secondChange.to}${secondChange.unit} (${secondChange.delta >= 0 ? '+' : ''}${secondChange.delta}${secondChange.unit}) — small daily shifts add up by the end of term`,
        () => semDeltas.length > 1
          ? `Sem ${bestSem.from.semester}→${bestSem.to.semester} was their standout term: +${bestSem.cgpaDelta.toFixed(2)} CGPA. What changed? ${bestSem.quizDelta > 5 ? `Quiz scores went up ${Math.round(bestSem.quizDelta)}%` : `Study hours went up by ${Math.round(bestSem.hoursDelta)}h`}. Double down on what worked that term`
          : `${secondChange.label} moved ${secondChange.from}${secondChange.unit} → ${secondChange.to}${secondChange.unit} (${secondChange.delta >= 0 ? '+' : ''}${secondChange.delta}${secondChange.unit}) — small, consistent effort compounds`,
        () => semDeltas.length > 1
          ? `Their breakthrough: sem ${bestSem.from.semester}→${bestSem.to.semester} (+${bestSem.cgpaDelta.toFixed(2)}). The trigger was ${bestSem.quizDelta > 5 ? 'quiz scores jumping' : 'study hours climbing'} by ${Math.round(Math.max(bestSem.quizDelta, bestSem.hoursDelta))}. Find your trigger and pull it`
          : `${secondChange.label}: ${secondChange.from}${secondChange.unit} → ${secondChange.to}${secondChange.unit}. These incremental gains are what separate a good trajectory from a great one`,
        () => semDeltas.length > 1
          ? `The term that made the biggest difference: sem ${bestSem.from.semester}→${bestSem.to.semester} (+${bestSem.cgpaDelta.toFixed(2)}). ${bestSem.quizDelta > 5 ? 'Quiz performance improved' : 'Study time increased'} by ${Math.round(Math.max(bestSem.quizDelta, bestSem.hoursDelta))} — identify your highest-leverage habit and do the same`
          : `Progress on ${secondChange.label} (${secondChange.from}${secondChange.unit} → ${secondChange.to}${secondChange.unit}) shows that small steps, repeated daily, produce real movement by exam time`,
      ]

      const m3Opts = [
        () => hasWeakTopics
          ? `Weak areas like ${traj[0].weakTopics!.slice(0, 2).join(' and ')} showed up early in sem ${f.semester} but were systematically closed using the AI Tutor — by sem ${l.semester}, those topics no longer appeared in their misconception logs. The key was addressing them before the next course built on them`
          : `Completion rate climbed from ${f.completionRate}% to ${l.completionRate}% (${deltas.completionDelta >= 0 ? '+' : ''}${Math.round(deltas.completionDelta)}%) — they stopped jumping between materials and started finishing what they started. Block completion time for each module before moving to the next`,
        () => hasWeakTopics
          ? `${traj[0].weakTopics!.slice(0, 2).join(' and ')} were flagged early. Instead of ignoring them, they used targeted practice to close those gaps. By sem ${l.semester}, those topics stopped holding them back`
          : `They went from finishing ${f.completionRate}% of materials to ${l.completionRate}% (${deltas.completionDelta >= 0 ? '+' : ''}${Math.round(deltas.completionDelta)}%). Finishing what you start is a superpower — most students jump between too many things`,
        () => hasWeakTopics
          ? `The weak topics (${traj[0].weakTopics!.slice(0, 2).join(', ')}) were dealt with early, not ignored. By the final semester, they no longer showed up as problem areas — that's the payoff of facing your gaps head-on`
          : `Completion rate improved from ${f.completionRate}% to ${l.completionRate}%. The discipline of finishing one module before starting the next made them more prepared for each exam`,
        () => hasWeakTopics
          ? `Instead of letting ${traj[0].weakTopics!.slice(0, 2).join(' and ')} slide, they addressed them early. By sem ${l.semester} these were no longer weak spots — early intervention prevented them from becoming bigger problems`
          : `${f.completionRate}% → ${l.completionRate}% on completion. They stopped being a starter and became a finisher. Each completed module built confidence for the next`,
      ]

      const m4Opts = [
        () => steadyClimb
          ? `CGPA rose every single semester from ${f.cgpa.toFixed(1)} to ${l.cgpa.toFixed(1)} without a single dip — this is rare. It means they built a sustainable routine that worked even during tough courses. The key was never skipping more than one study session in a row`
          : lateSurge
            ? `The biggest CGPA jump came in sem ${bestSem.from.semester}→${bestSem.to.semester} (+${bestSem.cgpaDelta.toFixed(2)}), transforming their trajectory from ${f.cgpa.toFixed(1)} to ${l.cgpa.toFixed(1)}. One focused change — ${bestSem.quizDelta > 5 ? 'more quiz practice' : 'better study consistency'} — shifted everything`
            : `CGPA moved from ${f.cgpa.toFixed(1)} to ${l.cgpa.toFixed(1)} over ${traj.length} semesters, with the strongest stretch in sem ${bestSem.from.semester}→${bestSem.to.semester} (+${bestSem.cgpaDelta.toFixed(2)}). Focusing on one metric at a time (starting with ${absSorted[0].label}) created ripple effects across everything else`,
        () => steadyClimb
          ? `Start: ${f.cgpa.toFixed(1)}. End: ${l.cgpa.toFixed(1)}. Every single term improved — no dips, no setbacks. That kind of consistency comes from having a system, not just motivation`
          : lateSurge
            ? `Their trajectory had a clear turning point: sem ${bestSem.from.semester}→${bestSem.to.semester} (+${bestSem.cgpaDelta.toFixed(2)}). Before that? ${f.cgpa.toFixed(1)}. After? ${l.cgpa.toFixed(1)}. Find your turning point`
            : `${f.cgpa.toFixed(1)} → ${l.cgpa.toFixed(1)} over ${traj.length} terms. The best run was sem ${bestSem.from.semester}→${bestSem.to.semester} (${bestSem.cgpaDelta.toFixed(2)}). Not every term was perfect, but the trend was up`,
        () => steadyClimb
          ? `CGPA trajectory: ${f.cgpa.toFixed(1)} → up every term → ${l.cgpa.toFixed(1)}. No single magic trick — just a routine that stuck even when courses got harder`
          : lateSurge
            ? `From ${f.cgpa.toFixed(1)} to ${l.cgpa.toFixed(1)}, with the inflection point at sem ${bestSem.from.semester}→${bestSem.to.semester} (+${bestSem.cgpaDelta.toFixed(2)}). Before the surge, things looked average. After? A completely different trajectory`
            : `The CGPA path: ${f.cgpa.toFixed(1)} → ${l.cgpa.toFixed(1)} over ${traj.length} terms. Best stretch: sem ${bestSem.from.semester}→${bestSem.to.semester} (${bestSem.cgpaDelta.toFixed(2)}). The lesson: start with ${absSorted[0].label}, the rest will follow`,
        () => steadyClimb
          ? `Not a single CGPA dip from ${f.cgpa.toFixed(1)} to ${l.cgpa.toFixed(1)} across ${traj.length} semesters. This wasn't luck — it was a repeatable system that worked regardless of course difficulty`
          : lateSurge
            ? `${f.cgpa.toFixed(1)} → ${l.cgpa.toFixed(1)}. The jump in sem ${bestSem.from.semester}→${bestSem.to.semester} (${bestSem.cgpaDelta.toFixed(2)}) changed everything. One well-executed term can rewrite your entire academic story`
            : `From ${f.cgpa.toFixed(1)} to ${l.cgpa.toFixed(1)}. Not every semester was a win, but the best stretch (sem ${bestSem.from.semester}→${bestSem.to.semester}, +${bestSem.cgpaDelta.toFixed(2)}) shows what's possible when things click`,
      ]

      return [
        pick(m1Opts, styleIndex)(),
        pick(m2Opts, styleIndex + 1)(),
        pick(m3Opts, styleIndex + 2)(),
        pick(m4Opts, styleIndex + 3)(),
      ]
    }

    const buildMatch = (m: typeof allScored[0], cautionary = false) => ({
      studentName: m.studentName,
      startCGPA: m.startCGPA,
      endCGPA: m.endCGPA,
      improvement: m.improvement,
      semesterCount: m.semesterCount,
      trajectory: m.trajectory,
      cautionary,
      similarityReasons: [
        `Quiz average: ${m.profile.quizAverage}% vs your ${userProfile.quizAverage}%`,
        `Study hours: ${m.profile.studyHours}h vs your ${userProfile.studyHours}h`,
        `Consistency: ${m.profile.consistencyRate}% vs your ${userProfile.consistencyRate}%`,
        `Weak topics overlap: ${m.trajectory[0]?.weakTopics?.slice(0, 3).join(', ') || 'similar areas'}`,
      ],
      predictedRange: { min: Math.max(2.0, Math.min(m.startCGPA, m.endCGPA) - 0.2), max: Math.min(4.0, Math.max(m.startCGPA, m.endCGPA) + 0.1) },
      studyPath: generateStudyPath(m.trajectory, cautionary, Math.round(m.score * 100) + (cautionary ? 100 : 0)),
    })

    const fallbackMatches = [
      ...topImproved.map(m => buildMatch(m, false)),
      ...stagnant.map(m => buildMatch(m, true)),
    ]

    if (!groq.apiKey) {
      return NextResponse.json({
        userProfile,
        matches: fallbackMatches,
        totalSeniors: seniorProfiles.length,
      })
    }

    const weakTopicsStr = userProfile.weakTopics.length > 0
      ? userProfile.weakTopics.map(w => `  - ${w.topic} (appeared ${w.frequency} times, type: ${w.mistakeType})`).join('\n')
      : '  - No specific weak topics logged yet'

    const coursesStr = userProfile.currentCourses.length > 0
      ? userProfile.currentCourses.map(c =>
          `  - ${c.code} ${c.name} | Attendance: ${c.attendance}% | Mid: ${c.marks.mid ?? 'N/A'} | Assignment: ${c.marks.assignment ?? 'N/A'}`
        ).join('\n')
      : '  - No course enrollments found'

    const wellbeingStr = userProfile.wellbeing
      ? `  - Stress Score: ${userProfile.wellbeing.stressScore}/100 | Burnout Risk: ${userProfile.wellbeing.burnoutRisk}% | Study Balance: ${userProfile.wellbeing.studyBalance}/100`
      : '  - No wellbeing data available'

    const moodStr = userProfile.recentMoods.length > 0
      ? userProfile.recentMoods.map(m => `  - ${m.mood} (${m.score}/10)`).join('\n')
      : '  - No mood data available'

    const topCandidatesForLLM = findSimilarLocal(userProfile, seniorProfiles, 10)

    const prompt = `You are an academic advisor AI for a learning platform. The platform has these features students can use: Quiz Generator (create topic-specific quizzes), AI Tutor (chat about concepts), Study Planner (schedule sessions), Pomodoro Timer (focus blocks), Study Notes, CGPA Predictor, Engagement Tracker, Wellbeing Support, and Discussion Forum.

A student wants to compare themselves with senior peers who had similar profiles.

CURRENT STUDENT'S PROFILE:
- Quiz Average (last 5 quizzes): ${userProfile.quizAverage}%
- Total Quizzes Taken: ${userProfile.quizCount}
- Estimated Total Study Hours: ${userProfile.studyHours}h
- Study Consistency: ${userProfile.consistencyRate}%
- Material Completion Rate: ${userProfile.completionRate}%

WEAK TOPICS (concepts they struggle with):
${weakTopicsStr}

CURRENT COURSES:
${coursesStr}

WELLBEING STATUS:
${wellbeingStr}

RECENT MOODS:
${moodStr}

Below are the ${topCandidatesForLLM.length} most similar senior students (ranked by similarity):

${topCandidatesForLLM.map(p => `
--- ${p.studentName} (${p.semesterCount} semesters, similarity score: ${p.score.toFixed(1)}) ---
Start CGPA: ${p.startCGPA} | End CGPA: ${p.endCGPA}
Improvement: ${p.improvement >= 0 ? '+' : ''}${p.improvement.toFixed(2)}
Trajectory:
${p.trajectory.map(t => `  Sem ${t.semester}: CGPA ${t.cgpa} | QuizAvg ${t.quizAverage}% | Study ${t.studyHours}h | Consistency ${t.consistencyRate}% | Completion ${t.completionRate}% | Weak topics: ${t.weakTopics?.join(', ') || 'N/A'}`).join('\n')}
`).join('\n')}

CRITICAL RULE: Each matched senior's studyPath MUST be DIFFERENT and based on THEIR UNIQUE trajectory deltas. Never reuse the same template across peers. The studyPath for each match must focus on the METRIC THAT CHANGED THE MOST in that peer's data (e.g., if Peer A's quiz avg jumped the most, focus on quizzes; if Peer B's consistency improved most, focus on scheduling).

YOUR ANALYSIS PROCESS (follow this exactly for each matched senior):
1. Compare each semester to the previous one — compute the delta changes in quiz avg, study hours, consistency, completion rate.
2. Identify which SINGLE metric changed the MOST between their first and last semester — that is their primary driver.
3. Cross-reference their weak topics with the current student's weak topics.
4. Map those changes to concrete actions using the platform features.
5. Only recommend what the peer's actual data supports — do NOT make up generic advice.

TASK:
You need to analyze TWO groups of seniors:

GROUP 1 — IMPROVERS (top 5): Find the 5 seniors whose EARLY semesters most closely match this student but who SHOWED POSITIVE IMPROVEMENT. For each:
  a) Explain WHY they are similar — cite exact numbers.
  b) Show their full trajectory.
  c) Generate a STUDY PATH of 4 milestones based on what actually changed in their data. Each peer's path MUST focus on their unique biggest-improvement metric.
  d) Give a predicted CGPA RANGE.

GROUP 2 — CAUTIONARY (1 senior): Find 1 senior whose EARLY semesters closely match this student but who DECLINED or STAGNATED (negative or very flat improvement). For this one:
  a) Explain why they are similar and what went wrong.
  b) Show their full trajectory.
  c) Instead of a study path, provide 4 WARNING milestones showing how their decline unfolded, with specific semester transitions and the exact metrics that dropped.

For Group 1, set "cautionary": false. For Group 2, set "cautionary": true.

Return ONLY valid JSON. No other text:
{
  "matches": [
    {
      "studentName": "string",
      "startCGPA": number,
      "endCGPA": number,
      "improvement": number,
      "semesterCount": number,
      "cautionary": boolean,
      "trajectory": [{ "semester": number, "cgpa": number, "quizAverage": number, "studyHours": number, "consistencyRate": number, "completionRate": number }],
      "similarityReasons": ["string - cite exact numbers when comparing"],
      "predictedRange": { "min": number, "max": number },
      "studyPath": [
        "string - A specific, data-backed milestone. Example: 'Between sem 2 and 3, their quiz avg jumped from 55% to 72% — a 17% shift that pulled their CGPA up by 0.3. To replicate this, add one extra quiz session on your weakest day each week.'",
        "string - milestone 2 citing specific delta from their trajectory",
        "string - milestone 3 citing weak topics or completion changes",
        "string - milestone 4 about the overall CGPA trajectory pattern with a takeaway"
      ]
    }
  ]
}`

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an academic data analyst. Compare semester trajectories, compute exact deltas between semesters, and generate precise study recommendations based ONLY on what the data shows. Always respond with valid JSON only. Never give generic advice.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 6000,
      })

      const content = completion.choices[0]?.message?.content || '{}'
      const cleaned = content.replace(/```json\s*/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      const llmMatches = (parsed.matches || []).slice(0, 6)

      const hasCautionary = llmMatches.some(m => m.cautionary)
      const result = hasCautionary ? llmMatches : [...llmMatches, ...stagnant.map(m => buildMatch(m, true))]

      return NextResponse.json({
        userProfile,
        matches: result,
        totalSeniors: seniorProfiles.length,
      })
    } catch (llmError) {
      console.warn('LLM call failed, using local fallback:', llmError)
      return NextResponse.json({
        userProfile,
        matches: fallbackMatches,
        totalSeniors: seniorProfiles.length,
      })
    }
  } catch (error) {
    console.error('Peer comparison error:', error)
    return NextResponse.json({ error: 'Failed to load peer comparison' }, { status: 500 })
  }
}

function findSimilarLocal(
  user: { quizAverage: number; studyHours: number; consistencyRate: number },
  seniors: { weakTopics?: string[]; studentId: string; studentName: string; semesterCount: number; trajectory: { semester: number; cgpa: number; quizAverage: number; studyHours: number; consistencyRate: number; completionRate: number; weakTopics?: string[] }[]; startCGPA: number; endCGPA: number; improvement: number }[],
  count: number
) {
  const scored = seniors.map(s => {
    const first = s.trajectory[0]
    const diff = Math.abs(first.quizAverage - user.quizAverage) * 0.5
      + Math.abs(first.studyHours - user.studyHours) * 0.005
      + Math.abs(first.consistencyRate - user.consistencyRate) * 0.3
    return { ...s, score: diff, profile: { quizAverage: first.quizAverage, studyHours: first.studyHours, consistencyRate: first.consistencyRate } }
  })
  return scored.sort((a, b) => a.score - b.score).slice(0, count)
}
