'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Brain,
  Sparkles,
  Loader2,
  Play,
  RefreshCw,
  Lightbulb,
  Target,
  TrendingUp,
  BookOpen,
  Clock,
  CalendarCheck,
  Zap,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  HelpCircle,
  Activity,
  Wand2,
  MessageSquareText,
  Info,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type LearningProfileType = 'Analytical Learner' | 'Sequential Learner' | 'Visual Learner' | 'Practical Learner' | 'Exploratory Learner' | 'Developing Profile'
type EffectLevel = 'Strong Improvement' | 'Likely Improvement' | 'Minor Improvement' | 'No Significant Impact'
type SimulationScenario =
  | 'STUDY_TWO_MORE_HOURS_WEEKLY'
  | 'REVIEW_BEFORE_QUIZZES'
  | 'TAKE_SHORT_BREAKS'
  | 'MAINTAIN_DAILY_SCHEDULE'
  | 'COMPLETE_MORE_PRACTICE_TESTS'
  | 'FOCUS_ON_WEAK_TOPICS'
  | 'REDUCE_LAST_MINUTE_STUDYING'
  | 'INCREASE_REVISION_FREQUENCY'

interface DigitalTwinProfile {
  learningProfileType: LearningProfileType
  strongestHabit: string
  biggestOpportunity: string
  studyConsistency: number
  revisionFrequency: number
  weakTopics: string[]
  engagementLevel: number
  dataSufficiency: 'sufficient' | 'partial' | 'insufficient'
  aiProfileSummary?: string | null
}

interface TwinInsight {
  id: string
  text: string
  category: 'timing' | 'retention' | 'consistency' | 'topic' | 'method'
  confidence: 'high' | 'medium' | 'low'
  aiEnhanced?: boolean
}

interface SimulationImpact {
  area: string
  effect: EffectLevel
}

interface EvidenceMetric {
  label: string
  value: string | number
  highlight?: boolean
  accent?: 'emerald' | 'cyan' | 'amber' | 'muted'
}

interface SimulationEvidence {
  title: string
  metrics: EvidenceMetric[]
  explanation?: string
  dataPoints: number
  period: string
}

interface SimulationResult {
  scenario: SimulationScenario
  scenarioLabel: string
  impacts: SimulationImpact[]
  reasoning: string
  evidence: SimulationEvidence | null
}

const SCENARIOS: { id: SimulationScenario; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { id: 'STUDY_TWO_MORE_HOURS_WEEKLY', label: 'Study 2 More Hours Weekly', icon: Clock, description: 'Add 2 hours of focused study time each week' },
  { id: 'REVIEW_BEFORE_QUIZZES', label: 'Review Before Quizzes', icon: BookOpen, description: 'Add review sessions before taking quizzes' },
  { id: 'TAKE_SHORT_BREAKS', label: 'Take Short Breaks', icon: Activity, description: 'Insert short breaks between study sessions' },
  { id: 'MAINTAIN_DAILY_SCHEDULE', label: 'Maintain Daily Study Schedule', icon: CalendarCheck, description: 'Study at consistent times every day' },
  { id: 'COMPLETE_MORE_PRACTICE_TESTS', label: 'Complete More Practice Tests', icon: Zap, description: 'Increase practice test attempts' },
  { id: 'FOCUS_ON_WEAK_TOPICS', label: 'Focus On Weak Topics', icon: Target, description: 'Spend more time on topics with mistakes' },
  { id: 'REDUCE_LAST_MINUTE_STUDYING', label: 'Reduce Last Minute Studying', icon: AlertCircle, description: 'Avoid cramming before assessments' },
  { id: 'INCREASE_REVISION_FREQUENCY', label: 'Increase Revision Frequency', icon: RefreshCw, description: 'Review materials more often at spaced intervals' },
]

const effectConfig: Record<EffectLevel, { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  'Strong Improvement': { color: 'text-emerald-500', bg: 'bg-emerald-500/15', icon: TrendingUp },
  'Likely Improvement': { color: 'text-cyan-500', bg: 'bg-cyan-500/15', icon: ArrowUpRight },
  'Minor Improvement': { color: 'text-amber-500', bg: 'bg-amber-500/15', icon: HelpCircle },
  'No Significant Impact': { color: 'text-muted-foreground', bg: 'bg-white/5', icon: BarChart3 },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
}

function GlassCard({ children, className, hover, glow, variant, breathing }: {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: string
  variant?: string
  breathing?: boolean
}) {
  return (
    <Card className={cn(
      'border border-white/10 bg-card/60 backdrop-blur-sm',
      hover && 'transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5',
      breathing && 'animate-pulse',
      className
    )}>
      {children}
    </Card>
  )
}

