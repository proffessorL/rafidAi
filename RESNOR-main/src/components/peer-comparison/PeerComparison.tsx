"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useMotionValue, animate } from "framer-motion"
import {
  Users, TrendingUp, Target, BookOpen, Sparkles,
  ArrowRight, Loader2, AlertCircle, ChevronDown, ChevronUp,
  UserCheck, Lightbulb, Brain, Clock, BarChart3,
  Trophy, Zap, GraduationCap, LineChart,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth"

function SeeMoreButton({ items, label }: { items: { topic: string; frequency: number }[]; label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(!open)} className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded-full border border-border/50 hover:border-border">
        {open ? 'less' : `+${items.length} more`}
      </button>
      {open && items.map((w, i) => (
        <Badge key={i} variant="secondary" className="text-[10px] font-normal px-2 py-0.5">
          {w.topic}
          <span className="text-[9px] text-muted-foreground ml-1">×{w.frequency}</span>
        </Badge>
      ))}
    </>
  )
}

function useCountUp(target: number, duration = 1200, decimals = 0) {
  const [displayValue, setDisplayValue] = useState(0)
  const motionVal = useMotionValue(0)
  useEffect(() => {
    const controls = animate(motionVal, target, { duration: duration / 1000, ease: 'easeOut' })
    const unsubscribe = motionVal.on('change', (v) => setDisplayValue(Number(v.toFixed(decimals))))
    return () => { controls.stop(); unsubscribe() }
  }, [motionVal, target, duration, decimals])
  return displayValue
}

interface TrajectoryPoint {
  semester: number
  cgpa: number
  quizAverage: number
  studyHours: number
  consistencyRate: number
  completionRate: number
}

interface PeerMatch {
  studentName: string
  startCGPA: number
  endCGPA: number
  improvement: number
  semesterCount: number
  trajectory: TrajectoryPoint[]
  cautionary?: boolean
  similarityReasons: string[]
  predictedRange: { min: number; max: number }
  studyPath: string[]
}

interface WeakTopic {
  topic: string
  frequency: number
  mistakeType: string
  description?: string
}

interface CourseInfo {
  name: string
  code: string
  attendance: number
  marks: { assignment: number | null; presentation: number | null; mid: number | null; final: number | null }
}

interface WellbeingInfo {
  stressScore: number
  burnoutRisk: number
  lastMood: string
  studyBalance: number
}

interface UserProfile {
  quizAverage: number
  quizCount: number
  studyHours: number
  consistencyRate: number
  interactionDensity: number
  completionRate: number
  weakTopics: WeakTopic[]
  currentCourses: CourseInfo[]
  wellbeing: WellbeingInfo | null
  recentMoods: { mood: string; score: number }[]
}

interface ApiResponse {
  userProfile: UserProfile
  matches: PeerMatch[]
  totalSeniors: number
}

const THEMES = [
  { gradient: 'from-emerald-600 to-teal-500', lightBg: 'from-emerald-50 to-teal-50', ring: 'ring-emerald-500/30', accent: 'emerald', chart: '#10b981' },
  { gradient: 'from-blue-600 to-cyan-500', lightBg: 'from-blue-50 to-cyan-50', ring: 'ring-blue-500/30', accent: 'blue', chart: '#3b82f6' },
  { gradient: 'from-violet-600 to-purple-500', lightBg: 'from-violet-50 to-purple-50', ring: 'ring-violet-500/30', accent: 'violet', chart: '#8b5cf6' },
  { gradient: 'from-amber-600 to-orange-500', lightBg: 'from-amber-50 to-orange-50', ring: 'ring-amber-500/30', accent: 'amber', chart: '#d97706' },
  { gradient: 'from-rose-600 to-pink-500', lightBg: 'from-rose-50 to-pink-50', ring: 'ring-rose-500/30', accent: 'rose', chart: '#e11d48' },
]

const CAUTIONARY_THEME = { gradient: 'from-red-600 to-rose-500', lightBg: 'from-red-50 to-rose-50', ring: 'ring-red-500/40', accent: 'red', chart: '#ef4444' }

