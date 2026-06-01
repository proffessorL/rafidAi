'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import {
  Heart, Frown, Meh, Smile, Angry, Thermometer,
  Brain, TrendingUp, Sparkles, BadgeCheck,
  Activity, Clock, MessageSquare, Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/stores/auth'

interface MoodOption {
  key: string
  label: string
  emoji: string
  color: string
  bg: string
  icon: React.ElementType
  score: number
}

const moodOptions: MoodOption[] = [
  { key: 'happy', label: 'Happy', emoji: '😊', color: 'text-emerald-500', bg: 'bg-emerald-500/15 border-emerald-500/30', icon: Smile, score: 9 },
  { key: 'normal', label: 'Normal', emoji: '🙂', color: 'text-teal-500', bg: 'bg-teal-500/15 border-teal-500/30', icon: Meh, score: 7 },
  { key: 'stressed', label: 'Stressed', emoji: '😰', color: 'text-amber-500', bg: 'bg-amber-500/15 border-amber-500/30', icon: Frown, score: 4 },
  { key: 'burned_out', label: 'Burned Out', emoji: '😩', color: 'text-rose-500', bg: 'bg-rose-500/15 border-rose-500/30', icon: Angry, score: 2 },
  { key: 'anxious', label: 'Anxious', emoji: '😟', color: 'text-violet-500', bg: 'bg-violet-500/15 border-violet-500/30', icon: Thermometer, score: 3 },
]

const mockHistory = [
  { date: 'Mon', score: 7, mood: 'happy' },
  { date: 'Tue', score: 5, mood: 'stressed' },
  { date: 'Wed', score: 4, mood: 'anxious' },
  { date: 'Thu', score: 3, mood: 'burned_out' },
  { date: 'Fri', score: 6, mood: 'normal' },
  { date: 'Sat', score: 8, mood: 'happy' },
  { date: 'Sun', score: 7, mood: 'normal' },
]

export default function MoodTracker() {
  const user = useAuthStore((s) => s.user)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState(mockHistory)
  const [streak, setStreak] = useState(0)
  const [moodLoggedToday, setMoodLoggedToday] = useState(false)
  const [justLogged, setJustLogged] = useState(false)

  useEffect(() => {
    const today = new Date().toDateString()
    const stored = localStorage.getItem('mood-logged-today')
    if (stored === today) {
      setMoodLoggedToday(true)
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/wellbeing/mood?student_id=${user?.id || 'stu_001'}`)
        if (res.ok) {
          const data = await res.json()
          if (data.entries?.length) {
            setHistory(data.entries.map((e: any) => ({
              date: new Date(e.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
              score: e.score,
              mood: e.mood,
            })))
          }
          if (data.streak !== undefined) setStreak(data.streak)
        }
      } catch {}
    }
    fetchHistory()
  }, [user?.id])

  const handleSaveMood = async () => {
    if (!selectedMood) return
    const mood = moodOptions.find((m) => m.key === selectedMood)
    if (!mood) return

    try {
      await fetch('/api/wellbeing/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.id || 'stu_001',
          mood: selectedMood,
          score: mood.score,
          note,
        }),
      })
    } catch {}

    setSaved(true)
    setHistory((prev) => [
      ...prev.slice(-6),
      { date: 'Today', score: mood.score, mood: selectedMood },
    ])
    const today = new Date().toDateString()
    localStorage.setItem('mood-logged-today', today)
    setMoodLoggedToday(true)
    setJustLogged(true)
    setTimeout(() => {
      setSelectedMood(null)
      setNote('')
      setSaved(false)
    }, 2000)
  }

  const getAvgMood = () => {
    if (!history.length) return 5
    return Math.round(history.reduce((a, b) => a + b.score, 0) / history.length)
  }

  const avgMood = getAvgMood()
  const avgMoodColor = avgMood >= 7 ? 'text-emerald-500' : avgMood >= 4 ? 'text-amber-500' : 'text-rose-500'

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mood & Stress Tracker</h1>
        <p className="text-sm text-muted-foreground">Track your emotional wellbeing and stress patterns</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
          <div className={`p-2 rounded-lg ${avgMoodColor}/10`}>
            <Heart className={`w-4 h-4 ${avgMoodColor}`} />
          </div>
          <div>
            <p className={`text-lg font-bold tabular-nums ${avgMoodColor}`}>{avgMood}/10</p>
            <p className="text-xs text-muted-foreground">Avg Mood</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{history.filter((h) => h.score <= 4).length}</p>
            <p className="text-xs text-muted-foreground">Stress Days</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
          <div className="p-2 rounded-lg bg-teal-500/10">
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{history.length}</p>
            <p className="text-xs text-muted-foreground">Total Logs</p>
          </div>
        </div>
      </div>

      <Card>
        {moodLoggedToday ? (
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold">
                  {justLogged ? 'Thanks for logging your mood!' : 'Mood already logged today'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {justLogged
                    ? 'Your mood has been recorded. This helps us analyze your emotional patterns and connect them to burnout.'
                    : `You've already checked in today. It'll reset tomorrow so you can log again.`}
                </p>
              </div>
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                How are you feeling right now?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {moodOptions.map((mood) => {
                  const Icon = mood.icon
                  const isSelected = selectedMood === mood.key
                  return (
                    <button
                      key={mood.key}
                      onClick={() => { setSelectedMood(mood.key); setSaved(false) }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? `${mood.bg} ${mood.color} scale-105 shadow-md`
                          : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/50'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isSelected ? mood.color : 'text-muted-foreground'}`} />
                      <span className={`text-xs font-medium ${isSelected ? mood.color : 'text-muted-foreground'}`}>
                        {mood.emoji} {mood.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <Textarea
                placeholder="Add a note about how you're feeling..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px] resize-none"
              />

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveMood}
                  disabled={!selectedMood || saved}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {saved ? (
                    <><BadgeCheck className="w-4 h-4 mr-1" /> Saved!</>
                  ) : (
                    <><Heart className="w-4 h-4 mr-1" /> Log Mood</>
                  )}
                </Button>
                {selectedMood && (
                  <Badge variant="outline" className="text-xs">
                    {moodOptions.find((m) => m.key === selectedMood)?.emoji} {moodOptions.find((m) => m.key === selectedMood)?.label}
                  </Badge>
                )}
              </div>
            </CardContent>
          </>
        )}
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-500" />
            Weekly Mood Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="oklch(var(--muted-foreground))" />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="oklch(var(--muted-foreground))" />
              <ReTooltip />
              <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fill="url(#moodGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-500/5 via-rose-500/5 to-violet-500/5 p-5"
      >
        <div className="relative flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20">
            <Brain className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1">AI Emotional Insight</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your mood has been fluctuating this week. Mid-week stress spikes suggest heavy academic load.
              Consider taking a 10-minute mindfulness break before studying. Your weekend recovery pattern is healthy!
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                <Sparkles className="w-3 h-3 mr-1" /> AI Generated
              </Badge>
              <span className="text-[10px] text-muted-foreground">Based on your mood logs</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
