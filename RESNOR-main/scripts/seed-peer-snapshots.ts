import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const ALL_WEAK_TOPICS = [
  'Data Structures', 'Algorithms', 'Calculus', 'Linear Algebra',
  'Probability', 'Database Systems', 'Computer Networks', 'Operating Systems',
  'Software Engineering', 'Object Oriented Programming', 'Discrete Mathematics',
  'Digital Logic', 'Compiler Design', 'Computer Architecture',
  'Artificial Intelligence', 'Machine Learning', 'Statistics',
  'Physics', 'Chemistry', 'Accounting',
]

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function clamp(v: number, min: number, max: number): number {
  return Math.round(Math.max(min, Math.min(max, v)) * 100) / 100
}

interface Trajectory {
  name: string
  semesters: { cgpa: number; quizAvg: number; studyHours: number; consistency: number; completion: number; interactionDensity: number; weakTopicCount: number; courseCount: number; attendance: number }[]
}

const TRAJECTORIES: Trajectory[] = [
  {
    name: 'Fahim Ahmed',
    semesters: [
      { cgpa: 2.10, quizAvg: 42, studyHours: 25, consistency: 30, completion: 35, interactionDensity: 0.15, weakTopicCount: 7, courseCount: 6, attendance: 55 },
      { cgpa: 2.45, quizAvg: 50, studyHours: 38, consistency: 38, completion: 42, interactionDensity: 0.22, weakTopicCount: 6, courseCount: 6, attendance: 60 },
      { cgpa: 2.85, quizAvg: 58, studyHours: 55, consistency: 48, completion: 55, interactionDensity: 0.30, weakTopicCount: 5, courseCount: 5, attendance: 68 },
      { cgpa: 3.20, quizAvg: 68, studyHours: 72, consistency: 60, completion: 68, interactionDensity: 0.40, weakTopicCount: 4, courseCount: 5, attendance: 75 },
      { cgpa: 3.50, quizAvg: 78, studyHours: 90, consistency: 72, completion: 80, interactionDensity: 0.52, weakTopicCount: 3, courseCount: 5, attendance: 82 },
      { cgpa: 3.70, quizAvg: 85, studyHours: 105, consistency: 80, completion: 88, interactionDensity: 0.60, weakTopicCount: 2, courseCount: 4, attendance: 88 },
    ],
  },
  {
    name: 'Nusrat Jahan',
    semesters: [
      { cgpa: 3.80, quizAvg: 90, studyHours: 95, consistency: 90, completion: 92, interactionDensity: 0.70, weakTopicCount: 2, courseCount: 5, attendance: 95 },
      { cgpa: 3.70, quizAvg: 88, studyHours: 92, consistency: 88, completion: 90, interactionDensity: 0.68, weakTopicCount: 2, courseCount: 5, attendance: 93 },
      { cgpa: 3.90, quizAvg: 93, studyHours: 100, consistency: 92, completion: 95, interactionDensity: 0.75, weakTopicCount: 1, courseCount: 5, attendance: 96 },
      { cgpa: 3.80, quizAvg: 90, studyHours: 96, consistency: 90, completion: 93, interactionDensity: 0.72, weakTopicCount: 1, courseCount: 4, attendance: 94 },
      { cgpa: 3.90, quizAvg: 94, studyHours: 102, consistency: 93, completion: 96, interactionDensity: 0.76, weakTopicCount: 1, courseCount: 4, attendance: 97 },
      { cgpa: 3.95, quizAvg: 96, studyHours: 108, consistency: 95, completion: 97, interactionDensity: 0.78, weakTopicCount: 1, courseCount: 4, attendance: 98 },
    ],
  },
  {
    name: 'Tanvir Hasan',
    semesters: [
      { cgpa: 2.50, quizAvg: 48, studyHours: 30, consistency: 35, completion: 40, interactionDensity: 0.18, weakTopicCount: 6, courseCount: 6, attendance: 58 },
      { cgpa: 2.30, quizAvg: 42, studyHours: 25, consistency: 28, completion: 32, interactionDensity: 0.14, weakTopicCount: 7, courseCount: 6, attendance: 50 },
      { cgpa: 2.00, quizAvg: 35, studyHours: 20, consistency: 22, completion: 28, interactionDensity: 0.10, weakTopicCount: 8, courseCount: 6, attendance: 42 },
      { cgpa: 2.80, quizAvg: 55, studyHours: 50, consistency: 45, completion: 50, interactionDensity: 0.28, weakTopicCount: 5, courseCount: 5, attendance: 65 },
      { cgpa: 3.10, quizAvg: 65, studyHours: 68, consistency: 58, completion: 65, interactionDensity: 0.38, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.30, quizAvg: 72, studyHours: 80, consistency: 68, completion: 75, interactionDensity: 0.48, weakTopicCount: 3, courseCount: 4, attendance: 78 },
    ],
  },
  {
    name: 'Sadia Islam',
    semesters: [
      { cgpa: 3.20, quizAvg: 72, studyHours: 65, consistency: 62, completion: 70, interactionDensity: 0.42, weakTopicCount: 4, courseCount: 5, attendance: 78 },
      { cgpa: 3.40, quizAvg: 76, studyHours: 70, consistency: 68, completion: 75, interactionDensity: 0.48, weakTopicCount: 3, courseCount: 5, attendance: 82 },
      { cgpa: 3.00, quizAvg: 65, studyHours: 55, consistency: 50, completion: 60, interactionDensity: 0.35, weakTopicCount: 5, courseCount: 5, attendance: 70 },
      { cgpa: 3.50, quizAvg: 80, studyHours: 78, consistency: 72, completion: 82, interactionDensity: 0.55, weakTopicCount: 3, courseCount: 5, attendance: 85 },
      { cgpa: 3.60, quizAvg: 82, studyHours: 85, consistency: 75, completion: 85, interactionDensity: 0.58, weakTopicCount: 2, courseCount: 4, attendance: 88 },
      { cgpa: 3.70, quizAvg: 85, studyHours: 90, consistency: 78, completion: 88, interactionDensity: 0.62, weakTopicCount: 2, courseCount: 4, attendance: 90 },
    ],
  },
  {
    name: 'Rakib Hossain',
    semesters: [
      { cgpa: 2.80, quizAvg: 55, studyHours: 40, consistency: 42, completion: 48, interactionDensity: 0.22, weakTopicCount: 5, courseCount: 6, attendance: 65 },
      { cgpa: 3.00, quizAvg: 60, studyHours: 48, consistency: 48, completion: 55, interactionDensity: 0.28, weakTopicCount: 5, courseCount: 6, attendance: 70 },
      { cgpa: 3.30, quizAvg: 70, studyHours: 62, consistency: 58, completion: 68, interactionDensity: 0.38, weakTopicCount: 4, courseCount: 5, attendance: 78 },
      { cgpa: 3.50, quizAvg: 78, studyHours: 75, consistency: 68, completion: 78, interactionDensity: 0.48, weakTopicCount: 3, courseCount: 5, attendance: 85 },
      { cgpa: 3.40, quizAvg: 76, studyHours: 72, consistency: 65, completion: 76, interactionDensity: 0.45, weakTopicCount: 3, courseCount: 5, attendance: 82 },
      { cgpa: 3.60, quizAvg: 82, studyHours: 82, consistency: 72, completion: 82, interactionDensity: 0.52, weakTopicCount: 2, courseCount: 4, attendance: 88 },
    ],
  },
  {
    name: 'Mehedi Hasan',
    semesters: [
      { cgpa: 2.00, quizAvg: 35, studyHours: 20, consistency: 22, completion: 28, interactionDensity: 0.10, weakTopicCount: 8, courseCount: 6, attendance: 45 },
      { cgpa: 2.20, quizAvg: 38, studyHours: 25, consistency: 28, completion: 32, interactionDensity: 0.14, weakTopicCount: 7, courseCount: 6, attendance: 50 },
      { cgpa: 2.50, quizAvg: 45, studyHours: 35, consistency: 35, completion: 42, interactionDensity: 0.20, weakTopicCount: 6, courseCount: 6, attendance: 58 },
      { cgpa: 2.30, quizAvg: 40, studyHours: 28, consistency: 30, completion: 35, interactionDensity: 0.16, weakTopicCount: 7, courseCount: 6, attendance: 52 },
      { cgpa: 2.80, quizAvg: 52, studyHours: 45, consistency: 42, completion: 50, interactionDensity: 0.25, weakTopicCount: 5, courseCount: 5, attendance: 65 },
      { cgpa: 3.00, quizAvg: 60, studyHours: 55, consistency: 50, completion: 58, interactionDensity: 0.32, weakTopicCount: 4, courseCount: 5, attendance: 72 },
    ],
  },
  {
    name: 'Shakib Al Hasan',
    semesters: [
      { cgpa: 2.50, quizAvg: 48, studyHours: 32, consistency: 35, completion: 40, interactionDensity: 0.18, weakTopicCount: 6, courseCount: 6, attendance: 60 },
      { cgpa: 2.50, quizAvg: 46, studyHours: 30, consistency: 33, completion: 38, interactionDensity: 0.17, weakTopicCount: 6, courseCount: 6, attendance: 58 },
      { cgpa: 2.70, quizAvg: 52, studyHours: 40, consistency: 40, completion: 48, interactionDensity: 0.22, weakTopicCount: 5, courseCount: 5, attendance: 65 },
      { cgpa: 3.00, quizAvg: 62, studyHours: 55, consistency: 52, completion: 60, interactionDensity: 0.32, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.00, quizAvg: 60, studyHours: 52, consistency: 50, completion: 58, interactionDensity: 0.30, weakTopicCount: 4, courseCount: 5, attendance: 70 },
      { cgpa: 3.20, quizAvg: 68, studyHours: 62, consistency: 58, completion: 65, interactionDensity: 0.38, weakTopicCount: 3, courseCount: 4, attendance: 78 },
    ],
  },
  {
    name: 'Farzana Rahman',
    semesters: [
      { cgpa: 3.30, quizAvg: 74, studyHours: 68, consistency: 65, completion: 72, interactionDensity: 0.44, weakTopicCount: 4, courseCount: 5, attendance: 80 },
      { cgpa: 3.50, quizAvg: 78, studyHours: 75, consistency: 70, completion: 78, interactionDensity: 0.50, weakTopicCount: 3, courseCount: 5, attendance: 85 },
      { cgpa: 3.40, quizAvg: 76, studyHours: 72, consistency: 68, completion: 75, interactionDensity: 0.48, weakTopicCount: 3, courseCount: 5, attendance: 82 },
      { cgpa: 3.70, quizAvg: 84, studyHours: 88, consistency: 78, completion: 86, interactionDensity: 0.58, weakTopicCount: 2, courseCount: 4, attendance: 90 },
      { cgpa: 3.80, quizAvg: 88, studyHours: 95, consistency: 82, completion: 90, interactionDensity: 0.65, weakTopicCount: 2, courseCount: 4, attendance: 92 },
      { cgpa: 3.90, quizAvg: 92, studyHours: 102, consistency: 88, completion: 94, interactionDensity: 0.70, weakTopicCount: 1, courseCount: 4, attendance: 95 },
    ],
  },
  {
    name: 'Nazmul Huda',
    semesters: [
      { cgpa: 3.00, quizAvg: 62, studyHours: 50, consistency: 52, completion: 58, interactionDensity: 0.30, weakTopicCount: 5, courseCount: 6, attendance: 72 },
      { cgpa: 3.20, quizAvg: 68, studyHours: 58, consistency: 58, completion: 65, interactionDensity: 0.36, weakTopicCount: 4, courseCount: 5, attendance: 78 },
      { cgpa: 3.40, quizAvg: 75, studyHours: 68, consistency: 65, completion: 72, interactionDensity: 0.44, weakTopicCount: 3, courseCount: 5, attendance: 82 },
      { cgpa: 3.60, quizAvg: 82, studyHours: 80, consistency: 72, completion: 80, interactionDensity: 0.52, weakTopicCount: 2, courseCount: 5, attendance: 88 },
      { cgpa: 3.80, quizAvg: 88, studyHours: 92, consistency: 80, completion: 88, interactionDensity: 0.62, weakTopicCount: 2, courseCount: 4, attendance: 92 },
      { cgpa: 3.85, quizAvg: 90, studyHours: 98, consistency: 85, completion: 92, interactionDensity: 0.66, weakTopicCount: 1, courseCount: 4, attendance: 94 },
    ],
  },
  {
    name: 'Sharmin Akter',
    semesters: [
      { cgpa: 2.20, quizAvg: 40, studyHours: 22, consistency: 28, completion: 32, interactionDensity: 0.12, weakTopicCount: 7, courseCount: 6, attendance: 50 },
      { cgpa: 2.80, quizAvg: 55, studyHours: 45, consistency: 42, completion: 50, interactionDensity: 0.25, weakTopicCount: 5, courseCount: 6, attendance: 65 },
      { cgpa: 3.00, quizAvg: 62, studyHours: 55, consistency: 50, completion: 58, interactionDensity: 0.32, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.40, quizAvg: 76, studyHours: 72, consistency: 65, completion: 75, interactionDensity: 0.45, weakTopicCount: 3, courseCount: 5, attendance: 82 },
      { cgpa: 3.50, quizAvg: 78, studyHours: 78, consistency: 70, completion: 80, interactionDensity: 0.50, weakTopicCount: 3, courseCount: 4, attendance: 85 },
    ],
  },
  {
    name: 'Imran Hossain',
    semesters: [
      { cgpa: 3.10, quizAvg: 68, studyHours: 58, consistency: 55, completion: 62, interactionDensity: 0.35, weakTopicCount: 4, courseCount: 5, attendance: 75 },
      { cgpa: 3.00, quizAvg: 62, studyHours: 52, consistency: 50, completion: 58, interactionDensity: 0.30, weakTopicCount: 5, courseCount: 5, attendance: 72 },
      { cgpa: 2.80, quizAvg: 55, studyHours: 45, consistency: 42, completion: 50, interactionDensity: 0.25, weakTopicCount: 5, courseCount: 5, attendance: 65 },
      { cgpa: 3.20, quizAvg: 70, studyHours: 65, consistency: 60, completion: 68, interactionDensity: 0.40, weakTopicCount: 4, courseCount: 5, attendance: 78 },
      { cgpa: 3.50, quizAvg: 80, studyHours: 82, consistency: 72, completion: 82, interactionDensity: 0.55, weakTopicCount: 3, courseCount: 4, attendance: 85 },
      { cgpa: 3.60, quizAvg: 84, studyHours: 88, consistency: 78, completion: 86, interactionDensity: 0.60, weakTopicCount: 2, courseCount: 4, attendance: 88 },
    ],
  },
  {
    name: 'Jahidul Islam',
    semesters: [
      { cgpa: 2.50, quizAvg: 48, studyHours: 30, consistency: 32, completion: 38, interactionDensity: 0.16, weakTopicCount: 6, courseCount: 6, attendance: 58 },
      { cgpa: 2.70, quizAvg: 52, studyHours: 38, consistency: 40, completion: 45, interactionDensity: 0.22, weakTopicCount: 5, courseCount: 6, attendance: 62 },
      { cgpa: 3.00, quizAvg: 60, studyHours: 50, consistency: 50, completion: 55, interactionDensity: 0.30, weakTopicCount: 4, courseCount: 5, attendance: 70 },
      { cgpa: 2.80, quizAvg: 55, studyHours: 42, consistency: 42, completion: 48, interactionDensity: 0.24, weakTopicCount: 5, courseCount: 5, attendance: 65 },
      { cgpa: 3.20, quizAvg: 70, studyHours: 65, consistency: 60, completion: 68, interactionDensity: 0.40, weakTopicCount: 4, courseCount: 5, attendance: 78 },
      { cgpa: 3.40, quizAvg: 75, studyHours: 72, consistency: 68, completion: 75, interactionDensity: 0.46, weakTopicCount: 3, courseCount: 4, attendance: 82 },
    ],
  },
  {
    name: 'Hasan Mahmud',
    semesters: [
      { cgpa: 2.00, quizAvg: 35, studyHours: 18, consistency: 20, completion: 25, interactionDensity: 0.08, weakTopicCount: 8, courseCount: 6, attendance: 42 },
      { cgpa: 2.30, quizAvg: 42, studyHours: 28, consistency: 30, completion: 35, interactionDensity: 0.15, weakTopicCount: 6, courseCount: 6, attendance: 55 },
      { cgpa: 2.60, quizAvg: 50, studyHours: 38, consistency: 40, completion: 45, interactionDensity: 0.22, weakTopicCount: 5, courseCount: 6, attendance: 62 },
      { cgpa: 3.00, quizAvg: 62, studyHours: 55, consistency: 52, completion: 60, interactionDensity: 0.32, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.30, quizAvg: 72, studyHours: 70, consistency: 65, completion: 72, interactionDensity: 0.42, weakTopicCount: 3, courseCount: 5, attendance: 80 },
      { cgpa: 3.50, quizAvg: 78, studyHours: 82, consistency: 72, completion: 80, interactionDensity: 0.52, weakTopicCount: 2, courseCount: 4, attendance: 85 },
    ],
  },
  {
    name: 'Sumaiya Akhter',
    semesters: [
      { cgpa: 2.40, quizAvg: 45, studyHours: 28, consistency: 30, completion: 35, interactionDensity: 0.15, weakTopicCount: 6, courseCount: 6, attendance: 55 },
      { cgpa: 2.60, quizAvg: 50, studyHours: 35, consistency: 38, completion: 42, interactionDensity: 0.20, weakTopicCount: 5, courseCount: 6, attendance: 62 },
      { cgpa: 3.00, quizAvg: 62, studyHours: 55, consistency: 52, completion: 60, interactionDensity: 0.32, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.20, quizAvg: 70, studyHours: 68, consistency: 62, completion: 70, interactionDensity: 0.42, weakTopicCount: 3, courseCount: 5, attendance: 78 },
      { cgpa: 3.60, quizAvg: 82, studyHours: 88, consistency: 75, completion: 85, interactionDensity: 0.55, weakTopicCount: 2, courseCount: 4, attendance: 88 },
    ],
  },
  {
    name: 'Marjia Akhter',
    semesters: [
      { cgpa: 2.60, quizAvg: 50, studyHours: 35, consistency: 38, completion: 42, interactionDensity: 0.20, weakTopicCount: 5, courseCount: 6, attendance: 62 },
      { cgpa: 2.40, quizAvg: 45, studyHours: 28, consistency: 30, completion: 35, interactionDensity: 0.15, weakTopicCount: 6, courseCount: 6, attendance: 55 },
      { cgpa: 2.80, quizAvg: 55, studyHours: 45, consistency: 42, completion: 50, interactionDensity: 0.25, weakTopicCount: 5, courseCount: 5, attendance: 65 },
      { cgpa: 3.00, quizAvg: 62, studyHours: 55, consistency: 52, completion: 60, interactionDensity: 0.32, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.20, quizAvg: 70, studyHours: 68, consistency: 62, completion: 70, interactionDensity: 0.42, weakTopicCount: 3, courseCount: 5, attendance: 78 },
      { cgpa: 3.40, quizAvg: 76, studyHours: 78, consistency: 70, completion: 78, interactionDensity: 0.50, weakTopicCount: 2, courseCount: 4, attendance: 84 },
    ],
  },
  {
    name: 'Touhid Hossain',
    semesters: [
      { cgpa: 3.00, quizAvg: 62, studyHours: 52, consistency: 55, completion: 60, interactionDensity: 0.32, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.20, quizAvg: 70, studyHours: 62, consistency: 60, completion: 68, interactionDensity: 0.40, weakTopicCount: 4, courseCount: 5, attendance: 78 },
      { cgpa: 3.40, quizAvg: 75, studyHours: 72, consistency: 68, completion: 75, interactionDensity: 0.46, weakTopicCount: 3, courseCount: 5, attendance: 82 },
      { cgpa: 3.50, quizAvg: 78, studyHours: 78, consistency: 72, completion: 80, interactionDensity: 0.50, weakTopicCount: 3, courseCount: 4, attendance: 85 },
      { cgpa: 3.70, quizAvg: 85, studyHours: 90, consistency: 80, completion: 88, interactionDensity: 0.60, weakTopicCount: 2, courseCount: 4, attendance: 90 },
    ],
  },
  {
    name: 'Nusrat Jahan',
    semesters: [
      { cgpa: 2.20, quizAvg: 40, studyHours: 22, consistency: 25, completion: 30, interactionDensity: 0.12, weakTopicCount: 7, courseCount: 6, attendance: 48 },
      { cgpa: 2.50, quizAvg: 48, studyHours: 32, consistency: 35, completion: 40, interactionDensity: 0.18, weakTopicCount: 6, courseCount: 6, attendance: 58 },
      { cgpa: 2.80, quizAvg: 55, studyHours: 45, consistency: 42, completion: 50, interactionDensity: 0.25, weakTopicCount: 5, courseCount: 5, attendance: 65 },
      { cgpa: 3.00, quizAvg: 62, studyHours: 55, consistency: 52, completion: 60, interactionDensity: 0.32, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.40, quizAvg: 75, studyHours: 72, consistency: 65, completion: 75, interactionDensity: 0.45, weakTopicCount: 3, courseCount: 5, attendance: 82 },
    ],
  },
  {
    name: 'Rumana Islam',
    semesters: [
      { cgpa: 2.50, quizAvg: 48, studyHours: 30, consistency: 32, completion: 38, interactionDensity: 0.16, weakTopicCount: 6, courseCount: 6, attendance: 58 },
      { cgpa: 3.00, quizAvg: 62, studyHours: 52, consistency: 50, completion: 58, interactionDensity: 0.30, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.30, quizAvg: 72, studyHours: 68, consistency: 62, completion: 70, interactionDensity: 0.42, weakTopicCount: 3, courseCount: 5, attendance: 80 },
      { cgpa: 3.60, quizAvg: 82, studyHours: 85, consistency: 75, completion: 82, interactionDensity: 0.55, weakTopicCount: 2, courseCount: 4, attendance: 88 },
      { cgpa: 3.80, quizAvg: 88, studyHours: 95, consistency: 82, completion: 90, interactionDensity: 0.65, weakTopicCount: 2, courseCount: 4, attendance: 92 },
    ],
  },
  {
    name: 'Faisal Rahman',
    semesters: [
      { cgpa: 2.80, quizAvg: 55, studyHours: 42, consistency: 45, completion: 50, interactionDensity: 0.24, weakTopicCount: 5, courseCount: 6, attendance: 65 },
      { cgpa: 2.50, quizAvg: 48, studyHours: 32, consistency: 35, completion: 40, interactionDensity: 0.18, weakTopicCount: 6, courseCount: 6, attendance: 58 },
      { cgpa: 2.20, quizAvg: 40, studyHours: 25, consistency: 28, completion: 32, interactionDensity: 0.14, weakTopicCount: 7, courseCount: 6, attendance: 50 },
      { cgpa: 2.60, quizAvg: 50, studyHours: 38, completion: 45, consistency: 40, interactionDensity: 0.22, weakTopicCount: 5, courseCount: 5, attendance: 62 },
      { cgpa: 3.00, quizAvg: 65, studyHours: 58, completion: 62, consistency: 55, interactionDensity: 0.35, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.20, quizAvg: 72, studyHours: 70, completion: 72, consistency: 65, interactionDensity: 0.45, weakTopicCount: 3, courseCount: 4, attendance: 80 },
    ],
  },
  {
    name: 'Shafiqul Islam',
    semesters: [
      { cgpa: 2.00, quizAvg: 32, studyHours: 15, consistency: 18, completion: 22, interactionDensity: 0.06, weakTopicCount: 8, courseCount: 6, attendance: 40 },
      { cgpa: 2.20, quizAvg: 38, studyHours: 22, consistency: 25, completion: 30, interactionDensity: 0.12, weakTopicCount: 7, courseCount: 6, attendance: 48 },
      { cgpa: 2.50, quizAvg: 45, studyHours: 32, consistency: 35, completion: 42, interactionDensity: 0.18, weakTopicCount: 6, courseCount: 6, attendance: 58 },
      { cgpa: 2.70, quizAvg: 52, studyHours: 40, consistency: 42, completion: 48, interactionDensity: 0.24, weakTopicCount: 5, courseCount: 5, attendance: 65 },
      { cgpa: 3.00, quizAvg: 60, studyHours: 55, consistency: 52, completion: 60, interactionDensity: 0.32, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.20, quizAvg: 68, studyHours: 65, consistency: 60, completion: 68, interactionDensity: 0.40, weakTopicCount: 3, courseCount: 4, attendance: 78 },
    ],
  },
  {
    name: 'Hasibul Hasan',
    semesters: [
      { cgpa: 2.50, quizAvg: 48, studyHours: 30, consistency: 35, completion: 40, interactionDensity: 0.18, weakTopicCount: 6, courseCount: 6, attendance: 58 },
      { cgpa: 2.70, quizAvg: 52, studyHours: 38, consistency: 40, completion: 45, interactionDensity: 0.22, weakTopicCount: 5, courseCount: 6, attendance: 65 },
      { cgpa: 3.00, quizAvg: 62, studyHours: 55, consistency: 52, completion: 60, interactionDensity: 0.32, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.20, quizAvg: 70, studyHours: 65, consistency: 60, completion: 68, interactionDensity: 0.40, weakTopicCount: 3, courseCount: 5, attendance: 78 },
      { cgpa: 3.10, quizAvg: 68, studyHours: 62, consistency: 58, completion: 65, interactionDensity: 0.38, weakTopicCount: 3, courseCount: 5, attendance: 76 },
      { cgpa: 3.30, quizAvg: 74, studyHours: 72, consistency: 68, completion: 75, interactionDensity: 0.48, weakTopicCount: 3, courseCount: 4, attendance: 82 },
    ],
  },
  {
    name: 'Rafiq Uddin',
    semesters: [
      { cgpa: 3.00, quizAvg: 62, studyHours: 50, consistency: 52, completion: 58, interactionDensity: 0.30, weakTopicCount: 5, courseCount: 6, attendance: 72 },
      { cgpa: 2.80, quizAvg: 55, studyHours: 42, consistency: 42, completion: 48, interactionDensity: 0.24, weakTopicCount: 5, courseCount: 6, attendance: 65 },
      { cgpa: 3.20, quizAvg: 70, studyHours: 62, consistency: 58, completion: 68, interactionDensity: 0.38, weakTopicCount: 4, courseCount: 5, attendance: 78 },
      { cgpa: 3.50, quizAvg: 78, studyHours: 78, consistency: 70, completion: 80, interactionDensity: 0.50, weakTopicCount: 3, courseCount: 5, attendance: 85 },
      { cgpa: 3.70, quizAvg: 85, studyHours: 92, consistency: 78, completion: 88, interactionDensity: 0.60, weakTopicCount: 2, courseCount: 4, attendance: 90 },
    ],
  },
  {
    name: 'Shamim Hossain',
    semesters: [
      { cgpa: 2.30, quizAvg: 42, studyHours: 25, consistency: 28, completion: 35, interactionDensity: 0.14, weakTopicCount: 7, courseCount: 6, attendance: 52 },
      { cgpa: 2.50, quizAvg: 48, studyHours: 35, consistency: 38, completion: 42, interactionDensity: 0.20, weakTopicCount: 6, courseCount: 6, attendance: 60 },
      { cgpa: 2.80, quizAvg: 55, studyHours: 45, consistency: 45, completion: 52, interactionDensity: 0.26, weakTopicCount: 5, courseCount: 5, attendance: 68 },
      { cgpa: 3.00, quizAvg: 62, studyHours: 55, consistency: 52, completion: 60, interactionDensity: 0.32, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.30, quizAvg: 72, studyHours: 70, consistency: 65, completion: 72, interactionDensity: 0.42, weakTopicCount: 3, courseCount: 5, attendance: 80 },
      { cgpa: 3.50, quizAvg: 78, studyHours: 80, consistency: 72, completion: 80, interactionDensity: 0.52, weakTopicCount: 2, courseCount: 4, attendance: 85 },
    ],
  },
  {
    name: 'Kazi Farhan',
    semesters: [
      { cgpa: 2.80, quizAvg: 55, studyHours: 40, consistency: 42, completion: 48, interactionDensity: 0.22, weakTopicCount: 5, courseCount: 6, attendance: 65 },
      { cgpa: 3.00, quizAvg: 62, studyHours: 50, consistency: 50, completion: 58, interactionDensity: 0.30, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.10, quizAvg: 65, studyHours: 55, consistency: 52, completion: 60, interactionDensity: 0.32, weakTopicCount: 4, courseCount: 5, attendance: 74 },
      { cgpa: 3.30, quizAvg: 72, studyHours: 68, consistency: 62, completion: 70, interactionDensity: 0.42, weakTopicCount: 3, courseCount: 5, attendance: 80 },
      { cgpa: 3.50, quizAvg: 78, studyHours: 78, consistency: 70, completion: 80, interactionDensity: 0.52, weakTopicCount: 2, courseCount: 4, attendance: 86 },
    ],
  },
  {
    name: 'Taslima Begum',
    semesters: [
      { cgpa: 3.20, quizAvg: 70, studyHours: 62, consistency: 60, completion: 68, interactionDensity: 0.40, weakTopicCount: 4, courseCount: 5, attendance: 78 },
      { cgpa: 3.40, quizAvg: 75, studyHours: 70, consistency: 65, completion: 75, interactionDensity: 0.46, weakTopicCount: 3, courseCount: 5, attendance: 82 },
      { cgpa: 3.30, quizAvg: 72, studyHours: 66, consistency: 62, completion: 70, interactionDensity: 0.42, weakTopicCount: 3, courseCount: 5, attendance: 80 },
      { cgpa: 3.60, quizAvg: 82, studyHours: 82, consistency: 72, completion: 82, interactionDensity: 0.55, weakTopicCount: 2, courseCount: 4, attendance: 88 },
      { cgpa: 3.70, quizAvg: 85, studyHours: 88, consistency: 78, completion: 86, interactionDensity: 0.60, weakTopicCount: 2, courseCount: 4, attendance: 90 },
    ],
  },
  {
    name: 'Maksuda Akhter',
    semesters: [
      { cgpa: 3.10, quizAvg: 68, studyHours: 55, consistency: 55, completion: 62, interactionDensity: 0.35, weakTopicCount: 4, courseCount: 5, attendance: 75 },
      { cgpa: 3.30, quizAvg: 74, studyHours: 68, consistency: 65, completion: 72, interactionDensity: 0.44, weakTopicCount: 3, courseCount: 5, attendance: 80 },
      { cgpa: 3.50, quizAvg: 78, studyHours: 78, consistency: 70, completion: 80, interactionDensity: 0.52, weakTopicCount: 3, courseCount: 5, attendance: 85 },
      { cgpa: 3.40, quizAvg: 76, studyHours: 72, consistency: 68, completion: 75, interactionDensity: 0.48, weakTopicCount: 3, courseCount: 5, attendance: 82 },
      { cgpa: 3.70, quizAvg: 85, studyHours: 90, consistency: 78, completion: 88, interactionDensity: 0.62, weakTopicCount: 2, courseCount: 4, attendance: 90 },
    ],
  },
  {
    name: 'Tahmina Akter',
    semesters: [
      { cgpa: 3.00, quizAvg: 62, studyHours: 50, consistency: 52, completion: 58, interactionDensity: 0.30, weakTopicCount: 5, courseCount: 6, attendance: 72 },
      { cgpa: 2.80, quizAvg: 55, studyHours: 42, consistency: 42, completion: 48, interactionDensity: 0.24, weakTopicCount: 5, courseCount: 6, attendance: 65 },
      { cgpa: 3.20, quizAvg: 70, studyHours: 62, consistency: 58, completion: 68, interactionDensity: 0.38, weakTopicCount: 4, courseCount: 5, attendance: 78 },
      { cgpa: 3.00, quizAvg: 62, studyHours: 52, consistency: 50, completion: 58, interactionDensity: 0.30, weakTopicCount: 4, courseCount: 5, attendance: 72 },
      { cgpa: 3.40, quizAvg: 76, studyHours: 72, consistency: 68, completion: 75, interactionDensity: 0.48, weakTopicCount: 3, courseCount: 5, attendance: 82 },
      { cgpa: 3.50, quizAvg: 80, studyHours: 80, consistency: 72, completion: 82, interactionDensity: 0.55, weakTopicCount: 2, courseCount: 4, attendance: 85 },
    ],
  },
  {
    name: 'Prince Kumar',
    semesters: [
      { cgpa: 3.70, quizAvg: 86, studyHours: 90, consistency: 88, completion: 90, interactionDensity: 0.68, weakTopicCount: 2, courseCount: 5, attendance: 92 },
      { cgpa: 3.80, quizAvg: 90, studyHours: 95, consistency: 90, completion: 94, interactionDensity: 0.72, weakTopicCount: 1, courseCount: 5, attendance: 94 },
      { cgpa: 3.60, quizAvg: 84, studyHours: 88, consistency: 82, completion: 88, interactionDensity: 0.65, weakTopicCount: 2, courseCount: 5, attendance: 90 },
      { cgpa: 3.80, quizAvg: 90, studyHours: 96, consistency: 90, completion: 94, interactionDensity: 0.74, weakTopicCount: 1, courseCount: 4, attendance: 95 },
      { cgpa: 3.90, quizAvg: 94, studyHours: 105, consistency: 94, completion: 97, interactionDensity: 0.78, weakTopicCount: 1, courseCount: 4, attendance: 97 },
    ],
  },
  {
    name: 'Shahidul Alam',
    semesters: [
      { cgpa: 3.50, quizAvg: 78, studyHours: 78, consistency: 72, completion: 80, interactionDensity: 0.52, weakTopicCount: 3, courseCount: 5, attendance: 85 },
      { cgpa: 3.30, quizAvg: 72, studyHours: 68, consistency: 65, completion: 72, interactionDensity: 0.44, weakTopicCount: 3, courseCount: 5, attendance: 80 },
      { cgpa: 3.60, quizAvg: 82, studyHours: 85, consistency: 75, completion: 84, interactionDensity: 0.58, weakTopicCount: 2, courseCount: 5, attendance: 88 },
      { cgpa: 3.40, quizAvg: 76, studyHours: 72, consistency: 68, completion: 75, interactionDensity: 0.48, weakTopicCount: 3, courseCount: 4, attendance: 82 },
      { cgpa: 3.70, quizAvg: 85, studyHours: 92, consistency: 80, completion: 88, interactionDensity: 0.62, weakTopicCount: 2, courseCount: 4, attendance: 90 },
    ],
  },
  {
    name: 'Ripa Sultana',
    semesters: [
      { cgpa: 3.60, quizAvg: 82, studyHours: 85, consistency: 80, completion: 85, interactionDensity: 0.60, weakTopicCount: 2, courseCount: 5, attendance: 88 },
      { cgpa: 3.70, quizAvg: 86, studyHours: 90, consistency: 82, completion: 88, interactionDensity: 0.64, weakTopicCount: 2, courseCount: 5, attendance: 90 },
      { cgpa: 3.50, quizAvg: 80, studyHours: 82, consistency: 78, completion: 82, interactionDensity: 0.58, weakTopicCount: 2, courseCount: 5, attendance: 86 },
      { cgpa: 3.80, quizAvg: 90, studyHours: 98, consistency: 88, completion: 92, interactionDensity: 0.70, weakTopicCount: 1, courseCount: 4, attendance: 94 },
      { cgpa: 3.90, quizAvg: 93, studyHours: 105, consistency: 92, completion: 96, interactionDensity: 0.76, weakTopicCount: 1, courseCount: 4, attendance: 96 },
    ],
  },
  {
    name: 'Shamima Pervin',
    semesters: [
      { cgpa: 3.40, quizAvg: 75, studyHours: 72, consistency: 68, completion: 75, interactionDensity: 0.48, weakTopicCount: 3, courseCount: 5, attendance: 82 },
      { cgpa: 3.50, quizAvg: 78, studyHours: 78, consistency: 72, completion: 80, interactionDensity: 0.52, weakTopicCount: 3, courseCount: 5, attendance: 85 },
      { cgpa: 3.60, quizAvg: 82, studyHours: 85, consistency: 76, completion: 84, interactionDensity: 0.58, weakTopicCount: 2, courseCount: 5, attendance: 88 },
      { cgpa: 3.70, quizAvg: 86, studyHours: 92, consistency: 80, completion: 88, interactionDensity: 0.62, weakTopicCount: 2, courseCount: 4, attendance: 90 },
      { cgpa: 3.80, quizAvg: 90, studyHours: 98, consistency: 84, completion: 92, interactionDensity: 0.68, weakTopicCount: 1, courseCount: 4, attendance: 93 },
    ],
  },
  {
    name: 'Maliha Tabassum',
    semesters: [
      { cgpa: 3.80, quizAvg: 88, studyHours: 92, consistency: 88, completion: 92, interactionDensity: 0.70, weakTopicCount: 1, courseCount: 5, attendance: 94 },
      { cgpa: 3.60, quizAvg: 82, studyHours: 85, consistency: 78, completion: 84, interactionDensity: 0.58, weakTopicCount: 2, courseCount: 5, attendance: 88 },
      { cgpa: 3.90, quizAvg: 92, studyHours: 100, consistency: 92, completion: 95, interactionDensity: 0.74, weakTopicCount: 1, courseCount: 4, attendance: 96 },
      { cgpa: 3.70, quizAvg: 86, studyHours: 90, consistency: 82, completion: 88, interactionDensity: 0.64, weakTopicCount: 2, courseCount: 4, attendance: 92 },
      { cgpa: 3.90, quizAvg: 94, studyHours: 102, consistency: 94, completion: 96, interactionDensity: 0.78, weakTopicCount: 1, courseCount: 4, attendance: 97 },
    ],
  },
  {
    name: 'Arifuzzaman',
    semesters: [
      { cgpa: 2.80, quizAvg: 55, studyHours: 40, consistency: 42, completion: 48, interactionDensity: 0.22, weakTopicCount: 5, courseCount: 6, attendance: 65 },
      { cgpa: 2.60, quizAvg: 50, studyHours: 32, consistency: 35, completion: 40, interactionDensity: 0.18, weakTopicCount: 6, courseCount: 6, attendance: 58 },
      { cgpa: 2.40, quizAvg: 42, studyHours: 25, consistency: 28, completion: 32, interactionDensity: 0.14, weakTopicCount: 7, courseCount: 6, attendance: 50 },
      { cgpa: 2.20, quizAvg: 38, studyHours: 20, consistency: 22, completion: 28, interactionDensity: 0.10, weakTopicCount: 8, courseCount: 6, attendance: 45 },
      { cgpa: 2.00, quizAvg: 32, studyHours: 15, consistency: 18, completion: 22, interactionDensity: 0.06, weakTopicCount: 8, courseCount: 5, attendance: 38 },
    ],
  },
]