function TrajectoryChart({ trajectory, color }: { trajectory: TrajectoryPoint[]; color: string }) {
  if (trajectory.length < 2) return null
  const maxCGPA = 4.0
  const minCGPA = Math.max(1.5, Math.min(...trajectory.map(t => t.cgpa)) - 0.3)
  const range = maxCGPA - minCGPA
  const w = (trajectory.length - 1) * 80 + 40
  const h = 120

  const pts = trajectory.map((t, i) => ({
    x: i * 80 + 20,
    y: h - 20 - ((t.cgpa - minCGPA) / range) * 80,
    cgpa: t.cgpa,
    semester: t.semester,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = pathD + ` L ${pts[pts.length - 1].x} ${h - 20} L ${pts[0].x} ${h - 20} Z`

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={color} strokeWidth="2.5" className="drop-shadow-sm" />
            <text x={p.x} y={p.y - 12} textAnchor="middle" className="fill-current text-[9px] font-bold" fill={color}>
              {p.cgpa.toFixed(1)}
            </text>
            <text x={p.x} y={h - 4} textAnchor="middle" className="fill-current text-[9px]" fill="#888">
              S{p.semester}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function PeerCard({ match, index }: { match: PeerMatch; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const theme = match.cautionary ? CAUTIONARY_THEME : THEMES[index % THEMES.length]

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card className={`overflow-hidden border-0 ring-1 ${theme.ring} shadow-sm hover:shadow-md transition-all duration-300`}>
        <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />

        <CardHeader className="pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} shadow-lg`}>
                <span className="text-white text-lg font-bold">#</span>
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Peer {index + 1}</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                    {match.semesterCount} semesters
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    CGPA {match.startCGPA.toFixed(1)} <span className="text-muted-foreground/40">→</span> <span className="font-semibold text-foreground">{match.endCGPA.toFixed(1)}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                {match.improvement >= 0 ? '+' : ''}{match.improvement.toFixed(2)}
              </div>
              <p className="text-[10px] text-muted-foreground">{match.cautionary ? 'CGPA change' : 'CGPA improvement'}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-4 space-y-4">
          <TrajectoryChart trajectory={match.trajectory} color={theme.chart} />

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Start', value: match.startCGPA.toFixed(1), icon: Clock },
              { label: 'Best', value: Math.max(...match.trajectory.map(t => t.cgpa)).toFixed(1), icon: Trophy },
              { label: 'End', value: match.endCGPA.toFixed(1), icon: TrendingUp },
            ].map((s, i) => (
              <div key={i} className="text-center p-2 rounded-xl bg-muted/40">
                <s.icon className={`size-3 mx-auto mb-0.5 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-emerald-500' : 'text-blue-500'}`} />
                <p className="text-sm font-bold tabular-nums">{s.value}</p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-[11px] font-semibold flex items-center gap-1.5 text-muted-foreground">
              <UserCheck className="size-3.5" />
              Why they match you
            </p>
            <ul className="space-y-1.5">
              {match.similarityReasons.slice(0, 3).map((r, i) => (
                <li key={i} className="text-[12px] text-foreground/80 leading-relaxed flex items-start gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 bg-gradient-to-r ${theme.gradient}`} />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-muted-foreground" />
              <span className="text-[12px] text-muted-foreground">
                Projected: <strong className="text-foreground">{match.predictedRange.min.toFixed(2)} – {match.predictedRange.max.toFixed(2)}</strong>
              </span>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className={`flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all ${
                expanded
                  ? 'bg-muted text-muted-foreground border-border'
                  : `bg-gradient-to-r ${theme.gradient} text-white border-transparent hover:shadow-md`
              }`}
            >
              {expanded ? <ChevronUp className="size-3.5" /> : <Lightbulb className="size-3.5" />}
              {expanded ? 'Hide path' : 'Show path'}
            </button>
          </div>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-1 border-t border-border/50"
            >
              <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Lightbulb className="size-3.5" />
                Data-backed milestones from Peer {index + 1}'s journey
              </p>
              <div className="relative">
                <div className={`absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b ${theme.gradient} opacity-30 rounded-full`} />
                <ol className="space-y-3">
                  {match.studyPath.map((step, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.08 * i }} className="text-[12px] text-foreground/80 leading-relaxed flex items-start gap-3 pl-1">
                      <span className={`relative flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br ${theme.gradient} text-white text-[10px] font-bold shadow-sm`}>
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} as const

function AnimatedMetric({ label, rawValue, suffix = '', icon: Icon, trend }: { label: string; rawValue: number; suffix?: string; icon: React.ElementType; trend?: 'up' | 'down' | 'neutral' }) {
  const animatedVal = useCountUp(rawValue, 1400, suffix === '%' || suffix === '' && rawValue < 100 ? 0 : 2)
  const displayValue = suffix === '%' || suffix === 'h' ? animatedVal : suffix === '' ? rawValue : animatedVal
  return (
    <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <div className="relative p-3 rounded-2xl bg-gradient-to-b from-background to-muted/30 border border-border/50 hover:border-emerald-500/30 hover:shadow-sm hover:shadow-emerald-500/5 transition-all duration-300">
        <div className="flex items-center justify-between mb-1.5">
          <Icon className="size-4 text-muted-foreground" />
          {trend && (
            <span className={`text-[10px] font-medium ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </span>
          )}
        </div>
        <p className="text-lg font-bold tabular-nums tracking-tight">{animatedVal}{suffix}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
}

export default function PeerComparison() {
  const authUser = useAuthStore((s) => s.user)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authUser?.id) return
    setLoading(true)
    setError(null)
    fetch(`/api/analytics/peer-comparison?student_id=${authUser.id}`)
      .then(async r => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || `Server error (${r.status})`)
        return d
      })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [authUser?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
            </div>
            <motion.div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/20" animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Finding your academic peers</p>
            <p className="text-xs text-muted-foreground">Analyzing senior student trajectories...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Something went wrong</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.matches.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Users className="h-7 w-7 text-amber-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Not enough data yet</p>
            <p className="text-xs text-muted-foreground">Keep studying and taking quizzes — we'll find your peers once there's more data to match.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-8 max-w-4xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Header */}
      <motion.div variants={itemVariants}>
        <motion.div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-violet-900/30"
          animate={{ backgroundPosition: ['0% 0%', '50% 50%', '100% 100%', '50% 0%', '0% 0%'] }}
          style={{
            backgroundImage: 'linear-gradient(135deg, #0f172a, #1e293b, #312e81)',
            backgroundSize: '200% 200%',
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        >
          {/* Floating gradient orbs */}
          <motion.div className="absolute -top-20 -right-20 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl" animate={{ scale: [1, 1.5, 0.9, 1.3, 1], opacity: [0.3, 0.6, 0.2, 0.5, 0.3] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute -bottom-24 -left-12 w-64 h-64 bg-indigo-400/12 rounded-full blur-3xl" animate={{ scale: [1, 1.4, 0.8, 1.2, 1], opacity: [0.2, 0.5, 0.1, 0.4, 0.2] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
          <motion.div className="absolute top-1/2 left-1/3 w-32 h-32 bg-violet-400/8 rounded-full blur-2xl" animate={{ scale: [1, 1.3, 0.9, 1.15, 1], opacity: [0.4, 0.7, 0.2, 0.6, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
          {/* Floating geometric shapes */}
          <motion.div className="absolute top-5 right-16 w-20 h-20 bg-white/6 rounded-2xl border border-white/10" animate={{ rotate: [12, 30, 5, 20, 12], y: [0, -10, 4, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute bottom-10 right-28 w-12 h-12 bg-white/6 rounded-xl border border-white/10" animate={{ rotate: [-12, -30, -5, -20, -12], y: [0, 8, -4, 6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }} />
          {/* Shimmer line */}
          <motion.div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />
          {/* Floating particles */}
          {[...Array(14)].map((_, i) => (
            <motion.div key={i} className="absolute w-1.5 h-1.5 bg-violet-300/30 rounded-full"
              animate={{
                x: [0, (i % 2 === 0 ? 1 : -1) * (25 + (i % 5) * 15), 0],
                y: [0, -20 - (i % 4) * 10, 0],
                opacity: [0, 0.7, 0],
              }}
              transition={{ duration: 2 + (i % 4) * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
              style={{ top: `${5 + i * 6.5}%`, left: `${5 + (i % 7) * 13}%` }}
            />
          ))}
          {/* Dot grid overlay */}
          <motion.div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} animate={{ opacity: [0.02, 0.04, 0.02] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Peer Comparison</h1>
                <p className="text-sm text-white/80">
                  See how your academic journey compares to your peers
                </p>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>

      {/* Profile Summary */}
      <motion.div variants={itemVariants}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-emerald-500" />
            <h2 className="text-sm font-semibold">Your Academic Snapshot</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {[
              { label: 'Quiz Avg', rawValue: data.userProfile.quizAverage, suffix: '%', icon: Brain, trend: data.userProfile.quizAverage >= 60 ? 'up' as const : 'neutral' as const },
              { label: 'Quizzes Taken', rawValue: data.userProfile.quizCount, suffix: '', icon: BookOpen, trend: 'neutral' as const },
              { label: 'Study Hours', rawValue: data.userProfile.studyHours, suffix: 'h', icon: Clock, trend: data.userProfile.studyHours >= 50 ? 'up' as const : 'neutral' as const },
              { label: 'Consistency', rawValue: data.userProfile.consistencyRate, suffix: '%', icon: BarChart3, trend: data.userProfile.consistencyRate >= 50 ? 'up' as const : 'down' as const },
              { label: 'Completion', rawValue: data.userProfile.completionRate, suffix: '%', icon: Target, trend: data.userProfile.completionRate >= 50 ? 'up' as const : 'down' as const },
              { label: 'Interaction', rawValue: data.userProfile.interactionDensity, suffix: '', icon: Zap, trend: 'neutral' as const },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.06 * i }}>
                <AnimatedMetric {...s} />
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {data.userProfile.weakTopics.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground font-medium mr-0.5">Weak topics:</span>
                {data.userProfile.weakTopics.slice(0, 3).map((w, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] font-normal px-2 py-0.5">
                    {w.topic}
                    <span className="text-[9px] text-muted-foreground ml-1">×{w.frequency}</span>
                  </Badge>
                ))}
                {data.userProfile.weakTopics.length > 3 && (
                  <SeeMoreButton items={data.userProfile.weakTopics.slice(3)} label="topic" />
                )}
              </div>
            )}
            {data.userProfile.currentCourses.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground font-medium mr-0.5">Courses:</span>
                {data.userProfile.currentCourses.map((c, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] font-normal px-2 py-0.5">
                    <GraduationCap className="size-3 mr-1 text-muted-foreground" />
                    {c.code}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Top Peers */}
      {(() => {
        const improvers = data.matches.filter(m => !m.cautionary)
        const cautionary = data.matches.filter(m => m.cautionary)
        return (
          <>
            {improvers.length > 0 && (
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                    <Sparkles className="size-3.5 text-emerald-500" />
                  </div>
                  <h2 className="text-sm font-semibold">Peers Like You</h2>
                  <Badge variant="secondary" className="text-[10px] font-normal ml-1">
                    Top {improvers.length} of {data.totalSeniors} seniors
                  </Badge>
                </div>
                <div className="space-y-5">
                  {improvers.map((match, i) => (
                    <PeerCard key={i} match={match} index={i} />
                  ))}
                </div>
              </motion.div>
            )}

            {cautionary.length > 0 && (
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-4 mt-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/10 to-rose-500/10">
                    <AlertCircle className="size-3.5 text-red-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">⚠ Don't Become This</h2>
                  <Badge variant="secondary" className="text-[10px] font-normal ml-1">
                    Warning
                  </Badge>
                </div>
                {cautionary.slice(0, 1).map((match, i) => (
                  <PeerCard key={i} match={match} index={improvers.length + i} />
                ))}
              </motion.div>
            )}
          </>
        )
      })()}

      {/* Footer */}
      <motion.div variants={itemVariants} className="text-center pb-8">
        <p className="text-[11px] text-muted-foreground">
          Analysis powered by AI · Comparing academic patterns across {data.totalSeniors} senior students
        </p>
      </motion.div>
    </motion.div>
  )
}
