'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CalendarDays, Clock, MapPin, BookOpen, Timer } from 'lucide-react'

const EXAM_TEMPLATES = [
  { course: 'CSE 201', title: 'Data Structures & Algorithms I', topics: ['Arrays & Linked Lists', 'Recursion', 'Big-O Complexity'], room: 'Auditorium A' },
  { course: 'CSE 203', title: 'Data Structures & Algorithms II', topics: ['Trees & BST', 'Hash Tables', 'Sorting Algorithms'], room: 'Lab 301' },
  { course: 'CSE 301', title: 'Advanced Algorithms', topics: ['Graphs & Traversal', 'Dynamic Programming'], room: 'Hall B' },
  { course: 'CSE 202', title: 'Discrete Mathematics', topics: ['Mathematical Logic', 'Set Theory', 'Graph Theory'], room: 'Room 205' },
]

function getExamRoutine() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dayOfWeek = today.getDay()
  const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7
  const firstExam = new Date(today)
  firstExam.setDate(firstExam.getDate() + daysUntilWednesday)

  const examDates = [firstExam]
  const gaps = [2, 3, 3]
  for (let i = 0; i < gaps.length; i++) {
    const prev = new Date(examDates[i])
    prev.setDate(prev.getDate() + gaps[i])
    examDates.push(prev)
  }

  const times = ['9:00 AM - 11:00 AM', '2:00 PM - 4:00 PM', '9:00 AM - 12:00 PM', '10:00 AM - 12:00 PM']

  return EXAM_TEMPLATES.map((t, i) => {
    const d = examDates[i]
    const daysUntil = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })
    const fullDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    return { ...t, date: d, monthDay, dayName, fullDate, daysUntil, time: times[i] }
  })
}

const colorSchemes = [
  { border: 'border-l-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-950/10', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { border: 'border-l-teal-500', bg: 'bg-teal-50/50 dark:bg-teal-950/10', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  { border: 'border-l-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-950/10', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { border: 'border-l-rose-500', bg: 'bg-rose-50/50 dark:bg-rose-950/10', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
]

export default function ExamRoutine() {
  const [selected, setSelected] = useState<number | null>(null)
  const exams = useMemo(() => getExamRoutine(), [])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-6 py-6">
            <motion.div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-400/8 rounded-full blur-2xl" animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
            <motion.div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <CalendarDays className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Final Exam Routine</h1>
                <p className="text-sm text-white/60">Upcoming · Daffodil International University</p>
              </div>
              <Badge variant="outline" className="ml-auto bg-white/10 text-white/80 border-white/20 text-[10px]">{exams[0]?.monthDay} – {exams[exams.length - 1]?.monthDay}</Badge>
            </div>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              {exams.map((exam, i) => {
                const colors = colorSchemes[i % colorSchemes.length]
                return (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => setSelected(selected === i ? null : i)}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    className={cn('w-full text-left px-5 py-4 transition-all duration-200 hover:bg-muted/40', colors.bg, selected === i ? 'ring-2 ring-inset ring-emerald-400/30' : '', colors.border)}
                    style={{ borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center min-w-[52px]">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">{exam.dayName.slice(0, 3)}</span>
                        <span className="text-lg font-bold tabular-nums text-foreground">{exam.monthDay}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{exam.course}</span>
                          <span className="text-sm font-semibold">{exam.title}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.time}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{exam.room}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <Badge variant="secondary" className={cn(
                          'text-xs font-bold px-2.5 py-0.5',
                          exam.daysUntil <= 7 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200/50' :
                          exam.daysUntil <= 14 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200/50' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200/50'
                        )}>
                          <Timer className="h-3 w-3 mr-1" />{exam.daysUntil}d
                        </Badge>
                        <motion.div
                          animate={{ rotate: selected === i ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-muted-foreground"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </motion.div>
                      </div>
                    </div>
                    <motion.div
                      initial={false}
                      animate={{ height: selected === i ? 'auto' : 0, opacity: selected === i ? 1 : 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2.5 mt-2 border-t border-border/40">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Topics Covered</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {exam.topics.map(t => (
                            <span key={t} className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', colors.badge)}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </motion.button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
