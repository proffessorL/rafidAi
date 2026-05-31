'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Heart, Phone, MessageCircle,
  Shield, Brain, BookOpen, Wind,
  X, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmergencySupportProps {
  open: boolean
  onClose: () => void
}

const resources = [
  {
    title: 'Campus Counseling Center',
    desc: 'Free confidential counseling services available',
    contact: 'Call: +1 (555) 123-4567',
    icon: Phone,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    title: '24/7 Crisis Helpline',
    desc: 'Immediate support for mental health crises',
    contact: 'Call or Text: 988',
    icon: Heart,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    title: 'Student Wellness Office',
    desc: 'Wellness programs and stress management',
    contact: 'Room 201, Student Center',
    icon: Shield,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
  },
  {
    title: 'Peer Support Group',
    desc: 'Connect with fellow students for mutual support',
    contact: 'Weekly meetups every Thursday',
    icon: MessageCircle,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
]

const calmingExercises = [
  {
    title: 'Deep Breathing',
    desc: 'Inhale 4s → Hold 4s → Exhale 4s. Repeat 5 times.',
    icon: Wind,
    action: 'Start breathing exercise',
  },
  {
    title: 'Grounding',
    desc: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
    icon: Brain,
    action: 'Start grounding',
  },
  {
    title: 'Positive Affirmation',
    desc: '"I am capable. I am enough. This feeling is temporary."',
    icon: Heart,
    action: 'More affirmations',
  },
]

export default function EmergencySupport({ open, onClose }: EmergencySupportProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card border rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
          >
            <div className="relative p-6 pb-4 text-center border-b">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/15 flex items-center justify-center mb-3">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </motion.div>
              </div>
              <h2 className="text-xl font-bold">You're Not Alone</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Help and support are available. You matter.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-500" />
                  Immediate Support Resources
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resources.map((res) => {
                    const Icon = res.icon
                    return (
                      <div key={res.title} className="flex items-start gap-3 p-3 rounded-xl border bg-muted/30">
                        <div className={`p-2 rounded-lg ${res.bg}`}>
                          <Icon className={`w-4 h-4 ${res.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{res.title}</p>
                          <p className="text-xs text-muted-foreground">{res.desc}</p>
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">{res.contact}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-teal-500" />
                  Calming Exercises
                </h3>
                <div className="space-y-2">
                  {calmingExercises.map((ex) => {
                    const Icon = ex.icon
                    return (
                      <div key={ex.title} className="flex items-start gap-3 p-3 rounded-xl border">
                        <div className="p-2 rounded-lg bg-teal-500/10">
                          <Icon className="w-4 h-4 text-teal-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ex.title}</p>
                          <p className="text-xs text-muted-foreground">{ex.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-center">
                <Brain className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">Activate Wellness Mode</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Reduces notifications, applies calming colors, suggests break activities
                </p>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                  <Heart className="w-4 h-4 mr-1" />
                  Activate Wellness Mode
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                If you're in immediate danger, please call emergency services (911).
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
