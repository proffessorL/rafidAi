'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  Plus,
  Search,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Pin,
  CheckCircle2,
  Clock,
  Users,
  Tag,
  X,
  Send,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ForumCategory = 'announcements' | 'questions' | 'study-groups' | 'resources' | 'general'
type SortOption = 'latest' | 'most-replied' | 'most-upvoted' | 'unresolved'
type ViewMode = 'list' | 'detail'

interface ForumUser {
  id: string
  name: string
  initials: string
  role: 'instructor' | 'moderator' | 'student' | 'admin'
  gradient: string
}

interface ForumReply {
  id: string
  threadId: string
  author: ForumUser
  content: string
  upvotes: number
  downvotes: number
  userVote: 'up' | 'down' | null
  createdAt: string
  isAnswer?: boolean
}

interface ForumThread {
  id: string
  author: ForumUser
  title: string
  preview: string
  content: string
  category: ForumCategory
  tags: string[]
  upvotes: number
  downvotes: number
  userVote: 'up' | 'down' | null
  replyCount: number
  createdAt: string
  lastActivityAt: string
  pinned?: boolean
  solved?: boolean
}

// ─────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ForumCategory, { label: string; border: string; badge: string; icon: string }> = {
  announcements: { label: 'Announcements', border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: 'AlertCircle' },
  questions: { label: 'Questions', border: 'border-l-teal-500', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300', icon: 'MessageCircle' },
  'study-groups': { label: 'Study Groups', border: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: 'Users' },
  resources: { label: 'Resources', border: 'border-l-rose-500', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', icon: 'TrendingUp' },
  general: { label: 'General', border: 'border-l-slate-400', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300', icon: 'MessageSquare' },
}

const ROLE_RING: Record<ForumUser['role'], string> = {
  admin: 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background',
  instructor: 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background',
  moderator: 'ring-2 ring-teal-500 ring-offset-2 ring-offset-background',
  student: 'ring-2 ring-slate-300 dark:ring-slate-600 ring-offset-2 ring-offset-background',
}

const ROLE_LABEL: Record<ForumUser['role'], string> = {
  admin: 'Admin',
  instructor: 'Instructor',
  moderator: 'Moderator',
  student: 'Student',
}

const MAX_REPLY_LENGTH = 1000
const MAX_BODY_LENGTH = 2000
const MAX_TAG_LENGTH = 25
const MAX_TAGS = 5

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  const diffWeek = Math.floor(diffDay / 7)
  if (diffWeek < 4) return `${diffWeek}w ago`
  return `${Math.floor(diffDay / 30)}mo ago`
}

// ─────────────────────────────────────────────
// Mock Data — Users
// ─────────────────────────────────────────────

const users: ForumUser[] = [
  { id: 'u1', name: 'Dr. Sarah Chen', initials: 'SC', role: 'instructor', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'u2', name: 'Marcus Johnson', initials: 'MJ', role: 'moderator', gradient: 'from-teal-500 to-cyan-600' },
  { id: 'u3', name: 'Ayesha Rahman', initials: 'AR', role: 'student', gradient: 'from-amber-500 to-orange-500' },
  { id: 'u4', name: 'Rafiq Ahmed', initials: 'RA', role: 'student', gradient: 'from-rose-500 to-pink-500' },
  { id: 'u5', name: 'Prof. Liam Torres', initials: 'LT', role: 'admin', gradient: 'from-emerald-400 to-emerald-600' },
]

// ─────────────────────────────────────────────
// Mock Data — Threads (12)
// ─────────────────────────────────────────────

const initialThreads: ForumThread[] = [
  {
    id: 't1',
    author: users[4],
    title: 'Midterm Exam Schedule & Important Guidelines',
    preview: 'Please review the updated midterm schedule. All exams will be held in the main auditorium. Make sure to bring your student ID and a scientific calculator.',
    content: 'Dear students,\n\nPlease review the updated midterm schedule for the Spring 2025 semester. All exams will be held in the main auditorium (Building A, Floor 3).\n\nKey reminders:\n- Bring your student ID\n- Scientific calculators are permitted for Math and Physics\n- No electronic devices except approved calculators\n- Arrive 15 minutes before your scheduled time\n- Review the syllabus for each course-specific guidelines\n\nIf you have any conflicts, please contact the admin office by March 10.\n\nBest regards,\nProf. Liam Torres',
    category: 'announcements',
    tags: ['midterm', 'exam', 'important'],
    upvotes: 45,
    downvotes: 0,
    userVote: null,
    replyCount: 8,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    pinned: true,
  },
  {
    id: 't2',
    author: users[0],
    title: 'Welcome to Spring 2025 — Course Overview & Resources',
    preview: 'Welcome everyone! Here is an overview of what we will cover this semester along with the required textbooks and online resources.',
    content: 'Welcome everyone to the Spring 2025 semester! I am excited to have you all in the course.\n\nThis semester we will cover:\n1. Advanced Data Structures & Algorithms\n2. Database Design & Optimization\n3. Software Engineering Principles\n4. Cloud Computing Fundamentals\n\nRequired textbooks will be available in the library. Online resources and lecture slides will be posted on the portal weekly.\n\nOffice hours: Tuesday & Thursday, 2:00 PM - 4:00 PM\n\nLooking forward to a great semester!',
    category: 'announcements',
    tags: ['welcome', 'spring2025', 'resources'],
    upvotes: 38,
    downvotes: 1,
    userVote: 'up',
    replyCount: 12,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    pinned: true,
  },
  {
    id: 't3',
    author: users[2],
    title: 'How to approach graph traversal problems in the assignment?',
    preview: 'I am stuck on question 3 of the assignment about BFS vs DFS traversal. Can someone explain the difference with a practical example?',
    content: 'Hi everyone,\n\nI am working on the current assignment and I am stuck on question 3 about graph traversal. I understand the basic definitions of BFS and DFS, but I am not sure how to decide which one to use for a given problem.\n\nCan someone explain with a practical example? Specifically:\n- When should I prefer BFS over DFS?\n- How do I handle weighted edges?\n- Is there a good way to visualize the traversal?\n\nThanks in advance!',
    category: 'questions',
    tags: ['graphs', 'bfs', 'dfs', 'assignment'],
    upvotes: 22,
    downvotes: 2,
    userVote: null,
    replyCount: 5,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    solved: true,
  },
  {
    id: 't4',
    author: users[3],
    title: 'Database normalization — 3NF vs BCNF confusion',
    preview: 'I am having trouble understanding the practical difference between 3NF and BCNF. The textbook examples are not clicking for me.',
    content: 'Hey folks,\n\nI have been studying database normalization and I am confused about the difference between 3NF and BCNF. The textbook says BCNF is a "stricter" form of 3NF, but the examples given are not helping.\n\nCan someone provide a real-world example where a table is in 3NF but not BCNF? Also, when would you actually choose to leave a table in 3NF rather than BCNF in practice?\n\nAppreciate any help!',
    category: 'questions',
    tags: ['database', 'normalization', '3nf', 'bcnf'],
    upvotes: 18,
    downvotes: 0,
    userVote: 'up',
    replyCount: 7,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't5',
    author: users[1],
    title: 'Study group for Operating Systems — Saturday mornings',
    preview: 'We are forming a study group for the Operating Systems course. We plan to meet every Saturday at 10 AM in the library study room.',
    content: 'Hey everyone!\n\nWe are putting together a study group for the Operating Systems course (CS 301). Here are the details:\n\n- When: Every Saturday, 10:00 AM - 12:00 PM\n- Where: Library Study Room B2\n- Focus areas: Process scheduling, memory management, file systems\n- Format: Collaborative problem solving + concept review\n\nCurrently we have 6 members and have room for 2-3 more. If interested, reply below or DM me.\n\nLooking forward to studying together!',
    category: 'study-groups',
    tags: ['operating-systems', 'cs301', 'weekly'],
    upvotes: 15,
    downvotes: 0,
    userVote: null,
    replyCount: 10,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't6',
    author: users[2],
    title: 'Shared notes from today\'s Software Engineering lecture',
    preview: 'I compiled detailed notes from today\'s lecture on design patterns. Including diagrams and code examples for Observer, Strategy, and Factory patterns.',
    content: 'Hi all,\n\nI put together comprehensive notes from today\'s Software Engineering lecture covering design patterns.\n\nTopics covered:\n1. Observer Pattern — with event system example\n2. Strategy Pattern — with sorting algorithm example\n3. Factory Pattern — with database connection example\n\nEach pattern includes:\n- UML diagram\n- Code example in Python\n- Pros and cons\n- When to use\n\nI have also linked to the additional reading materials the professor mentioned.\n\nFeel free to add your own notes or corrections!',
    category: 'resources',
    tags: ['software-engineering', 'design-patterns', 'notes'],
    upvotes: 32,
    downvotes: 0,
    userVote: 'up',
    replyCount: 3,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't7',
    author: users[3],
    title: 'Cloud Computing project — anyone want to pair up?',
    preview: 'Looking for a partner for the cloud computing group project. I have experience with AWS and Docker. Prefer someone familiar with Kubernetes.',
    content: 'Hey,\n\nI am looking for a partner for the Cloud Computing group project (due April 15). My background:\n- AWS (EC2, S3, Lambda)\n- Docker containerization\n- CI/CD pipelines\n\nI would love to work with someone who has experience with Kubernetes or GCP. The project requires deploying a microservices application on the cloud.\n\nDrop a reply if interested and we can discuss!',
    category: 'study-groups',
    tags: ['cloud-computing', 'project', 'pairing'],
    upvotes: 8,
    downvotes: 1,
    userVote: null,
    replyCount: 4,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't8',
    author: users[0],
    title: 'Recommended reading list for Advanced Algorithms',
    preview: 'Here is a curated list of books, papers, and online resources for students who want to go deeper into algorithm analysis and design.',
    content: 'For those interested in going beyond the textbook, here is my recommended reading list:\n\nBooks:\n- "Introduction to Algorithms" (CLRS) — 4th Edition\n- "Algorithm Design Manual" by Skiena\n- "Competitive Programming" by Halim\n\nOnline Resources:\n- MIT OpenCourseWare 6.006\n- Coursera Algorithms specialization\n- LeetCode problem sets (by topic)\n\nPapers:\n- "A New Approach to Linear-time Graph Algorithms" — Hagerup\n- "Randomized Algorithms" by Motwani & Raghavan\n\nStart with CLRS chapters 1-15 and supplement with the online lectures. Happy reading!',
    category: 'resources',
    tags: ['algorithms', 'reading-list', 'advanced'],
    upvotes: 28,
    downvotes: 0,
    userVote: 'up',
    replyCount: 2,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't9',
    author: users[4],
    title: 'Campus Wi-Fi maintenance this weekend',
    preview: 'The IT department will be performing scheduled maintenance on the campus Wi-Fi network this Saturday from 8 AM to 2 PM.',
    content: 'Dear campus community,\n\nPlease be advised that the IT department will perform scheduled maintenance on the campus Wi-Fi network this weekend.\n\nDate: Saturday, March 15\nTime: 8:00 AM - 2:00 PM\nAffected areas: All campus buildings\n\nDuring this time, internet connectivity may be intermittent. Please plan accordingly. The library will have wired connections available.\n\nThank you for your understanding.',
    category: 'announcements',
    tags: ['wifi', 'maintenance', 'campus'],
    upvotes: 12,
    downvotes: 3,
    userVote: null,
    replyCount: 6,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't10',
    author: users[2],
    title: 'Tips for managing exam stress and staying focused?',
    preview: 'With midterms coming up, I am finding it hard to concentrate. Does anyone have effective study techniques or stress management tips?',
    content: 'Hi everyone,\n\nWith midterms approaching, I am feeling overwhelmed and having trouble concentrating. I study for hours but feel like nothing sticks.\n\nDoes anyone have tips for:\n- Staying focused during long study sessions?\n- Managing exam anxiety?\n- Effective note-taking strategies?\n- Balancing study with breaks?\n\nI have heard about the Pomodoro technique but not sure how well it works for exam prep. Any advice would be greatly appreciated!',
    category: 'general',
    tags: ['study-tips', 'stress', 'midterms'],
    upvotes: 25,
    downvotes: 0,
    userVote: null,
    replyCount: 15,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 't11',
    author: users[1],
    title: 'What laptop specs do you recommend for CS coursework?',
    preview: 'My current laptop is really slow for running Docker and IDEs. Looking for recommendations from students who have recently upgraded.',
    content: 'Hey everyone,\n\nMy 4-year-old laptop is really struggling with Docker containers, running IDEs (IntelliJ + VS Code), and compiling large projects. I need to upgrade but want to be smart about it.\n\nCurrent setup I am considering:\n- Option A: MacBook Pro M3 (16GB RAM, 512GB SSD)\n- Option B: ThinkPad X1 Carbon (32GB RAM, 1TB SSD)\n- Option C: Custom build with Ryzen 7 / 32GB RAM\n\nWhat are you all using? Any recommendations for CS coursework? My budget is around $1500-2000.',
    category: 'general',
    tags: ['laptop', 'hardware', 'recommendations'],
    upvotes: 14,
    downvotes: 1,
    userVote: null,
    replyCount: 11,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't12',
    author: users[3],
    title: 'Can someone explain Big-O notation with real examples?',
    preview: 'I understand the basic concept but struggle with analyzing nested loops and recursive functions. Need help with practical problem analysis.',
    content: 'Hey all,\n\nSo I get the general idea of Big-O notation — it describes how an algorithm scales with input size. But when I try to analyze actual code, I get confused.\n\nSpecifically, I struggle with:\n1. Nested loops with varying bounds\n2. Recursive functions (how to use the master theorem)\n3. Space complexity analysis\n4. Logarithmic complexities — when is something O(log n) vs O(n log n)?\n\nCan someone walk through a few examples step by step? I have a quiz coming up next week and I really want to nail this.\n\nThanks!',
    category: 'questions',
    tags: ['big-o', 'algorithms', 'complexity', 'quiz'],
    upvotes: 20,
    downvotes: 0,
    userVote: null,
    replyCount: 9,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
]

// ─────────────────────────────────────────────
// Mock Data — Replies for thread t1 (8 replies)
// ─────────────────────────────────────────────

const threadReplies: Record<string, ForumReply[]> = {
  t1: [
    {
      id: 'r1',
      threadId: 't1',
      author: users[2],
      content: 'Thank you for sharing this! Is there a specific seating arrangement we should follow?',
      upvotes: 5,
      downvotes: 0,
      userVote: null,
      createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'r2',
      threadId: 't1',
      author: users[4],
      content: 'Good question, Ayesha. Seating will be assigned by course section. Section A on the left, Section B on the right. The seating chart will be posted outside the auditorium 30 minutes before the exam.',
      upvotes: 12,
      downvotes: 0,
      userVote: 'up',
      createdAt: new Date(Date.now() - 1.2 * 60 * 60 * 1000).toISOString(),
      isAnswer: true,
    },
    {
      id: 'r3',
      threadId: 't1',
      author: users[3],
      content: 'Can we use a graphing calculator for the Physics exam, or only scientific?',
      upvotes: 3,
      downvotes: 0,
      userVote: null,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'r4',
      threadId: 't1',
      author: users[0],
      content: 'Only scientific calculators are permitted. Graphing calculators with programming capabilities are not allowed. If you are unsure about your calculator model, bring it to my office before the exam and I will verify it.',
      upvotes: 8,
      downvotes: 0,
      userVote: null,
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'r5',
      threadId: 't1',
      author: users[1],
      content: 'For anyone who has a scheduling conflict, the deadline to submit the conflict form has been extended to March 12. You can pick up the form from the admin office or download it from the student portal.',
      upvotes: 6,
      downvotes: 0,
      userVote: null,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'r6',
      threadId: 't1',
      author: users[2],
      content: 'Will the exam be cumulative or focused on recent material only?',
      upvotes: 2,
      downvotes: 0,
      userVote: null,
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'r7',
      threadId: 't1',
      author: users[4],
      content: 'The midterm will cover Chapters 1 through 8. It is not cumulative with the previous quizzes. Make sure to review the practice problems at the end of each chapter.',
      upvotes: 10,
      downvotes: 0,
      userVote: 'up',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    {
      id: 'r8',
      threadId: 't1',
      author: users[3],
      content: 'Thanks for all the clarifications, Prof. Torres! Really appreciate the detailed responses. 🙌',
      upvotes: 4,
      downvotes: 0,
      userVote: null,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  ],
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function UserAvatar({ user, size = 'sm' }: { user: ForumUser; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  return (
    <Avatar className={cn(sizeClasses[size], ROLE_RING[user.role])}>
      <AvatarFallback className={cn('bg-gradient-to-br text-white font-bold', user.gradient)}>
        {user.initials}
      </AvatarFallback>
    </Avatar>
  )
}

function RoleBadge({ role }: { role: ForumUser['role'] }) {
  const roleColors: Record<ForumUser['role'], string> = {
    admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    instructor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    moderator: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    student: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400',
  }

  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', roleColors[role])}>
      {ROLE_LABEL[role]}
    </span>
  )
}

function VoteButtons({
  upvotes,
  downvotes,
  userVote,
  onVote,
  compact = false,
}: {
  upvotes: number
  downvotes: number
  userVote: 'up' | 'down' | null
  onVote: (dir: 'up' | 'down') => void
  compact?: boolean
}) {
  const score = upvotes - downvotes

  return (
    <div className={cn('flex items-center gap-0.5', compact ? 'flex-col' : 'flex-row')}>
      <button
        onClick={() => onVote('up')}
        className={cn(
          'flex items-center justify-center rounded-md transition-all duration-200',
          compact ? 'p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
          userVote === 'up' && 'text-emerald-600 dark:text-emerald-400'
        )}
        aria-label="Upvote"
      >
        <ChevronUp className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      </button>
      <span
        className={cn(
          'font-semibold tabular-nums',
          compact ? 'text-xs' : 'text-sm',
          userVote === 'up' && 'text-emerald-600 dark:text-emerald-400',
          userVote === 'down' && 'text-rose-600 dark:text-rose-400'
        )}
      >
        {score}
      </span>
      <button
        onClick={() => onVote('down')}
        className={cn(
          'flex items-center justify-center rounded-md transition-all duration-200',
          compact ? 'p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30' : 'p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30',
          userVote === 'down' && 'text-rose-600 dark:text-rose-400'
        )}
        aria-label="Downvote"
      >
        <ChevronDown className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      </button>
    </div>
  )
}

function ThreadCard({
  thread,
  index,
  onSelect,
  onVote,
}: {
  thread: ForumThread
  index: number
  onSelect: (id: string) => void
  onVote: (id: string, dir: 'up' | 'down') => void
}) {
  const catConfig = CATEGORY_CONFIG[thread.category]
  const isPinned = thread.pinned
  const isSolved = thread.solved

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={() => onSelect(thread.id)}
      className={cn(
        'group relative flex gap-4 rounded-xl border bg-card p-4 cursor-pointer',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        'border-l-4',
        catConfig.border,
        isPinned && 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
      )}
    >
      {/* Vote column */}
      <div className="hidden sm:flex shrink-0">
        <VoteButtons
          upvotes={thread.upvotes}
          downvotes={thread.downvotes}
          userVote={thread.userVote}
          onVote={(dir) => onVote(thread.id, dir)}
          compact
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Top row: indicators + meta */}
        <div className="flex items-center gap-2 flex-wrap">
          {isPinned && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              <Pin className="h-3 w-3" />
              Pinned
            </span>
          )}
          {isSolved && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Solved
            </span>
          )}
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', catConfig.badge)}>
            {catConfig.label}
          </span>
        </div>

        {/* Title */}
        <h3 className={cn(
          'text-sm font-semibold leading-snug line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors',
        )}>
          {thread.title}
        </h3>

        {/* Preview */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {thread.preview}
        </p>

        {/* Tags */}
        {thread.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {thread.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                #{tag}
              </span>
            ))}
            {thread.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{thread.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Bottom row: author + stats */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <UserAvatar user={thread.author} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium truncate">{thread.author.name}</span>
                <RoleBadge role={thread.author.role} />
              </div>
              <span className="text-[10px] text-muted-foreground">{timeAgo(thread.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-muted-foreground shrink-0">
            <span className="inline-flex items-center gap-1 text-[11px]">
              <MessageCircle className="h-3 w-3" />
              {thread.replyCount}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px]">
              <TrendingUp className="h-3 w-3" />
              {thread.upvotes}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px]">
              <Clock className="h-3 w-3" />
              {timeAgo(thread.lastActivityAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ReplyCard({
  reply,
  index,
  onVote,
}: {
  reply: ForumReply
  index: number
  onVote: (id: string, dir: 'up' | 'down') => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'relative border-l-2 border-slate-200 dark:border-slate-700 pl-4 py-3',
        reply.isAnswer && 'border-l-emerald-500'
      )}
    >
      {reply.isAnswer && (
        <div className="absolute -left-2 -top-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Best Answer
          </span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0 pt-4">
          <UserAvatar user={reply.author} size="sm" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-medium">{reply.author.name}</span>
            <RoleBadge role={reply.author.role} />
            <span className="text-[10px] text-muted-foreground">{timeAgo(reply.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {reply.content}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <VoteButtons
              upvotes={reply.upvotes}
              downvotes={reply.downvotes}
              userVote={reply.userVote}
              onVote={(dir) => onVote(reply.id, dir)}
              compact
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function DiscussionForum() {
  // ── State ──
  const [threads, setThreads] = useState<ForumThread[]>(initialThreads)
  const [replies, setReplies] = useState<Record<string, ForumReply[]>>(threadReplies)
  const [view, setView] = useState<ViewMode>('list')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<'all' | ForumCategory>('all')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [searchQuery, setSearchQuery] = useState('')
  const [newReply, setNewReply] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  // New thread form state
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [newThreadCategory, setNewThreadCategory] = useState<ForumCategory | ''>('')
  const [newThreadBody, setNewThreadBody] = useState('')
  const [newThreadTags, setNewThreadTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // ── Derived ──
  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? null,
    [threads, selectedThreadId]
  )

  const selectedThreadReplies = useMemo(
    () => (selectedThreadId ? replies[selectedThreadId] ?? [] : []),
    [replies, selectedThreadId]
  )

  const filteredThreads = useMemo(() => {
    let result = [...threads]

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category === activeCategory)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.preview.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    // Sort — pinned always first
    const pinned = result.filter((t) => t.pinned)
    const unpinned = result.filter((t) => !t.pinned)

    const sortFn = (a: ForumThread, b: ForumThread) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
        case 'most-replied':
          return b.replyCount - a.replyCount
        case 'most-upvoted':
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
        case 'unresolved':
          return (a.solved === false ? 0 : 1) - (b.solved === false ? 0 : 1)
        default:
          return 0
      }
    }

    pinned.sort(sortFn)
    unpinned.sort(sortFn)

    return [...pinned, ...unpinned]
  }, [threads, activeCategory, searchQuery, sortBy])

  // Stats
  const totalThreads = threads.length
  const totalReplies = threads.reduce((sum, t) => sum + t.replyCount, 0) + Object.values(replies).flat().length
  const activeUsers = new Set(threads.map((t) => t.author.id)).size

  // ── Handlers ──
  const handleSelectThread = useCallback((id: string) => {
    setSelectedThreadId(id)
    setView('detail')
    setNewReply('')
  }, [])

  const handleBackToList = useCallback(() => {
    setView('list')
    setSelectedThreadId(null)
    setNewReply('')
  }, [])

  const handleVoteThread = useCallback((id: string, dir: 'up' | 'down') => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const newVote = t.userVote === dir ? null : dir
        const up = newVote === 'up' ? t.upvotes + (t.userVote === 'up' ? -1 : 1) : t.userVote === 'up' ? t.upvotes - 1 : t.upvotes
        const down = newVote === 'down' ? t.downvotes + (t.userVote === 'down' ? -1 : 1) : t.userVote === 'down' ? t.downvotes - 1 : t.downvotes
        return { ...t, upvotes: up, downvotes: down, userVote: newVote }
      })
    )
  }, [])

  const handleVoteReply = useCallback((id: string, dir: 'up' | 'down') => {
    setReplies((prev) => {
      const updated: Record<string, ForumReply[]> = {}
      for (const [key, list] of Object.entries(prev)) {
        updated[key] = list.map((r) => {
          if (r.id !== id) return r
          const newVote = r.userVote === dir ? null : dir
          const up = newVote === 'up' ? r.upvotes + (r.userVote === 'up' ? -1 : 1) : r.userVote === 'up' ? r.upvotes - 1 : r.upvotes
          const down = newVote === 'down' ? r.downvotes + (r.userVote === 'down' ? -1 : 1) : r.userVote === 'down' ? r.downvotes - 1 : r.downvotes
          return { ...r, upvotes: up, downvotes: down, userVote: newVote }
        })
      }
      return updated
    })
  }, [])

  const handleSubmitReply = useCallback(() => {
    if (!selectedThreadId || !newReply.trim()) return

    const reply: ForumReply = {
      id: `r-new-${Date.now()}`,
      threadId: selectedThreadId,
      author: users[2], // Current user = Ayesha (student)
      content: newReply.trim(),
      upvotes: 0,
      downvotes: 0,
      userVote: null,
      createdAt: new Date().toISOString(),
    }

    setReplies((prev) => ({
      ...prev,
      [selectedThreadId]: [...(prev[selectedThreadId] ?? []), reply],
    }))

    setThreads((prev) =>
      prev.map((t) =>
        t.id === selectedThreadId
          ? { ...t, replyCount: t.replyCount + 1, lastActivityAt: new Date().toISOString() }
          : t
      )
    )

    setNewReply('')
  }, [selectedThreadId, newReply])

  const handleAddTag = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault()
        const val = tagInput.trim().replace(/,/g, '')
        if (val && val.length <= MAX_TAG_LENGTH && newThreadTags.length < MAX_TAGS && !newThreadTags.includes(val)) {
          setNewThreadTags((prev) => [...prev, val])
        }
        setTagInput('')
      }
    },
    [tagInput, newThreadTags]
  )

  const handleRemoveTag = useCallback((tag: string) => {
    setNewThreadTags((prev) => prev.filter((t) => t !== tag))
  }, [])

  const handleSubmitNewThread = useCallback(() => {
    if (!newThreadTitle.trim() || !newThreadCategory || !newThreadBody.trim()) return

    const thread: ForumThread = {
      id: `t-new-${Date.now()}`,
      author: users[2], // Current user = Ayesha (student)
      title: newThreadTitle.trim(),
      preview: newThreadBody.trim().slice(0, 150) + (newThreadBody.trim().length > 150 ? '...' : ''),
      content: newThreadBody.trim(),
      category: newThreadCategory,
      tags: newThreadTags,
      upvotes: 0,
      downvotes: 0,
      userVote: null,
      replyCount: 0,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    }

    setThreads((prev) => [thread, ...prev])
    setNewThreadTitle('')
    setNewThreadCategory('')
    setNewThreadBody('')
    setNewThreadTags([])
    setTagInput('')
    setDialogOpen(false)
  }, [newThreadTitle, newThreadCategory, newThreadBody, newThreadTags])

  // ── Category tabs ──
  const categoryTabs: Array<{ key: 'all' | ForumCategory; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'questions', label: 'Questions' },
    { key: 'study-groups', label: 'Study Groups' },
    { key: 'resources', label: 'Resources' },
    { key: 'general', label: 'General' },
  ]

  const sortOptions: Array<{ key: SortOption; label: string }> = [
    { key: 'latest', label: 'Latest' },
    { key: 'most-replied', label: 'Most Replied' },
    { key: 'most-upvoted', label: 'Most Upvoted' },
    { key: 'unresolved', label: 'Unresolved' },
  ]

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* ────── Forum Header ────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            Discussion Forum
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ask questions, share resources, and connect with peers
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5 text-teal-500" />
            <span className="font-semibold text-foreground">{totalThreads}</span> threads
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-semibold text-foreground">{totalReplies}</span> replies
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-rose-500" />
            <span className="font-semibold text-foreground">{activeUsers}</span> active
          </div>
        </div>
      </motion.div>

      {/* ────── Category Tabs ────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        {categoryTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200',
              activeCategory === tab.key
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ────── Search + Sort + New Thread ────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads, tags..."
            className="pl-9 h-9"
          />
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* New Thread Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
              <Plus className="h-4 w-4" />
              New Thread
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-500" />
                Create New Thread
              </DialogTitle>
              <DialogDescription>
                Start a new discussion. Choose a category, write your question or topic, and add relevant tags.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="Enter a clear, descriptive title..."
                  maxLength={120}
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {newThreadTitle.length}/120
                </p>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <Select value={newThreadCategory} onValueChange={(v) => setNewThreadCategory(v as ForumCategory)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryTabs
                      .filter((t) => t.key !== 'all')
                      .map((t) => (
                        <SelectItem key={t.key} value={t.key}>
                          {t.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Body</label>
                <Textarea
                  value={newThreadBody}
                  onChange={(e) => setNewThreadBody(e.target.value)}
                  placeholder="Write the details of your discussion here..."
                  rows={5}
                  maxLength={MAX_BODY_LENGTH}
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {newThreadBody.length}/{MAX_BODY_LENGTH}
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Tags <span className="text-muted-foreground font-normal">(up to {MAX_TAGS}, press Enter to add)</span>
                </label>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add a tag..."
                  maxLength={MAX_TAG_LENGTH}
                  disabled={newThreadTags.length >= MAX_TAGS}
                />
                {newThreadTags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {newThreadTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-500 transition-colors"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitNewThread}
                disabled={!newThreadTitle.trim() || !newThreadCategory || !newThreadBody.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Post Thread
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* ────── Content Area ────── */}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {filteredThreads.length === 0 ? (
              /* ── Empty state: no threads ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No threads found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchQuery
                    ? `No threads matching "${searchQuery}". Try a different search or category.`
                    : 'No threads in this category yet. Be the first to start a discussion!'}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                )}
              </motion.div>
            ) : (
              /* ── Thread list ── */
              <div className="space-y-3">
                {filteredThreads.map((thread, index) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    index={index}
                    onSelect={handleSelectThread}
                    onVote={handleVoteThread}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : selectedThread ? (
          /* ── Thread Detail View ── */
          <motion.div
            key="detail-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-6"
          >
            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to threads
            </Button>

            {/* Original post */}
            <div className={cn(
              'rounded-xl border bg-card p-6 border-l-4',
              CATEGORY_CONFIG[selectedThread.category].border,
              selectedThread.pinned && 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
            )}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <UserAvatar user={selectedThread.author} size="md" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{selectedThread.author.name}</span>
                      <RoleBadge role={selectedThread.author.role} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Posted {timeAgo(selectedThread.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {selectedThread.pinned && (
                    <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </Badge>
                  )}
                  {selectedThread.solved && (
                    <Badge variant="outline" className="gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Solved
                    </Badge>
                  )}
                  <Badge className={cn(CATEGORY_CONFIG[selectedThread.category].badge, 'border-0')}>
                    {CATEGORY_CONFIG[selectedThread.category].label}
                  </Badge>
                </div>
              </div>

              <h2 className="text-lg font-bold mb-3">{selectedThread.title}</h2>

              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {selectedThread.content}
              </p>

              {selectedThread.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t">
                  {selectedThread.tags.map((tag) => (
                    <span key={tag} className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                <VoteButtons
                  upvotes={selectedThread.upvotes}
                  downvotes={selectedThread.downvotes}
                  userVote={selectedThread.userVote}
                  onVote={(dir) => handleVoteThread(selectedThread.id, dir)}
                />
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {selectedThread.replyCount} {selectedThread.replyCount === 1 ? 'reply' : 'replies'}
                </span>
              </div>
            </div>

            {/* Replies header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                Replies ({selectedThreadReplies.length})
              </h3>
            </div>

            {/* Replies list */}
            {selectedThreadReplies.length === 0 ? (
              /* ── Empty state: no replies ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center rounded-xl border bg-card/50"
              >
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-semibold mb-1">No replies yet</h4>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Be the first to share your thoughts on this thread.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-1">
                {selectedThreadReplies.map((reply, index) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    index={index}
                    onVote={handleVoteReply}
                  />
                ))}
              </div>
            )}

            {/* Reply composer */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <UserAvatar user={users[2]} size="sm" />
                <span className="text-sm font-medium">{users[2].name}</span>
                <RoleBadge role={users[2].role} />
              </div>
              <Textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value.slice(0, MAX_REPLY_LENGTH))}
                placeholder="Write your reply..."
                rows={3}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-[10px] tabular-nums',
                  newReply.length > MAX_REPLY_LENGTH * 0.9
                    ? 'text-rose-500'
                    : 'text-muted-foreground'
                )}>
                  {newReply.length}/{MAX_REPLY_LENGTH}
                </span>
                <Button
                  onClick={handleSubmitReply}
                  disabled={!newReply.trim()}
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Send className="h-3.5 w-3.5" />
                  Reply
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
