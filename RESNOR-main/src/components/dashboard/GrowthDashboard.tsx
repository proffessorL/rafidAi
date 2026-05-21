'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import {
  BookOpen,
  Clock,
  Target,
  Flame,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
  Sparkles,
  Calendar,
  BarChart3,
  CheckCircle,
  Award,
  Timer,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

// --- Count-Up Animation Hook ---
function useCountUp(target: number, duration: number = 1200, decimals: number = 0) {
  const [displayValue, setDisplayValue] = useState(0)
  const motionVal = useMotionValue(0)
  const frameRef = useRef<number>()

  useEffect(() => {
    const controls = animate(motionVal, target, {
      duration: duration / 1000,
      ease: 'easeOut',
    })

    const unsubscribe = motionVal.on('change', (v) => {
      setDisplayValue(Number(v.toFixed(decimals)))
    })

    return () => {
      controls.stop()
      unsubscribe()
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [motionVal, target, duration, decimals])

  return displayValue
}

// --- Mock Data ---

const statsData = {
  totalMaterials: 128,
  completedMaterials: 87,
  inProgressMaterials: 24,
  pendingMaterials: 17,
  studyTimeThisWeek: 18.5,
  quizAverageScore: 78.4,
  currentStreak: 12,
}

const materialStatusData = [
  { name: 'Completed', value: 87, fill: 'oklch(0.646 0.222 41.116)' },
  { name: 'In Progress', value: 24, fill: 'oklch(0.769 0.188 70.08)' },
  { name: 'Pending', value: 17, fill: 'oklch(0.828 0.189 84.429)' },
]

const materialStatusConfig = {
  completed: { label: 'Completed', color: 'oklch(0.646 0.222 41.116)' },
  inProgress: { label: 'In Progress', color: 'oklch(0.769 0.188 70.08)' },
  pending: { label: 'Pending', color: 'oklch(0.828 0.189 84.429)' },
} satisfies ChartConfig

const topicPerformanceData = [
  { week: 'Wk 1', 'Data Structures': 62, Algorithms: 55, 'Web Dev': 70, Databases: 58 },
  { week: 'Wk 2', 'Data Structures': 65, Algorithms: 58, 'Web Dev': 73, Databases: 60 },
  { week: 'Wk 3', 'Data Structures': 70, Algorithms: 63, 'Web Dev': 75, Databases: 65 },
  { week: 'Wk 4', 'Data Structures': 68, Algorithms: 67, 'Web Dev': 78, Databases: 62 },
  { week: 'Wk 5', 'Data Structures': 74, Algorithms: 70, 'Web Dev': 80, Databases: 68 },
  { week: 'Wk 6', 'Data Structures': 78, Algorithms: 72, 'Web Dev': 82, Databases: 71 },
  { week: 'Wk 7', 'Data Structures': 82, Algorithms: 76, 'Web Dev': 85, Databases: 75 },
  { week: 'Wk 8', 'Data Structures': 85, Algorithms: 80, 'Web Dev': 88, Databases: 78 },
]

const topicPerformanceConfig = {
  'Data Structures': { label: 'Data Structures', color: 'oklch(0.646 0.222 41.116)' },
  Algorithms: { label: 'Algorithms', color: 'oklch(0.6 0.118 184.704)' },
  'Web Dev': { label: 'Web Dev', color: 'oklch(0.398 0.07 227.392)' },
  Databases: { label: 'Databases', color: 'oklch(0.769 0.188 70.08)' },
} satisfies ChartConfig

const weeklyActivityData = [
  { day: 'Sat', hours: 3.5 },
  { day: 'Sun', hours: 2.0 },
  { day: 'Mon', hours: 4.0 },
  { day: 'Tue', hours: 1.5 },
  { day: 'Wed', hours: 3.0 },
  { day: 'Thu', hours: 2.5 },
  { day: 'Fri', hours: 2.0 },
]

const weeklyActivityConfig = {
  hours: { label: 'Hours Studied', color: 'oklch(0.646 0.222 41.116)' },
} satisfies ChartConfig

const recentQuizAttempts = [
  { id: 1, quiz: 'Data Structures Midterm', score: 85, total: 100, date: '2025-01-14', status: 'passed' },
  { id: 2, quiz: 'Algorithms Quiz 3', score: 72, total: 100, date: '2025-01-12', status: 'passed' },
  { id: 3, quiz: 'Web Dev Practical', score: 90, total: 100, date: '2025-01-10', status: 'passed' },
  { id: 4, quiz: 'Database Design Test', score: 58, total: 100, date: '2025-01-08', status: 'needs-improvement' },
  { id: 5, quiz: 'OS Concepts Quiz', score: 67, total: 100, date: '2025-01-05', status: 'passed' },
]

const weeklyGoals = [
  {
    id: 'materials',
    label: 'Complete 10 materials',
    current: 7,
    target: 10,
    icon: BookOpen,
    color: 'bg-emerald-500',
    progressColor: '[&>div]:bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'quizzes',
    label: 'Score 80%+ on quizzes',
    current: 2,
    target: 3,
    icon: Award,
    color: 'bg-teal-500',
    progressColor: '[&>div]:bg-teal-500',
    textColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    id: 'study-hours',
    label: 'Study 20+ hours',
    current: 18.5,
    target: 20,
    icon: Timer,
    color: 'bg-amber-500',
    progressColor: '[&>div]:bg-amber-500',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'streak',
    label: 'Maintain daily streak',
    current: 5,
    target: 7,
    icon: Flame,
    color: 'bg-rose-500',
    progressColor: '[&>div]:bg-rose-500',
    textColor: 'text-rose-600 dark:text-rose-400',
  },
]

// --- Sparkline Component ---
function Sparkline({ data, color = 'currentColor', width = 48, height = 24 }: {
  data: number[]
  color?: string
  width?: number
  height?: number
}) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// --- Section Header Component ---
function SectionHeader({
  icon: Icon,
  title,
  accentColor = 'border-l-emerald-500',
  iconColor = 'text-emerald-600 dark:text-emerald-400',
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  accentColor?: string
  iconColor?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex items-center gap-2.5 py-1"
    >
      <div className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md bg-muted/80',
        iconColor,
      )}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className={cn(
        'h-5 w-[3px] rounded-full',
        accentColor,
      )} />
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
    </motion.div>
  )
}

