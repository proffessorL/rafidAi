'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  BarChart3,
  Bot,
  Brain,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react'

const STORAGE_KEY = 'resnor-onboarding-dismissed'

interface TourStep {
  icon: React.ElementType
  title: string
  description: string
  color: string
  bgColor: string
}

const tourSteps: TourStep[] = [
  {
    icon: GraduationCap,
    title: 'Welcome to RESNOR',
    description: 'Your AI-powered learning companion. Track progress, get personalized help, and ace your courses.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: BarChart3,
    title: 'Track Your Progress',
    description: 'Monitor your study streaks, quiz scores, and material completion from your Growth Dashboard.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: Bot,
    title: 'Get AI Help Anytime',
    description: 'Use the AI Tutor for instant explanations, quiz generation, and personalized study recommendations.',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
  },
  {
    icon: Brain,
    title: 'Test Your Knowledge',
    description: 'Take AI-generated quizzes, review your mistakes, and strengthen weak areas with targeted practice.',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
]

export default function OnboardingTour() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      // Delay showing to let the page fully render
      const timer = setTimeout(() => {
        setIsDismissed(false)
        setOpen(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsDismissed(true)
    setOpen(false)
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleDismiss()
    }
  }, [currentStep, handleDismiss])

  const handleSkip = useCallback(() => {
    handleDismiss()
  }, [handleDismiss])

  const step = tourSteps[currentStep]
  const StepIcon = step.icon
  const isLastStep = currentStep === tourSteps.length - 1

  return (
    <Dialog open={open && !isDismissed} onOpenChange={(v) => { if (!v) handleDismiss() }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Step Content */}
        <div className="p-6 pb-0">
          <DialogHeader className="text-center items-center space-y-4">
            {/* Animated Icon */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
              >
                <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center', step.bgColor)}>
                  <StepIcon className={cn('w-8 h-8', step.color)} />
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="space-y-2">
              {/* Step indicator badge */}
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Step {currentStep + 1} of {tourSteps.length}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <DialogTitle className="text-xl font-bold">{step.title}</DialogTitle>
                  <DialogDescription className="text-sm mt-2 leading-relaxed max-w-sm mx-auto">
                    {step.description}
                  </DialogDescription>
                </motion.div>
              </AnimatePresence>
            </div>
          </DialogHeader>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-4">
          {tourSteps.map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === currentStep
                  ? 'w-6 bg-emerald-500'
                  : i < currentStep
                    ? 'w-1.5 bg-emerald-500/50'
                    : 'w-1.5 bg-muted-foreground/20',
              )}
              animate={{
                width: i === currentStep ? 24 : 6,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          ))}
        </div>

        {/* Footer with actions */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip tour
          </Button>
          <Button
            onClick={handleNext}
            className={cn(
              'gap-2 px-5',
              isLastStep
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                : '',
            )}
          >
            {isLastStep ? (
              <>
                <Check className="w-4 h-4" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
