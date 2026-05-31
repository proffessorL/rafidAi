import { db } from '@/lib/db'

export type Fingerprint = {
  avgHoursPerDay: number
  avgMood: number
  lowMoodRatio: number
  lateNightRatio: number
  quizScoreTrend: number
}

export type Neighbor = {
  rating: number
  stressRating: number
  fingerprint: Fingerprint
  distance: number
  date: Date
}

export type Prediction = {
  message: string
  stressMessage: string
  nearestBurnout: Neighbor | null
  nearestFine: Neighbor | null
  nearestStressed: Neighbor | null
  nearestCalm: Neighbor | null
  burnoutNeighbors: number
  fineNeighbors: number
  stressedNeighbors: number
  calmNeighbors: number
  totalNeighbors: number
}

function toVector(f: Fingerprint): number[] {
  return [
    f.avgHoursPerDay / 12,
    f.avgMood / 10,
    f.lowMoodRatio,
    f.lateNightRatio,
    f.quizScoreTrend,
  ]
}

function distance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, _, i) => sum + (a[i] - b[i]) ** 2, 0))
}

export async function captureDailyFingerprint(studentId: string): Promise<Fingerprint> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [telemetry, moods, sessions, quizzes] = await Promise.all([
    db.telemetryRecord.findMany({ where: { studentId, createdAt: { gte: dayAgo } } }),
    db.moodEntry.findMany({ where: { studentId, createdAt: { gte: dayAgo } }, orderBy: { createdAt: 'desc' }, take: 3 }),
    db.focusSession.findMany({ where: { studentId, startedAt: { gte: dayAgo } }, orderBy: { startedAt: 'desc' }, take: 10 }),
    db.quizAttempt.findMany({ where: { studentId, completedAt: { gte: dayAgo } }, orderBy: { completedAt: 'desc' }, take: 5 }),
  ])

  const avgHoursPerDay = telemetry.reduce((s, r) => s + r.activeSeconds, 0) / 3600
  const avgMood = moods.length ? moods.reduce((s, m) => s + m.score, 0) / moods.length : 5
  const lowMoodRatio = moods.length ? moods.filter((m) => m.score <= 4).length / moods.length : 0
  const lateNightRatio = sessions.length
    ? sessions.filter((s) => new Date(s.startedAt).getHours() < 6).length / sessions.length
    : 0

  let quizScoreTrend = 0.5
  if (quizzes.length >= 2) {
    const mid = Math.ceil(quizzes.length / 2)
    const first = quizzes.slice(0, mid).reduce((s, q) => s + q.score, 0) / mid
    const last = quizzes.slice(-mid).reduce((s, q) => s + q.score, 0) / mid
    if (last < first * 0.9) quizScoreTrend = 1
    else if (last > first * 1.1) quizScoreTrend = 0
  }

  return { avgHoursPerDay, avgMood, lowMoodRatio, lateNightRatio, quizScoreTrend }
}

export async function storeCheckIn(studentId: string, rating: number, stressRating: number): Promise<Fingerprint> {
  const fingerprint = await captureDailyFingerprint(studentId)
  await db.burnoutCheckIn.create({
    data: { studentId, rating, stressRating, fingerprint: JSON.stringify(fingerprint) },
  })
  return fingerprint
}

async function getAverageFingerprint(studentId: string): Promise<Fingerprint | null> {
  const today = await captureDailyFingerprint(studentId)

  const recent = await db.burnoutCheckIn.findMany({
    where: { studentId, fingerprint: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 2,
  })

  const all = [today, ...recent.map((r) => JSON.parse(r.fingerprint!) as Fingerprint)]

  return {
    avgHoursPerDay: all.reduce((s, f) => s + f.avgHoursPerDay, 0) / all.length,
    avgMood: all.reduce((s, f) => s + f.avgMood, 0) / all.length,
    lowMoodRatio: all.reduce((s, f) => s + f.lowMoodRatio, 0) / all.length,
    lateNightRatio: all.reduce((s, f) => s + f.lateNightRatio, 0) / all.length,
    quizScoreTrend: all.reduce((s, f) => s + f.quizScoreTrend, 0) / all.length,
  }
}

export async function predict(studentId: string): Promise<Prediction> {
  const current = await getAverageFingerprint(studentId)
  if (!current) {
    return {
      message: 'Not enough data yet. Keep checking in!',
      stressMessage: '',
      nearestBurnout: null, nearestFine: null,
      nearestStressed: null, nearestCalm: null,
      burnoutNeighbors: 0, fineNeighbors: 0,
      stressedNeighbors: 0, calmNeighbors: 0,
      totalNeighbors: 0,
    }
  }
  const currentVec = toVector(current)

  const past = await db.burnoutCheckIn.findMany({
    where: { studentId, fingerprint: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  if (past.length < 3) {
    return {
      message: `Only ${past.length} check-ins so far. Keep checking in — each one makes the prediction smarter.`,
      stressMessage: '',
      nearestBurnout: null, nearestFine: null,
      nearestStressed: null, nearestCalm: null,
      burnoutNeighbors: 0, fineNeighbors: 0,
      stressedNeighbors: 0, calmNeighbors: 0,
      totalNeighbors: 0,
    }
  }

  const neighbors: Neighbor[] = past.map((c) => {
    const fp: Fingerprint = JSON.parse(c.fingerprint!)
    return {
      rating: c.rating,
      stressRating: c.stressRating || 3,
      fingerprint: fp,
      distance: distance(currentVec, toVector(fp)),
      date: c.createdAt,
    }
  }).sort((a, b) => a.distance - b.distance)

  const k = Math.min(7, Math.max(3, Math.floor(past.length / 4)))
  const closest = neighbors.slice(0, k)

  // Burnout KNN (using rating)
  const burnoutOnes = closest.filter((n) => n.rating >= 4)
  const fineOnes = closest.filter((n) => n.rating <= 2)
  const nearestBurnout = neighbors.find((n) => n.rating >= 4) || null
  const nearestFine = neighbors.find((n) => n.rating <= 2) || null

  let message: string
  const burnoutRatio = burnoutOnes.length / k
  if (burnoutRatio >= 0.5) {
    message = 'Experiencing burnout'
  } else if (burnoutRatio >= 0.25) {
    message = 'Early signs of burnout'
  } else {
    message = 'Not burnt out'
  }

  // Stress KNN (using stressRating)
  const stressedOnes = closest.filter((n) => n.stressRating >= 4)
  const calmOnes = closest.filter((n) => n.stressRating <= 2)
  const nearestStressed = neighbors.find((n) => n.stressRating >= 4) || null
  const nearestCalm = neighbors.find((n) => n.stressRating <= 2) || null

  let stressMessage: string
  const stressRatio = stressedOnes.length / k
  if (stressRatio >= 0.5) {
    stressMessage = 'High stress detected'
  } else if (stressRatio >= 0.25) {
    stressMessage = 'Mild stress detected'
  } else {
    stressMessage = 'You seem calm'
  }

  return {
    message,
    stressMessage,
    nearestBurnout,
    nearestFine,
    nearestStressed,
    nearestCalm,
    burnoutNeighbors: burnoutOnes.length,
    fineNeighbors: fineOnes.length,
    stressedNeighbors: stressedOnes.length,
    calmNeighbors: calmOnes.length,
    totalNeighbors: k,
  }
}