export default function DigitalTwinPage() {
  const [profile, setProfile] = useState<DigitalTwinProfile | null>(null)
  const [insights, setInsights] = useState<TwinInsight[]>([])
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('resnor_token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const [profileRes, insightsRes] = await Promise.all([
        fetch('/api/digital-twin/profile', { headers }).then(r => r.json()),
        fetch('/api/digital-twin/insights', { headers }).then(r => r.json()),
      ])

      setProfile(profileRes.data)
      setInsights(insightsRes.data ?? [])
    } catch (err) {
      setError('Unable to load your Digital Twin. Please try again.')
      console.error('Digital twin fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const runSimulation = useCallback(async () => {
    if (!selectedScenario) return
    setIsSimulating(true)
    try {
      const token = localStorage.getItem('resnor_token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch('/api/digital-twin/simulate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ scenario: selectedScenario }),
      }).then(r => r.json())
      setSimulationResult(response.data)
    } catch (err) {
      console.error('Simulation error:', err)
    } finally {
      setIsSimulating(false)
    }
  }, [selectedScenario])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Digital Twin</h2>
            <p className="text-sm text-muted-foreground">Your behavior simulation & insight engine</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Digital Twin</h2>
            <p className="text-sm text-muted-foreground">Your behavior simulation & insight engine</p>
          </div>
        </div>
        <Card className="flex flex-col items-center justify-center py-12 border-white/10 bg-card/60 backdrop-blur-sm">
          <Activity className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchData} variant="outline" size="sm" className="mt-4 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  if (!profile) return null

  const isInsufficientData = profile.dataSufficiency === 'insufficient'

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Digital Twin</h2>
            <p className="text-sm text-muted-foreground">Your behavior simulation & insight engine</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm" className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard hover className="relative overflow-hidden p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <Brain className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Learning Profile</p>
                <p className="text-base font-bold text-foreground leading-tight">{profile.learningProfileType}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard hover className="relative overflow-hidden p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
                <CheckCircle2 className="h-5 w-5 text-cyan-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Strongest Habit</p>
                <p className="text-base font-bold text-foreground leading-tight">{profile.strongestHabit}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard hover className="relative overflow-hidden p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <Target className="h-5 w-5 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Biggest Opportunity</p>
                <p className="text-base font-bold text-foreground leading-tight">{profile.biggestOpportunity}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <GlassCard className="text-center py-4 px-3">
            <p className="text-2xl font-bold text-emerald-500">{profile.studyConsistency}%</p>
            <p className="text-xs text-muted-foreground mt-1">Study Consistency</p>
          </GlassCard>
          <GlassCard className="text-center py-4 px-3">
            <p className="text-2xl font-bold text-cyan-500">{profile.revisionFrequency}%</p>
            <p className="text-xs text-muted-foreground mt-1">Revision Frequency</p>
          </GlassCard>
          <GlassCard className="text-center py-4 px-3">
            <p className="text-2xl font-bold text-emerald-500">{profile.engagementLevel}%</p>
            <p className="text-xs text-muted-foreground mt-1">Engagement Level</p>
          </GlassCard>
          <GlassCard className="text-center py-4 px-3">
            <p className="text-2xl font-bold text-cyan-500">{profile.weakTopics.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Weak Topics</p>
          </GlassCard>
        </div>
      </motion.div>

      {profile.aiProfileSummary && (
        <motion.div variants={itemVariants}>
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 backdrop-blur-sm p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 mt-0.5">
                <MessageSquareText className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-foreground">AI Profile Summary</h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                    <Wand2 className="h-3 w-3 mr-1" />
                    AI-Generated
                  </Badge>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{profile.aiProfileSummary}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
              <Lightbulb className="h-4 w-4 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Learning Insights</h3>
              <p className="text-xs text-muted-foreground">Generated from your academic activity history</p>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {insights.map((insight, i) => {
                const categoryIcon: Record<string, React.ComponentType<{ className?: string }>> = {
                  timing: Clock, retention: BookOpen, consistency: CalendarCheck, topic: Target, method: Zap,
                }
                const IconComp = categoryIcon[insight.category] || Lightbulb
                const confidenceColor: Record<string, string> = {
                  high: 'text-emerald-500', medium: 'text-amber-500', low: 'text-muted-foreground',
                }

                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 rounded-lg px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 mt-0.5">
                      <IconComp className="h-3.5 w-3.5 text-cyan-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-relaxed">{insight.text}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-cyan-500/20 text-cyan-500">
                          {insight.category}
                        </Badge>
                        <span className={cn('text-[10px]', confidenceColor[insight.confidence])}>
                          {insight.confidence} confidence
                        </span>
                        {insight.aiEnhanced && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                            <Wand2 className="h-2.5 w-2.5 mr-0.5" />
                            AI
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {insights.length === 0 && (
              <div className="text-center py-8">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Not enough data yet. Continue using RESNOR to build your Digital Twin.
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
              <Sparkles className="h-4 w-4 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">&quot;What If&quot; Simulator</h3>
              <p className="text-xs text-muted-foreground">Select a behavior change to simulate its potential impact</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 mb-4">
            {SCENARIOS.map((scenario) => {
              const IconComp = scenario.icon
              const isSelected = selectedScenario === scenario.id
              return (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 border',
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-foreground'
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.04] hover:border-white/10 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <IconComp className={cn('h-4 w-4 mt-0.5 shrink-0', isSelected ? 'text-cyan-500' : 'text-muted-foreground')} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{scenario.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{scenario.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <Button
            onClick={runSimulation}
            disabled={!selectedScenario || isSimulating}
            className="w-full sm:w-auto bg-cyan-500/20 text-cyan-600 hover:bg-cyan-500/30 border border-cyan-500/20 h-11 font-semibold"
            variant="outline"
          >
            {isSimulating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Simulating...</>
            ) : (
              <><Play className="mr-2 h-4 w-4" />Simulate</>
            )}
          </Button>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {simulationResult && (
          <motion.div
            key={simulationResult.scenario}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Simulation Results: {simulationResult.scenarioLabel}
                </h3>
                <p className="text-xs text-muted-foreground">Based on your historical data</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-5">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Expected Improvements
                </h4>
                <div className="space-y-2.5">
                  {simulationResult.impacts.map((impact, i) => {
                    const config = effectConfig[impact.effect]
                    const EffectIcon = config.icon
                    return (
                      <motion.div
                        key={impact.area}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2.5"
                      >
                        <span className="text-sm text-foreground">{impact.area}</span>
                        <div className="flex items-center gap-1.5">
                          <EffectIcon className={cn('h-3.5 w-3.5', config.color)} />
                          <span className={cn('text-xs font-semibold', config.color)}>{impact.effect}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </Card>

              <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-5">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-cyan-500" />
                  Why This Matters
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{simulationResult.reasoning}</p>
                {isInsufficientData && (
                  <div className="mt-3 rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2">
                    <p className="text-xs text-amber-500">Limited data available. Continue using RESNOR for more accurate simulations.</p>
                  </div>
                )}
              </Card>

              <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-5">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-500" />
                  Supporting Evidence
                </h4>
                {simulationResult.evidence ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {simulationResult.evidence.title}
                    </p>
                    <div className="space-y-1.5">
                      {simulationResult.evidence.metrics.map((metric, i) => {
                        const colorMap: Record<string, string> = {
                          emerald: 'text-emerald-500', cyan: 'text-cyan-500', amber: 'text-amber-500', muted: 'text-muted-foreground',
                        }
                        const bgMap: Record<string, string> = {
                          emerald: 'bg-emerald-500/8', cyan: 'bg-cyan-500/8', amber: 'bg-amber-500/8', muted: 'bg-white/[0.03]',
                        }
                        const accent = metric.accent || 'muted'
                        return (
                          <TooltipProvider key={metric.label}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.07 }}
                                  className={cn('flex items-center justify-between rounded-lg border border-white/[0.04] px-3 py-2 cursor-default', bgMap[accent])}
                                >
                                  <span className="text-sm text-foreground/80">{metric.label}</span>
                                  <span className={cn('text-sm font-bold', colorMap[accent], metric.highlight && 'text-base')}>
                                    {metric.value}
                                  </span>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
                                <p>Calculated from your last 30 days of activity.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                    </div>
                    {simulationResult.evidence.explanation && (
                      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
                        <p className="text-xs text-foreground/70 leading-relaxed">{simulationResult.evidence.explanation}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">Based on {simulationResult.evidence.dataPoints} data points</p>
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] text-muted-foreground">{simulationResult.evidence.period}</p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground/50 cursor-default" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
                              <p>All metrics shown above are calculated from your last 30 days of activity.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-4 py-6 text-center">
                    <HelpCircle className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Not enough data yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Continue using RESNOR to build your Digital Twin.</p>
                  </div>
                )}
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <Card className="border-white/10 bg-card/60 backdrop-blur-sm py-3 px-4">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            The Digital Twin is not a grade predictor. It is a personalized behavioral simulation engine that analyzes
            your historical learning patterns and shows how different study strategies may affect your academic outcomes.
            Every recommendation is backed by your own data.
          </p>
        </Card>
      </motion.div>
    </motion.div>
  )
}