async function main() {
  console.log('Seeding peer comparison snapshots...\n')

  for (const t of TRAJECTORIES) {
    const studentId = `senior_${t.name.toLowerCase().replace(/\s+/g, '_')}`

    for (let s = 0; s < t.semesters.length; s++) {
      const sem = t.semesters[s]
      const weakTopics = pickRandom(ALL_WEAK_TOPICS, sem.weakTopicCount)

      await db.semesterSnapshot.create({
        data: {
          studentId,
          studentName: t.name,
          semester: s + 1,
          cgpa: clamp(sem.cgpa, 2.0, 4.0),
          quizAverage: clamp(sem.quizAvg, 0, 100),
          quizCount: Math.round(8 + Math.random() * 12),
          studyHours: clamp(sem.studyHours, 5, 200),
          consistencyRate: clamp(sem.consistency, 0, 100),
          interactionDensity: clamp(sem.interactionDensity, 0, 1),
          completionRate: clamp(sem.completion, 0, 100),
          weakTopics: JSON.stringify(weakTopics),
          courseCount: sem.courseCount,
          attendanceAvg: clamp(sem.attendance, 0, 100),
        },
      })
    }

    console.log(`  ✓ ${t.name.padEnd(18)} — ${t.semesters.length} semesters (CGPA: ${t.semesters[0].cgpa.toFixed(1)} → ${t.semesters[t.semesters.length - 1].cgpa.toFixed(1)})`)
  }

  const total = TRAJECTORIES.reduce((s, t) => s + t.semesters.length, 0)
  console.log(`\n✅ Seeded ${TRAJECTORIES.length} students with ${total} total semester snapshots`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
