'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Star,
  ArrowUpRight,
  Medal,
  Crown,
  ChevronUp,
  ChevronDown,
  Zap,
  User,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Student {
  id: string
  name: string
  initials: string
  xp: number
  badges: number
  isCurrentUser?: boolean
}

interface RankedStudent extends Student {
  rank: number
  change: number // positive = moved up, negative = moved down, 0 = no change
}

type TimeTab = 'weekly' | 'monthly' | 'alltime'

// ─────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────

const weeklyData: RankedStudent[] = [
  { id: '1', name: 'Ayesha Rahman', initials: 'AR', xp: 2840, badges: 12, rank: 1, change: 2 },
  { id: '2', name: 'Farhan Islam', initials: 'FI', xp: 2610, badges: 10, rank: 2, change: -1 },
  { id: '3', name: 'Tahmina Akter', initials: 'TA', xp: 2480, badges: 11, rank: 3, change: 0 },
  { id: '4', name: 'Rafiq Ahmed', initials: 'RA', xp: 2340, badges: 9, isCurrentUser: true, rank: 4, change: 1 },
  { id: '5', name: 'Nusrat Jahan', initials: 'NJ', xp: 2190, badges: 8, rank: 5, change: -1 },
  { id: '6', name: 'Sakib Hasan', initials: 'SH', xp: 2050, badges: 7, rank: 6, change: 2 },
  { id: '7', name: 'Maliha Tabassum', initials: 'MT', xp: 1980, badges: 9, rank: 7, change: -2 },
  { id: '8', name: 'Imran Hossain', initials: 'IH', xp: 1870, badges: 6, rank: 8, change: 0 },
  { id: '9', name: 'Fatima Begum', initials: 'FB', xp: 1740, badges: 7, rank: 9, change: 1 },
  { id: '10', name: 'Arif Uddin', initials: 'AU', xp: 1680, badges: 5, rank: 10, change: -1 },
  { id: '11', name: 'Sumaiya Islam', initials: 'SI', xp: 1550, badges: 6, rank: 11, change: 0 },
  { id: '12', name: 'Tanvir Ahmed', initials: 'TAh', xp: 1420, badges: 4, rank: 12, change: 1 },
  { id: '13', name: 'Sharmin Sultana', initials: 'SS', xp: 1380, badges: 5, rank: 13, change: -2 },
  { id: '14', name: 'Rakibul Islam', initials: 'RI', xp: 1250, badges: 3, rank: 14, change: 0 },
  { id: '15', name: 'Nadia Afrin', initials: 'NA', xp: 1180, badges: 4, rank: 15, change: 1 },
]

const monthlyData: RankedStudent[] = [
  { id: '1', name: 'Farhan Islam', initials: 'FI', xp: 8920, badges: 18, rank: 1, change: 1 },
  { id: '2', name: 'Ayesha Rahman', initials: 'AR', xp: 8640, badges: 16, rank: 2, change: -1 },
  { id: '3', name: 'Rafiq Ahmed', initials: 'RA', xp: 8450, badges: 15, isCurrentUser: true, rank: 3, change: 2 },
  { id: '4', name: 'Sakib Hasan', initials: 'SH', xp: 7890, badges: 14, rank: 4, change: 1 },
  { id: '5', name: 'Tahmina Akter', initials: 'TA', xp: 7650, badges: 13, rank: 5, change: -1 },
  { id: '6', name: 'Maliha Tabassum', initials: 'MT', xp: 7320, badges: 12, rank: 6, change: 0 },
  { id: '7', name: 'Nusrat Jahan', initials: 'NJ', xp: 7100, badges: 11, rank: 7, change: -2 },
  { id: '8', name: 'Imran Hossain', initials: 'IH', xp: 6890, badges: 10, rank: 8, change: 1 },
  { id: '9', name: 'Fatima Begum', initials: 'FB', xp: 6540, badges: 9, rank: 9, change: 0 },
  { id: '10', name: 'Arif Uddin', initials: 'AU', xp: 6200, badges: 8, rank: 10, change: 1 },
  { id: '11', name: 'Sumaiya Islam', initials: 'SI', xp: 5980, badges: 9, rank: 11, change: -1 },
  { id: '12', name: 'Tanvir Ahmed', initials: 'TAh', xp: 5750, badges: 7, rank: 12, change: 0 },
  { id: '13', name: 'Sharmin Sultana', initials: 'SS', xp: 5400, badges: 6, rank: 13, change: -1 },
  { id: '14', name: 'Rakibul Islam', initials: 'RI', xp: 5120, badges: 5, rank: 14, change: 1 },
  { id: '15', name: 'Nadia Afrin', initials: 'NA', xp: 4890, badges: 6, rank: 15, change: 0 },
]

