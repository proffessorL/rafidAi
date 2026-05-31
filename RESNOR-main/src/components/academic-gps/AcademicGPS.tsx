'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Clock, Target, BookOpen, BrainCircuit,
  AlertTriangle, Sparkles, ArrowRight, Users,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

type SubjectMarks = { assignment: number | null; presentation: number | null; mid: number | null; final: number | null }

type Subject = {
  courseId: string; courseName: string; courseCode: string
  marks: SubjectMarks
  quizAvg: number; quizCount: number; recentQuizScore: number | null
  weakTopics: string[]
  readiness: number; hasMarks: boolean
  grade: string | null; gradePoint: number | null
  finalNeeded: number | null; finalTarget: string | null
  vsPeerQuiz: number | null; peerQuizAvg: number | null
  trend: 'up' | 'down' | 'stable'
  priority: number
  attendance: number
}

type Data = {
  subjects: Subject[]
  focus: { subject: string; reason: string; priority: number } | null
  weakQuizSubjects: number
  lowConsistency: boolean
  recommendations: { icon: string; text: string }[]
  engagement: { weeklyHours: number; consistency: number; totalQuizzes: number; peerCount: number }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function readinessColor(v: number): string {
  if (v >= 75) return '#10b981'
  if (v >= 55) return '#3b82f6'
  if (v >= 40) return '#f59e0b'
  return '#ef4444'
}

function readinessLabel(v: number): string {
  if (v >= 75) return 'On Track'
  if (v >= 55) return 'Fair'
  if (v >= 40) return 'Needs Work'
  return 'Critical'
}

function ringDash(percent: number): { dash: string; color: string } {
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = `${(percent / 100) * circ} ${circ}`
  const color = readinessColor(percent)
  return { dash, color }
}

// ── Ring Component ──────────────────────────────────────────────────────────

function ReadinessRing({ value, size = 100 }: { value: number; size?: number }) {
  const r = 40
  const stroke = 8
  const viewBox = 100
  const { dash, color } = ringDash(value)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`} className="shrink-0">
      <circle cx={viewBox / 2} cy={viewBox / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke}
        className="text-muted/20" />
      <circle cx={viewBox / 2} cy={viewBox / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={dash} transform={`rotate(-90 ${viewBox / 2} ${viewBox / 2})`}
        className="transition-all duration-700" />
      <text x={viewBox / 2} y={viewBox / 2 - 4} textAnchor="middle" fontSize="18" fontWeight="800" fill="currentColor"
        className="text-foreground">{value}</text>
      <text x={viewBox / 2} y={viewBox / 2 + 14} textAnchor="middle" fontSize="9" fill="currentColor"
        className="text-muted-foreground/60">READY</text>
    </svg>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function AcademicGPS() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const authUser = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!authUser?.id) return
    setLoading(true)
    fetch(`/api/analytics/subject-insights?student_id=${authUser.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const overall = useMemo(() => {
    if (!data || data.subjects.length === 0) return null
    const avg = Math.round(data.subjects.reduce((s, v) => s + v.readiness, 0) / data.subjects.length)
    return avg
  }, [data])

  const sorted = useMemo(() => {
    if (!data) return []
    return [...data.subjects].sort((a, b) => b.priority - a.priority)
  }, [data])

  // ── Loading ──
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-2xl border p-5 animate-pulse bg-gradient-to-br from-muted/10 to-muted/5">
            <div className="h-5 w-1/3 bg-muted/60 rounded-full mb-3" />
            <div className="h-3 w-1/2 bg-muted/40 rounded-full mb-4" />
            <div className="h-16 bg-muted/30 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.subjects.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground/60">No course data yet</h3>
        <p className="text-sm text-muted-foreground/40 mt-1">Enroll in courses to start tracking your readiness.</p>
      </div>
    )
  }

  const topColor = overall ? readinessColor(overall) : '#6b7280'

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ══════ OVERALL STATUS ══════ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
          <div className="h-1.5" style={{ background: `linear-gradient(90deg, #3b82f6, #8b5cf6, ${topColor})` }} />
          <CardContent className="p-5">
            <div className="flex items-center gap-5">
              {overall !== null && <ReadinessRing value={overall} size={96} />}
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold">{overall !== null ? readinessLabel(overall) : '—'}</div>
                <div className="text-xs text-muted-foreground/60 mt-0.5">
                  {overall !== null && overall >= 75
                    ? 'Keep it up! Stay consistent.'
                    : overall !== null && overall >= 55
                      ? 'You have room to improve. Focus on weak spots.'
                      : 'Needs attention. Small daily effort will help.'}
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground/70">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {data.engagement.weeklyHours}h/wk</span>
                  <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {data.engagement.consistency}% consistent</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {data.engagement.totalQuizzes} quizzes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ══════ FOCUS ALERT ══════ */}
      {data.focus && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/5 to-amber-500/5 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold">Prioritize {data.focus.subject}</div>
            <div className="text-xs text-muted-foreground/80 mt-0.5">{data.focus.reason}</div>
          </div>
        </motion.div>
      )}

      {/* ══════ SUBJECT CARDS (compact) ══════ */}
      <div className="space-y-2">
        {sorted.map((subject, i) => {
          const rColor = readinessColor(subject.readiness)
          return (
            <motion.div
              key={subject.courseId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="border-0 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-3">
                    {/* Mini ring */}
                    <ReadinessRing value={subject.readiness} size={52} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate">{subject.courseName}</span>
                        <span className="text-[9px] text-muted-foreground/40 font-mono">{subject.courseCode}</span>
                        {subject.grade && (
                          <Badge className="text-[8px] px-1.5 py-0 h-3.5 font-bold border-0 ml-auto"
                            style={{ backgroundColor: `${rColor}20`, color: rColor }}>
                            {subject.grade}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground/60 flex-wrap">
                        <span>Quiz: <strong className="text-foreground/70">{subject.quizAvg}%</strong> ({subject.quizCount})</span>
                        {subject.vsPeerQuiz !== null && (
                          <span>vs peers: <strong className={subject.vsPeerQuiz > 0 ? 'text-emerald-500' : 'text-red-500'}>
                            {subject.vsPeerQuiz > 0 ? '+' : ''}{subject.vsPeerQuiz}%
                          </strong></span>
                        )}
                        {subject.weakTopics.length > 0 && (
                          <span className="text-red-500/80">Weak: {subject.weakTopics.slice(0, 2).join(', ')}{subject.weakTopics.length > 2 ? '...' : ''}</span>
                        )}
                        {subject.finalNeeded !== null && (
                          <span>Need <strong className={subject.finalNeeded > 80 ? 'text-red-500' : 'text-amber-500'}>{subject.finalNeeded}%</strong> on final for {subject.finalTarget}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ══════ SUGGESTIONS ══════ */}
      {data.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-blue-500/5 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-bold text-violet-700 dark:text-violet-300">Suggestions</span>
          </div>
          <div className="space-y-2">
            {data.recommendations.map((rec, j) => (
              <div key={j} className="flex items-start gap-2.5 text-xs text-muted-foreground/80">
                <ArrowRight className="h-3.5 w-3.5 text-violet-500 mt-0.5 shrink-0" />
                <span>{rec.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
