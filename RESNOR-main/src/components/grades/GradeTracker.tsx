'use client'

import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  TrendingUp,
  Trophy,
  BookOpen,
  Clock,
  Target,
  Award,
  BarChart3,
  Calculator,
  Star,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type GradeLetter = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'D' | 'F'
type CourseStatus = 'completed' | 'in-progress' | 'planned'

interface Course {
  code: string
  title: string
  credits: number
  grade: GradeLetter | null
  gradePoint: number | null
  status: CourseStatus
}

interface Semester {
  id: number
  name: string
  shortName: string
  courses: Course[]
  gpa: number | null
  totalCredits: number
  earnedCredits: number
}

// ─── Grade Scale ─────────────────────────────────────────────────────────────

const GRADE_SCALE: Record<GradeLetter, number> = {
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  D: 1.0,
  F: 0.0,
}

function gradeColor(grade: GradeLetter | null): string {
  if (!grade) return 'text-muted-foreground'
  if (grade === 'A' || grade === 'A-') return 'text-emerald-600 dark:text-emerald-400'
  if (grade === 'B+' || grade === 'B' || grade === 'B-')
    return 'text-teal-600 dark:text-teal-400'
  if (grade === 'C+' || grade === 'C') return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

function gradeBgColor(grade: GradeLetter | null): string {
  if (!grade) return 'bg-muted/30'
  if (grade === 'A' || grade === 'A-') return 'bg-emerald-100 dark:bg-emerald-950/60'
  if (grade === 'B+' || grade === 'B' || grade === 'B-') return 'bg-teal-100 dark:bg-teal-950/60'
  if (grade === 'C+' || grade === 'C') return 'bg-amber-100 dark:bg-amber-950/60'
  return 'bg-rose-100 dark:bg-rose-950/60'
}

function statusBadge(status: CourseStatus) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      )
    case 'in-progress':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0 gap-1">
          <Clock className="h-3 w-3" />
          In Progress
        </Badge>
      )
    case 'planned':
      return (
        <Badge className="bg-muted text-muted-foreground border-0 gap-1">
          <Target className="h-3 w-3" />
          Planned
        </Badge>
      )
  }
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const semesters: Semester[] = [
  {
    id: 1,
    name: 'Fall 2022',
    shortName: 'S1',
    courses: [
      { code: 'CSE 101', title: 'Introduction to Computing', credits: 3, grade: 'A', gradePoint: 4.0, status: 'completed' },
      { code: 'CSE 102', title: 'Programming Fundamentals', credits: 4, grade: 'A-', gradePoint: 3.7, status: 'completed' },
      { code: 'MTH 101', title: 'Calculus I', credits: 3, grade: 'B+', gradePoint: 3.3, status: 'completed' },
      { code: 'ENG 101', title: 'English Composition', credits: 3, grade: 'B', gradePoint: 3.0, status: 'completed' },
      { code: 'PHY 101', title: 'Physics I', credits: 3, grade: 'B+', gradePoint: 3.3, status: 'completed' },
    ],
    gpa: 3.48,
    totalCredits: 16,
    earnedCredits: 16,
  },
  {
    id: 2,
    name: 'Spring 2023',
    shortName: 'S2',
    courses: [
      { code: 'CSE 201', title: 'Data Structures', credits: 4, grade: 'A-', gradePoint: 3.7, status: 'completed' },
      { code: 'CSE 202', title: 'Discrete Mathematics', credits: 3, grade: 'B+', gradePoint: 3.3, status: 'completed' },
      { code: 'MTH 102', title: 'Calculus II', credits: 3, grade: 'B', gradePoint: 3.0, status: 'completed' },
      { code: 'CSE 203', title: 'Object-Oriented Programming', credits: 3, grade: 'A', gradePoint: 4.0, status: 'completed' },
      { code: 'STA 201', title: 'Probability & Statistics', credits: 3, grade: 'B+', gradePoint: 3.3, status: 'completed' },
    ],
    gpa: 3.47,
    totalCredits: 16,
    earnedCredits: 16,
  },
  {
    id: 3,
    name: 'Fall 2023',
    shortName: 'S3',
    courses: [
      { code: 'CSE 301', title: 'Algorithms', credits: 4, grade: 'A-', gradePoint: 3.7, status: 'completed' },
      { code: 'CSE 302', title: 'Computer Architecture', credits: 3, grade: 'B+', gradePoint: 3.3, status: 'completed' },
      { code: 'CSE 303', title: 'Database Systems', credits: 3, grade: 'A-', gradePoint: 3.7, status: 'completed' },
      { code: 'CSE 304', title: 'Software Engineering', credits: 3, grade: 'A', gradePoint: 4.0, status: 'completed' },
    ],
    gpa: 3.68,
    totalCredits: 13,
    earnedCredits: 13,
  },
  {
    id: 4,
    name: 'Spring 2024',
    shortName: 'S4',
    courses: [
      { code: 'CSE 401', title: 'Operating Systems', credits: 4, grade: 'B+', gradePoint: 3.3, status: 'completed' },
      { code: 'CSE 402', title: 'Computer Networks', credits: 3, grade: 'A-', gradePoint: 3.7, status: 'completed' },
      { code: 'CSE 403', title: 'Web Development', credits: 3, grade: 'A', gradePoint: 4.0, status: 'completed' },
      { code: 'CSE 404', title: 'Theory of Computation', credits: 3, grade: 'B', gradePoint: 3.0, status: 'completed' },
    ],
    gpa: 3.51,
    totalCredits: 13,
    earnedCredits: 13,
  },
  {
    id: 5,
    name: 'Fall 2024',
    shortName: 'S5',
    courses: [
      { code: 'CSE 501', title: 'Machine Learning', credits: 4, grade: 'A', gradePoint: 4.0, status: 'completed' },
      { code: 'CSE 502', title: 'Artificial Intelligence', credits: 3, grade: 'A-', gradePoint: 3.7, status: 'completed' },
      { code: 'CSE 503', title: 'Cloud Computing', credits: 3, grade: 'A-', gradePoint: 3.7, status: 'completed' },
      { code: 'CSE 504', title: 'Cybersecurity', credits: 3, grade: 'B+', gradePoint: 3.3, status: 'completed' },
    ],
    gpa: 3.71,
    totalCredits: 13,
    earnedCredits: 13,
  },
  {
    id: 6,
    name: 'Spring 2025',
    shortName: 'S6',
    courses: [
      { code: 'CSE 601', title: 'Deep Learning', credits: 4, grade: 'A', gradePoint: 4.0, status: 'completed' },
      { code: 'CSE 602', title: 'Distributed Systems', credits: 3, grade: 'A-', gradePoint: 3.7, status: 'completed' },
      { code: 'CSE 603', title: 'Natural Language Processing', credits: 3, grade: 'B+', gradePoint: 3.3, status: 'completed' },
      { code: 'CSE 604', title: 'Compiler Design', credits: 3, grade: 'A-', gradePoint: 3.7, status: 'completed' },
    ],
    gpa: 3.70,
    totalCredits: 13,
    earnedCredits: 13,
  },
  {
    id: 7,
    name: 'Fall 2025',
    shortName: 'S7',
    courses: [
      { code: 'CSE 701', title: 'Computer Vision', credits: 4, grade: null, gradePoint: null, status: 'in-progress' },
      { code: 'CSE 702', title: 'Robotics', credits: 3, grade: null, gradePoint: null, status: 'in-progress' },
      { code: 'CSE 703', title: 'Blockchain Technology', credits: 3, grade: null, gradePoint: null, status: 'in-progress' },
      { code: 'CSE 704', title: 'Capstone Project I', credits: 4, grade: null, gradePoint: null, status: 'in-progress' },
    ],
    gpa: null,
    totalCredits: 14,
    earnedCredits: 0,
  },
]

