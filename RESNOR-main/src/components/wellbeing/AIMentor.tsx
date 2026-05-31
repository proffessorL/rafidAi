'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Send, Sparkles, Bot,
  AlertTriangle, BookOpen, Zap,
  MessageCircle, Clock, Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'

interface MentorMsg {
  id: string
  role: 'user' | 'mentor'
  content: string
  category?: string
  timestamp: Date
}

const welcomeMessages = [
  {
    id: 'welcome-1',
    role: 'mentor' as const,
    content: 'Hi there! I\'m your **AI Academic Mentor**. I\'ve been analyzing your recent study patterns and I\'m here to help you stay balanced, focused, and healthy.\n\nHere\'s what I\'ve noticed recently:\n\n📊 **Study Load**: Your study hours increased 30% this week\n😰 **Stress Indicators**: Quiz scores dropped slightly in mid-week sessions\n💪 **Strengths**: Your consistency is impressive — 6-day streak!\n\nHow are you feeling about your current workload?',
    category: 'greeting',
    timestamp: new Date(),
  },
]

const mentorResponses = [
  `I can see you've been pushing hard lately. That's admirable, but remember — **rest is part of the learning process**.

  Here are some personalized suggestions:
  
  1. **Break it down**: Try 45-min study blocks with 10-min breaks
  2. **Mix subjects**: Alternate between strong and weak subjects
  3. **Self-check**: Rate your energy before each session
  
  Would you like me to create a lighter study plan for tomorrow?`,
  
  `I've been tracking your quiz performance. Here's what I see:

  📉 Your accuracy drops after 2 hours of continuous study
  📈 Morning sessions (8-10am) show best retention
  ⚡ Taking a 15-min walk between subjects improves scores by ~15%

  **Recommendation**: Try scheduling your most challenging subject first thing tomorrow morning. Save review sessions for the afternoon.`,
  
  `You've studied continuously for a long stretch. Your brain needs time to consolidate what you've learned.

  **Quick reset suggestion:**
  - Stand up and stretch for 2 minutes 🧘
  - Drink a glass of water 💧
  - Step away from screens for 5 minutes 🌿
  
  Your retention will actually improve after a short break!`,
]

export default function AIMentor() {
  const user = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState<MentorMsg[]>(welcomeMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [burnoutRisk, setBurnoutRisk] = useState(25)
  const [focusScore, setFocusScore] = useState(72)
  const [studyLoad, setStudyLoad] = useState('Moderate')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isTyping) return

    const userMsg: MentorMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/wellbeing/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.id || 'stu_001',
          message: text,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const mentorMsg: MentorMsg = {
          id: crypto.randomUUID(),
          role: 'mentor',
          content: data.response,
          category: data.category,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, mentorMsg])
      } else {
        throw new Error('API error')
      }
    } catch {
      const fallback = mentorResponses[Math.floor(Math.random() * mentorResponses.length)]
      const mentorMsg: MentorMsg = {
        id: crypto.randomUUID(),
        role: 'mentor',
        content: fallback,
        category: 'advice',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, mentorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">AI Academic Mentor</h1>
          <p className="text-sm text-muted-foreground">Your personal AI guide for balanced learning</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border">
          <div className={`p-1.5 rounded-lg ${burnoutRisk < 30 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <AlertTriangle className={`w-4 h-4 ${burnoutRisk < 30 ? 'text-emerald-500' : 'text-amber-500'}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Burnout Risk</p>
            <p className={`text-sm font-bold tabular-nums ${burnoutRisk < 30 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {burnoutRisk}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border">
          <div className="p-1.5 rounded-lg bg-teal-500/10">
            <Zap className="w-4 h-4 text-teal-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Focus Score</p>
            <p className="text-sm font-bold tabular-nums text-teal-500">{focusScore}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Study Load</p>
            <p className="text-sm font-bold tabular-nums text-amber-500">{studyLoad}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col rounded-2xl border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Mentor</p>
            <p className="text-xs text-muted-foreground">Online • Monitoring your wellbeing</p>
          </div>
          <Badge variant="outline" className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            <Sparkles className="w-3 h-3 mr-1" /> AI-Powered
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`p-2 rounded-xl ${
                    msg.role === 'mentor'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : 'bg-muted'
                  }`}>
                    {msg.role === 'mentor' ? (
                      <Brain className="w-4 h-4 text-white" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className={`max-w-[75%] ${
                    msg.role === 'user' ? 'text-right' : ''
                  }`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-muted-foreground/40"
                        animate={{ opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me how you're feeling..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
