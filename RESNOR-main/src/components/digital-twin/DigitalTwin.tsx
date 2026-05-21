'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import {
  Clock,
  Target,
  Activity,
  Zap,
  Coffee,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  SlidersHorizontal,
  GraduationCap,
} from 'lucide-react'

// --- Types ---

interface SimulationParams {
  weeklyHours: number
  quizTarget: number
  consistency: number
  engagement: number
  breakFreq: number
}

// --- Constants ---

const BASELINE_CGPA = 3.15
const WEEKS = 8

const digitalTwinConfig = {
  projected: { label: 'Projected CGPA', color: 'oklch(0.646 0.222 41.116)' },
  baseline: { label: 'Baseline CGPA', color: 'oklch(0.828 0.189 84.429)' },
} satisfies ChartConfig

// Preset scenarios for scenario comparison
interface ScenarioPreset {
  id: string
  label: string
  emoji: string
  description: string
  params: SimulationParams
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'conservative',
    label: 'Conservative',
    emoji: '🐢',
    description: 'Lower hours, moderate targets',
    params: {
      weeklyHours: 8,
      quizTarget: 65,
      consistency: 50,
      engagement: 40,
      breakFreq: 5,
    },
  },
  {
    id: 'current',
    label: 'Current',
    emoji: '⚡',
    description: 'Your current slider values',
    params: {} as SimulationParams,
  },
  {
    id: 'ambitious',
    label: 'Ambitious',
    emoji: '🚀',
    description: 'Higher hours, aggressive targets',
    params: {
      weeklyHours: 30,
      quizTarget: 95,
      consistency: 95,
      engagement: 90,
      breakFreq: 3,
    },
  },
]

// --- Helpers ---

function computeProjectedCGPA(params: SimulationParams): number {
  const { weeklyHours, quizTarget, consistency, engagement, breakFreq } = params
  const cgpa =
    BASELINE_CGPA +
    (weeklyHours / 40) * 0.5 +
    ((quizTarget - 60) / 100) * 0.3 +
    (consistency / 100) * 0.4 +
    (engagement / 100) * 0.2 -
    ((breakFreq - 3) / 10) * 0.1
  return Math.min(4.0, Math.max(1.0, parseFloat(cgpa.toFixed(2))))
}

function generateProjectionData(params: SimulationParams) {
  const finalCGPA = computeProjectedCGPA(params)
  const data: Array<{ week: string; projected: number; baseline: number }> = []

  for (let week = 0; week <= WEEKS; week++) {
    // Smooth interpolation from baseline to projected final CGPA
    const progress = week / WEEKS
    // Apply easing for more realistic trajectory
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2

    const projected = BASELINE_CGPA + (finalCGPA - BASELINE_CGPA) * eased
    // Baseline grows slightly over time (natural progression)
    const baseline = BASELINE_CGPA + progress * 0.08

    data.push({
      week: week === 0 ? 'Now' : `Wk ${week}`,
      projected: parseFloat(projected.toFixed(2)),
      baseline: parseFloat(baseline.toFixed(2)),
    })
  }

  return data
}

// --- Slider Config ---

interface SliderConfig {
  key: keyof SimulationParams
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
  icon: React.ComponentType<{ className?: string }>
  unit?: string
  description: string
  // Impact: positive means higher is better
  impact: 'positive' | 'neutral'
}

const sliderConfigs: SliderConfig[] = [
  {
    key: 'weeklyHours',
    label: 'Weekly Study Hours',
    min: 0,
    max: 40,
    step: 1,
    defaultValue: 14,
    icon: Clock,
    unit: 'hrs',
    description: 'Total hours spent studying per week',
    impact: 'positive',
  },
  {
    key: 'quizTarget',
    label: 'Quiz Score Target',
    min: 50,
    max: 100,
    step: 1,
    defaultValue: 75,
    icon: Target,
    unit: '%',
    description: 'Target average score for upcoming quizzes',
    impact: 'positive',
  },
  {
    key: 'consistency',
    label: 'Study Consistency',
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 70,
    icon: Activity,
    unit: '%',
    description: 'How regularly you maintain your study schedule',
    impact: 'positive',
  },
  {
    key: 'engagement',
    label: 'Active Engagement',
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 65,
    icon: Zap,
    unit: '%',
    description: 'Level of active participation in learning activities',
    impact: 'positive',
  },
  {
    key: 'breakFreq',
    label: 'Break Frequency',
    min: 1,
    max: 10,
    step: 1,
    defaultValue: 3,
    icon: Coffee,
    description: 'Number of study breaks per session (optimal: 3-5)',
    impact: 'neutral',
  },
]

// --- Component ---