// ─── Chart Configs ───────────────────────────────────────────────────────────

const gpaTrendConfig = {
  gpa: {
    label: 'Cumulative GPA',
    color: 'oklch(0.696 0.17 162.48)',
  },
  semesterGpa: {
    label: 'Semester GPA',
    color: 'oklch(0.646 0.222 41.116)',
  },
} satisfies ChartConfig

const distributionConfig = {
  A: { label: 'A', color: 'oklch(0.696 0.17 162.48)' },
  'A-': { label: 'A-', color: 'oklch(0.652 0.16 152.53)' },
  'B+': { label: 'B+', color: 'oklch(0.6 0.118 184.704)' },
  B: { label: 'B', color: 'oklch(0.704 0.14 162.48)' },
  'B-': { label: 'B-', color: 'oklch(0.646 0.222 41.116)' },
  'C+': { label: 'C+', color: 'oklch(0.769 0.188 70.08)' },
  C: { label: 'C', color: 'oklch(0.828 0.189 84.429)' },
  D: { label: 'D', color: 'oklch(0.637 0.237 25.331)' },
  F: { label: 'F', color: 'oklch(0.577 0.245 27.325)' },
} satisfies ChartConfig

// ─── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
} as const

// ─── Component ───────────────────────────────────────────────────────────────

