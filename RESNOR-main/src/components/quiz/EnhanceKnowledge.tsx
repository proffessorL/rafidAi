'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth'
import {
  Brain, Sparkles, CheckCircle2, XCircle, History, BookOpen,
  Target, Trophy, RefreshCw, TrendingUp, Clock, PanelRight, X, ArrowRight,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'

type Step = 'selection' | 'loading' | 'active' | 'results'

interface EKQuestion {
  id: string
  questionNumber: number
  question: string
  options: string[]
  correctIndex: number
  difficulty: string
  isRemedial: boolean
  parentQuestionId: string | null
  answeredCorrectly?: boolean | null
}

interface EKSession {
  id: string
  topic: string
  totalQuestions: number
  totalCorrect: number
  totalRemedial: number
  correctMain: number
  totalMain: number
  completedAt: string
  score: number
}

interface SessionDetailQuestion {
  id: string
  questionNumber: number
  question: string
  options: string[]
  correctIndex: number
  difficulty: string
  isRemedial: boolean
  parentQuestionId: string | null
  answeredCorrectly: boolean | null
}

interface SessionDetail {
  id: string
  topic: string
  totalQuestions: number
  totalCorrect: number
  totalRemedial: number
  completedAt: string
  questions: SessionDetailQuestion[]
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

const LOADING_MESSAGES = [
  'Creating your knowledge path...',
  'Generating easy questions...',
  'Building medium challenges...',
  'Preparing advanced problems...',
  'Almost ready...',
]

export default function EnhanceKnowledge() {
  const user = useAuthStore((s) => s.user)
  const historyLoaded = useRef(false)

  const [step, setStep] = useState<Step>('selection')
  const [topic, setTopic] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const [loadingProgress, setLoadingProgress] = useState(0)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<EKQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const [results, setResults] = useState<{ correctCount: number; wrongCount: number; remedialCount: number; mainCount: number } | null>(null)
  const [history, setHistory] = useState<EKSession[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [viewingSession, setViewingSession] = useState<SessionDetail | null>(null)
  const [viewingLoading, setViewingLoading] = useState(false)

  const currentQuestion = questions[currentIndex]

  useEffect(() => {
    if (!user?.id || historyLoaded.current) return
    historyLoaded.current = true
    setHistoryLoading(true)
    setViewingSession(null)
    fetch(`/api/enhance-knowledge/history?student_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => setHistory(data.sessions || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [user?.id])

  useEffect(() => {
    if (step !== 'loading') return
    setLoadingProgress(0)
    setLoadingMessage(LOADING_MESSAGES[0])
    const msgInterval = setInterval(() => {
      setLoadingMessage((prev) => {
        const idx = LOADING_MESSAGES.indexOf(prev)
        return LOADING_MESSAGES[(idx + 1) % LOADING_MESSAGES.length]
      })
    }, 2500)
    const progInterval = setInterval(() => {
      setLoadingProgress((prev) => Math.min(prev + 5, 90))
    }, 300)
    return () => { clearInterval(msgInterval); clearInterval(progInterval) }
  }, [step])

  const refreshHistory = useCallback(async () => {
    if (!user?.id) return
    try {
      setViewingSession(null)
      const res = await fetch(`/api/enhance-knowledge/history?student_id=${user.id}`)
      const data = await res.json()
      setHistory(data.sessions || [])
    } catch {}
  }, [user?.id])

  const handleGenerate = useCallback(async () => {
    if (!topic.trim() || !user?.id) return
    setStep('loading')
    try {
      const res = await fetch('/api/enhance-knowledge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), questionCount, studentId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setSessionId(data.sessionId)
      setQuestions(data.questions)
      setCurrentIndex(0)
      setSelectedOption(null)
      setAnswerResult(null)
      await new Promise((r) => setTimeout(r, 800))
      setStep('active')
      refreshHistory()
    } catch {
      setStep('selection')
    }
  }, [topic, questionCount, user?.id, refreshHistory])

  const openSessionDetail = useCallback(async (id: string) => {
    setViewingLoading(true)
    setViewingSession(null)
    try {
      const res = await fetch(`/api/enhance-knowledge/session?id=${id}`)
      const data = await res.json()
      setViewingSession(data)
    } catch {
      setViewingSession(null)
    } finally {
      setViewingLoading(false)
    }
  }, [])

  const closeSessionDetail = useCallback(() => {
    setViewingSession(null)
  }, [])

  const handleAnswer = useCallback(async (optionIndex: number) => {
    if (!sessionId || !currentQuestion || isSubmitting || selectedOption !== null) return
    setSelectedOption(optionIndex)
    setIsSubmitting(true)

    const isCorrect = optionIndex === currentQuestion.correctIndex
    setAnswerResult(isCorrect ? 'correct' : 'wrong')

    try {
      const res = await fetch('/api/enhance-knowledge/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          selectedKey: OPTION_LABELS[optionIndex],
          studentId: user?.id,
        }),
      })
      const data = await res.json()

      if (isCorrect) {
        setQuestions((prev) => prev.map((q, i) => i === currentIndex ? { ...q, answeredCorrectly: true } : q))
        setTimeout(() => {
          if (currentIndex < questions.length - 1) {
            setCurrentIndex((i) => i + 1)
            setSelectedOption(null)
            setAnswerResult(null)
          } else {
            finishQuiz()
          }
        }, 1200)
      } else if (data.remedialQuestions?.length > 0) {
        setTimeout(() => {
          setQuestions((prev) => {
            const updated = [...prev]
            updated.splice(currentIndex + 1, 0, ...data.remedialQuestions.map((rq: EKQuestion, i: number) => ({
              ...rq,
              questionNumber: currentIndex + 1 + i + 1,
            })))
            return updated
          })
          setSelectedOption(null)
          setAnswerResult(null)
          setCurrentIndex((i) => i + 1)
        }, 1500)
      }
    } catch {
      setTimeout(() => { setSelectedOption(null); setAnswerResult(null) }, 1500)
    }
    setIsSubmitting(false)
  }, [sessionId, currentQuestion, isSubmitting, selectedOption, questions, currentIndex, user?.id])

  const finishQuiz = useCallback(async () => {
    try {
      const res = await fetch(`/api/enhance-knowledge/history?student_id=${user?.id}`)
      const data = await res.json()
      const session = data.sessions?.find((s: any) => s.id === sessionId)
      setResults(session ? {
        correctCount: session.totalCorrect,
        wrongCount: session.totalMain - session.totalCorrect + session.totalRemedial,
        remedialCount: session.totalRemedial,
        mainCount: session.totalMain,
      } : { correctCount: 0, wrongCount: 0, remedialCount: 0, mainCount: 0 })
      setHistory(data.sessions || [])
    } catch {}
    setStep('results')
  }, [sessionId, user?.id])

  const startNew = useCallback(() => {
    setStep('selection')
    setSessionId(null)
    setQuestions([])
    setCurrentIndex(0)
    setSelectedOption(null)
    setAnswerResult(null)
    setResults(null)
    setTopic('')
    setQuestionCount(5)
    setViewingSession(null)
  }, [])

  const answeredMain = questions.filter((q) => !q.isRemedial && q.answeredCorrectly === true).length
  const totalMain = questions.filter((q) => !q.isRemedial).length

  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 md:p-8">

          <AnimatePresence mode="wait">
            {step === 'selection' && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="py-8 mb-4 text-center">
                  <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
                    <TrendingUp className="size-7 text-emerald-500" />
                  </div>
                  <h1 className="mb-3 text-2xl font-bold">Enhance Your Knowledge</h1>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Progressive difficulty from easy to advanced. Master each concept before moving on.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 bg-white border border-slate-200/80 shadow-sm dark:bg-card/30 dark:backdrop-blur-xl dark:border-border/50 dark:shadow-none rounded-2xl p-6 sm:p-7 space-y-7">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="size-5 text-emerald-500" />
                        <h3 className="text-sm font-semibold">What do you want to learn?</h3>
                      </div>
                      <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Arrays, Dynamic Programming, Linked Lists..."
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-background/50 border border-slate-200/60 dark:border-border/50 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-sm transition-all"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate() }}
                        autoFocus
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="size-5 text-emerald-500" />
                          <h3 className="text-sm font-semibold">Number of Questions</h3>
                        </div>
                        <span className="text-lg font-bold text-emerald-600">{questionCount}</span>
                      </div>
                      <Slider
                        value={[questionCount]}
                        onValueChange={([v]) => setQuestionCount(v)}
                        min={3}
                        max={15}
                        step={1}
                        className="py-1"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground/60 mt-2">
                        <span>3 (quick)</span>
                        <span>9 (balanced)</span>
                        <span>15 (deep)</span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 p-4 space-y-2.5">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="size-3.5" />
                        How it works
                      </p>
                      <ul className="space-y-1.5 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <ArrowRight className="size-3 text-emerald-500 mt-0.5 shrink-0" />
                          <span>Questions go in <strong>Easy → Medium → Hard</strong> order</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="size-3 text-emerald-500 mt-0.5 shrink-0" />
                          <span>Wrong answer? Get <strong>2 remedial questions</strong> on that concept</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="size-3 text-emerald-500 mt-0.5 shrink-0" />
                          <span>Must answer both correctly <strong>before moving forward</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="size-3 text-emerald-500 mt-0.5 shrink-0" />
                          <span><strong>No time limit</strong> — learn thoroughly at your own pace</span>
                        </li>
                      </ul>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={!topic.trim()}
                      className="w-full gap-2 h-11 text-sm"
                      size="default"
                    >
                      <Brain className="size-4" />
                      Generate Knowledge Path
                    </Button>
                  </div>

                  {/* Desktop history panel */}
                  <div className="hidden lg:block lg:col-span-5">
                    <div className="bg-white border border-slate-200/80 shadow-sm dark:bg-card/30 dark:backdrop-blur-xl dark:border-border/50 dark:shadow-none rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <History className="size-4 text-muted-foreground" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Past Sessions</h3>
                        </div>
                        <Button variant="ghost" size="sm" onClick={refreshHistory} className="h-6 w-6 p-0">
                          <RefreshCw className="size-3" />
                        </Button>
                      </div>

                      {historyLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-xl" />
                          ))}
                        </div>
                      ) : history.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                          <div className="flex justify-center">
                            <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-muted">
                              <BookOpen className="size-5 text-slate-400" />
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">No sessions yet</p>
                          <p className="text-xs text-muted-foreground/60">Start your first knowledge enhancement session above.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                          {history.map((s, i) => (
                            <motion.div
                              key={s.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              onClick={() => openSessionDetail(s.id)}
                              className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 dark:border-border/40 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] dark:hover:bg-emerald-500/[0.03] hover:shadow-sm cursor-pointer transition-all"
                            >
                              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                s.score >= 80 ? 'bg-emerald-500/10 text-emerald-600' :
                                s.score >= 50 ? 'bg-amber-500/10 text-amber-600' :
                                'bg-rose-500/10 text-rose-600'
                              }`}>
                                {s.score}%
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold truncate">{s.topic}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70 mt-0.5">
                                  <span>{new Date(s.completedAt).toLocaleDateString()}</span>
                                  <span>·</span>
                                  <span>{s.totalMain} main</span>
                                  {s.totalRemedial > 0 && <><span>·</span><span>{s.totalRemedial} remedial</span></>}
                                </div>
                              </div>
                              <ArrowRight className="size-4 text-muted-foreground/20 group-hover:text-emerald-500/40 transition-colors" />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-center min-h-[60vh]"
              >
                <div className="bg-white border border-slate-200/80 shadow-sm dark:bg-card/30 dark:backdrop-blur-xl dark:border-border/50 dark:shadow-none rounded-2xl p-10 max-w-md w-full">
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative flex items-center justify-center">
                      <motion.div className="absolute size-20 rounded-full border-2 border-emerald-500/20" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
                      <motion.div className="absolute size-16 rounded-full border-2 border-dashed border-emerald-500/30" animate={{ rotate: -360 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />
                      <motion.div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                        <TrendingUp className="size-6 text-emerald-500" />
                      </motion.div>
                    </div>
                    <div className="text-center space-y-1">
                      <motion.p key={loadingMessage} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold">
                        {loadingMessage}
                      </motion.p>
                      <p className="text-xs text-muted-foreground">Topic: {topic}</p>
                    </div>
                    <Progress value={loadingProgress} className="h-1.5 w-full max-w-xs" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'active' && currentQuestion && (
              <motion.div
                key="active"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Progress header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-slate-300 dark:border-border">
                      {currentQuestion.isRemedial ? 'Remedial Practice' : `Question ${currentQuestion.questionNumber}`}
                    </Badge>
                    <Badge className={`text-[10px] px-2 py-0.5 ${
                      currentQuestion.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800' :
                      currentQuestion.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800' :
                      'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800'
                    }`} variant="outline">
                      {currentQuestion.difficulty}
                    </Badge>
                    {currentQuestion.isRemedial && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-violet-600 border-violet-200 dark:border-violet-800 bg-violet-500/5">
                        Must answer correctly
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-emerald-600 font-semibold">{answeredMain}</span>
                    <span className="text-muted-foreground/40">/</span>
                    <span>{totalMain}</span>
                    <span className="text-muted-foreground/30 mx-1">·</span>
                    <span>{questions.length - answeredMain} remaining</span>
                  </div>
                </div>

                <Progress
                  value={totalMain > 0 ? (answeredMain / totalMain) * 100 : 0}
                  className="h-1 mb-6"
                />

                <div className="max-w-3xl mx-auto">
                  {/* Question card */}
                  <div className="bg-white border border-slate-200/80 shadow-sm dark:bg-card/30 dark:backdrop-blur-xl dark:border-border/50 dark:shadow-none rounded-2xl p-6 sm:p-7 mb-4">
                    <p className="text-sm sm:text-base font-medium leading-relaxed mb-6">{currentQuestion.question}</p>

                    {currentQuestion.isRemedial && (
                      <div className="flex items-start gap-2.5 mb-5 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                        <Brain className="size-4 text-violet-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
                          You got a similar question wrong earlier. Answer this correctly to build your understanding and proceed.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {currentQuestion.options.map((option, i) => {
                        const isSelected = selectedOption === i
                        const isCorrectOption = answerResult === 'correct' && i === currentQuestion.correctIndex
                        const isWrongOption = answerResult === 'wrong' && isSelected && i !== currentQuestion.correctIndex
                        const isCorrectReveal = answerResult === 'wrong' && i === currentQuestion.correctIndex

                        return (
                          <button
                            key={i}
                            onClick={() => handleAnswer(i)}
                            disabled={selectedOption !== null}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center gap-3.5 ${
                              isSelected && answerResult === null
                                ? 'border-emerald-500/50 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]'
                                : isCorrectOption
                                  ? 'border-emerald-500/50 bg-emerald-500/10'
                                  : isWrongOption
                                    ? 'border-rose-500/50 bg-rose-500/10'
                                    : isCorrectReveal
                                      ? 'border-emerald-500/30 bg-emerald-500/5'
                                      : 'border-slate-200/60 dark:border-border/50 hover:border-slate-300 dark:hover:border-border bg-white/40 dark:bg-background/20'
                            } ${selectedOption !== null ? 'cursor-default' : 'cursor-pointer hover:shadow-sm'}`}
                          >
                            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                              isCorrectOption
                                ? 'bg-emerald-500/20 text-emerald-600'
                                : isWrongOption
                                  ? 'bg-rose-500/20 text-rose-600'
                                  : isSelected
                                    ? 'bg-emerald-500/20 text-emerald-600'
                                    : 'bg-slate-100 dark:bg-muted text-slate-500 dark:text-muted-foreground'
                            }`}>
                              {isCorrectOption ? <CheckCircle2 className="size-4" /> : isWrongOption ? <XCircle className="size-4" /> : OPTION_LABELS[i]}
                            </span>
                            <span className="text-sm leading-snug">{option}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Status messages */}
                  <AnimatePresence>
                    {answerResult === 'correct' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 py-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/15">
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        </div>
                        <p className="text-sm font-medium text-emerald-600">
                          {currentIndex < questions.length - 1 ? 'Correct! Moving to next question...' : 'All questions completed!'}
                        </p>
                      </motion.div>
                    )}
                    {answerResult === 'wrong' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center py-3 space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-rose-500/15">
                            <XCircle className="size-4 text-rose-600" />
                          </div>
                          <p className="text-sm font-medium text-rose-600">Not quite — generating remedial practice...</p>
                        </div>
                        <p className="text-xs text-muted-foreground">You'll get 2 practice questions on this concept.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Mobile sidebar trigger */}
                  <div className="lg:hidden mt-6">
                    <Button variant="outline" size="sm" onClick={() => setShowMobileSidebar(true)} className="w-full gap-2 text-xs">
                      <History className="size-3.5" />
                      View Session History
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-center min-h-[60vh]"
              >
                <div className="max-w-md w-full space-y-4">
                  <div className="bg-white border border-slate-200/80 shadow-sm dark:bg-card/30 dark:backdrop-blur-xl dark:border-border/50 dark:shadow-none rounded-2xl p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                        <Trophy className="size-8 text-emerald-600" />
                      </div>
                    </div>
                    <h2 className="text-xl font-bold mb-1">Session Complete!</h2>
                    <p className="text-sm text-muted-foreground mb-6">Topic: {topic}</p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                        <p className="text-2xl font-bold text-emerald-600">{results?.correctCount ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Correct</p>
                      </div>
                      <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
                        <p className="text-2xl font-bold text-rose-600">{results?.wrongCount ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Wrong</p>
                      </div>
                      <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3">
                        <p className="text-2xl font-bold text-violet-600">{results?.remedialCount ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Remedial</p>
                      </div>
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                        <p className="text-2xl font-bold text-amber-600">{results?.mainCount ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Main Qs</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={startNew} className="flex-1 gap-2" size="lg">
                        <RefreshCw className="size-4" />
                        New Session
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Session detail overlay */}
      <AnimatePresence>
        {(viewingSession || viewingLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex"
          >
            <div className="absolute inset-0 bg-black/40" onClick={closeSessionDetail} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-background border-l shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Button variant="ghost" size="sm" onClick={closeSessionDetail} className="h-8 w-8 p-0 shrink-0">
                    <ArrowRight className="size-4 rotate-180" />
                  </Button>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold truncate">{viewingSession ? viewingSession.topic : 'Loading...'}</h2>
                    <p className="text-[11px] text-muted-foreground">
                      {viewingSession
                        ? `${new Date(viewingSession.completedAt).toLocaleString()} · ${viewingSession.totalCorrect}/${viewingSession.totalQuestions} correct · ${viewingSession.totalRemedial > 0 ? `${viewingSession.totalRemedial} remedial` : ''}`
                        : 'Fetching session details...'
                      }
                    </p>
                  </div>
                </div>
                {viewingSession && (
                  <Badge variant="outline" className={`shrink-0 text-xs px-2.5 py-1 ${
                    (viewingSession.totalCorrect / viewingSession.totalQuestions) >= 0.8
                      ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5'
                      : (viewingSession.totalCorrect / viewingSession.totalQuestions) >= 0.5
                      ? 'border-amber-500/30 text-amber-600 bg-amber-500/5'
                      : 'border-rose-500/30 text-rose-600 bg-rose-500/5'
                  }`}>
                    {Math.round((viewingSession.totalCorrect / viewingSession.totalQuestions) * 100)}%
                  </Badge>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {viewingLoading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <motion.div className="relative flex items-center justify-center" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                      <div className="size-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
                    </motion.div>
                    <p className="text-xs text-muted-foreground">Loading session details...</p>
                  </div>
                ) : viewingSession ? (
                  viewingSession.questions
                  .filter((q) => !q.isRemedial)
                  .map((q) => {
                    const remedial = viewingSession.questions.filter(
                      (r) => r.parentQuestionId === q.id
                    )
                    return (
                      <div key={q.id} className="space-y-2">
                        <div className={`p-4 rounded-xl border ${
                          q.answeredCorrectly
                            ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                            : 'border-rose-500/20 bg-rose-500/[0.03]'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                              q.answeredCorrectly
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {q.answeredCorrectly
                                ? <CheckCircle2 className="size-4" />
                                : <XCircle className="size-4" />
                              }
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                              <p className="text-sm font-semibold leading-snug">
                                {q.questionNumber}. {q.question}
                              </p>
                              <div className="grid grid-cols-1 gap-1.5">
                                {q.options.map((opt, oi) => (
                                  <div
                                    key={oi}
                                    className={`px-3 py-2 rounded-lg text-xs leading-relaxed ${
                                      oi === q.correctIndex
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium ring-1 ring-emerald-500/20'
                                        : 'text-muted-foreground/70 bg-muted/30'
                                    }`}
                                  >
                                    {OPTION_LABELS[oi]}. {opt}
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 h-5 ${
                                  q.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5' :
                                  q.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-600 bg-amber-500/5' :
                                  'border-rose-500/20 text-rose-600 bg-rose-500/5'
                                }`}>
                                  {q.difficulty}
                                </Badge>
                                {q.answeredCorrectly ? (
                                  <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="size-3.5" />
                                    Correct
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                                    <XCircle className="size-3.5" />
                                    Wrong
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {remedial.length > 0 && (
                          <div className="pl-6 space-y-2 border-l-2 border-amber-400/30 ml-3">
                            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                              <RefreshCw className="size-3.5" />
                              Remedial Questions
                            </p>
                            {remedial.map((r) => (
                              <div key={r.id} className={`p-3 rounded-lg border ${
                                r.answeredCorrectly
                                  ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                                  : 'border-rose-500/20 bg-rose-500/[0.03]'
                              }`}>
                                <div className="flex items-start gap-2.5">
                                  <div className={`flex size-6 shrink-0 items-center justify-center rounded-md ${
                                    r.answeredCorrectly
                                      ? 'bg-emerald-500/10 text-emerald-500'
                                      : 'bg-rose-500/10 text-rose-500'
                                  }`}>
                                    {r.answeredCorrectly
                                      ? <CheckCircle2 className="size-3.5" />
                                      : <XCircle className="size-3.5" />
                                    }
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <p className="text-xs font-medium leading-snug">{r.question}</p>
                                    <div className="space-y-1">
                                      {r.options.map((opt, oi) => (
                                        <div
                                          key={oi}
                                          className={`px-2.5 py-1 rounded text-[11px] ${
                                            oi === r.correctIndex
                                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium ring-1 ring-emerald-500/20'
                                              : 'text-muted-foreground/60 bg-muted/20'
                                          }`}
                                        >
                                          {OPTION_LABELS[oi]}. {opt}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileSidebar(false)} />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-card border-l shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b shrink-0">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sessions</h3>
                <button onClick={() => setShowMobileSidebar(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {historyLoading ? (
                  <>
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </>
                ) : history.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <BookOpen className="size-6 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground/60">No sessions yet</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {history.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => { openSessionDetail(s.id); setShowMobileSidebar(false) }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-emerald-500/20 cursor-pointer transition-all"
                      >
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          s.score >= 80 ? 'bg-emerald-500/10 text-emerald-600' :
                          s.score >= 50 ? 'bg-amber-500/10 text-amber-600' :
                          'bg-rose-500/10 text-rose-600'
                        }`}>
                          {s.score}%
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{s.topic}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                            {new Date(s.completedAt).toLocaleDateString()} · {s.totalMain} Q
                          </p>
                        </div>
                        <ArrowRight className="size-3.5 text-muted-foreground/30 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border-t shrink-0">
                <Button variant="outline" size="sm" onClick={() => { startNew(); setShowMobileSidebar(false) }} className="w-full gap-1.5 text-xs">
                  <RefreshCw className="size-3" />
                  New Session
                </Button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
