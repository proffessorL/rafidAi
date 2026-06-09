'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  ListChecks,
  Shield,
  RefreshCw,
  Sparkles,
  Brain,
  ChevronRight,
  MessageSquare,
  Target,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react'
import type { QuizQuestion, MistakeExplanationData } from './types'
import { resolveOptionText } from './types'

interface CenterPanelProps {
  question: QuizQuestion
  attemptId: string
  activeTab: 'diagnosis' | 'mastery' | 'misconceptions'
  explanation: MistakeExplanationData | null
  isLoading: boolean
  questionNumber?: number
  onSwitchToMastery?: () => void
}

function StreamedText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    setIsComplete(false)
    indexRef.current = 0
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1))
        indexRef.current++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <span>
      {displayed}
      {!isComplete && (
        <span className="inline-block w-0.5 h-4 bg-primary/70 animate-pulse ml-0.5 align-middle" />
      )}
    </span>
  )
}

const LOADING_STEPS = [
  'Analyzing your mistake...',
  'Pinpointing the root cause...',
  'Tracing your reasoning path...',
  'Building your explanation...',
  'Almost there...',
]

export default function CenterPanel({ question, attemptId, activeTab, explanation, isLoading, questionNumber, onSwitchToMastery }: CenterPanelProps) {
  const [showStreaming, setShowStreaming] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [loadingStep, setLoadingStep] = useState(LOADING_STEPS[0])

  useEffect(() => {
    if (!isLoading) { setLoadingStep(LOADING_STEPS[0]); return }
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        const idx = LOADING_STEPS.indexOf(prev)
        return LOADING_STEPS[(idx + 1) % LOADING_STEPS.length]
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [isLoading])

  useEffect(() => {
    setShowStreaming(false)
    if (explanation) {
      const timer = setTimeout(() => setShowStreaming(true), 300)
      return () => clearTimeout(timer)
    }
  }, [explanation])

  const handleRegenerate = () => {
    setRegenerating(true)
    setShowStreaming(false)
    setTimeout(() => {
      setShowStreaming(true)
      setRegenerating(false)
    }, 500)
  }

  if (!question.isCorrect) {
    if (activeTab === 'misconceptions') return null
    const isDiagnosis = activeTab === 'diagnosis'

    return (
      <div className="flex flex-col gap-4">
        <Card className="bg-card/60 backdrop-blur-xl border-l-4 border-l-rose-500/60">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                <Brain className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Question #{questionNumber ?? '?'}
                  </p>
                  {question.mistakeType && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-rose-600 border-rose-200 dark:border-rose-800">
                      {question.mistakeType.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium leading-relaxed">{question.text}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 px-3 py-2">
                <p className="text-[9px] text-rose-500 uppercase tracking-wider font-medium mb-0.5">Your Answer</p>
                <p className="text-xs text-rose-600 dark:text-rose-400">{resolveOptionText(question, question.studentAnswer)}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                <p className="text-[9px] text-emerald-500 uppercase tracking-wider font-medium mb-0.5">Correct Answer</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{resolveOptionText(question, question.correctAnswer)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-8">
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="relative flex items-center justify-center">
                <motion.div
                  className="absolute size-24 rounded-full border-2 border-primary/10"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute size-20 rounded-full border-2 border-dashed border-primary/20"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Brain className="size-7 text-violet-600" />
                </motion.div>
              </div>

              <div className="text-center space-y-2">
                <motion.p
                  key={loadingStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-medium text-foreground"
                >
                  {loadingStep}
                </motion.p>
                <p className="text-xs text-muted-foreground">
                  AI is analyzing your mistake pattern
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="size-2 rounded-full bg-violet-400"
                    animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : explanation ? (
          <>
            {isDiagnosis ? (
              <div className="space-y-0">
                <Card className="bg-card/60 backdrop-blur-xl overflow-hidden border-border/50 rounded-2xl shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 text-xs font-bold">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-semibold">What went wrong in your thinking?</p>
                        <p className="text-[10px] text-muted-foreground">Root cause analysis</p>
                      </div>
                    </div>
                    <div className="ml-[52px]">
                      {showStreaming ? (
                        <div className="rounded-lg bg-rose-500/5 border border-rose-500/15 p-3.5">
                          <div className="text-sm leading-relaxed text-foreground/85">
                            <StreamedText text={explanation.rootCauseAnalysis} speed={15} />
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-rose-500/5 border border-rose-500/15 p-3.5 space-y-1.5">
                          {explanation.rootCauseAnalysis
                            .split(/(?<=\.) /)
                            .filter(Boolean)
                            .map((sentence, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="size-1.5 rounded-full bg-rose-500/40 mt-2 shrink-0" />
                                <p className="text-sm leading-relaxed text-foreground/85">{sentence}</p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center -my-1 relative z-10">
                  <div className="size-5 rounded-full border-2 border-border/30 bg-background flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-muted-foreground/30" />
                  </div>
                </div>

                <Card className="bg-card/60 backdrop-blur-xl overflow-hidden border-border/50 rounded-2xl shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 text-xs font-bold">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Where did your reasoning break?</p>
                        <p className="text-[10px] text-muted-foreground">Your path vs the correct path</p>
                      </div>
                    </div>
                    <div className="ml-[52px] space-y-3">
                      {(() => {
                        const reasoning = explanation.reasoningBreakdown?.trim()
                          || explanation.rootCauseAnalysis?.trim()
                          || explanation.mistakeSummary?.trim()
                          || 'Unable to trace reasoning path.'
                        return reasoning.split('\n').filter(Boolean).length > 1 ? (
                          <div className="space-y-2">
                            {reasoning
                              .split('\n')
                              .filter(Boolean)
                              .map((line, i) => {
                                const stepMatch = line.match(/^(\d+)[.)]\s*(.*)/)
                                if (stepMatch) {
                                  return (
                                    <div key={i} className="flex items-start gap-3">
                                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-600">
                                        {stepMatch[1]}
                                      </span>
                                      <p className="text-sm leading-relaxed text-foreground/85 pt-0.5">{stepMatch[2]}</p>
                                    </div>
                                  )
                                }
                                const memMatch = line.match(/^(Memory rule|Tip|Heuristic|Reminder|Key insight|Takeaway)[:\s]+(.+)/i)
                                if (memMatch) {
                                  return (
                                    <div key={i} className="flex items-start gap-2 rounded-lg bg-violet-500/5 border border-violet-500/20 px-3 py-2">
                                      <Lightbulb className="size-4 text-violet-600 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">{memMatch[1]}</p>
                                        <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{memMatch[2]}</p>
                                      </div>
                                    </div>
                                  )
                                }
                                return (
                                  <p key={i} className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">{line}</p>
                                )
                              })}
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <div className="size-1.5 rounded-full bg-violet-500/40 mt-2 shrink-0" />
                            <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
                              {reasoning}
                            </p>
                          </div>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center -my-1 relative z-10">
                  <div className="size-5 rounded-full border-2 border-border/30 bg-background flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-muted-foreground/30" />
                  </div>
                </div>

                <Card className="bg-card/60 backdrop-blur-xl overflow-hidden border-border/50 rounded-2xl shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 text-xs font-bold">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-semibold">How to fix it now</p>
                        <p className="text-[10px] text-muted-foreground">Actionable takeaway</p>
                      </div>
                    </div>
                    <div className="ml-[52px] space-y-3">
                      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Shield className="size-3.5 text-emerald-600" />
                          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Quick Fix</p>
                        </div>
                        {explanation.quickFix && explanation.quickFix.split(/(?<=\.) /).filter(Boolean).length > 1 ? (
                          <div className="space-y-1">
                            {explanation.quickFix.split(/(?<=\.) /).filter(Boolean).map((sentence, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="size-1.5 rounded-full bg-emerald-500/40 mt-2 shrink-0" />
                                <p className="text-sm text-foreground/80 leading-relaxed">{sentence}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {explanation.quickFix || 'Review the core concept and practice similar problems.'}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onSwitchToMastery}
                        className="w-full gap-2 text-xs"
                      >
                        <Target className="size-3.5" />
                        Go to Remediation Exercises
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="bg-card/60 backdrop-blur-xl overflow-hidden border-border/50 rounded-2xl shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded bg-emerald-500/15">
                        <BookOpen className="size-3.5 text-emerald-600" />
                      </div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Correct concept
                      </h3>
                    </div>
                    <div className="pl-8 space-y-1.5">
                      {explanation.correctConceptExplanation
                        .split(/(?<=\.) /)
                        .filter(Boolean)
                        .map((sentence, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="size-1.5 rounded-full bg-emerald-500/40 mt-2 shrink-0" />
                            <p className="text-sm leading-relaxed text-foreground/85">{sentence}</p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-xl overflow-hidden border-border/50 rounded-2xl shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded bg-violet-500/15">
                        <Sparkles className="size-3.5 text-violet-600" />
                      </div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Simple analogy
                      </h3>
                    </div>
                    <div className="pl-8">
                      <div className="rounded-lg bg-violet-500/5 border border-violet-500/15 p-3.5 text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
                        {explanation.simplifiedAnalogy}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-xl overflow-hidden border-border/50 rounded-2xl shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded bg-blue-500/15">
                        <ListChecks className="size-3.5 text-blue-600" />
                      </div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Step-by-step correction
                      </h3>
                    </div>
                    <div className="pl-8 space-y-2">
                      {(Array.isArray(explanation.stepByStepCorrection)
                        ? explanation.stepByStepCorrection.join('\n')
                        : explanation.stepByStepCorrection || ''
                      ).split('\n')
                        .filter(Boolean)
                        .map((line, i) => {
                          const stepMatch = line.match(/^(\d+)[.)]\s*(.*)/)
                          if (stepMatch) {
                            return (
                              <div key={i} className="flex items-start gap-3">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-[11px] font-bold text-blue-600">
                                  {stepMatch[1]}
                                </span>
                                <p className="text-sm leading-relaxed text-foreground/85 pt-0.5">{stepMatch[2]}</p>
                              </div>
                            )
                          }
                          const memMatch = line.match(/^(Memory rule|Tip|Heuristic|Reminder)[:\s]+(.+)/i)
                          if (memMatch) {
                            return (
                              <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2 mt-1">
                                <Shield className="size-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">{memMatch[1]}</p>
                                  <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{memMatch[2]}</p>
                                </div>
                              </div>
                            )
                          }
                          return (
                            <p key={i} className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">{line}</p>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-xl overflow-hidden border-border/50 rounded-2xl shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded bg-amber-500/15">
                        <Shield className="size-3.5 text-amber-600" />
                      </div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Prevention tips
                      </h3>
                    </div>
                    <div className="pl-8">
                      <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-3.5 py-2.5 text-sm leading-relaxed text-foreground/85">
                        {explanation.preventionTips || 'Review the core concept above and practice with similar problems to reinforce your understanding.'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {explanation.relatedTopics.length > 0 && (
                  <Card className="bg-card/60 backdrop-blur-xl border-border/50 rounded-2xl shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted">
                          <ChevronRight className="size-3.5 text-muted-foreground" />
                        </div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Related topics
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-8">
                        {explanation.relatedTopics.map((topic) => (
                          <Badge
                            key={topic}
                            variant="outline"
                            className="text-[11px] cursor-pointer transition-colors hover:bg-muted"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <div className="flex justify-end">
              {activeTab === 'mastery' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="text-xs text-muted-foreground"
                >
                  <RefreshCw className={`size-3 mr-1 ${regenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-48">
            <div className="text-center space-y-2">
              <MessageSquare className="size-6 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                No AI explanation available for this question.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (activeTab === 'misconceptions') return null

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="max-w-md bg-card/60 backdrop-blur-xl border-border/50 rounded-2xl shadow-none">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-base font-bold mb-1">Correct Answer!</h3>
          <p className="text-sm text-muted-foreground">
            You answered this question correctly. Select a wrong answer from the left panel to see the AI diagnosis.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