// --- Stat Card Data ---
const statCards = [
  {
    title: 'Total Materials',
    rawValue: statsData.totalMaterials,
    displayValue: () => statsData.totalMaterials,
    decimals: 0,
    subtitle: `${statsData.completedMaterials} done · ${statsData.pendingMaterials} pending`,
    icon: BookOpen,
    borderColor: 'border-l-emerald-500',
    iconColor: 'text-emerald-500',
    trend: 'up' as const,
    trendValue: '+12%',
    sparkline: [60, 75, 80, 90, 100, 110, 120, 128],
    sparkColor: 'oklch(0.646 0.222 41.116)',
  },
  {
    title: 'Study Time This Week',
    rawValue: statsData.studyTimeThisWeek,
    displayValue: () => statsData.studyTimeThisWeek,
    decimals: 1,
    subtitle: '3.5h more than last week',
    icon: Clock,
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-500',
    trend: 'up' as const,
    trendValue: '+23%',
    sparkline: [10, 12, 14, 13, 15, 16, 17.5, 18.5],
    sparkColor: 'oklch(0.769 0.188 70.08)',
  },
  {
    title: 'Quiz Average',
    rawValue: statsData.quizAverageScore,
    displayValue: () => statsData.quizAverageScore,
    decimals: 1,
    subtitle: 'Across 12 quizzes',
    icon: Target,
    borderColor: 'border-l-teal-500',
    iconColor: 'text-teal-500',
    trend: 'up' as const,
    trendValue: '+5.2%',
    sparkline: [65, 68, 70, 72, 74, 75, 77, 78.4],
    sparkColor: 'oklch(0.6 0.118 184.704)',
  },
  {
    title: 'Current Streak',
    rawValue: statsData.currentStreak,
    displayValue: () => statsData.currentStreak,
    decimals: 0,
    subtitle: 'Personal best: 18 days',
    icon: Flame,
    borderColor: 'border-l-rose-500',
    iconColor: 'text-rose-500',
    trend: 'neutral' as const,
    trendValue: '0%',
    sparkline: [5, 8, 10, 7, 9, 11, 10, 12],
    sparkColor: 'oklch(0.577 0.245 27.325)',
  },
]

