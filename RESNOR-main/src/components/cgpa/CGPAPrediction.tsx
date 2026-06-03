'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  type ChartConfig,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Activity,
  Clock,
  Target,
  BrainCircuit,
  Gauge,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

interface CGPAData {
  predictedCGPA: number
  baselineCGPA: number
  metrics: {
    quizAverage: number
    quizCount: number
    weeklyActiveHours: number
    studyConsistency: number
    interactionDensity: number
    completionRate: number
    quizScoreTrend: number[]
  }
  confidence: number
  gradeBreakdown: { subject: string; predicted: number; trend: string; currentMark: number | null }[]
  studyTip: string
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
    case 'down':
      return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
    default:
      return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

export default function CGPAPrediction() {
  const authUser = useAuthStore((s) => s.user)
  const [data, setData] = useState<CGPAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authUser?.id) return
    setLoading(true)
    setError(null)
    fetch(`/api/analytics/predict-cgpa?student_id=${authUser.id}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Failed to load')
        if (!d.success) throw new Error('API returned unsuccessful')
        setData(d.data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [authUser?.id])

  const category = useMemo(() => {
    if (!data) return 'medium' as const
    if (data.predictedCGPA >= 3.5) return 'high' as const
    if (data.predictedCGPA >= 3.0) return 'medium' as const
    return 'low' as const
  }, [data])

  const cgpaColor = useMemo(() => {
    if (!data) return ''
    if (data.predictedCGPA >= 3.5) return 'text-emerald-600 dark:text-emerald-400'
    if (data.predictedCGPA >= 3.0) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }, [data])

  const cgpaGradientFrom = useMemo(() => {
    if (!data) return 'oklch(0.769 0.188 70.08)'
    if (data.predictedCGPA >= 3.5) return 'oklch(0.696 0.17 162.48)'
    if (data.predictedCGPA >= 3.0) return 'oklch(0.769 0.188 70.08)'
    return 'oklch(0.577 0.245 27.325)'
  }, [data])

  const cgpaGradientTo = useMemo(() => {
    if (!data) return 'oklch(0.646 0.222 41.116)'
    if (data.predictedCGPA >= 3.5) return 'oklch(0.6 0.118 184.704)'
    if (data.predictedCGPA >= 3.0) return 'oklch(0.646 0.222 41.116)'
    return 'oklch(0.646 0.222 41.116)'
  }, [data])

  const sparklineConfig = {
    score: { label: 'Score', color: 'oklch(0.646 0.222 41.116)' },
  } satisfies ChartConfig

  const sparklineData = useMemo(() => {
    if (!data) return []
    return data.metrics.quizScoreTrend.map((score, i) => ({
      week: `W${i + 1}`,
      score,
    }))
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Analyzing your academic data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
      </div>
    )
  }

  const baselineDelta = (data.predictedCGPA - data.baselineCGPA)

  return (
    <div className="space-y-6">
      {/* Main CGPA Display + Confidence */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Large CGPA Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Predicted CGPA
            </CardTitle>
            <CardDescription>
              Based on your current academic performance patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-4">
              <div
                className="text-7xl font-extrabold tracking-tight"
                style={{
                  background: `linear-gradient(135deg, ${cgpaGradientFrom}, ${cgpaGradientTo})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {data.predictedCGPA.toFixed(2)}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={
                    category === 'high'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0'
                      : category === 'medium'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-0'
                  }
                >
                  {category === 'high' ? "On Track for Dean's List" : category === 'medium' ? 'Good Standing' : 'Needs Improvement'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Baseline: {data.baselineCGPA.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {baselineDelta >= 0 ? '+' : ''}{baselineDelta.toFixed(2)} from baseline trajectory
              </p>
            </div>

            {/* Sub-metrics Grid */}
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {/* Study Consistency */}
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  Consistency
                </div>
                <Progress value={data.metrics.studyConsistency} className="h-2" />
                <p className="text-xs text-muted-foreground">{data.metrics.studyConsistency}% rate</p>
              </div>

              {/* Weekly Active Hours */}
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Active Hours
                </div>
                <p className="text-2xl font-bold">{data.metrics.weeklyActiveHours}h</p>
                <p className="text-xs text-muted-foreground">Avg. per week</p>
              </div>

              {/* Quiz Score Trend (Sparkline) */}
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  Quiz Trend
                </div>
                {sparklineData.length > 1 ? (
                  <ChartContainer config={sparklineConfig} className="h-10 w-full">
                    <LineChart data={sparklineData} margin={{ left: -25, right: 0, top: 0, bottom: 0 }}>
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="oklch(0.646 0.222 41.116)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-2xl font-bold">{data.metrics.quizAverage}%</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {data.metrics.quizScoreTrend.length >= 2
                    ? `${data.metrics.quizScoreTrend[data.metrics.quizScoreTrend.length - 1] - data.metrics.quizScoreTrend[0]}% over ${data.metrics.quizScoreTrend.length} quizzes`
                    : `${data.metrics.quizCount} quizzes taken`}
                </p>
              </div>

              {/* Interaction Density */}
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BrainCircuit className="h-3.5 w-3.5 text-muted-foreground" />
                  Interactions
                </div>
                <p className="text-2xl font-bold">{data.metrics.interactionDensity}</p>
                <p className="text-xs text-muted-foreground">Avg. per day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prediction Confidence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4" />
              Confidence
            </CardTitle>
            <CardDescription>Model prediction reliability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-6">
              {/* Circular confidence meter */}
              <div className="relative flex h-36 w-36 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="oklch(0.922 0 0)"
                    strokeWidth="8"
                    className="dark:stroke-[oklch(0.269_0_0)]"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="oklch(0.646 0.222 41.116)"
                    strokeWidth="8"
                    strokeDasharray={`${data.confidence * 2.64} ${264 - data.confidence * 2.64}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold">{data.confidence}%</span>
                  <span className="text-xs text-muted-foreground">Confidence</span>
                </div>
              </div>

              <div className="mt-4 w-full space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data Points</span>
                  <span className="font-medium">
                    {data.metrics.quizCount + sparklineData.length + (data.gradeBreakdown?.length || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className="font-medium">±0.15 CGPA</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">Live</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Breakdown + AI Tip */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Subject-wise Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Subject-wise Prediction</CardTitle>
            <CardDescription>Predicted grades based on current performance</CardDescription>
          </CardHeader>
          <CardContent>
            {data.gradeBreakdown.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {data.gradeBreakdown.map((subject) => (
                  <div
                    key={subject.subject}
                    className="flex flex-col gap-1.5 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{subject.subject}</p>
                      {getTrendIcon(subject.trend)}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold">{subject.predicted.toFixed(1)}</span>
                      {subject.currentMark !== null && (
                        <span className="text-xs text-muted-foreground">({subject.currentMark}%)</span>
                      )}
                    </div>
                    <Progress
                      value={(subject.predicted / 4.0) * 100}
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No course enrollment data available yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI Study Tip */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              AI Study Tip
            </CardTitle>
            <CardDescription>Personalized recommendation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm leading-relaxed">{data.studyTip}</p>
            </div>
            <div className="mt-4 space-y-2">
              {data.metrics.completionRate < 70 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">Complete pending materials — {data.metrics.completionRate}% done</span>
                </div>
              )}
              {data.metrics.weeklyActiveHours < 10 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">Increase study hours — currently {data.metrics.weeklyActiveHours}h/week</span>
                </div>
              )}
              {data.metrics.studyConsistency < 60 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Build a daily streak — consistency is {data.metrics.studyConsistency}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
