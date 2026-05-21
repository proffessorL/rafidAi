// ============================================================
// MOCK DATABASE — Replace with real API/DB calls later
// ============================================================

export interface Student {
  id: string;
  name: string;
  avatar: string;
  course: string;
  semester: number;
  stressScore: number;
  lastActiveDate: string;
  streakDays: number;
  totalTopics: number;
  completedTopics: number;
  weeklyGoalHours: number;
  hoursThisWeek: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  totalTopics: number;
  completedTopics: number;
  avgScore: number;
  nextExam?: string;
  pendingTopics: string[];
  strongTopics: string[];
  weakTopics: WeakTopic[];
}

export interface WeakTopic {
  id: string;
  subjectId: string;
  name: string;
  avgScore: number;
  attempts: number;
  lastAttempted: string;
}

export interface DailyActivity {
  day: string;
  shortDay: string;
  studyMinutes: number;
  quizzesAttempted: number;
  topicsCompleted: number;
  mood: 'great' | 'good' | 'okay' | 'low';
}

export interface RoutineBlock {
  time: string;
  duration: string;
  type: 'study' | 'break' | 'exercise' | 'sleep' | 'meal' | 'review';
  subject?: string;
  topic?: string;
  label: string;
  note?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DayRoutine {
  day: string;
  shortDay: string;
  date: string;
  totalStudyHours: number;
  energyLevel: 'high' | 'medium' | 'low';
  blocks: RoutineBlock[];
  motivationTip: string;
}

// --- Student Data ---
export const currentStudent: Student = {
  id: 'stu_001',
  name: 'Aryan Ahmed',
  avatar: '🧑‍💻',
  course: 'BSc Computer Science',
  semester: 5,
  stressScore: 61,
  lastActiveDate: '2024-01-15',
  streakDays: 4,
  totalTopics: 48,
  completedTopics: 31,
  weeklyGoalHours: 25,
  hoursThisWeek: 14.5,
};

// --- Subject Data ---
export const subjects: Subject[] = [
  {
    id: 'sub_math',
    name: 'Mathematics',
    color: '#7c3aed',
    icon: '∑',
    totalTopics: 12,
    completedTopics: 9,
    avgScore: 72,
    nextExam: 'Jan 25',
    pendingTopics: ['Differential Equations', 'Complex Numbers', 'Fourier Series'],
    strongTopics: ['Integration', 'Limits', 'Matrices', 'Probability', 'Series', 'Vectors', 'Linear Algebra', 'Calculus I', 'Calculus II'],
    weakTopics: [
      { id: 'wt_001', subjectId: 'sub_math', name: 'Fourier Series', avgScore: 44, attempts: 3, lastAttempted: '5 days ago' },
      { id: 'wt_002', subjectId: 'sub_math', name: 'Complex Numbers', avgScore: 58, attempts: 2, lastAttempted: '1 week ago' },
    ]
  },
  {
    id: 'sub_physics',
    name: 'Physics',
    color: '#0ea5e9',
    icon: '⚛',
    totalTopics: 10,
    completedTopics: 7,
    avgScore: 65,
    nextExam: 'Jan 28',
    pendingTopics: ['Quantum Mechanics', 'Thermodynamics', 'Wave Optics'],
    strongTopics: ['Mechanics', 'Electricity', 'Magnetism', 'Optics Basics', 'Modern Physics', 'Nuclear', 'Relativity'],
    weakTopics: [
      { id: 'wt_003', subjectId: 'sub_physics', name: 'Vectors - Cross Product', avgScore: 45, attempts: 4, lastAttempted: '3 days ago' },
      { id: 'wt_004', subjectId: 'sub_physics', name: 'Quantum Mechanics Intro', avgScore: 52, attempts: 2, lastAttempted: '2 weeks ago' },
    ]
  },
  {
    id: 'sub_dbms',
    name: 'Database Systems',
    color: '#00c896',
    icon: '🗄',
    totalTopics: 8,
    completedTopics: 6,
    avgScore: 78,
    nextExam: 'Feb 1',
    pendingTopics: ['NoSQL Design', 'Query Optimization'],
    strongTopics: ['ER Diagrams', 'SQL Basics', 'Normalization 1NF', 'Normalization 2NF', 'Joins', 'Transactions'],
    weakTopics: [
      { id: 'wt_005', subjectId: 'sub_dbms', name: '3rd Normal Form (3NF)', avgScore: 42, attempts: 3, lastAttempted: '4 days ago' },
    ]
  },
  {
    id: 'sub_os',
    name: 'Operating Systems',
    color: '#f59e0b',
    icon: '⚙',
    totalTopics: 9,
    completedTopics: 5,
    avgScore: 60,
    nextExam: 'Feb 5',
    pendingTopics: ['Memory Management', 'File Systems', 'Concurrency', 'Deadlocks'],
    strongTopics: ['Process Scheduling', 'CPU Algorithms', 'Inter-Process Communication', 'System Calls', 'Semaphores'],
    weakTopics: [
      { id: 'wt_006', subjectId: 'sub_os', name: 'Memory Paging & Segmentation', avgScore: 48, attempts: 3, lastAttempted: '6 days ago' },
      { id: 'wt_007', subjectId: 'sub_os', name: 'Deadlock Detection', avgScore: 55, attempts: 2, lastAttempted: '1 week ago' },
    ]
  },
  {
    id: 'sub_algo',
    name: 'Algorithms',
    color: '#ff6b8a',
    icon: '◈',
    totalTopics: 9,
    completedTopics: 4,
    avgScore: 55,
    nextExam: 'Feb 8',
    pendingTopics: ['Graph Algorithms', 'Dynamic Programming', 'Greedy Algorithms', 'NP Completeness', 'Network Flow'],
    strongTopics: ['Sorting', 'Searching', 'Recursion', 'Big-O Notation'],
    weakTopics: [
      { id: 'wt_008', subjectId: 'sub_algo', name: 'Dynamic Programming', avgScore: 38, attempts: 5, lastAttempted: '2 days ago' },
      { id: 'wt_009', subjectId: 'sub_algo', name: 'Graph Traversal (BFS/DFS)', avgScore: 50, attempts: 3, lastAttempted: '5 days ago' },
    ]
  },
];

// --- Weekly Activity ---
export const weeklyActivity: DailyActivity[] = [
  { day: 'Monday', shortDay: 'Mon', studyMinutes: 120, quizzesAttempted: 2, topicsCompleted: 1, mood: 'good' },
  { day: 'Tuesday', shortDay: 'Tue', studyMinutes: 90, quizzesAttempted: 1, topicsCompleted: 0, mood: 'okay' },
  { day: 'Wednesday', shortDay: 'Wed', studyMinutes: 180, quizzesAttempted: 3, topicsCompleted: 2, mood: 'great' },
  { day: 'Thursday', shortDay: 'Thu', studyMinutes: 60, quizzesAttempted: 0, topicsCompleted: 0, mood: 'low' },
  { day: 'Friday', shortDay: 'Fri', studyMinutes: 150, quizzesAttempted: 2, topicsCompleted: 1, mood: 'good' },
  { day: 'Saturday', shortDay: 'Sat', studyMinutes: 240, quizzesAttempted: 4, topicsCompleted: 3, mood: 'great' },
  { day: 'Sunday', shortDay: 'Sun', studyMinutes: 30, quizzesAttempted: 0, topicsCompleted: 0, mood: 'low' },
];

// --- AI-Generated Routines ---
export const getAIRoutine = (mode: 'focused' | 'balanced' | 'gentle'): DayRoutine[] => {
  const today = new Date();

  const focusedRoutine: DayRoutine[] = [
    {
      day: 'Monday', shortDay: 'Mon', date: '',
      totalStudyHours: 6, energyLevel: 'high',
      motivationTip: 'Start your week strong! Your Physics exam is in 8 days.',
      blocks: [
        { time: '6:30 AM', duration: '30m', type: 'exercise', label: 'Morning Stretch + Walk', note: 'Boosts brain oxygen by 20%', priority: 'high' },
        { time: '7:00 AM', duration: '30m', type: 'meal', label: 'Breakfast', priority: 'low' },
        { time: '7:30 AM', duration: '2h', type: 'study', subject: 'Algorithms', topic: 'Dynamic Programming', label: 'Study: Dynamic Programming', note: '⚠ Weak area – 38% avg. Focus on Memoization patterns.', priority: 'high' },
        { time: '9:30 AM', duration: '20m', type: 'break', label: 'Short Break', note: 'Walk away from screen', priority: 'low' },
        { time: '9:50 AM', duration: '1.5h', type: 'study', subject: 'Physics', topic: 'Vectors - Cross Product', label: 'Study: Cross Product', note: '⚠ Exam in 8 days. Practice Right-Hand Rule problems.', priority: 'high' },
        { time: '11:20 AM', duration: '1h', type: 'review', subject: 'Mathematics', topic: 'Fourier Series', label: 'Review: Fourier Series', note: 'Re-read derivation notes', priority: 'medium' },
        { time: '12:20 PM', duration: '40m', type: 'meal', label: 'Lunch Break', priority: 'low' },
        { time: '1:00 PM', duration: '1.5h', type: 'study', subject: 'Database Systems', topic: '3NF', label: 'Study: 3rd Normal Form', note: 'Practice normalization exercises', priority: 'medium' },
        { time: '2:30 PM', duration: '30m', type: 'break', label: 'Rest & Hydrate', priority: 'low' },
        { time: '3:00 PM', duration: '1h', type: 'study', subject: 'Operating Systems', topic: 'Memory Paging', label: 'Study: Memory Paging', note: 'Focus on page table structures', priority: 'medium' },
        { time: '10:00 PM', duration: '8h', type: 'sleep', label: '😴 Sleep', note: 'Sleep is essential for memory consolidation', priority: 'high' },
      ]
    },
    {
      day: 'Tuesday', shortDay: 'Tue', date: '',
      totalStudyHours: 5.5, energyLevel: 'high',
      motivationTip: 'Algorithms is your biggest challenge — push through today!',
      blocks: [
        { time: '7:00 AM', duration: '30m', type: 'exercise', label: 'Exercise', note: 'Light jog or yoga', priority: 'medium' },
        { time: '7:30 AM', duration: '30m', type: 'meal', label: 'Breakfast', priority: 'low' },
        { time: '8:00 AM', duration: '2h', type: 'study', subject: 'Algorithms', topic: 'Graph Traversal BFS/DFS', label: 'Study: BFS & DFS', note: 'Draw out graph traversal by hand first', priority: 'high' },
        { time: '10:00 AM', duration: '20m', type: 'break', label: 'Break', priority: 'low' },
        { time: '10:20 AM', duration: '1.5h', type: 'study', subject: 'Mathematics', topic: 'Complex Numbers', label: 'Study: Complex Numbers', note: 'Argand diagram practice set', priority: 'high' },
        { time: '12:00 PM', duration: '1h', type: 'meal', label: 'Lunch', priority: 'low' },
        { time: '1:00 PM', duration: '2h', type: 'study', subject: 'Physics', topic: 'Quantum Mechanics Intro', label: 'Study: Quantum Mechanics', note: 'Wave-particle duality & Schrödinger equation overview', priority: 'high' },
        { time: '3:00 PM', duration: '30m', type: 'review', subject: 'Algorithms', topic: 'Dynamic Programming', label: 'Quick Revision: DP', note: 'Re-attempt 3 practice problems', priority: 'medium' },
        { time: '10:00 PM', duration: '8h', type: 'sleep', label: '😴 Sleep', priority: 'high' },
      ]
    },
    {
      day: 'Wednesday', shortDay: 'Wed', date: '',
      totalStudyHours: 5, energyLevel: 'medium',
      motivationTip: 'Midweek! Stay consistent. Review yesterday\'s material first.',
      blocks: [
        { time: '7:30 AM', duration: '30m', type: 'exercise', label: 'Morning Walk', priority: 'medium' },
        { time: '8:00 AM', duration: '1.5h', type: 'review', subject: 'Physics', topic: 'All Pending', label: 'Revision: Physics Weak Areas', note: 'Mock quiz yourself on Cross Product & Quantum', priority: 'high' },
        { time: '9:30 AM', duration: '20m', type: 'break', label: 'Break', priority: 'low' },
        { time: '9:50 AM', duration: '1.5h', type: 'study', subject: 'Operating Systems', topic: 'Deadlock Detection', label: 'Study: Deadlock Detection', note: 'Banker\'s algorithm deep dive', priority: 'medium' },
        { time: '11:20 AM', duration: '40m', type: 'meal', label: 'Lunch', priority: 'low' },
        { time: '12:00 PM', duration: '2h', type: 'study', subject: 'Mathematics', topic: 'Fourier Series', label: 'Study: Fourier Series', note: 'This is critical — exam next week!', priority: 'high' },
        { time: '2:00 PM', duration: '1h', type: 'study', subject: 'Database Systems', topic: 'Query Optimization', label: 'Study: Query Optimization', note: 'Indexes and execution plans', priority: 'medium' },
        { time: '10:00 PM', duration: '8h', type: 'sleep', label: '😴 Sleep', priority: 'high' },
      ]
    },
    {
      day: 'Thursday', shortDay: 'Thu', date: '',
      totalStudyHours: 4, energyLevel: 'medium',
      motivationTip: 'Almost to the weekend. Keep momentum going!',
      blocks: [
        { time: '8:00 AM', duration: '2h', type: 'study', subject: 'Algorithms', topic: 'Greedy Algorithms', label: 'Study: Greedy Algorithms', note: 'Compare with DP approaches', priority: 'high' },
        { time: '10:00 AM', duration: '30m', type: 'break', label: 'Short Break', priority: 'low' },
        { time: '10:30 AM', duration: '1.5h', type: 'study', subject: 'Mathematics', topic: 'Differential Equations', label: 'Study: Differential Equations', note: 'ODE solution methods', priority: 'high' },
        { time: '12:00 PM', duration: '1h', type: 'meal', label: 'Lunch', priority: 'low' },
        { time: '1:00 PM', duration: '30m', type: 'review', subject: 'Physics', topic: 'Cross Product', label: 'Quick Quiz: Physics', note: 'Take a 10-question mock quiz', priority: 'medium' },
        { time: '10:00 PM', duration: '8h', type: 'sleep', label: '😴 Sleep', priority: 'high' },
      ]
    },
    {
      day: 'Friday', shortDay: 'Fri', date: '',
      totalStudyHours: 5, energyLevel: 'high',
      motivationTip: 'Physics exam is Monday! Use today to consolidate.',
      blocks: [
        { time: '7:00 AM', duration: '30m', type: 'exercise', label: 'Energize: Workout', note: 'High-energy before a big study day', priority: 'high' },
        { time: '7:30 AM', duration: '2h', type: 'study', subject: 'Physics', topic: 'Full Revision', label: 'Physics: Full Revision', note: '🚨 Exam Monday. Cover all weak areas.', priority: 'high' },
        { time: '9:30 AM', duration: '30m', type: 'break', label: 'Break', priority: 'low' },
        { time: '10:00 AM', duration: '1.5h', type: 'study', subject: 'Algorithms', topic: 'NP Completeness', label: 'Study: NP Completeness', note: 'Focus on problem classification', priority: 'medium' },
        { time: '11:30 AM', duration: '1.5h', type: 'review', subject: 'All Subjects', topic: 'Flash Cards', label: 'Flash Card Review: All Subjects', note: 'Use spaced repetition', priority: 'medium' },
        { time: '10:00 PM', duration: '8h', type: 'sleep', label: '😴 Sleep', priority: 'high' },
      ]
    },
    {
      day: 'Saturday', shortDay: 'Sat', date: '',
      totalStudyHours: 7, energyLevel: 'high',
      motivationTip: 'Weekend power session! Best time to tackle hard material.',
      blocks: [
        { time: '7:00 AM', duration: '45m', type: 'exercise', label: 'Weekend Run', note: 'Studies show 45min exercise = +40% cognition', priority: 'high' },
        { time: '8:00 AM', duration: '2.5h', type: 'study', subject: 'Algorithms', topic: 'Dynamic Programming + Graph', label: 'Deep Work: Algorithms', note: 'Solve 5 LeetCode DP problems', priority: 'high' },
        { time: '10:30 AM', duration: '30m', type: 'break', label: 'Break + Snack', priority: 'low' },
        { time: '11:00 AM', duration: '2h', type: 'study', subject: 'Mathematics', topic: 'Fourier + Complex Numbers', label: 'Math Power Hour (×2)', note: 'Focus: Fourier derivations', priority: 'high' },
        { time: '1:00 PM', duration: '1h', type: 'meal', label: 'Lunch', priority: 'low' },
        { time: '2:00 PM', duration: '2.5h', type: 'study', subject: 'Operating Systems', topic: 'Memory + Deadlock', label: 'OS: Memory & Deadlock', note: 'Work through past exam papers', priority: 'medium' },
        { time: '10:00 PM', duration: '8h', type: 'sleep', label: '😴 Sleep', priority: 'high' },
      ]
    },
    {
      day: 'Sunday', shortDay: 'Sun', date: '',
      totalStudyHours: 2, energyLevel: 'low',
      motivationTip: 'Rest is part of the plan. Light review only today. 🌿',
      blocks: [
        { time: '9:00 AM', duration: '45m', type: 'exercise', label: 'Walk + Fresh Air', note: 'Nature reduces cortisol by 30%', priority: 'medium' },
        { time: '11:00 AM', duration: '1h', type: 'review', subject: 'All', topic: 'Light Review', label: 'Light Review: Key Formulas', note: 'Glance through your formula sheet only', priority: 'low' },
        { time: '12:00 PM', duration: '1h', type: 'meal', label: 'Lunch', priority: 'low' },
        { time: '2:00 PM', duration: '1h', type: 'break', label: 'Free Time / Hobby', note: 'Recharge for the week ahead', priority: 'low' },
        { time: '9:30 PM', duration: '8.5h', type: 'sleep', label: '😴 Early Sleep', note: 'Physics exam tomorrow — sleep is your best weapon!', priority: 'high' },
      ]
    },
  ];

  // For balanced/gentle, just adjust some things in the routine
  return focusedRoutine.map((day, i) => {
    const date = new Date(today);
    const todayIdx = today.getDay();
    const diff = i - ((todayIdx === 0 ? 7 : todayIdx) - 1);
    date.setDate(today.getDate() + diff);
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (mode === 'gentle') {
      return {
        ...day,
        date: formatted,
        totalStudyHours: Math.max(1.5, day.totalStudyHours - 3),
        blocks: day.blocks.filter(b => b.priority !== 'low' || b.type === 'sleep' || b.type === 'meal').map(b =>
          b.type === 'study' ? { ...b, duration: b.duration === '2h' ? '45m' : b.duration === '1.5h' ? '45m' : b.duration, note: b.note ? '(Light review only) ' + b.note : '(Light review only)' } : b
        )
      };
    } else if (mode === 'balanced') {
      return {
        ...day,
        date: formatted,
        totalStudyHours: Math.max(2.5, day.totalStudyHours - 1.5),
        blocks: day.blocks.map(b =>
          b.type === 'study' && b.duration === '2.5h' ? { ...b, duration: '2h' } : b
        )
      };
    }
    return { ...day, date: formatted };
  });
};

export const getMotivationMessage = (student: Student): string => {
  const pct = Math.round((student.completedTopics / student.totalTopics) * 100);
  if (pct >= 80) return `🔥 You're in the top 15% of your class! ${pct}% topics completed.`;
  if (pct >= 60) return `📈 Great progress! ${student.completedTopics} of ${student.totalTopics} topics done. Keep it up!`;
  return `💪 ${student.completedTopics} topics completed. You've got this — one topic at a time!`;
};
