'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Timer, Play, Pause, RotateCcw, Volume2, VolumeX,
  Sparkles, Coffee, Brain, Zap, BarChart3,
  Moon, Sun, Maximize2, Minimize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'

const focusHistory = [
  { day: 'Mon', sessions: 4, duration: 95, focus: 85 },
  { day: 'Tue', sessions: 3, duration: 75, focus: 72 },
  { day: 'Wed', sessions: 5, duration: 120, focus: 78 },
  { day: 'Thu', sessions: 2, duration: 50, focus: 65 },
  { day: 'Fri', sessions: 4, duration: 100, focus: 88 },
  { day: 'Sat', sessions: 1, duration: 25, focus: 90 },
  { day: 'Sun', sessions: 3, duration: 60, focus: 82 },
]

const motivationalMessages = [
  'You\'re building focus muscle! 💪',
  'Every session counts toward mastery! 🎯',
  'Your brain is rewiring for success! 🧠',
  'Stay present, stay powerful! ⚡',
  'Deep focus = deep learning! 📚',
]

export default function FocusMode() {
  const [mode, setMode] = useState<'pomodoro' | 'deep' | 'quick'>('pomodoro')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [sessionCount, setSessionCount] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [motivation, setMotivation] = useState(motivationalMessages[0])
  const [breakTime, setBreakTime] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const durations = { pomodoro: 25, deep: 50, quick: 10 }

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            setBreakTime(true)
            setSessionCount((s) => s + 1)
            setTotalMinutes((m) => m + durations[mode])
            setMotivation(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)])
            if (soundEnabled) {
              try {
                const ctx = new AudioContext()
                const osc = ctx.createOscillator()
                osc.type = 'sine'
                osc.frequency.value = 880
                osc.connect(ctx.destination)
                osc.start()
                setTimeout(() => { osc.stop(); ctx.close() }, 500)
              } catch {}
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, mode, soundEnabled])

  const startTimer = useCallback(() => {
    if (timeLeft === 0) {
      setTimeLeft(durations[mode] * 60)
      setBreakTime(false)
    }
    setIsRunning(true)
  }, [timeLeft, mode])

  const pauseTimer = useCallback(() => setIsRunning(false), [])
  const resetTimer = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(durations[mode] * 60)
    setBreakTime(false)
  }, [mode])

  const switchMode = useCallback((newMode: typeof mode) => {
    setMode(newMode)
    setIsRunning(false)
    setTimeLeft(durations[newMode] * 60)
    setBreakTime(false)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = 1 - timeLeft / (durations[mode] * 60)

  const getModeColor = () => {
    switch (mode) {
      case 'pomodoro': return 'from-emerald-500 to-teal-600'
      case 'deep': return 'from-violet-500 to-purple-600'
      case 'quick': return 'from-amber-500 to-orange-600'
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Focus Mode</h1>
          <p className="text-sm text-muted-foreground">Distraction-free study sessions with AI guidance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sessions</p>
            <p className="text-lg font-bold tabular-nums">{sessionCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border">
          <div className="p-1.5 rounded-lg bg-teal-500/10">
            <Timer className="w-4 h-4 text-teal-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Focus</p>
            <p className="text-lg font-bold tabular-nums">{totalMinutes}m</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <Brain className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Focus</p>
            <p className="text-lg font-bold tabular-nums">{Math.round(focusHistory.reduce((a, b) => a + b.focus, 0) / focusHistory.length)}%</p>
          </div>
        </div>
      </div>

      <Card className={`relative overflow-hidden bg-gradient-to-br ${getModeColor()} text-white`}>
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />
        <div className="relative p-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['pomodoro', 'deep', 'quick'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  mode === m
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {m === 'pomodoro' ? 'Pomodoro' : m === 'deep' ? 'Deep Focus' : 'Quick'}
              </button>
            ))}
          </div>

          <div className="text-center mb-6">
            <div className="text-6xl font-bold tabular-nums tracking-wider mb-2">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <p className="text-white/60 text-sm">
              {breakTime ? 'Break time! Take a rest 🧘' : `${mode === 'pomodoro' ? 'Focus' : mode === 'deep' ? 'Deep Work' : 'Quick Session'}`}
            </p>
          </div>

          <div className="w-full h-1.5 rounded-full bg-white/20 mb-6 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            {!isRunning ? (
              <Button
                onClick={startTimer}
                size="lg"
                className="rounded-full bg-white text-black hover:bg-white/90 hover:scale-105 transition-all px-8"
              >
                <Play className="w-5 h-5 mr-2 fill-black" />
                {timeLeft === durations[mode] * 60 ? 'Start' : 'Resume'}
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                size="lg"
                className="rounded-full bg-white/20 text-white hover:bg-white/30 border border-white/30 px-8"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
            <Button
              onClick={resetTimer}
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/10 text-white hover:bg-white/20 h-11 w-11"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <motion.p
            key={motivation}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white/70 text-sm mt-4"
          >
            {motivation}
          </motion.p>
        </div>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-500" />
            Focus Analytics (This Week)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={focusHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="oklch(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="oklch(var(--muted-foreground))" />
              <ReTooltip />
              <Bar dataKey="duration" fill="#10b981" radius={[4, 4, 0, 0]} name="Minutes" />
              <Bar dataKey="sessions" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: Coffee, title: 'Take Breaks', desc: '5-min break every 25 min improves retention by 30%', color: 'text-amber-500' },
          { icon: Moon, title: 'Sleep Well', desc: '7-9 hours of sleep boosts focus by 40%', color: 'text-violet-500' },
          { icon: Brain, title: 'Stay Hydrated', desc: 'Water intake directly affects cognitive performance', color: 'text-teal-500' },
        ].map((tip) => {
          const Icon = tip.icon
          return (
            <div key={tip.title} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border">
              <div className={`p-1.5 rounded-lg ${tip.color}/10`}>
                <Icon className={`w-4 h-4 ${tip.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