const alltimeData: RankedStudent[] = [
  { id: '1', name: 'Tahmina Akter', initials: 'TA', xp: 18420, badges: 24, rank: 1, change: 0 },
  { id: '2', name: 'Farhan Islam', initials: 'FI', xp: 17680, badges: 22, rank: 2, change: 0 },
  { id: '3', name: 'Ayesha Rahman', initials: 'AR', xp: 16340, badges: 21, rank: 3, change: 0 },
  { id: '4', name: 'Sakib Hasan', initials: 'SH', xp: 15290, badges: 19, rank: 4, change: 0 },
  { id: '5', name: 'Maliha Tabassum', initials: 'MT', xp: 14850, badges: 20, rank: 5, change: 0 },
  { id: '6', name: 'Rafiq Ahmed', initials: 'RA', xp: 12450, badges: 15, isCurrentUser: true, rank: 6, change: 0 },
  { id: '7', name: 'Nusrat Jahan', initials: 'NJ', xp: 11920, badges: 14, rank: 7, change: 0 },
  { id: '8', name: 'Imran Hossain', initials: 'IH', xp: 10870, badges: 13, rank: 8, change: 0 },
  { id: '9', name: 'Fatima Begum', initials: 'FB', xp: 9650, badges: 12, rank: 9, change: 0 },
  { id: '10', name: 'Arif Uddin', initials: 'AU', xp: 9100, badges: 11, rank: 10, change: 0 },
  { id: '11', name: 'Sumaiya Islam', initials: 'SI', xp: 8780, badges: 10, rank: 11, change: 0 },
  { id: '12', name: 'Tanvir Ahmed', initials: 'TAh', xp: 8250, badges: 9, rank: 12, change: 0 },
  { id: '13', name: 'Sharmin Sultana', initials: 'SS', xp: 7400, badges: 8, rank: 13, change: 0 },
  { id: '14', name: 'Rakibul Islam', initials: 'RI', xp: 6890, badges: 7, rank: 14, change: 0 },
  { id: '15', name: 'Nadia Afrin', initials: 'NA', xp: 5230, badges: 6, rank: 15, change: 0 },
]

const dataMap: Record<TimeTab, RankedStudent[]> = {
  weekly: weeklyData,
  monthly: monthlyData,
  alltime: alltimeData,
}

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────

function formatXP(xp: number): string {
  return xp.toLocaleString()
}

function getChangeDisplay(change: number) {
  if (change > 0) return { icon: ChevronUp, text: `↑${change}`, color: 'text-emerald-500' }
  if (change < 0) return { icon: ChevronDown, text: `↓${Math.abs(change)}`, color: 'text-rose-500' }
  return { icon: Minus, text: '—', color: 'text-muted-foreground' }
}