export default function DigitalTwin() {
  const [params, setParams] = useState<SimulationParams>({
    weeklyHours: 14,
    quizTarget: 75,
    consistency: 70,
    engagement: 65,
    breakFreq: 3,
  })
  const [activeScenario, setActiveScenario] = useState<string>('current')

  const handleSliderChange = useCallback(
    (key: keyof SimulationParams, value: number[]) => {
      setParams((prev) => ({ ...prev, [key]: value[0] }))
      setActiveScenario('current')
    },
    []
  )

  const handlePresetClick = useCallback((preset: ScenarioPreset) => {
    setActiveScenario(preset.id)
    if (preset.id !== 'current') {
      setParams({ ...preset.params })
    }
  }, [])

  const projectedCGPA = useMemo(() => computeProjectedCGPA(params), [params])
  const finalBaselineCGPA = useMemo(() => BASELINE_CGPA + 0.08, [])
  const improvement = useMemo(
    () => projectedCGPA - finalBaselineCGPA,
    [projectedCGPA, finalBaselineCGPA]
  )
  const chartData = useMemo(() => generateProjectionData(params), [params])

  const improvementBadge = useMemo(() => {
    if (improvement > 0.1) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          +{improvement.toFixed(2)} above baseline
        </Badge>
      )
    } else if (improvement < -0.05) {
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-0">
          <ArrowDownRight className="h-3 w-3 mr-1" />
          {improvement.toFixed(2)} below baseline
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <Minus className="h-3 w-3 mr-1" />
        On par with baseline
      </Badge>
    )
  }, [improvement])

  const projectedColor = useMemo(() => {
    if (projectedCGPA >= 3.5) return 'text-emerald-600 dark:text-emerald-400'
    if (projectedCGPA >= 3.0) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }, [projectedCGPA])

  // Gradient background for CGPA card based on projection
  const cgpaCardGradient = useMemo(() => {
    if (projectedCGPA >= 3.5) return 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20'
    if (projectedCGPA >= 3.0) return 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20'
    return 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20'
  }, [projectedCGPA])

  const cgpaCardBorder = useMemo(() => {
    if (projectedCGPA >= 3.5) return 'border-emerald-200 dark:border-emerald-800/50'
    if (projectedCGPA >= 3.0) return 'border-amber-200 dark:border-amber-800/50'
    return 'border-red-200 dark:border-red-800/50'
  }, [projectedCGPA])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Panel: Sliders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="h-4 w-4" />
              Simulation Parameters
            </CardTitle>
            <CardDescription>
              Adjust sliders to see how different study behaviors affect your projected CGPA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sliderConfigs.map((config) => {
              const Icon = config.icon
              const value = params[config.key]
              const percentage = ((value - config.min) / (config.max - config.min)) * 100
              const trackColor = config.impact === 'positive'
                ? 'bg-emerald-500'
                : 'bg-amber-500'

              return (
                <div key={config.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {config.label}
                    </div>
                    <span className="text-sm font-mono font-semibold tabular-nums">
                      {value}
                      {config.unit && (
                        <span className="text-muted-foreground font-normal">
                          {config.unit}
                        </span>
                      )}
                    </span>
                  </div>
                  {/* Custom slider with colored track */}
                  <div className="relative">
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full pointer-events-none" style={{ width: `${percentage}%`, backgroundColor: config.impact === 'positive' ? '#10b981' : '#f59e0b' }} />
                    <Slider
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={[value]}
                      onValueChange={(v) => handleSliderChange(config.key, v)}
                      className="relative z-10 [&_[role=slider]]:shadow-[0_0_8px_rgba(16,185,129,0.4)] [&_[role=slider]]:hover:shadow-[0_0_12px_rgba(16,185,129,0.6)] [&_[role=slider]]:active:shadow-[0_0_16px_rgba(16,185,129,0.8)]"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Right Panel: Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Projected CGPA Trajectory
            </CardTitle>
            <CardDescription>
              Real-time simulation based on your parameter inputs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={digitalTwinConfig} className="aspect-[4/3] w-full">
              <LineChart data={chartData} margin={{ left: -20, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  domain={[2.5, 4.0]}
                  tickCount={4}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <ReferenceLine
                  y={BASELINE_CGPA}
                  stroke="oklch(0.828 0.189 84.429)"
                  strokeDasharray="6 4"
                  strokeOpacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="oklch(0.646 0.222 41.116)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'oklch(0.646 0.222 41.116)' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="baseline"
                  stroke="oklch(0.828 0.189 84.429)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Comparison Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4" />
            Scenario Comparison
          </CardTitle>
          <CardDescription>
            Click a preset to see how different strategies affect your CGPA projection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {SCENARIO_PRESETS.map((preset) => {
              const isActive = activeScenario === preset.id
              const presetParams = preset.id === 'current' ? params : preset.params
              const presetCGPA = computeProjectedCGPA(presetParams)

              return (
                <motion.button
                  key={preset.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePresetClick(preset)}
                  className={`flex items-center gap-3 rounded-xl border-2 px-5 py-3 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30 bg-background'
                  }`}
                >
                  <span className="text-xl">{preset.emoji}</span>
                  <div className="text-left">
                    <div className="text-sm font-semibold">{preset.label}</div>
                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                    <div className="mt-1 text-base font-bold tabular-nums">
                      CGPA: {presetCGPA.toFixed(2)}
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <span className="text-xs">✓</span>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={`sm:col-span-2 lg:col-span-2 ${cgpaCardGradient} ${cgpaCardBorder}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expected Final CGPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <motion.span
                key={projectedCGPA.toFixed(2)}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`text-5xl font-extrabold tabular-nums ${projectedColor}`}
              >
                {projectedCGPA.toFixed(2)}
              </motion.span>
              <div>
                <p className="text-sm text-muted-foreground">
                  out of 4.00
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {projectedCGPA >= 3.7
                    ? 'Distinction level'
                    : projectedCGPA >= 3.5
                      ? 'Merit level'
                      : projectedCGPA >= 3.0
                        ? 'Good standing'
                        : 'Needs improvement'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Improvement vs Baseline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span
                className={`text-5xl font-extrabold tabular-nums ${
                  improvement > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : improvement < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-muted-foreground'
                }`}
              >
                {improvement > 0 ? '+' : ''}{improvement.toFixed(2)}
              </span>
              <div className="space-y-1">
                {improvementBadge}
                <p className="text-xs text-muted-foreground">
                  Compared to current trajectory ({finalBaselineCGPA.toFixed(2)})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
