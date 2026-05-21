'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  BarChart3, Bot, Brain, LineChart, Sparkles, Search,
  Activity, Trophy, Bell, GraduationCap, Shield, Clock,
  ArrowRight, Timer, Users, StickyNote, Library, CalendarDays, UserCircle,
  MessageSquare, FolderOpen,
} from 'lucide-react'
import { useAppStore, type PageKey } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

interface SearchableItem {
  key: PageKey
  label: string
  icon: React.ElementType
  group: string
  keywords: string[]
}

const searchableItems: SearchableItem[] = [
  { key: 'dashboard', label: 'Growth Dashboard', icon: BarChart3, group: 'Features', keywords: ['stats', 'analytics', 'progress', 'growth', 'charts', 'performance'] },
  { key: 'tutor', label: 'AI Tutor', icon: Bot, group: 'Features', keywords: ['chat', 'ask', 'help', 'question', 'assistant', 'learn'] },
  { key: 'quiz', label: 'Quiz Generator', icon: Brain, group: 'Features', keywords: ['test', 'exam', 'practice', 'question', 'quiz', 'assessment'] },
  { key: 'cgpa', label: 'CGPA Prediction', icon: LineChart, group: 'Features', keywords: ['gpa', 'grade', 'score', 'prediction', 'academic'] },
  { key: 'digital-twin', label: 'Digital Twin', icon: Sparkles, group: 'Features', keywords: ['simulation', 'predict', 'what-if', 'scenario', 'model'] },
  { key: 'explain-mistake', label: 'Explain My Mistake', icon: Search, group: 'Features', keywords: ['error', 'wrong', 'answer', 'explanation', 'learn', 'fix'] },
  { key: 'engagement', label: 'Engagement Tracker', icon: Activity, group: 'Features', keywords: ['passive', 'detection', 'attention', 'focus', 'time'] },
  { key: 'gamification', label: 'Gamification', icon: Trophy, group: 'Features', keywords: ['streak', 'badge', 'points', 'level', 'reward', 'achievement'] },
  { key: 'notifications', label: 'Notifications', icon: Bell, group: 'Features', keywords: ['alert', 'message', 'reminder', 'update'] },
  { key: 'teacher', label: 'Teacher Dashboard', icon: GraduationCap, group: 'Features', keywords: ['class', 'students', 'admin', 'teacher', 'instructor'] },
  { key: 'wellbeing', label: 'Wellbeing Support', icon: Shield, group: 'Features', keywords: ['health', 'stress', 'break', 'mood', 'mental', 'wellbeing'] },
  { key: 'pomodoro', label: 'Pomodoro Timer', icon: Timer, group: 'Tools', keywords: ['timer', 'focus', 'pomodoro', 'study session', 'countdown'] },
  { key: 'leaderboard', label: 'Peer Leaderboard', icon: Users, group: 'Tools', keywords: ['rank', 'leaderboard', 'peers', 'competition', 'top'] },
  { key: 'notes', label: 'Study Notes', icon: StickyNote, group: 'Tools', keywords: ['note', 'journal', 'write', 'document', 'study notes'] },
  { key: 'courses', label: 'Course Catalog', icon: Library, group: 'Learning', keywords: ['course', 'catalog', 'enroll', 'class', 'subject', 'browse'] },
  { key: 'planner', label: 'Study Planner', icon: CalendarDays, group: 'Tools', keywords: ['planner', 'schedule', 'plan', 'calendar', 'weekly'] },
  { key: 'profile', label: 'Profile & Settings', icon: UserCircle, group: 'Account', keywords: ['profile', 'settings', 'account', 'preferences', 'avatar'] },
  { key: 'forum', label: 'Discussion Forum', icon: MessageSquare, group: 'Community', keywords: ['forum', 'discussion', 'thread', 'reply', 'community', 'post', 'question'] },
  { key: 'resources', label: 'Resource Library', icon: FolderOpen, group: 'Learning', keywords: ['resource', 'library', 'document', 'video', 'material', 'download', 'bookmark'] },
  { key: 'grades', label: 'Grade Tracker', icon: GraduationCap, group: 'Analytics', keywords: ['grade', 'gpa', 'transcript', 'semester', 'credit', 'academic', 'score'] },
]

const topicItems = [
  { label: 'Data Structures', keywords: ['tree', 'linked list', 'array', 'stack', 'queue', 'heap', 'graph'] },
  { label: 'Algorithms', keywords: ['sorting', 'searching', 'dynamic programming', 'greedy', 'recursion'] },
  { label: 'Web Development', keywords: ['html', 'css', 'javascript', 'react', 'nextjs', 'frontend'] },
  { label: 'Database Systems', keywords: ['sql', 'nosql', 'query', 'normalization', 'indexing'] },
  { label: 'Operating Systems', keywords: ['process', 'thread', 'memory', 'scheduling', 'kernel'] },
  { label: 'Computer Networks', keywords: ['tcp', 'ip', 'routing', 'protocol', 'osi'] },
]

const recentSearches = [
  'Data Structures quiz',
  'AI Tutor',
  'CGPA',
]

export default function SearchCommand() {
  const [open, setOpen] = useState(false)
  const [recent] = useState(recentSearches)
  const { setActivePage } = useAppStore()
  const { currentUser } = useAuthStore()
  const isTeacher = currentUser?.role === 'teacher'
  const visibleItems = isTeacher
    ? searchableItems.filter(i => i.key === 'teacher' || i.key === 'profile' || i.key === 'notifications')
    : searchableItems.filter(i => i.key !== 'teacher')

  const handleSelect = useCallback((key: PageKey) => {
    setActivePage(key)
    setOpen(false)
  }, [setActivePage])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const navigateToTopic = (topic: string) => {
    setActivePage('tutor')
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search features, topics, materials..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Recent Searches */}
        {recent.length > 0 && (
          <CommandGroup heading="Recent">
            {recent.map((search) => (
              <CommandItem
                key={search}
                onSelect={() => {
                  setOpen(false)
                }}
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{search}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Features */}
        <CommandGroup heading="Features">
          {visibleItems.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.key}
                value={`${item.label} ${item.keywords.join(' ')}`}
                onSelect={() => handleSelect(item.key)}
              >
                <Icon className="mr-2 h-4 w-4 text-emerald-500" />
                <span>{item.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Topics */}
        <CommandGroup heading="Topics">
          {topicItems.map((topic) => (
            <CommandItem
              key={topic.label}
              value={`${topic.label} ${topic.keywords.join(' ')}`}
              onSelect={() => navigateToTopic(topic.label)}
            >
              <BarChart3 className="mr-2 h-4 w-4 text-amber-500" />
              <span>{topic.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">Open in AI Tutor</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
