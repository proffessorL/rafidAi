'use client'

import { useMemo } from 'react'
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
} from 'lucide-react'

// --- Mock Data ---

const predictedCGPA = 3.42
const baselineCGPA = 3.15

const subMetrics = {
  studyConsistency: 73,
  weeklyActiveHours: 18.5,
  quizScoreTrend: [62, 65, 63, 68, 72, 70, 75, 78],
  interactionDensity: 8.4,
}

const sparklineConfig = {
  score: { label: 'Score', color: 'oklch(0.646 0.222 41.116)' },
} satisfies ChartConfig

const sparklineData = subMetrics.quizScoreTrend.map((score, i) => ({
  week: `W${i + 1}`,
  score,
}))

const confidenceLevel = 82

const subjectBreakdown = [
  { name: 'Data Structures', predictedGrade: 'A-', gpa: 3.7, trend: 'up' as const, color: 'oklch(0.646 0.222 41.116)' },
  { name: 'Algorithms', predictedGrade: 'B+', gpa: 3.3, trend: 'up' as const, color: 'oklch(0.6 0.118 184.704)' },
  { name: 'Web Development', predictedGrade: 'A', gpa: 4.0, trend: 'up' as const, color: 'oklch(0.398 0.07 227.392)' },
  { name: 'Database Systems', predictedGrade: 'B', gpa: 3.0, trend: 'neutral' as const, color: 'oklch(0.769 0.188 70.08)' },
  { name: 'Operating Systems', predictedGrade: 'B+', gpa: 3.3, trend: 'down' as const, color: 'oklch(0.828 0.189 84.429)' },
  { name: 'Software Engineering', predictedGrade: 'A-', gpa: 3.7, trend: 'up' as const, color: 'oklch(0.6 0.118 184.704)' },
]

const studyTips: Record<string, string> = {
  high: 'Excellent trajectory! Focus on maintaining your study consistency. Try cross-topic revision sessions to strengthen weaker areas.',
  medium: 'Good progress! Increasing daily study time by 30 minutes and taking more practice quizzes could push your CGPA above 3.5.',
  low: 'Your CGPA needs attention. Prioritize completing pending materials and aim for at least 20 weekly study hours with consistent quiz practice.',
}

function getTrendIcon(trend: 'up' | 'down' | 'neutral') {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
    case 'down':
      return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
    case 'neutral':
      return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

function getCGPACategory(cgpa: number): 'high' | 'medium' | 'low' {
  if (cgpa >= 3.5) return 'high'
  if (cgpa >= 3.0) return 'medium'
  return 'low'
}

export default function CGPAPrediction() {
  const category = getCGPACategory(predictedCGPA)
  const tip = studyTips[category]

  const cgpaColor = useMemo(() => {
    if (predictedCGPA >= 3.5) return 'text-emerald-600 dark:text-emerald-400'
    if (predictedCGPA >= 3.0) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }, [predictedCGPA])

  const cgpaGradientFrom = useMemo(() => {
    if (predictedCGPA >= 3.5) return 'oklch(0.696 0.17 162.48)'
    if (predictedCGPA >= 3.0) return 'oklch(0.769 0.188 70.08)'
    return 'oklch(0.577 0.245 27.325)'
  }, [predictedCGPA])

  const cgpaGradientTo = useMemo(() => {
    if (predictedCGPA >= 3.5) return 'oklch(0.6 0.118 184.704)'
    if (predictedCGPA >= 3.0) return 'oklch(0.646 0.222 41.116)'
    return 'oklch(0.646 0.222 41.116)'
  }, [predictedCGPA])

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
                {predictedCGPA.toFixed(2)}
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
                  {category === 'high' ? 'On Track for Dean\'s List' : category === 'medium' ? 'Good Standing' : 'Needs Improvement'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Baseline: {baselineCGPA.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                +{(predictedCGPA - baselineCGPA).toFixed(2)} from baseline trajectory
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
                <Progress value={subMetrics.studyConsistency} className="h-2" />
                <p className="text-xs text-muted-foreground">{subMetrics.studyConsistency}% rate</p>
              </div>

              {/* Weekly Active Hours */}
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Active Hours
                </div>
                <p className="text-2xl font-bold">{subMetrics.weeklyActiveHours}h</p>
                <p className="text-xs text-muted-foreground">This week</p>
              </div>

              {/* Quiz Score Trend (Sparkline) */}
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  Quiz Trend
                </div>
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
                <p className="text-xs text-muted-foreground">
                  +{subMetrics.quizScoreTrend[7] - subMetrics.quizScoreTrend[0]}% over 8 weeks
                </p>
              </div>

              {/* Interaction Density */}
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BrainCircuit className="h-3.5 w-3.5 text-muted-foreground" />
                  Interactions
                </div>
                <p className="text-2xl font-bold">{subMetrics.interactionDensity}</p>
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
                    strokeDasharray={`${confidenceLevel * 2.64} ${264 - confidenceLevel * 2.64}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold">{confidenceLevel}%</span>
                  <span className="text-xs text-muted-foreground">Confidence</span>
                </div>
              </div>

              <div className="mt-4 w-full space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data Points</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className="font-medium">±0.12 CGPA</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">2h ago</span>
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {subjectBreakdown.map((subject) => (
                <div
                  key={subject.name}
                  className="flex flex-col gap-1.5 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{subject.name}</p>
                    {getTrendIcon(subject.trend)}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">{subject.predictedGrade}</span>
                    <span className="text-xs text-muted-foreground">({subject.gpa.toFixed(1)})</span>
                  </div>
                  <Progress
                    value={(subject.gpa / 4.0) * 100}
                    className="h-1.5"
                  />
                </div>
              ))}
            </div>
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
              <p className="text-sm leading-relaxed">{tip}</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Complete 3 pending materials in Database Systems</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Review OS concepts — score dropped last quiz</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Maintain Web Dev momentum — your strongest topic</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