function StatCard({
  title,
  rawValue,
  decimals,
  subtitle,
  icon: Icon,
  borderColor,
  iconColor,
  trend,
  trendValue,
  sparkline,
  sparkColor,
  suffix = '',
}: {
  title: string
  rawValue: number
  decimals: number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  borderColor: string
  iconColor: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  sparkline: number[]
  sparkColor: string
  suffix?: string
}) {
  const animatedValue = useCountUp(rawValue, 1400, decimals)

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card className={cn(
        'border-l-4 transition-shadow duration-300 hover:shadow-md',
        borderColor,
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={cn('h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center', iconColor)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold tabular-nums">
              {animatedValue}{suffix}
            </div>
            <Sparkline data={sparkline} color={sparkColor} />
          </div>
          <div className="flex items-center gap-1.5 pt-1.5">
            {trend === 'up' && (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                {trendValue}
              </span>
            )}
            {trend === 'down' && (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <TrendingDown className="h-3 w-3" />
                {trendValue}
              </span>
            )}
            {trend === 'neutral' && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
                <span className="h-3 w-3 flex items-center justify-center text-[10px]">—</span>
                {trendValue}
              </span>
            )}
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- Donut Center Label ---
function DonutCenterLabel({ percentage }: { percentage: number }) {
  const animatedPct = useCountUp(percentage, 1600, 0)

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        <p className="text-3xl font-bold tabular-nums">{animatedPct}%</p>
        <p className="text-[10px] text-muted-foreground font-medium">Complete</p>
      </div>
    </div>
  )
}

// --- Weekly Goals Section ---
function WeeklyGoalsSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/60">
                <Target className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">This Week&apos;s Goals</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {weeklyGoals.filter(g => g.current >= g.target).length} of {weeklyGoals.length} completed
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              {Math.round(weeklyGoals.reduce((a, g) => a + Math.min(g.current / g.target, 1), 0) / weeklyGoals.length * 100)}% overall
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {weeklyGoals.map((goal, index) => {
              const pct = Math.round((goal.current / goal.target) * 100)
              const isComplete = goal.current >= goal.target
              const GoalIcon = goal.icon

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + index * 0.08 }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg p-2.5 transition-colors',
                    isComplete
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/20'
                      : 'bg-muted/40 hover:bg-muted/60',
                  )}
                >
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    isComplete
                      ? 'bg-emerald-500 text-white'
                      : cn('bg-muted', goal.textColor),
                  )}>
                    {isComplete ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <GoalIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={cn(
                        'text-xs font-medium truncate',
                        isComplete && 'text-emerald-700 dark:text-emerald-300',
                      )}>
                        {goal.label}
                      </p>
                      <span className={cn(
                        'text-xs font-semibold tabular-nums shrink-0',
                        isComplete ? 'text-emerald-600 dark:text-emerald-400' : goal.textColor,
                      )}>
                        {goal.current}/{goal.target}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={pct}
                        className={cn('h-1.5 flex-1', goal.progressColor)}
                      />
                      <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- Welcome Banner with Glassmorphism ---
function WelcomeBanner() {
  const { setActivePage } = useAppStore()

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const materialsToday = 5
  const quizScore = '85%'
  const streak = 12

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 p-6 md:p-8 text-white shadow-lg shadow-emerald-900/10">
      {/* Decorative blur elements */}
      <motion.div
        className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 0.9, 1.2, 1],
          x: [0, 20, -15, 10, 0],
          y: [0, -10, 15, -8, 0],
          opacity: [0.3, 0.6, 0.4, 0.5, 0.3],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute top-4 right-8 w-20 h-20 bg-white/5 rounded-2xl rotate-12" />
      <div className="absolute bottom-6 right-24 w-12 h-12 bg-white/5 rounded-xl -rotate-12" />

      {/* Glass panel overlay */}
      <div className="absolute inset-0 rounded-2xl bg-white/[0.06] backdrop-blur-[1px] pointer-events-none" />
      {/* Inner shadow effect */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.1)] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2 text-white/80">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{dateStr}</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome back, Rafiq! 👋
        </h2>

        <p className="text-white/85 text-sm md:text-base mb-6 max-w-lg">
          You&apos;ve completed {materialsToday} materials today with a quiz score of {quizScore}.
          Keep going — you&apos;re on a {streak}-day streak! 🔥
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setActivePage('tutor')}
            className="bg-white text-emerald-700 hover:bg-white/90 font-semibold shadow-lg shadow-emerald-900/20 transition-all hover:shadow-xl hover:scale-[1.02]"
          >
            Continue Studying
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePage('digital-twin')}
            className="bg-white/15 border-white/30 text-white hover:bg-white/25 hover:text-white backdrop-blur-sm transition-all hover:scale-[1.02]"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            View Recommendations
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Score dot color helper ---
function getScoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

function getScoreRing(score: number) {
  if (score >= 80) return 'ring-emerald-500/30'
  if (score >= 60) return 'ring-amber-500/30'
  return 'ring-red-500/30'
}