function getRankStyle(rank: number) {
  if (rank === 1) return { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-400/30' }
  if (rank === 2) return { bg: 'bg-slate-50 dark:bg-slate-800/40', border: 'border-slate-300 dark:border-slate-600', text: 'text-slate-600 dark:text-slate-300', ring: 'ring-slate-400/30' }
  if (rank === 3) return { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300', ring: 'ring-orange-400/30' }
  return { bg: '', border: '', text: 'text-muted-foreground', ring: '' }
}

function getInitialsBgColor(id: string): string {
  const colors = [
    'from-emerald-500 to-teal-600',
    'from-teal-500 to-cyan-600',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-emerald-400 to-emerald-600',
    'from-teal-400 to-teal-600',
    'from-amber-400 to-amber-600',
    'from-rose-400 to-rose-600',
  ]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  iconBg,
  iconColor,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: string
  subtext: string
  iconBg: string
  iconColor: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-center gap-3.5 rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground">{subtext}</p>
      </div>
    </motion.div>
  )
}

function PodiumCard({
  student,
  place,
  delay,
}: {
  student: RankedStudent
  place: 1 | 2 | 3
  delay: number
}) {
  const isFirst = place === 1
  const isSecond = place === 2
  const isThird = place === 3

  const avatarSize = isFirst ? 'w-16 h-16 text-xl' : 'w-12 h-12 text-base'
  const gradientBg = isFirst
    ? 'from-amber-400 via-yellow-500 to-amber-500'
    : isSecond
      ? 'from-slate-300 via-gray-300 to-slate-400'
      : 'from-orange-400 via-amber-600 to-orange-500'

  const borderGradient = isFirst
    ? 'border-2 border-transparent bg-gradient-to-br bg-clip-border [background-clip:padding-box] shadow-lg shadow-amber-400/20'
    : isSecond
      ? 'border-2 border-slate-300 dark:border-slate-600 shadow-md shadow-slate-400/15'
      : 'border-2 border-orange-300 dark:border-orange-700 shadow-md shadow-orange-400/15'

  const rankColors = {
    1: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
    2: { bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600' },
    3: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
  }

  const podiumHeight = isFirst ? 'h-16' : isSecond ? 'h-10' : 'h-7'

  const scale = isFirst ? 1.05 : 0.95

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'flex flex-col items-center gap-2',
        isFirst ? 'order-2 md:order-2' : isSecond ? 'order-1 md:order-1' : 'order-3 md:order-3',
      )}
      style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}
    >
      {/* Crown for 1st */}
      {isFirst && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.2, type: 'spring', stiffness: 200 }}
        >
          <span className="text-2xl" role="img" aria-label="crown">👑</span>
        </motion.div>
      )}

      {/* Card */}
      <div className={cn('relative rounded-2xl bg-card p-5 w-full max-w-[180px] flex flex-col items-center', borderGradient)}>
        {/* Outer glow for 1st */}
        {isFirst && (
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-500 -z-10 opacity-60 blur-sm" />
        )}

        {/* Rank badge */}
        <div className={cn(
          'absolute -top-3 left-1/2 -translate-x-1/2 rounded-full w-7 h-7 flex items-center justify-center border font-bold text-xs shadow-sm',
          rankColors[place].bg,
          rankColors[place].text,
          rankColors[place].border,
        )}>
          {place}
        </div>

        <div className="mt-2 mb-2">
          <Avatar className={avatarSize}>
            <AvatarFallback className={cn('bg-gradient-to-br text-white font-bold', gradientBg)}>
              {student.initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <p className="font-semibold text-sm text-center leading-tight truncate max-w-full">
          {student.name}
        </p>

        <div className="flex items-center gap-1 mt-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {formatXP(student.xp)} XP
          </span>
        </div>

        <div className="flex items-center gap-1 mt-1">
          <Medal className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{student.badges} badges</span>
        </div>
      </div>

      {/* Podium base */}
      <div className={cn('w-full max-w-[140px] rounded-t-lg bg-gradient-to-t', podiumHeight,
        isFirst && 'from-amber-200 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/30',
        isSecond && 'from-slate-200 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/30',
        isThird && 'from-orange-200 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/30',
      )}>
        <div className="flex items-center justify-center h-full">
          <span className={cn('text-xs font-bold',
            isFirst && 'text-amber-700 dark:text-amber-300',
            isSecond && 'text-slate-500 dark:text-slate-400',
            isThird && 'text-orange-700 dark:text-orange-300',
          )}>
            {formatXP(student.xp)} XP
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function RankingsRow({
  student,
  index,
}: {
  student: RankedStudent
  index: number
}) {
  const changeDisplay = getChangeDisplay(student.change)
  const ChangeIcon = changeDisplay.icon
  const isCurrentUser = student.isCurrentUser
  const isTop3 = student.rank <= 3

  const rankBadgeColors: Record<number, { bg: string; text: string }> = {
    1: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
    2: { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-300' },
    3: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' },
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-default',
        'hover:bg-accent/60 hover:shadow-sm',
        isCurrentUser && 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/40',
      )}
    >
      {/* Rank */}
      <div className="w-8 shrink-0 flex items-center justify-center">
        {isTop3 ? (
          <span className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border',
            rankBadgeColors[student.rank].bg,
            rankBadgeColors[student.rank].text,
          )}>
            {student.rank}
          </span>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground w-7 text-center">
            {student.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarFallback className={cn(
          'text-[11px] font-bold bg-gradient-to-br text-white',
          getInitialsBgColor(student.id),
        )}>
          {student.initials}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            'text-sm font-medium truncate',
            isCurrentUser ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground',
          )}>
            {student.name}
          </p>
          {isCurrentUser && (
            <Badge className="h-4 px-1.5 text-[9px] font-bold bg-emerald-500 text-white border-0 shrink-0">
              YOU
            </Badge>
          )}
        </div>
      </div>

      {/* Change indicator */}
      <div className="flex items-center gap-0.5 shrink-0 w-10 justify-end">
        <ChangeIcon className={cn('w-3.5 h-3.5', changeDisplay.color)} />
        <span className={cn('text-xs font-semibold', changeDisplay.color)}>
          {student.change !== 0 ? Math.abs(student.change) : ''}
        </span>
      </div>

      {/* Badges count */}
      <div className="flex items-center gap-1 shrink-0 w-14 justify-end">
        <Medal className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">{student.badges}</span>
      </div>

      {/* XP */}
      <div className="flex items-center gap-1 shrink-0 w-24 justify-end">
        <Zap className="w-3 h-3 text-amber-500" />
        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {formatXP(student.xp)}
        </span>
      </div>
    </motion.div>
  )
}

