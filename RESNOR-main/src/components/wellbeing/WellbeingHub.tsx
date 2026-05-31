'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Heart, Brain, Timer, Flame,
  MessageCircle, BookOpen, AlertTriangle,
  ChevronLeft, Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import WellbeingDashboard from './WellbeingDashboard'
import MoodTracker from './MoodTracker'
import AIMentor from './AIMentor'
import FocusMode from './FocusMode'
import BurnoutPredictor from './BurnoutPredictor'
import AIChatbot from './AIChatbot'
import JournalSystem from './JournalSystem'
import EmergencySupport from './EmergencySupport'

type WellbeingTab =
  | 'dashboard' | 'mood' | 'mentor' | 'focus'
  | 'burnout' | 'chatbot' | 'journal'

interface TabItem {
  key: WellbeingTab
  label: string
  icon: React.ElementType
  desc: string
}

const tabs: TabItem[] = [
  { key: 'dashboard', label: 'Overview', icon: LayoutDashboard, desc: 'Wellbeing overview & analytics' },
  { key: 'mood', label: 'Mood Tracker', icon: Heart, desc: 'Track stress & emotional wellbeing' },
  { key: 'mentor', label: 'AI Mentor', icon: Brain, desc: 'Personalized AI academic mentor' },
  { key: 'focus', label: 'Focus Mode', icon: Timer, desc: 'Distraction-free study sessions' },
  { key: 'burnout', label: 'Burnout', icon: Flame, desc: 'Burnout risk prediction' },
  { key: 'chatbot', label: 'AI Chat', icon: MessageCircle, desc: 'Emotion-aware support chatbot' },
  { key: 'journal', label: 'Journal', icon: BookOpen, desc: 'Private reflection journal' },
]

export default function WellbeingHub() {
  const [activeTab, setActiveTab] = useState<WellbeingTab>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [emergencyOpen, setEmergencyOpen] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <WellbeingDashboard onEmergency={() => setEmergencyOpen(true)} />
      case 'mood': return <MoodTracker />
      case 'mentor': return <AIMentor />
      case 'focus': return <FocusMode />
      case 'burnout': return <BurnoutPredictor />
      case 'chatbot': return <AIChatbot />
      case 'journal': return <JournalSystem />
    }
  }

  return (
    <>
      <div className="flex h-full gap-4">
        {/* Sidebar Navigation */}
        <div className={`hidden md:flex flex-col shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'}`}>
          <div className="space-y-1 p-2">
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wide">AI WELLBEING</h2>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSidebarOpen(false)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
            </div>
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-500/20'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-emerald-500/20' : 'bg-muted'}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium leading-tight">{tab.label}</p>
                    <p className="text-[10px] text-muted-foreground font-normal">{tab.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-auto p-3">
            <button
              onClick={() => setEmergencyOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium hover:bg-rose-500/20 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Emergency Support
            </button>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t flex items-center gap-1 px-1 py-1 safe-area-bottom overflow-x-auto">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-4 h-4" />
          </Button>
          {tabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors shrink-0 ${
                  isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <ScrollArea className="h-full pb-20 md:pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </ScrollArea>
        </div>
      </div>

      <EmergencySupport open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </>
  )
}