export default function GrowthDashboard() {
  const completionPercentage = Math.round((statsData.completedMaterials / statsData.totalMaterials) * 100)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <WelcomeBanner />
      </motion.div>

      {/* Weekly Goals Section */}
      <WeeklyGoalsSection />

      {/* Section Header: Performance Overview */}
      <SectionHeader
        icon={BarChart3}
        title="Performance Overview"
        accentColor="border-l-emerald-500"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <StatCard
              key={card.title}
              title={card.title}
              rawValue={card.rawValue}
              decimals={card.decimals}
              subtitle={card.subtitle}
              icon={card.icon}
              borderColor={card.borderColor}
              iconColor={card.iconColor}
              trend={card.trend}
              trendValue={card.trendValue}
              sparkline={card.sparkline}
              sparkColor={card.sparkColor}
              suffix={card.decimals > 0 ? 'h' : ''}
            />
          )
        })}
      </div>

      {/* Section Header: Learning Analytics */}
      <SectionHeader
        icon={TrendingUp}
        title="Learning Analytics"
        accentColor="border-l-teal-500"
        iconColor="text-teal-600 dark:text-teal-400"
      />

      {/* Charts Row: Pie + Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Material Status Donut */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Card className="h-full transition-shadow duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Material Progress</CardTitle>
              <CardDescription>Completion breakdown across all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <ChartContainer config={materialStatusConfig} className="mx-auto aspect-square max-h-[250px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={materialStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      strokeWidth={2}
                      stroke="oklch(1 0 0)"
                    >
                      {materialStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
                <DonutCenterLabel percentage={completionPercentage} />
              </div>
              <div className="mt-3 flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'oklch(0.646 0.222 41.116)' }} />
                  <span className="text-muted-foreground">{statsData.completedMaterials} completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5" style={{ color: 'oklch(0.769 0.188 70.08)' }} />
                  <span className="text-muted-foreground">{statsData.inProgressMaterials} in progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Circle className="h-3.5 w-3.5" style={{ color: 'oklch(0.828 0.189 84.429)' }} />
                  <span className="text-muted-foreground">{statsData.pendingMaterials} pending</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Topic Performance Area Chart */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="lg:col-span-2"
        >
          <Card className="h-full transition-shadow duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Topic Performance Over Time</CardTitle>
              <CardDescription>Average quiz scores across 8 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={topicPerformanceConfig} className="aspect-[16/9] max-h-[300px]">
                <AreaChart data={topicPerformanceData} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="fillDS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.646 0.222 41.116)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.646 0.222 41.116)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillAlgo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.6 0.118 184.704)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.6 0.118 184.704)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillWeb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.398 0.07 227.392)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.398 0.07 227.392)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillDB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.769 0.188 70.08)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.769 0.188 70.08)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} domain={[40, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="Data Structures"
                    stroke="oklch(0.646 0.222 41.116)"
                    fill="url(#fillDS)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="Algorithms"
                    stroke="oklch(0.6 0.118 184.704)"
                    fill="url(#fillAlgo)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="Web Dev"
                    stroke="oklch(0.398 0.07 227.392)"
                    fill="url(#fillWeb)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="Databases"
                    stroke="oklch(0.769 0.188 70.08)"
                    fill="url(#fillDB)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row: Weekly Activity + Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Activity Bar Chart */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Card className="h-full transition-shadow duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Weekly Activity</CardTitle>
              <CardDescription>Hours studied per day this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={weeklyActivityConfig} className="aspect-[16/9] max-h-[250px]">
                <BarChart data={weeklyActivityData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, 5]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="hours"
                    fill="oklch(0.646 0.222 41.116)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section Header: Recent Activity */}
        <div className="flex flex-col">
          <SectionHeader
            icon={Clock}
            title="Recent Activity"
            accentColor="border-l-rose-500"
            iconColor="text-rose-600 dark:text-rose-400"
          />

          {/* Recent Activity Timeline */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex-1"
          >
            <Card className="h-full transition-shadow duration-300 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Quiz Attempts</CardTitle>
                <CardDescription>Your last 5 quiz results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recentQuizAttempts.map((quiz, index) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 * index }}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors',
                        index % 2 === 0
                          ? 'bg-transparent'
                          : 'bg-muted/30',
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {quiz.date.slice(5)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full shrink-0 ring-2',
                              getScoreColor(quiz.score),
                              getScoreRing(quiz.score),
                            )}
                          />
                          <p className="truncate text-sm font-medium">{quiz.quiz}</p>
                        </div>
                        <div className="flex items-center gap-2.5 ml-4 mt-1">
                          <Progress
                            value={quiz.score}
                            className="mt-0.5 h-1.5 flex-1 max-w-24"
                          />
                          <span className="text-xs font-bold tabular-nums">
                            {quiz.score}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            /{quiz.total}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={quiz.score >= 70 ? 'default' : 'secondary'}
                        className={
                          quiz.score >= 70
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0'
                            : quiz.score >= 60
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0'
                              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-0'
                        }
                      >
                        {quiz.score >= 70 ? 'Passed' : quiz.score >= 60 ? 'Average' : 'Low'}
                      </Badge>
                    </motion.div>
                  ))}
                </div>

                {/* View All Link */}
                <div className="mt-3 pt-2 border-t">
                  <button
                    onClick={() => useAppStore.getState().setActivePage('quiz')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    View all quiz attempts
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
