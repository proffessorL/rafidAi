'use client'

import { useEffect, useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Brain, TrendingUp, Activity, AlertTriangle, Target, BookOpen, Flame, Zap,
  Clock, ArrowUpRight, ArrowDownRight, Heart, CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StudentDetailProps {
  studentId: string
  studentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FEATURE_LABELS: Record<string, string> = {
  quiz: 'Quiz', tutor: 'AI Tutor', wellbeing: 'Wellbeing',
  notes: 'Notes', gamification: 'Gamification', planner: 'Planner',
  forum: 'Forum', 'explain-mistake': 'Explain', resources: 'Resources',
  leaderboard: 'Leaderboard',
}

const STRESS_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981']

function ScoreCard({ label, value, max = 100, icon: Icon, accent, badge }: {
  label: string; value: number; max?: number; icon: React.ElementType
  accent: string; badge?: { text: string; color: string }
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('flex size-9 items-center justify-center rounded-lg', accent)}>
          <Icon className="size-4" />
        </div>
        {badge && (
          <Badge className={cn('text-[10px] px-2 py-0 h-5 border-transparent', badge.color)}>
            {badge.text}
          </Badge>
        )}
      </div>
      <p className="text-2xl font-bold">{value}{max === 100 ? '%' : ''}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', barColor)} style={{ width: `${pct}%` }} />
      </div>
    </Card>
  )
}

export default function StudentDetailModal({ studentId, studentName, open, onOpenChange }: StudentDetailProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !studentId) return
    setLoading(true)
    fetch(`/api/teacher/student-detail?student_id=${studentId}`)
      .then(r => r.json())
      .then(res => { if (!res.error) setData(res) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [open, studentId])

  const quizChartData = data?.quizAttempts
    ? [...data.quizAttempts].reverse().map((a: any, i: number) => ({
        name: `#${i + 1}`, score: a.score, title: a.title,
      }))
    : []

  const wellbeing = data?.wellbeing
  const engSummary = data?.engagementSummary

  const badgeForScore = (v: number) =>
    v >= 70 ? { text: 'Good', color: 'bg-emerald-500/10 text-emerald-500' }
      : v >= 40 ? { text: 'Fair', color: 'bg-amber-500/10 text-amber-500' }
      : { text: 'Needs Attention', color: 'bg-rose-500/10 text-rose-500' }

  const burnoutBadge = (v: number) =>
    v <= 20 ? { text: 'Low', color: 'bg-emerald-500/10 text-emerald-500' }
      : v <= 50 ? { text: 'Moderate', color: 'bg-amber-500/10 text-amber-500' }
      : { text: 'High', color: 'bg-rose-500/10 text-rose-500' }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <SheetTitle>{studentName}</SheetTitle>
          <SheetDescription>
            {loading ? 'Loading...' : data?.user?.email}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
          {loading ? (
            <div className="space-y-4 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : !data ? (
            <p className="text-sm text-muted-foreground pt-4">Failed to load student data.</p>
          ) : (
            <div className="space-y-5 pt-2">
              {/* ── Quick Stats ── */}
              <div className="grid grid-cols-2 gap-2">
                {engSummary && (
                  <>
                    <div className="rounded-lg border border-white/[0.04] bg-card/60 backdrop-blur-sm p-3 flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Clock className="size-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Weekly Study</p>
                        <p className="text-base font-bold">{engSummary.weeklyHours}h</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/[0.04] bg-card/60 backdrop-blur-sm p-3 flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
                        <CalendarDays className="size-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Active Days</p>
                        <p className="text-base font-bold">{engSummary.activeDaysThisMonth}</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="rounded-lg border border-white/[0.04] bg-card/60 backdrop-blur-sm p-3 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <Flame className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Streak</p>
                    <p className="text-base font-bold">{data.streak?.current || 0}d</p>
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.04] bg-card/60 backdrop-blur-sm p-3 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                    <Zap className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Level</p>
                    <p className="text-base font-bold">{data.progress?.level || '—'}</p>
                  </div>
                </div>
              </div>

              {/* ── Engagement (privacy-preserving) ── */}
              {engSummary && (
                <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-4">
                  <h4 className="text-xs font-semibold text-foreground/80 mb-3 flex items-center gap-1.5">
                    <Activity className="size-3.5" />
                    Engagement Overview
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 ml-1 text-muted-foreground">Privacy-safe</Badge>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Focus Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', engSummary.consistency >= 70 ? 'bg-emerald-500' : engSummary.consistency >= 40 ? 'bg-amber-500' : 'bg-rose-500')}
                            style={{ width: `${Math.min(100, engSummary.consistency || 0)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">{Math.round(engSummary.consistency || 0)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Active Days (this month)</p>
                      <p className="text-sm font-bold">{engSummary.activeDaysThisMonth ?? 0}</p>
                    </div>
                  </div>
                  {engSummary.topFeatures?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[11px] text-muted-foreground mb-1.5">Most Used Features</p>
                      <div className="flex flex-wrap gap-1.5">
                        {engSummary.topFeatures.map((f: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0 h-5">
                            {FEATURE_LABELS[f.pageId] || f.pageId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {engSummary.weeklyTrend && engSummary.weeklyTrend.length > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1.5">7-Day Activity (minutes/day)</p>
                      <div className="h-[60px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={engSummary.weeklyTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <XAxis dataKey="day" tick={{ fontSize: 9 }} className="fill-muted-foreground" axisLine={false} tickLine={false} />
                            <Bar dataKey="minutes" fill="oklch(0.62 0.19 163)" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* ── Quiz Performance Chart ── */}
              {quizChartData.length > 0 && (
                <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-3">
                  <h4 className="text-xs font-semibold text-foreground/80 mb-2 flex items-center gap-1.5">
                    <Target className="size-3.5" />
                    Recent Quiz Scores
                  </h4>
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quizChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12 }}
                          formatter={(value: number) => [`${value}%`, 'Score']}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.title || ''}
                        />
                        <Bar dataKey="score" fill="oklch(0.62 0.19 163)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* ── Misconceptions ── */}
              {data.misconceptions?.length > 0 && (
                <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-3">
                  <h4 className="text-xs font-semibold text-foreground/80 mb-2 flex items-center gap-1.5">
                    <BookOpen className="size-3.5" />
                    Common Misconceptions
                  </h4>
                  <div className="space-y-1">
                    {data.misconceptions.slice(0, 5).map((m: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 text-xs">
                        <span className="text-foreground/80 truncate min-w-0 break-words">{m.concept ?? '—'}</span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{m.frequency}x</Badge>
                          <Badge
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-4 border-transparent',
                              m.recoveryStatus === 'MASTERED' ? 'bg-emerald-500/10 text-emerald-500' :
                              m.recoveryStatus === 'PRACTICING' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-muted text-muted-foreground'
                            )}
                          >
                            {m.recoveryStatus.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* ── Wellbeing (student's own dashboard style) ── */}
              {wellbeing && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ScoreCard
                      label="Wellbeing Score"
                      value={Math.round(wellbeing.score)}
                      icon={Heart}
                      accent="bg-emerald-500/10 text-emerald-500"
                      badge={badgeForScore(wellbeing.score)}
                    />
                    <ScoreCard
                      label="Focus Rate Score"
                      value={Math.round(wellbeing.consistency)}
                      icon={Activity}
                      accent="bg-cyan-500/10 text-cyan-500"
                      badge={badgeForScore(wellbeing.consistency)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                          <AlertTriangle className="size-4" />
                        </div>
                        <Badge className={cn('text-[10px] px-2 py-0 h-5 border-transparent',
                          wellbeing.burnoutRisk <= 20 ? 'bg-emerald-500/10 text-emerald-500' :
                          wellbeing.burnoutRisk <= 50 ? 'bg-amber-500/10 text-amber-500' :
                          'bg-rose-500/10 text-rose-500'
                        )}>
                          {burnoutBadge(wellbeing.burnoutRisk).text}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold">Burnout Analysis</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {wellbeing.burnoutRisk <= 20
                          ? 'Student shows healthy engagement patterns with low burnout indicators.'
                          : wellbeing.burnoutRisk <= 50
                            ? 'Some early signs of disengagement detected. Consider checking in.'
                            : 'Elevated burnout indicators suggest the student may need support.'}
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', wellbeing.burnoutRisk <= 20 ? 'bg-emerald-500' : wellbeing.burnoutRisk <= 50 ? 'bg-amber-500' : 'bg-rose-500')}
                          style={{ width: `${wellbeing.burnoutRisk}%` }}
                        />
                      </div>
                    </Card>

                    <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                          <Brain className="size-4" />
                        </div>
                        <Badge className={cn('text-[10px] px-2 py-0 h-5 border-transparent',
                          wellbeing.stress <= 30 ? 'bg-emerald-500/10 text-emerald-500' :
                          wellbeing.stress <= 60 ? 'bg-amber-500/10 text-amber-500' :
                          'bg-rose-500/10 text-rose-500'
                        )}>
                          {wellbeing.stress <= 30 ? 'Low' : wellbeing.stress <= 60 ? 'Moderate' : 'High'}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold">Stress Analysis</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {wellbeing.stress <= 30
                          ? 'Stress levels are well-managed. Student appears to be coping effectively.'
                          : wellbeing.stress <= 60
                            ? 'Moderate stress levels. Student may benefit from wellbeing resources.'
                            : 'Elevated stress detected. May impact learning and engagement.'}
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', wellbeing.stress <= 30 ? 'bg-emerald-500' : wellbeing.stress <= 60 ? 'bg-amber-500' : 'bg-rose-500')}
                          style={{ width: `${wellbeing.stress}%` }}
                        />
                      </div>
                    </Card>
                  </div>

                  {/* Mood Trend + Stress Factors */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {wellbeing.moodTrend && wellbeing.moodTrend.length > 0 && (
                      <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-3">
                        <h4 className="text-xs font-semibold text-foreground/80 mb-2 flex items-center gap-1.5">
                          <Heart className="size-3.5" />
                          Mood Trend
                        </h4>
                        <div className="h-[140px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={wellbeing.moodTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                              <XAxis dataKey="day" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                              <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                              <Tooltip
                                contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 11 }}
                                formatter={(value: number) => [`${value}/10`, 'Mood']}
                              />
                              <Line type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    )}

                    {wellbeing.stressFactors && wellbeing.stressFactors.length > 0 && (
                      <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-3">
                        <h4 className="text-xs font-semibold text-foreground/80 mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="size-3.5" />
                          Stress Factors
                        </h4>
                        <div className="h-[140px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={wellbeing.stressFactors}
                                cx="50%" cy="50%"
                                innerRadius={35} outerRadius={55}
                                dataKey="value"
                                nameKey="name"
                              >
                                {wellbeing.stressFactors.map((_: any, i: number) => (
                                  <Cell key={i} fill={STRESS_COLORS[i % STRESS_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 11 }}
                                formatter={(value: number) => [`${value}%`, 'Impact']}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
                          {wellbeing.stressFactors.map((f: any, i: number) => (
                            <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground min-w-0">
                              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: STRESS_COLORS[i % STRESS_COLORS.length] }} />
                              <span className="truncate">{f.name ?? f.factor ?? '—'}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </>
              )}

              {/* ── Cognitive Profile ── */}
              {data.cognitive && (
                <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-3">
                  <h4 className="text-xs font-semibold text-foreground/80 mb-2 flex items-center gap-1.5">
                    <Brain className="size-3.5" />
                    Cognitive Profile
                  </h4>
                  {data.cognitive.strongestAreas && (
                    <div className="flex items-start gap-2 text-xs mb-1.5">
                      <ArrowUpRight className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="break-words min-w-0"><strong>Strongest:</strong> {data.cognitive.strongestAreas}</span>
                    </div>
                  )}
                  {data.cognitive.weakestAreas && (
                    <div className="flex items-start gap-2 text-xs mb-1.5">
                      <ArrowDownRight className="size-3.5 text-rose-500 mt-0.5 shrink-0" />
                      <span className="break-words min-w-0"><strong>Needs work:</strong> {data.cognitive.weakestAreas}</span>
                    </div>
                  )}
                  <div className="flex gap-3 text-[11px] text-muted-foreground mt-1">
                    <span>Recovery: {data.cognitive.recoveryRate}%</span>
                    <span>Dissonance: {data.cognitive.dissonanceScore}</span>
                  </div>
                </Card>
              )}

              {/* ── Academic Risks ── */}
              {data.academicRisks?.length > 0 && (
                <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-3">
                  <h4 className="text-xs font-semibold text-foreground/80 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5" />
                    Academic Risks
                  </h4>
                  <div className="space-y-1.5">
                    {data.academicRisks.map((r: any, i: number) => (
                      <div key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize break-words min-w-0">{r.riskType.replace(/_/g, ' ')}</span>
                          <Badge
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-4 border-transparent shrink-0 ml-2',
                              r.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                              r.severity === 'moderate' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-muted text-muted-foreground'
                            )}
                          >
                            {r.probability ?? '?'}%
                          </Badge>
                        </div>
                        {r.indicator && <p className="text-muted-foreground break-words">{r.indicator}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* ── Semester History ── */}
              {data.semesterSnapshots?.length > 0 && (
                <Card className="border-white/10 bg-card/60 backdrop-blur-sm p-3">
                  <h4 className="text-xs font-semibold text-foreground/80 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="size-3.5" />
                    Semester History
                  </h4>
                  <div className="space-y-1.5">
                    {data.semesterSnapshots.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 text-xs">
                        <span className="font-medium">Semester {s.semester}</span>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>CGPA: <strong className="text-foreground">{s.cgpa.toFixed(2)}</strong></span>
                          <span>Quiz: <strong className="text-foreground">{s.quizAverage}%</strong></span>
                          <span>Study: <strong className="text-foreground">{s.studyHours}h/wk</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
