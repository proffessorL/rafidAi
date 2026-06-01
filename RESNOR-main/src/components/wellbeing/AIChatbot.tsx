'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Send, Bot, Heart,
  Sparkles, Smile, Frown, Meh,
  Brain, BadgeCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore } from '@/stores/auth'

interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickEmotions = [
  { emoji: '😊', label: 'Stressed', color: 'text-amber-500' },
  { emoji: '😢', label: 'Sad', color: 'text-blue-500' },
  { emoji: '😰', label: 'Anxious', color: 'text-violet-500' },
  { emoji: '😴', label: 'Tired', color: 'text-yellow-500' },
  { emoji: '🤗', label: 'Need Support', color: 'text-rose-500' },
]

const botResponses = [
  `I hear you, and I want you to know that it's completely okay to feel this way. Academic pressure can be overwhelming, but you're not alone in this.

  **Here are a few things that might help right now:**
  
  1. **Pause and breathe** — Take 3 deep breaths. Inhale for 4 seconds, hold for 4, exhale for 4.
  2. **You're doing enough** — Your best is always enough, even on days when it doesn't feel like it.
  3. **Break it down** — If everything feels like too much, focus on just ONE small task.
  
  Would you like to talk about what's bothering you specifically? I'm here to listen and help. 💙`,
  
  `That's a really important thing to recognize. Being aware of how you feel is the first step toward feeling better.

  **Some things that might help:**
  - Take a short walk (even 5 minutes helps!)
  - Listen to your favorite music
  - Talk to a friend or family member
  - Write down what you're feeling in your journal
  
  Remember: **your mental health is more important than any grade.** You matter. 💚`,
  
  `I appreciate you sharing that with me. It takes courage to reach out when things are tough.

  Here's a quick grounding exercise you can try right now:
  
  🌿 **5-4-3-2-1 Technique:**
  - **5** things you can see
  - **4** things you can touch
  - **3** things you can hear
  - **2** things you can smell
  - **1** thing you can taste
  
  This helps bring your mind back to the present moment. How are you feeling now?`,
]

export default function AIChatbot() {
  const user = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'init',
      role: 'assistant',
      content: 'Hi, I\'m your **Wellbeing Companion** 🤗. I\'m here to support you emotionally and help you navigate academic stress. How are you feeling today?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (text?: string) => {
    const content = text || input.trim()
    if (!content || isTyping) return

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/wellbeing/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.id || 'stu_001',
          message: content,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const botMsg: ChatMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMsg])
      } else {
        throw new Error('API error')
      }
    } catch {
      const response = botResponses[Math.floor(Math.random() * botResponses.length)]
      const botMsg: ChatMsg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMsg])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Emotion-Aware AI Chat</h1>
        <p className="text-sm text-muted-foreground">A compassionate companion for emotional support</p>
      </div>

      <div className="flex-1 flex flex-col rounded-2xl border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
          <div className="relative">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Wellbeing Companion</p>
            <p className="text-xs text-muted-foreground">Here to support you 💚</p>
          </div>
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            <Sparkles className="w-3 h-3 mr-1" /> Empathetic AI
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
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : 'bg-muted'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <Bot className="w-4 h-4 text-white" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 px-1">
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
                  <Bot className="w-4 h-4 text-white" />
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

        <div className="flex items-center gap-1.5 px-4 py-2 border-t">
          {quickEmotions.map((em) => (
            <button
              key={em.label}
              onClick={() => handleSend(`I'm feeling ${em.label.toLowerCase()}`)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{em.emoji}</span>
              <span>{em.label}</span>
            </button>
          ))}
        </div>

        <div className="border-t p-3">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what's on your mind..."
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