function YourPositionCard({ student }: { student: RankedStudent }) {
  const nextRankXP = Math.ceil(student.xp / 500) * 500 + 500
  const xpNeeded = nextRankXP - student.xp
  const progress = ((student.xp % 500) / 500) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mt-6 rounded-2xl border bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800 p-4 shadow-lg shadow-emerald-500/5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Your Position</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                #{student.rank}
              </span>
              <span className="text-sm text-muted-foreground">of 15</span>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 h-8"
        >
          View Profile
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-lg bg-background/60 dark:bg-background/30 p-3">
          <p className="text-[11px] text-muted-foreground font-medium">Total Points</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {formatXP(student.xp)} XP
          </p>
        </div>
        <div className="rounded-lg bg-background/60 dark:bg-background/30 p-3">
          <p className="text-[11px] text-muted-foreground font-medium">Distance to #{student.rank - 1}</p>
          <p className="text-lg font-bold text-foreground">
            {student.rank > 1 ? `${formatXP(weeklyData[student.rank - 2].xp - student.xp)} XP` : '—'}
          </p>
        </div>
      </div>

      {/* XP progress to next milestone */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted-foreground font-medium">Next milestone</span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            {formatXP(xpNeeded)} XP to go
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function PeerLeaderboard() {
  const [activeTab, setActiveTab] = useState<TimeTab>('weekly')

  const currentData = dataMap[activeTab]
  const currentUser = useMemo(
    () => currentData.find(s => s.isCurrentUser)!,
    [currentData],
  )
  const top3 = currentData.slice(0, 3)
  const remaining = currentData.slice(3)
  const totalPeers = 15

  const tabLabels: Record<TimeTab, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    alltime: 'All Time',
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Peer Leaderboard
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compete with your peers and track your progress
          </p>
        </div>

        {/* Tab Filters */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TimeTab)}>
          <TabsList className="h-9">
            {(Object.keys(tabLabels) as TimeTab[]).map((key) => (
              <TabsTrigger key={key} value={key} className="text-xs px-3">
                {tabLabels[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Your Rank"
          value={`#${currentUser.rank}`}
          subtext={`${currentUser.change > 0 ? `Up ${currentUser.change}` : currentUser.change < 0 ? `Down ${Math.abs(currentUser.change)}` : 'Steady'} from last period`}
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
          delay={0.1}
        />
        <StatCard
          icon={Star}
          label="Total Points"
          value={`${formatXP(currentUser.xp)} XP`}
          subtext="Earned this period"
          iconBg="bg-amber-100 dark:bg-amber-900/40"
          iconColor="text-amber-600 dark:text-amber-400"
          delay={0.2}
        />
        <StatCard
          icon={Users}
          label="Active Peers"
          value={totalPeers.toString()}
          subtext="Students competing"
          iconBg="bg-teal-100 dark:bg-teal-900/40"
          iconColor="text-teal-600 dark:text-teal-400"
          delay={0.3}
        />
      </div>

      {/* Podium Section */}
      <div className="rounded-2xl border bg-card p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Crown className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Top Performers</h3>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6">
              {/* Render in staggered order: 2nd, 1st, 3rd */}
              <PodiumCard student={top3[1]} place={2} delay={0.1} />
              <PodiumCard student={top3[0]} place={1} delay={0.25} />
              <PodiumCard student={top3[2]} place={3} delay={0.15} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Full Rankings Table */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <h3 className="text-sm font-semibold">Full Rankings</h3>
          <Badge variant="outline" className="text-[10px] font-medium">
            {totalPeers} students
          </Badge>
        </div>

        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/20">
          <div className="w-8 shrink-0" />
          <div className="w-8 shrink-0" />
          <div className="flex-1">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Student</span>
          </div>
          <div className="w-10 shrink-0 text-right">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Change</span>
          </div>
          <div className="w-14 shrink-0 text-right">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Badges</span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">XP</span>
          </div>
        </div>

        {/* Rankings list */}
        <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-2 space-y-1"
            >
              {remaining.map((student, index) => (
                <RankingsRow key={student.id} student={student} index={index} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Your Position Card */}
      <YourPositionCard student={currentUser} />

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: oklch(0.7 0.01 260);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: oklch(0.6 0.01 260);
        }
      `}</style>
    </div>
  )
}
