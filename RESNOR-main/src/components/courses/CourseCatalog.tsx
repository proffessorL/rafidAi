"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Star,
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  Trophy,
  TrendingUp,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Circle,
  ListChecks,
  Filter,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

interface Course {
  id: string;
  code: string;
  title: string;
  instructor: string;
  category: string;
  difficulty: Difficulty;
  duration: string;
  enrolledCount: number;
  rating: number;
  reviewCount: number;
  description: string;
  syllabus: string[];
  prerequisites: string[];
  thumbnail: string;
  isEnrolled: boolean;
  progress: number; // 0-100
  reviews: { author: string; rating: number; comment: string; date: string }[];
  relatedCourseIds: string[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_COURSES: Course[] = [
  {
    id: "cse-331",
    code: "CSE-331",
    title: "Data Structures & Algorithms",
    instructor: "Prof. Karim",
    category: "Core",
    difficulty: "Advanced",
    duration: "14 weeks",
    enrolledCount: 234,
    rating: 4.8,
    reviewCount: 56,
    description:
      "Master fundamental data structures including trees, graphs, heaps, and hash tables. Learn advanced algorithm design techniques such as dynamic programming, greedy algorithms, and divide-and-conquer. Build a strong foundation for technical interviews and competitive programming.",
    syllabus: [
      "Week 1-2: Arrays, Linked Lists & Stacks",
      "Week 3-4: Trees & Binary Search Trees",
      "Week 5-6: Heaps & Priority Queues",
      "Week 7-8: Graph Algorithms (BFS, DFS)",
      "Week 9-10: Shortest Path & Minimum Spanning Tree",
      "Week 11-12: Dynamic Programming",
      "Week 13-14: Advanced Topics & Review",
    ],
    prerequisites: ["CSE-115 Programming Fundamentals", "Basic discrete mathematics"],
    thumbnail: "/placeholder-dsa.jpg",
    isEnrolled: true,
    progress: 65,
    reviews: [
      { author: "Rafi Ahmed", rating: 5, comment: "Excellent course! Prof. Karim explains complex topics very clearly.", date: "2025-02-10" },
      { author: "Nusrat Jahan", rating: 4, comment: "Challenging but rewarding. Great problem sets.", date: "2025-01-28" },
    ],
    relatedCourseIds: ["cse-421", "cse-441"],
  },
  {
    id: "cse-421",
    code: "CSE-421",
    title: "Artificial Intelligence",
    instructor: "Prof. Rahman",
    category: "Specialization",
    difficulty: "Intermediate",
    duration: "14 weeks",
    enrolledCount: 189,
    rating: 4.6,
    reviewCount: 42,
    description:
      "Explore the core concepts of artificial intelligence including search algorithms, knowledge representation, machine learning basics, and natural language processing. Hands-on projects with Python implementations of classic AI algorithms.",
    syllabus: [
      "Week 1-2: Introduction to AI & Intelligent Agents",
      "Week 3-4: Search Algorithms (A*, Minimax)",
      "Week 5-6: Knowledge Representation & Reasoning",
      "Week 7-8: Machine Learning Fundamentals",
      "Week 9-10: Neural Networks & Deep Learning Intro",
      "Week 11-12: Natural Language Processing",
      "Week 13-14: AI Ethics & Final Project",
    ],
    prerequisites: ["CSE-331 Data Structures & Algorithms", "Basic probability & statistics"],
    thumbnail: "/placeholder-ai.jpg",
    isEnrolled: true,
    progress: 30,
    reviews: [
      { author: "Tanvir Hasan", rating: 5, comment: "Fascinating content. The AI project was my favorite part.", date: "2025-03-01" },
      { author: "Farhana Islam", rating: 4, comment: "Good overview of AI concepts with practical exercises.", date: "2025-02-15" },
    ],
    relatedCourseIds: ["cse-441", "cse-331"],
  },
  {
    id: "cse-225",
    code: "CSE-225",
    title: "Database Systems",
    instructor: "Prof. Haque",
    category: "Core",
    difficulty: "Beginner",
    duration: "12 weeks",
    enrolledCount: 312,
    rating: 4.5,
    reviewCount: 78,
    description:
      "Learn the principles of database management systems including relational models, SQL, normalization, transaction management, and indexing. Practical labs using PostgreSQL and MySQL with real-world dataset projects.",
    syllabus: [
      "Week 1-2: Introduction & ER Model",
      "Week 3-4: Relational Algebra & SQL Basics",
      "Week 5-6: Advanced SQL & Views",
      "Week 7-8: Normalization (1NF to BCNF)",
      "Week 9-10: Transaction Management & Concurrency",
      "Week 11-12: Indexing & Final Project",
    ],
    prerequisites: ["CSE-115 Programming Fundamentals"],
    thumbnail: "/placeholder-db.jpg",
    isEnrolled: false,
    progress: 0,
    reviews: [
      { author: "Sakib Uddin", rating: 5, comment: "Very practical approach to databases. Loved the SQL labs!", date: "2025-02-20" },
      { author: "Mitu Akter", rating: 4, comment: "Solid foundation course. Well-structured content.", date: "2025-01-30" },
    ],
    relatedCourseIds: ["cse-331", "cse-311"],
  },
  {
    id: "cse-412",
    code: "CSE-412",
    title: "Computer Networks",
    instructor: "Prof. Islam",
    category: "Core",
    difficulty: "Advanced",
    duration: "14 weeks",
    enrolledCount: 156,
    rating: 4.3,
    reviewCount: 34,
    description:
      "Deep dive into computer networking from physical layer to application layer. Covers TCP/IP protocol suite, network security, routing algorithms, and modern networking technologies including SDN and cloud networking.",
    syllabus: [
      "Week 1-2: Network Models & Physical Layer",
      "Week 3-4: Data Link Layer & Error Detection",
      "Week 5-6: Network Layer & IP Addressing",
      "Week 7-8: Routing Algorithms (OSPF, BGP)",
      "Week 9-10: Transport Layer (TCP/UDP)",
      "Week 11-12: Application Layer Protocols",
      "Week 13-14: Network Security & Final Project",
    ],
    prerequisites: ["CSE-225 Database Systems", "CSE-331 Data Structures & Algorithms"],
    thumbnail: "/placeholder-net.jpg",
    isEnrolled: false,
    progress: 0,
    reviews: [
      { author: "Arif Khan", rating: 4, comment: "Comprehensive coverage of networking concepts.", date: "2025-02-25" },
    ],
    relatedCourseIds: ["cse-315", "cse-331"],
  },
  {
    id: "cse-311",
    code: "CSE-311",
    title: "Software Engineering",
    instructor: "Prof. Chowdhury",
    category: "Core",
    difficulty: "Intermediate",
    duration: "12 weeks",
    enrolledCount: 278,
    rating: 4.7,
    reviewCount: 61,
    description:
      "Learn software development methodologies, requirements engineering, system design, testing strategies, and project management. Apply agile and DevOps practices in a semester-long team project with real-world constraints.",
    syllabus: [
      "Week 1-2: Software Process Models",
      "Week 3-4: Requirements Engineering",
      "Week 5-6: System Design & Architecture",
      "Week 7-8: Object-Oriented Design Patterns",
      "Week 9-10: Testing & Quality Assurance",
      "Week 11-12: DevOps & Team Project Presentations",
    ],
    prerequisites: ["CSE-225 Database Systems", "CSE-115 Programming Fundamentals"],
    thumbnail: "/placeholder-se.jpg",
    isEnrolled: true,
    progress: 90,
    reviews: [
      { author: "Sadia Afrin", rating: 5, comment: "The team project was an incredible learning experience!", date: "2025-03-05" },
      { author: "Imran Hossain", rating: 5, comment: "Prof. Chowdhury brings real industry experience to the class.", date: "2025-02-18" },
    ],
    relatedCourseIds: ["cse-315", "cse-225"],
  },
  {
    id: "cse-115",
    code: "CSE-115",
    title: "Programming Fundamentals",
    instructor: "Prof. Akter",
    category: "Foundation",
    difficulty: "Beginner",
    duration: "14 weeks",
    enrolledCount: 420,
    rating: 4.9,
    reviewCount: 112,
    description:
      "Start your programming journey with Python. Learn variables, control flow, functions, data structures, file I/O, and object-oriented programming. Includes 50+ coding exercises and a final capstone project to build a complete application.",
    syllabus: [
      "Week 1-2: Introduction to Python & Variables",
      "Week 3-4: Control Flow & Functions",
      "Week 5-6: Lists, Tuples & Dictionaries",
      "Week 7-8: File I/O & Exception Handling",
      "Week 9-10: Object-Oriented Programming",
      "Week 11-12: Modules & Libraries",
      "Week 13-14: Capstone Project & Review",
    ],
    prerequisites: [],
    thumbnail: "/placeholder-pf.jpg",
    isEnrolled: false,
    progress: 0,
    reviews: [
      { author: "Riya Sen", rating: 5, comment: "Perfect for absolute beginners! Prof. Akter is amazing.", date: "2025-03-10" },
      { author: "Habib Mia", rating: 5, comment: "This course sparked my love for programming.", date: "2025-02-28" },
      { author: "Nadia Rahman", rating: 5, comment: "Best introductory CS course I have taken.", date: "2025-01-15" },
    ],
    relatedCourseIds: ["cse-225", "cse-331"],
  },
  {
    id: "cse-441",
    code: "CSE-441",
    title: "Machine Learning",
    instructor: "Prof. Das",
    category: "Specialization",
    difficulty: "Advanced",
    duration: "14 weeks",
    enrolledCount: 145,
    rating: 4.4,
    reviewCount: 28,
    description:
      "Explore supervised and unsupervised learning algorithms including linear regression, logistic regression, SVMs, decision trees, random forests, neural networks, and clustering. Implement algorithms from scratch and using scikit-learn and TensorFlow.",
    syllabus: [
      "Week 1-2: Linear Regression & Gradient Descent",
      "Week 3-4: Logistic Regression & Classification",
      "Week 5-6: Support Vector Machines",
      "Week 7-8: Decision Trees & Ensemble Methods",
      "Week 9-10: Neural Networks Fundamentals",
      "Week 11-12: Unsupervised Learning (K-Means, PCA)",
      "Week 13-14: Model Evaluation & Final Project",
    ],
    prerequisites: ["CSE-331 Data Structures & Algorithms", "CSE-421 Artificial Intelligence", "Linear algebra & statistics"],
    thumbnail: "/placeholder-ml.jpg",
    isEnrolled: false,
    progress: 0,
    reviews: [
      { author: "Zahid Islam", rating: 4, comment: "Rigorous mathematical approach. Definitely worth the effort.", date: "2025-02-22" },
    ],
    relatedCourseIds: ["cse-421", "cse-331"],
  },
  {
    id: "cse-315",
    code: "CSE-315",
    title: "Web Technologies",
    instructor: "Prof. Begum",
    category: "Specialization",
    difficulty: "Intermediate",
    duration: "12 weeks",
    enrolledCount: 198,
    rating: 4.6,
    reviewCount: 45,
    description:
      "Build modern web applications from the ground up. Covers HTML5, CSS3, JavaScript ES6+, React, Node.js, RESTful APIs, and deployment. Weekly hands-on labs culminating in a full-stack portfolio project.",
    syllabus: [
      "Week 1-2: HTML5 & CSS3 Fundamentals",
      "Week 3-4: JavaScript ES6+ & DOM Manipulation",
      "Week 5-6: React Components & State Management",
      "Week 7-8: Node.js & Express Backend",
      "Week 9-10: RESTful API Design & Databases",
      "Week 11-12: Deployment & Portfolio Project",
    ],
    prerequisites: ["CSE-115 Programming Fundamentals"],
    thumbnail: "/placeholder-web.jpg",
    isEnrolled: true,
    progress: 45,
    reviews: [
      { author: "Fahim Shahriar", rating: 5, comment: "Hands-down the most practical course. Built my first full-stack app!", date: "2025-03-08" },
      { author: "Tania Akter", rating: 4, comment: "Great pace and modern tech stack.", date: "2025-02-14" },
    ],
    relatedCourseIds: ["cse-311", "cse-412"],
  },
];

const FEATURED_COURSE_ID = "cse-421";

const CATEGORIES = ["All", "Core", "Specialization", "Foundation"];
const DIFFICULTIES: ("All" | Difficulty)[] = ["All", "Beginner", "Intermediate", "Advanced"];
const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest First" },
  { value: "title", label: "Title A-Z" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<Difficulty, { border: string; badge: string; text: string; dot: string }> = {
  Beginner: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  Intermediate: {
    border: "border-l-amber-500",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  Advanced: {
    border: "border-l-rose-500",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  Core: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  Specialization: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  Foundation: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const starSize = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            "transition-colors",
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function CourseCard({
  course,
  onOpenDetail,
  onToggleEnroll,
}: {
  course: Course;
  onOpenDetail: (course: Course) => void;
  onToggleEnroll: (courseId: string) => void;
}) {
  const diffColors = DIFFICULTY_COLORS[course.difficulty];
  const catColor = CATEGORY_COLORS[course.category] ?? "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "group relative overflow-hidden border-l-4 cursor-pointer",
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
          diffColors.border
        )}
        onClick={() => onOpenDetail(course)}
      >
        {/* Thumbnail placeholder */}
        <div className="relative h-36 bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
          <BookOpen className="h-10 w-10 text-muted-foreground/30" />
          {/* Difficulty badge on thumbnail */}
          <Badge
            variant="outline"
            className={cn("absolute top-3 right-3 text-[10px] font-semibold", diffColors.badge)}
          >
            {course.difficulty}
          </Badge>
          {/* Category badge */}
          <Badge variant="outline" className={cn("absolute top-3 left-3 text-[10px]", catColor)}>
            {course.category}
          </Badge>
          {/* Enrolled overlay */}
          {course.isEnrolled && (
            <div className="absolute bottom-3 right-3">
              <div className="flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm px-2 py-1 shadow-sm">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                  Enrolled
                </span>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Code & Title */}
          <div className="space-y-1">
            <p className="text-xs font-mono text-muted-foreground">{course.code}</p>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {course.title}
            </h3>
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                {getInitials(course.instructor)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{course.instructor}</span>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{course.enrolledCount}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <RatingStars rating={course.rating} />
            <span className="text-xs font-semibold tabular-nums">{course.rating}</span>
            <span className="text-[10px] text-muted-foreground">({course.reviewCount})</span>
          </div>

          {/* Progress bar for enrolled courses */}
          {course.isEnrolled && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Progress</span>
                <span className="text-[11px] font-semibold tabular-nums">{course.progress}%</span>
              </div>
              <Progress
                value={course.progress}
                className="h-1.5 [&>[data-slot=progress-indicator]]:bg-emerald-500"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant={course.isEnrolled ? "secondary" : "default"}
              size="sm"
              className={cn(
                "flex-1 text-xs",
                course.isEnrolled
                  ? "text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:text-rose-300"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleEnroll(course.id);
              }}
            >
              {course.isEnrolled ? (
                <>
                  <Circle className="h-3 w-3" />
                  Unenroll
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Enroll Now
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(course);
              }}
            >
              Details
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FeaturedBanner({
  course,
  onEnroll,
}: {
  course: Course;
  onEnroll: (courseId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl border border-white/20 dark:border-white/10"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-800 dark:via-teal-800 dark:to-emerald-900" />
      <div className="absolute inset-0 backdrop-blur-xl bg-white/10 dark:bg-white/5" />

      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Left content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Course of the Week
            </div>
          </div>
          <div>
            <p className="text-sm text-emerald-100 font-mono">{course.code}</p>
            <h2 className="text-xl md:text-2xl font-bold text-white mt-0.5">
              {course.title}
            </h2>
          </div>
          <p className="text-sm text-emerald-100/80 leading-relaxed max-w-xl line-clamp-2">
            {course.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-emerald-100/80">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              <span>{course.instructor}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{course.enrolledCount} enrolled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
              <span>{course.rating}</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="lg"
            className={cn(
              "bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-lg shadow-black/10",
              course.isEnrolled && "bg-emerald-100 text-emerald-800"
            )}
            onClick={() => onEnroll(course.id)}
          >
            {course.isEnrolled ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Continue Learning
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Enroll Now
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

function CourseDetailSheet({
  course,
  open,
  onOpenChange,
  onToggleEnroll,
  allCourses,
}: {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleEnroll: (courseId: string) => void;
  allCourses: Course[];
}) {
  if (!course) return null;

  const diffColors = DIFFICULTY_COLORS[course.difficulty];
  const catColor = CATEGORY_COLORS[course.category] ?? "";
  const relatedCourses = allCourses.filter((c) => course.relatedCourseIds.includes(c.id));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {/* Header gradient */}
          <div className="relative">
            <div className="h-40 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent" />
            <SheetHeader className="absolute bottom-0 left-0 right-0 px-6 pb-2 pt-10 bg-gradient-to-t from-background via-background/80 to-transparent">
              <SheetTitle className="text-xl font-bold">{course.title}</SheetTitle>
              <SheetDescription>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{course.code}</span> — {course.instructor}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Meta badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn("text-xs", diffColors.badge)}>
                {course.difficulty}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", catColor)}>
                {course.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {course.duration}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {course.enrolledCount} students
              </Badge>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <RatingStars rating={course.rating} size="lg" />
              <span className="text-lg font-bold tabular-nums">{course.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({course.reviewCount} reviews)
              </span>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                About This Course
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            </div>

            <Separator />

            {/* Progress for enrolled */}
            {course.isEnrolled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Your Progress
                  </h4>
                  <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {course.progress}%
                  </span>
                </div>
                <Progress
                  value={course.progress}
                  className="h-2.5 [&>[data-slot=progress-indicator]]:bg-emerald-500"
                />
              </div>
            )}

            {/* Syllabus */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-teal-500" />
                Course Syllabus
              </h4>
              <div className="space-y-1.5">
                {course.syllabus.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <div
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                        course.isEnrolled && course.progress > (i / course.syllabus.length) * 100
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/30"
                      )}
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Prerequisites</h4>
                <ul className="space-y-1">
                  {course.prerequisites.map((prereq, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="h-3 w-3 text-amber-500" />
                      {prereq}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Reviews */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                Student Reviews
              </h4>
              <div className="space-y-3">
                {course.reviews.map((review, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[9px] bg-muted">
                            {getInitials(review.author)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{review.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <RatingStars rating={review.rating} />
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(review.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Courses */}
            {relatedCourses.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Related Courses</h4>
                  <div className="space-y-2">
                    {relatedCourses.map((related) => (
                      <div
                        key={related.id}
                        className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => onOpenChange(false)}
                      >
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            DIFFICULTY_COLORS[related.difficulty].dot
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{related.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {related.code} · {related.difficulty} · ★ {related.rating}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Enroll CTA */}
            <div className="pt-2 pb-6">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className={cn(
                    "w-full font-semibold",
                    course.isEnrolled
                      ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20 dark:text-rose-400"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                  onClick={() => {
                    onToggleEnroll(course.id);
                    onOpenChange(false);
                  }}
                >
                  {course.isEnrolled ? (
                    <>
                      <Circle className="h-4 w-4" />
                      Unenroll from Course
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Enroll in This Course
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function StatsSummary({ courses }: { courses: Course[] }) {
  const totalCourses = courses.length;
  const enrolledCount = courses.filter((c) => c.isEnrolled).length;
  const completedCount = courses.filter((c) => c.isEnrolled && c.progress === 100).length;

  const stats = [
    {
      label: "Total Courses",
      value: totalCourses,
      icon: BookOpen,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: "Enrolled",
      value: enrolledCount,
      icon: GraduationCap,
      color: "text-teal-500 bg-teal-500/10",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: Trophy,
      color: "text-amber-500 bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="text-center">
            <CardContent className="pt-4 pb-3 px-3">
              <div className={cn("mx-auto flex h-9 w-9 items-center justify-center rounded-xl", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="mt-1.5 text-xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No courses found</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {searchQuery
          ? `No courses match "${searchQuery}". Try a different search term or adjust your filters.`
          : "No courses match your current filters. Try removing some constraints."}
      </p>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const featuredCourse = useMemo(
    () => courses.find((c) => c.id === FEATURED_COURSE_ID) ?? courses[0],
    [courses]
  );

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query) ||
          c.instructor.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== "All") {
      result = result.filter((c) => c.difficulty === selectedDifficulty);
    }

    // Sort
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => b.enrolledCount - a.enrolledCount);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort((a, b) => b.code.localeCompare(a.code));
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [courses, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" || selectedCategory !== "All" || selectedDifficulty !== "All";

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedDifficulty("All");
  }, []);

  const handleOpenDetail = useCallback((course: Course) => {
    setDetailCourse(course);
    setSheetOpen(true);
  }, []);

  const handleToggleEnroll = useCallback((courseId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const wasEnrolled = c.isEnrolled;
        return {
          ...c,
          isEnrolled: !wasEnrolled,
          progress: wasEnrolled ? 0 : 0,
          enrolledCount: wasEnrolled ? c.enrolledCount - 1 : c.enrolledCount + 1,
        };
      })
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-emerald-500" />
          Course Catalog
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore and enroll in courses to advance your learning journey
        </p>
      </motion.div>

      {/* Stats Summary */}
      <StatsSummary courses={courses} />

      {/* Featured Course Banner */}
      <FeaturedBanner course={featuredCourse} onEnroll={handleToggleEnroll} />

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-4"
      >
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses, instructors, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category + Difficulty pills */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs font-medium text-muted-foreground self-center mr-1">
              Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all",
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs font-medium text-muted-foreground self-center mr-1">
              Level:
            </span>
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all flex items-center gap-1.5",
                  selectedDifficulty === diff
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {diff !== "All" && (
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      selectedDifficulty === diff
                        ? "bg-white"
                        : DIFFICULTY_COLORS[diff as Difficulty].dot
                    )}
                  />
                )}
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Active filter indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Showing {filteredCourses.length} of {courses.length} courses
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Course Grid */}
      <div>
        {filteredCourses.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                  }}
                >
                  <CourseCard
                    course={course}
                    onOpenDetail={handleOpenDetail}
                    onToggleEnroll={handleToggleEnroll}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Course Detail Sheet */}
      <CourseDetailSheet
        course={detailCourse}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onToggleEnroll={handleToggleEnroll}
        allCourses={courses}
      />
    </div>
  );
}