export default function GradeTracker() {
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [targetGPA, setTargetGPA] = useState('3.80')

  // ── Derived Data ──

  const totalEarnedCredits = useMemo(
    () => semesters.reduce((sum, s) => sum + s.earnedCredits, 0),
    []
  )

  const totalRequiredCredits = 160
  const creditProgress = (totalEarnedCredits / totalRequiredCredits) * 100

  const completedCourses = useMemo(
    () =>
      semesters.reduce((sum, s) => sum + s.courses.filter((c) => c.status === 'completed').length, 0),
    []
  )

  const allGrades = useMemo(
    () =>
      semesters.flatMap((s) =>
        s.courses.filter((c) => c.grade !== null).map((c) => c.grade as GradeLetter)
      ),
    []
  )

  const overallGPA = 3.67

  const academicStanding = useMemo(() => {
    if (overallGPA >= 3.5) return { label: "Dean's List", color: 'emerald' as const }
    if (overallGPA >= 2.0) return { label: 'Good Standing', color: 'amber' as const }
    return { label: 'Academic Probation', color: 'rose' as const }
  }, [overallGPA])

  // ── GPA Trend Data ──

  const gpaTrendData = useMemo(() => {
    let cumulativeCredits = 0
    let cumulativePoints = 0
    return semesters.map((s) => {
      const completed = s.courses.filter((c) => c.status === 'completed')
      completed.forEach((c) => {
        cumulativeCredits += c.credits
        cumulativePoints += (c.gradePoint ?? 0) * c.credits
      })
      const cumulative = cumulativeCredits > 0 ? cumulativePoints / cumulativeCredits : 0
      return {
        semester: s.shortName,
        name: s.name,
        gpa: parseFloat(cumulative.toFixed(2)),
        semesterGpa: s.gpa,
      }
    })
  }, [])

  // ── Grade Distribution Data ──

  const distributionData = useMemo(() => {
    const counts: Record<string, number> = {}
    const gradeOrder: GradeLetter[] = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F']
    gradeOrder.forEach((g) => (counts[g] = 0))
    allGrades.forEach((g) => (counts[g] = (counts[g] || 0) + 1))
    return gradeOrder.filter((g) => counts[g] > 0).map((g) => ({
      grade: g,
      count: counts[g],
      fill: `var(--color-${g})`,
    }))
  }, [allGrades])

  // ── Course Breakdown (current semester or all) ──

  const activeCourses = useMemo(() => {
    if (selectedSemester === 'all') {
      return semesters.flatMap((s) =>
        s.courses.map((c) => ({ ...c, semester: s.shortName, semesterName: s.name }))
      )
    }
    const sem = semesters.find((s) => s.id === Number(selectedSemester))
    if (!sem) return []
    return sem.courses.map((c) => ({
      ...c,
      semester: sem.shortName,
      semesterName: sem.name,
    }))
  }, [selectedSemester])

  // ── Best / Worst Semester ──

  const bestSemester = useMemo(
    () =>
      semesters
        .filter((s) => s.gpa !== null)
        .sort((a, b) => (b.gpa ?? 0) - (a.gpa ?? 0))[0],
    []
  )

  const worstSemester = useMemo(
    () =>
      semesters
        .filter((s) => s.gpa !== null)
        .sort((a, b) => (a.gpa ?? 0) - (b.gpa ?? 0))[0],
    []
  )

  // ── Target GPA Calculator ──

  const targetCalc = useMemo(() => {
    const target = parseFloat(targetGPA)
    if (isNaN(target) || target < 0 || target > 4.0) return null

    const remainingCredits = totalRequiredCredits - totalEarnedCredits
    if (remainingCredits <= 0) {
      return { achievable: true, needed: 'Already completed all credits!', remainingCredits: 0 }
    }

    const neededGPA =
      (target * totalRequiredCredits - overallGPA * totalEarnedCredits) / remainingCredits

    if (neededGPA <= 0) {
      return {
        achievable: true,
        needed: `You already exceed ${target.toFixed(2)}! Maintain any GPA.`,
        remainingCredits,
        requiredGPA: 0,
      }
    }

    if (neededGPA > 4.0) {
      return {
        achievable: false,
        needed: `Requires ${neededGPA.toFixed(2)} GPA — above 4.0. Not achievable.`,
        remainingCredits,
        requiredGPA: neededGPA,
      }
    }

    // Find closest grade
    const gradeEntries = Object.entries(GRADE_SCALE) as [GradeLetter, number][]
    const closest = gradeEntries.reduce((prev, curr) =>
      Math.abs(curr[1] - neededGPA) < Math.abs(prev[1] - neededGPA) ? curr : prev
    )

    return {
      achievable: true,
      needed: `Requires a ${neededGPA.toFixed(2)} average — aim for ${closest[0]} grades.`,
      remainingCredits,
      requiredGPA: neededGPA,
    }
  }, [targetGPA, overallGPA, totalEarnedCredits])

  // ── Academic Standing Badge ──

  const standingBadge = useMemo(() => {
    switch (academicStanding.color) {
      case 'emerald':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0 gap-1.5">
            <Trophy className="h-3.5 w-3.5" />
            {academicStanding.label}
          </Badge>
        )
      case 'amber':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0 gap-1.5">
            <Star className="h-3.5 w-3.5" />
            {academicStanding.label}
          </Badge>
        )
      case 'rose':
        return (
          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-0 gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {academicStanding.label}
          </Badge>
        )
    }
  }, [academicStanding])

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ─── 1. GPA Overview Card ─── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              background:
                'linear-gradient(135deg, oklch(0.696 0.17 162.48) 0%, oklch(0.6 0.118 184.704) 100%)',
            }}
          />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4" />
              GPA Overview
            </CardTitle>
            <CardDescription>
              Your cumulative academic performance
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className="text-7xl font-extrabold tracking-tight"
                style={{
                  background:
                    'linear-gradient(135deg, oklch(0.696 0.17 162.48), oklch(0.6 0.118 184.704))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {overallGPA.toFixed(2)}
              </div>
              <div className="flex items-center gap-3">
                {standingBadge}
                <span className="text-sm text-muted-foreground">
                  out of 4.00
                </span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                +{(
                  (gpaTrendData[gpaTrendData.length - 1]?.gpa ?? 0) -
                  (gpaTrendData[gpaTrendData.length - 2]?.gpa ?? 0)
                ).toFixed(2)}{' '}
                from last semester
              </p>
            </div>

            {/* Credit Progress */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Credit Progress</span>
                <span className="font-medium">
                  {totalEarnedCredits} / {totalRequiredCredits}
                </span>
              </div>
              <Progress value={creditProgress} className="h-2.5" />
              <p className="text-xs text-muted-foreground">
                {totalRequiredCredits - totalEarnedCredits} credits remaining to graduate
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ─── 9. Summary Stats ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Summary Stats
            </CardTitle>
            <CardDescription>Academic statistics at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{totalEarnedCredits}</p>
                <p className="text-xs text-muted-foreground">Credits Earned</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{completedCourses}</p>
                <p className="text-xs text-muted-foreground">Courses Done</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">A-</p>
                <p className="text-xs text-muted-foreground">Average Grade</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">
                  {(creditProgress).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Completion</p>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                  Best Semester
                </span>
                <span className="font-medium">
                  {bestSemester?.name} ({bestSemester?.gpa?.toFixed(2)})
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                  Lowest Semester
                </span>
                <span className="font-medium">
                  {worstSemester?.name} ({worstSemester?.gpa?.toFixed(2)})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── 2. Semester Selector ─── */}
      <motion.div variants={itemVariants}>
        <Tabs value={selectedSemester} onValueChange={setSelectedSemester}>
          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <TabsList className="flex-wrap">
              <TabsTrigger value="all">All Semesters</TabsTrigger>
              {semesters.map((s) => (
                <TabsTrigger key={s.id} value={String(s.id)}>
                  {s.shortName}
                  {s.gpa !== null && (
                    <span className="ml-1 text-xs opacity-70">{s.gpa.toFixed(2)}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </motion.div>

      {/* ─── 3. Course Grade Table ─── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedSemester === 'all'
                ? 'All Courses'
                : `${semesters.find((s) => s.id === Number(selectedSemester))?.name} Courses`}
            </CardTitle>
            <CardDescription>
              {activeCourses.length} courses •{' '}
              {activeCourses.filter((c) => c.status === 'completed').length} completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  {selectedSemester === 'all' && <TableHead>Semester</TableHead>}
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCourses.map((course, i) => (
                  <TableRow key={`${course.code}-${i}`}>
                    <TableCell className="font-mono font-medium text-sm">
                      {course.code}
                    </TableCell>
                    <TableCell>{course.title}</TableCell>
                    {selectedSemester === 'all' && (
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {course.semester}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-center">{course.credits}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold',
                          gradeColor(course.grade),
                          gradeBgColor(course.grade)
                        )}
                      >
                        {course.grade ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {course.gradePoint !== null ? course.gradePoint.toFixed(1) : '—'}
                    </TableCell>
                    <TableCell className="text-center">{statusBadge(course.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── 4. GPA Trend Chart + 5. Grade Distribution ─── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* GPA Trend Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              GPA Trend
            </CardTitle>
            <CardDescription>Cumulative and semester GPA across all semesters</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={gpaTrendConfig} className="h-[300px] w-full">
              <AreaChart data={gpaTrendData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="oklch(0.696 0.17 162.48)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="oklch(0.696 0.17 162.48)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="semester" tickLine={false} axisLine={false} />
                <YAxis
                  domain={[2.5, 4.0]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => v.toFixed(1)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="gpa"
                  stroke="oklch(0.696 0.17 162.48)"
                  strokeWidth={2.5}
                  fill="url(#gpaGradient)"
                  dot={{ r: 4, fill: 'oklch(0.696 0.17 162.48)' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="semesterGpa"
                  stroke="oklch(0.646 0.222 41.116)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: 'oklch(0.646 0.222 41.116)' }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Grade Distribution Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" />
              Grade Distribution
            </CardTitle>
            <CardDescription>Breakdown of all earned grades</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ChartContainer config={distributionConfig} className="h-[200px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={distributionData}
                  dataKey="count"
                  nameKey="grade"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="oklch(1 0 0)"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="grade" />} />
              </PieChart>
            </ChartContainer>
            <div className="text-sm text-muted-foreground text-center">
              {allGrades.length} total grades recorded
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── 6. Course Grade Breakdown ─── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Course Grade Breakdown
            </CardTitle>
            <CardDescription>
              Individual course performance for completed courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {semesters
                .flatMap((s) =>
                  s.courses
                    .filter((c) => c.status === 'completed')
                    .map((c) => ({ ...c, semester: s.shortName }))
                )
                .map((course, i) => (
                  <motion.div
                    key={`${course.code}-${i}`}
                    className={cn(
                      'rounded-lg border p-3 transition-colors hover:bg-muted/30',
                    )}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{course.code}</p>
                        <p className="text-xs text-muted-foreground truncate">{course.title}</p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-md px-2 py-0.5 text-sm font-bold',
                          gradeColor(course.grade),
                          gradeBgColor(course.grade)
                        )}
                      >
                        {course.grade}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{course.credits} credits</span>
                      <span className="text-xs font-mono">
                        {(course.gradePoint ?? 0).toFixed(1)} / 4.0
                      </span>
                    </div>
                    <Progress
                      value={((course.gradePoint ?? 0) / 4.0) * 100}
                      className="mt-1.5 h-1"
                    />
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── 7. Target GPA Calculator + 8. Academic Standing ─── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Target GPA Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4" />
              Target GPA Calculator
            </CardTitle>
            <CardDescription>
              See what grades you need to reach your goal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target-gpa">Desired Cumulative GPA</Label>
              <Input
                id="target-gpa"
                type="number"
                min="0"
                max="4"
                step="0.01"
                value={targetGPA}
                onChange={(e) => setTargetGPA(e.target.value)}
                className="w-full"
                placeholder="e.g. 3.80"
              />
            </div>

            {targetCalc && (
              <div
                className={cn(
                  'rounded-lg border p-4 space-y-3',
                  targetCalc.achievable
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                )}
              >
                <div className="flex items-start gap-2">
                  {targetCalc.achievable ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm font-medium">{targetCalc.needed}</p>
                </div>

                {targetCalc.remainingCredits > 0 && targetCalc.requiredGPA !== undefined && targetCalc.requiredGPA > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Remaining Credits</span>
                      <span className="font-medium">{targetCalc.remainingCredits}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Required Average GPA</span>
                      <span className="font-medium font-mono">
                        {targetCalc.requiredGPA.toFixed(2)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min((targetCalc.requiredGPA / 4.0) * 100, 100)}
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Standing Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" />
              Academic Standing
            </CardTitle>
            <CardDescription>Your current academic status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className={cn(
                  'flex h-20 w-20 items-center justify-center rounded-full',
                  academicStanding.color === 'emerald' &&
                    'bg-emerald-100 dark:bg-emerald-950/60',
                  academicStanding.color === 'amber' &&
                    'bg-amber-100 dark:bg-amber-950/60',
                  academicStanding.color === 'rose' &&
                    'bg-rose-100 dark:bg-rose-950/60',
                )}
              >
                {academicStanding.color === 'emerald' && (
                  <Trophy className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
                )}
                {academicStanding.color === 'amber' && (
                  <Star className="h-9 w-9 text-amber-600 dark:text-amber-400" />
                )}
                {academicStanding.color === 'rose' && (
                  <AlertTriangle className="h-9 w-9 text-rose-600 dark:text-rose-400" />
                )}
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{academicStanding.label}</p>
                <p className="text-sm text-muted-foreground">
                  Cumulative GPA: {overallGPA.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="text-sm font-medium">Standing Thresholds</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    Dean&apos;s List
                  </span>
                  <span className="text-muted-foreground">≥ 3.50</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    Good Standing
                  </span>
                  <span className="text-muted-foreground">2.00 – 3.49</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                    Academic Probation
                  </span>
                  <span className="text-muted-foreground">&lt; 2.00</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t space-y-2">
                <h4 className="text-sm font-medium">Semester Standing History</h4>
                {semesters
                  .filter((s) => s.gpa !== null)
                  .map((s) => {
                    const gpa = s.gpa!
                    const color =
                      gpa >= 3.5
                        ? 'bg-emerald-500'
                        : gpa >= 2.0
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                    return (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <div className={cn('h-2 w-2 rounded-full', color)} />
                          {s.name}
                        </span>
                        <span className="font-mono font-medium">{gpa.toFixed(2)}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
