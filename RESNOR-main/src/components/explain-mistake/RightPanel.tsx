'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { MisconceptionRecord, RemediationExerciseData, MistakeExplanationData, QuizQuestion } from './types'
import {
  Brain,
  TrendingUp,
  Lightbulb,
  BarChart3,
  Target,
  Sparkles,
  BookOpen,
  Clock,
  Loader2,
  StickyNote,
  CheckCircle2,
} from 'lucide-react'
import { useAppStore } from '@/stores/app'

type RightPanelVariant = 'full' | 'misconceptions' | 'exercises'

interface RightPanelProps {
  misconceptions: MisconceptionRecord[]
  exercises: RemediationExerciseData[]
  loading: boolean
  onCompleteExercise: (exerciseId: string) => void
  onGenerateExercises?: () => void
  activeExplanation?: MistakeExplanationData | null
  question?: QuizQuestion | null
  variant?: RightPanelVariant
}

const recoveryStatusConfig: Record<string, { label: string; color: string; icon: string }> = {
  NOT_STARTED: { label: 'Not Started', color: 'text-gray-500 bg-gray-500/10', icon: '○' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-600 bg-amber-500/10', icon: '◐' },
  PRACTICING: { label: 'Practicing', color: 'text-blue-600 bg-blue-500/10', icon: '●' },
  MASTERED: { label: 'Mastered', color: 'text-emerald-600 bg-emerald-500/10', icon: '✔' },
  REVIEWING: { label: 'Reviewing', color: 'text-violet-600 bg-violet-500/10', icon: '↻' },
}

export default function RightPanel({ misconceptions, exercises, loading, onCompleteExercise, onGenerateExercises, activeExplanation, question, variant = 'full' }: RightPanelProps) {
  const [expandedMisconception, setExpandedMisconception] = useState<string | null>(null)
  const [showAllMisconceptions, setShowAllMisconceptions] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiGaps, setAiGaps] = useState<string[]>([])
  const [gapsLoading, setGapsLoading] = useState(false)
  const gapsKeyRef = useRef('')
  const DISPLAY_LIMIT = 5

  useEffect(() => {
    const key = activeExplanation ? `${activeExplanation.mistakeSummary}-${activeExplanation.rootCauseAnalysis?.slice(0, 50)}` : ''
    if (!key || key === gapsKeyRef.current) return
    gapsKeyRef.current = key
    setGapsLoading(true)
    setAiGaps([])
    fetch('/api/quiz/explain-mistake/knowledge-gaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: question?.text || '',
        studentAnswer: question?.studentAnswer || '',
        correctAnswer: question?.correctAnswer || '',
        rootCauseAnalysis: activeExplanation?.rootCauseAnalysis || '',
        reasoningBreakdown: activeExplanation?.reasoningBreakdown || '',
        quickFix: activeExplanation?.quickFix || '',
        correctConceptExplanation: activeExplanation?.correctConceptExplanation || '',
        simplifiedAnalogy: activeExplanation?.simplifiedAnalogy || '',
        stepByStepCorrection: activeExplanation?.stepByStepCorrection || '',
        preventionTips: activeExplanation?.preventionTips || '',
      }),
    })
      .then((res) => res.json())
      .then((data) => setAiGaps(Array.isArray(data.gaps) ? data.gaps : []))
      .catch(() => setAiGaps([]))
      .finally(() => setGapsLoading(false))
  }, [activeExplanation, question])

  const visibleMisconceptions = showAllMisconceptions ? misconceptions : misconceptions.slice(0, DISPLAY_LIMIT)

  const recoveryProgress = misconceptions.length > 0
    ? Math.round(
        (misconceptions.filter((m) => m.recoveryStatus === 'MASTERED' || m.recoveryStatus === 'PRACTICING').length /
          misconceptions.length) * 100
      )
    : 0

  if (loading) {
    return (
      <div className="flex flex-col h-full gap-3">
        <Card className="bg-card/60 backdrop-blur-xl border-border/50 rounded-2xl shadow-none">
          <CardContent className="p-3">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur-xl border-border/50 rounded-2xl shadow-none">
          <CardContent className="p-3 space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {variant !== 'exercises' && (
        <Card className="bg-card/60 backdrop-blur-xl border-border/50 rounded-2xl shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-600" />
                <span className="text-xs font-semibold">Recovery Progress</span>
              </div>
              <span className="text-xs font-bold text-emerald-600">{recoveryProgress}%</span>
            </div>
            <Progress value={recoveryProgress} className="h-1.5" />
          </CardContent>
        </Card>
      )}

      {variant !== 'exercises' && (
        <Card className="bg-card/60 backdrop-blur-xl border-border/50 rounded-2xl shadow-none flex-1 overflow-hidden flex flex-col">
          <CardContent className="p-3 pb-0">
            {activeExplanation && gapsLoading && (
              <div className="flex items-center gap-2 text-muted-foreground px-1 py-2">
                <Loader2 className="size-3 animate-spin" />
                <span className="text-[11px]">Analyzing knowledge gaps...</span>
              </div>
            )}

            {activeExplanation && !gapsLoading && aiGaps.length > 0 && (
              <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-md bg-indigo-500/15">
                    <BarChart3 className="size-3 text-indigo-600" />
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">Knowledge Gaps</span>
                </div>
                <div className="space-y-1.5">
                  {aiGaps.map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="size-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <p className="text-[11px] leading-relaxed text-foreground/80">{point}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const title = question?.text
                      ? `Knowledge Gaps: ${question.text.slice(0, 60)}${question.text.length > 60 ? '...' : ''}`
                      : 'Knowledge Gaps'
                    const content = aiGaps.map((g) => `- ${g}`).join('\n')
                    useAppStore.getState().setPendingNoteData({ title, content })
                    useAppStore.getState().setActivePage('notes')
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 transition-all"
                >
                  <StickyNote className="size-3.5" />
                  Save as Study Note
                </button>
              </div>
            )}

            {activeExplanation && !gapsLoading && aiGaps.length === 0 && (
              <div className="rounded-xl bg-muted/30 border border-border/40 p-3 text-center">
                <p className="text-[11px] text-muted-foreground/60">No knowledge gaps identified</p>
              </div>
            )}
          </CardContent>

          <CardHeader className="p-3 pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="size-4 text-rose-600" />
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Misconception History
                </CardTitle>
              </div>
              {misconceptions.length > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {misconceptions.length} tracked
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 flex-1 overflow-y-auto scrollbar-thin">
            {misconceptions.length > 0 ? (
              <div className="space-y-1.5">
                {visibleMisconceptions.map((mc) => {
                  const config = recoveryStatusConfig[mc.recoveryStatus] || recoveryStatusConfig.NOT_STARTED
                  const isExpanded = expandedMisconception === mc.id
                  return (
                    <button
                      key={mc.id}
                      onClick={() => setExpandedMisconception(isExpanded ? null : mc.id)}
                      className="w-full text-left p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 transition-all"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${config.color}`}
                        >
                          {config.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium truncate">{mc.conceptLabel}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              ×{mc.frequencyCounter} occurrences
                            </span>
                            <span className="text-[10px] text-muted-foreground">Last: {mc.lastTriggeredAt}</span>
                          </div>
                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
                              {mc.relatedQuestions.length > 0 ? (
                                mc.relatedQuestions.map((rq, i) => (
                                  <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-md px-2 py-1.5">
                                    <BookOpen className="size-3 text-violet-500 shrink-0" />
                                    <p className="text-[11px] font-medium text-foreground truncate min-w-0">
                                      {rq.conceptLabel || 'Unknown concept'}
                                    </p>
                                    <span className="text-[9px] text-muted-foreground shrink-0 ml-auto">{rq.date}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[11px] text-muted-foreground">{mc.patternDescription}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
                {!showAllMisconceptions && misconceptions.length > DISPLAY_LIMIT && (
                  <button
                    onClick={() => setShowAllMisconceptions(true)}
                    className="w-full text-center py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    See More ({misconceptions.length - DISPLAY_LIMIT} hidden)
                  </button>
                )}
                {showAllMisconceptions && misconceptions.length > DISPLAY_LIMIT && (
                  <button
                    onClick={() => setShowAllMisconceptions(false)}
                    className="w-full text-center py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Show Less
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-5 space-y-2">
                <div className="flex justify-center">
                  <div className="flex size-9 items-center justify-center rounded-full bg-violet-500/10">
                    <Clock className="size-4 text-violet-600" />
                  </div>
                </div>
                <p className="text-xs text-foreground/70 font-medium">No patterns detected yet</p>
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-[220px] mx-auto">
                  Misconception clusters will appear here once the system detects recurring conceptual patterns.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {variant !== 'misconceptions' && (
        <>
          <Card className="bg-card/60 backdrop-blur-xl border-border/50 rounded-2xl shadow-none">
            <CardHeader className="p-3 pb-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-violet-600" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Remediation Exercises
                  </CardTitle>
                </div>
                {exercises.length > 0 && (
                  <Badge variant="outline" className="text-[10px]">
                    {exercises.filter((e) => e.isCompleted).length}/{exercises.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {exercises.length > 0 ? (
                <div className="space-y-2">
                  {exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        ex.isCompleted
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-border/50 hover:bg-muted/50'
                      }`}
                      onClick={() => { if (!ex.isCompleted) onCompleteExercise(ex.id) }}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`flex size-6 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                            ex.isCompleted ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {ex.isCompleted ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <Lightbulb className="size-3" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium leading-snug line-clamp-2">{ex.question}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              {ex.exerciseType?.replace('_', ' ') || 'exercise'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 ${
                                ex.difficulty === 'easy'
                                  ? 'text-emerald-600 border-emerald-200'
                                  : ex.difficulty === 'medium'
                                    ? 'text-amber-600 border-amber-200'
                                    : 'text-rose-600 border-rose-200'
                              }`}
                            >
                              {ex.difficulty || 'adaptive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <div className="flex justify-center">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <BookOpen className="size-5 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">No exercises yet</p>
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-[220px] mx-auto">
                    Practice exercises will appear once we analyze your mistakes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            variant="default"
            size="sm"
            className="shrink-0 w-full gap-2"
            onClick={() => {
              setGenerating(true)
              onGenerateExercises?.()
              setTimeout(() => setGenerating(false), 2000)
            }}
            disabled={generating}
          >
            {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {generating ? 'Generating...' : exercises.length > 0 ? 'Generate More Practice' : 'Generate Practice'}
          </Button>
        </>
      )}
    </div>
  )
}
