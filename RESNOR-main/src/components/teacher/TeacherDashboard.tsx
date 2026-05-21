"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  Target,
  Activity,
  Search,
  Send,
  Save,
  Loader2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  PenLine,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  email: string;
  lastActive: string;
  quizAvg: number;
  engagementScore: number;
  status: "At Risk" | "Warning" | "OK";
}

type SortField = "name" | "email" | "lastActive" | "quizAvg" | "engagementScore" | "status";
type SortDirection = "asc" | "desc";

type Tone = "supportive" | "encouraging" | "formal";

// ── Mock Data ──────────────────────────────────────────────────────────────────

const completionData = [
  { topic: "Variables", completed: 22, inProgress: 6, pending: 2 },
  { topic: "Loops", completed: 18, inProgress: 8, pending: 4 },
  { topic: "Functions", completed: 15, inProgress: 10, pending: 5 },
  { topic: "Arrays", completed: 12, inProgress: 9, pending: 9 },
  { topic: "OOP Basics", completed: 8, inProgress: 12, pending: 10 },
  { topic: "Data Structures", completed: 5, inProgress: 7, pending: 18 },
];

const scoreDistribution = [
  { range: "0–20%", students: 2 },
  { range: "20–40%", students: 4 },
  { range: "40–60%", students: 7 },
  { range: "60–80%", students: 12 },
  { range: "80–100%", students: 15 },
];

const recentActivities = [
  { id: 1, student: "Maria Chen", action: "completed quiz", target: "Variables & Types", time: "5 min ago" },
  { id: 2, student: "James Wilson", action: "started topic", target: "Functions & Scope", time: "12 min ago" },
  { id: 3, student: "Aisha Patel", action: "scored 92% on", target: "Loops Quiz", time: "23 min ago" },
  { id: 4, student: "Carlos Rivera", action: "submitted assignment", target: "Array Methods Lab", time: "41 min ago" },
  { id: 5, student: "Sophie Kim", action: "started topic", target: "OOP Basics", time: "1 hr ago" },
];

const studentsData: Student[] = [
  { id: "1", name: "Carlos Rivera", email: "carlos.r@email.com", lastActive: "2024-12-01", quizAvg: 42, engagementScore: 25, status: "At Risk" },
  { id: "2", name: "Diana Foster", email: "diana.f@email.com", lastActive: "2024-12-05", quizAvg: 51, engagementScore: 35, status: "Warning" },
  { id: "3", name: "Ethan Brooks", email: "ethan.b@email.com", lastActive: "2024-12-10", quizAvg: 38, engagementScore: 20, status: "At Risk" },
  { id: "4", name: "Fatima Al-Hassan", email: "fatima.h@email.com", lastActive: "2024-12-18", quizAvg: 55, engagementScore: 40, status: "Warning" },
  { id: "5", name: "George Tanaka", email: "george.t@email.com", lastActive: "2024-12-20", quizAvg: 78, engagementScore: 72, status: "OK" },
  { id: "6", name: "Hannah Müller", email: "hannah.m@email.com", lastActive: "2024-12-22", quizAvg: 85, engagementScore: 80, status: "OK" },
  { id: "7", name: "Isaac Nguyen", email: "isaac.n@email.com", lastActive: "2024-12-14", quizAvg: 45, engagementScore: 30, status: "At Risk" },
  { id: "8", name: "Julia Santos", email: "julia.s@email.com", lastActive: "2024-12-19", quizAvg: 68, engagementScore: 58, status: "OK" },
];

const defaultDraftMessages: Record<Tone, string> = {
  supportive:
    "Hi {name},\n\nI've noticed you've been having a bit of a tough time recently with the course material. That's completely okay — learning to code can be challenging, and everyone hits roadblocks.\n\nYour quiz average is currently {quizAvg}%, and I want to make sure you have the support you need to get back on track.\n\nWould you like to schedule a 1-on-1 session this week? I'm happy to go over any topics you're finding difficult.\n\nBest regards,\nYour Instructor",
  encouraging:
    "Hey {name}!\n\nYou've got real potential, and I can see you're putting in the effort. Sometimes the concepts just need a little more time to click.\n\nRight now your quiz scores are around {quizAvg}%, but I know you can bring that up. Let's work together to make it happen!\n\nHow about we set up a quick study session? I've got some great resources that might help things click.\n\nKeep going — you've got this!\nCheers,\nYour Instructor",
  formal:
    "Dear {name},\n\nI am writing regarding your current progress in the course. Your quiz average stands at {quizAvg}%, which is below the recommended threshold.\n\nWe encourage you to review the course material and consider attending office hours for additional support. Consistent engagement with the material will significantly improve your outcomes.\n\nPlease let me know a convenient time to discuss your progress.\n\nSincerely,\nCourse Instructor",
};

const aiImprovedMessages: Record<Tone, string> = {
  supportive:
    "Hi {name},\n\nI wanted to reach out because I care about your success in this course. I noticed that some of the recent topics — particularly around {weakestTopic} — may not have clicked yet, and that's completely normal.\n\nYour current quiz average is {quizAvg}%, but here's the thing: every programmer started exactly where you are now. The concepts build on each other, so let's make sure the foundations are solid.\n\nHere's what I'd suggest:\n1. Review the {weakestTopic} module at your own pace\n2. Try the practice problems at the end of each section\n3. Join the study group that meets on Wednesdays\n\nI'm available for a 1-on-1 session anytime this week — just let me know. We'll get through this together.\n\nWarmly,\nYour Instructor",
  encouraging:
    "Hey {name}! 🌟\n\nQuick note — I see you've been working through the material, and I want you to know that your effort doesn't go unnoticed!\n\nYour quiz scores are around {quizAvg}% right now, but here's what's exciting: students who stick with it through this phase almost always see a big jump in understanding. The \"confusion phase\" is actually a sign that your brain is building new connections!\n\nA few students in your cohort have been crushing it in the study group — would you be up for joining? Sometimes talking through problems with peers makes all the difference.\n\nAlso, I noticed you might benefit from revisiting {weakestTopic}. I've added some bonus practice problems there that are designed to build confidence step by step.\n\nYou're closer to a breakthrough than you think. Let's make it happen!\n\nHigh five,\nYour Instructor",
  formal:
    "Dear {name},\n\nI hope this message finds you well. I am writing to share some observations regarding your academic progress and to offer concrete next steps for improvement.\n\nCurrent Metrics:\n• Quiz Average: {quizAvg}%\n• Last Active: {lastActive}\n• Engagement Score: {engagementScore}/100\n\nAreas for Focus:\nBased on your recent assessments, I recommend prioritizing a review of {weakestTopic}, as this appears to be the primary area affecting your quiz performance.\n\nRecommended Actions:\n1. Attend the upcoming review session (Thursday, 3 PM)\n2. Complete the supplementary exercises in Module 4\n3. Schedule a 15-minute progress check-in during office hours\n\nResearch consistently shows that students who maintain regular engagement and seek help early achieve significantly better outcomes. I am confident that with targeted effort, you can reach your goals.\n\nPlease reply with your availability, and I will arrange a meeting at your convenience.\n\nBest regards,\nCourse Instructor",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusBadge(status: Student["status"]) {
  switch (status) {
    case "At Risk":
      return <Badge className="bg-red-600 text-white hover:bg-red-600/90 border-transparent">At Risk</Badge>;
    case "Warning":
      return <Badge className="bg-amber-500 text-white hover:bg-amber-500/90 border-transparent">Warning</Badge>;
    case "OK":
      return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90 border-transparent">OK</Badge>;
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  // Search & sort state for at-risk tracker
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("engagementScore");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  // Intervention builder state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tone, setTone] = useState<Tone>("supportive");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openIntervention = useCallback((student: Student) => {
    setSelectedStudent(student);
    setTone("supportive");
    setSubject(`Checking in — ${student.name}`);
    setMessage(
      defaultDraftMessages.supportive
        .replace("{name}", student.name)
        .replace("{quizAvg}", String(student.quizAvg))
    );
    setSheetOpen(true);
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField]
  );

  const handleGenerateAI = useCallback(() => {
    if (!selectedStudent) return;
    setIsGenerating(true);
    setTimeout(() => {
      const template = aiImprovedMessages[tone];
      setMessage(
        template
          .replace("{name}", selectedStudent.name)
          .replace("{quizAvg}", String(selectedStudent.quizAvg))
          .replace("{lastActive}", formatDate(selectedStudent.lastActive))
          .replace("{engagementScore}", String(selectedStudent.engagementScore))
          .replace("{weakestTopic}", "Data Structures")
      );
      setIsGenerating(false);
    }, 2000);
  }, [selectedStudent, tone]);

  const handleToneChange = useCallback(
    (newTone: Tone) => {
      if (!selectedStudent) return;
      setTone(newTone);
      setMessage(
        defaultDraftMessages[newTone]
          .replace("{name}", selectedStudent.name)
          .replace("{quizAvg}", String(selectedStudent.quizAvg))
      );
    },
    [selectedStudent]
  );

  // ── Computed ─────────────────────────────────────────────────────────────

  const sortedStudents = useMemo(() => {
    const filtered = studentsData.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "lastActive":
          cmp = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
          break;
        case "quizAvg":
          cmp = a.quizAvg - b.quizAvg;
          break;
        case "engagementScore":
          cmp = a.engagementScore - b.engagementScore;
          break;
        case "status": {
          const order = { "At Risk": 0, Warning: 1, OK: 2 };
          cmp = order[a.status] - order[b.status];
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [search, sortField, sortDir]);

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const stats = useMemo(
    () => ({
      totalStudents: studentsData.length,
      avgCompletion: 62,
      avgQuizScore: Math.round(
        studentsData.reduce((sum, s) => sum + s.quizAvg, 0) / studentsData.length
      ),
      activeStudents: studentsData.filter(
        (s) => new Date(s.lastActive) > new Date("2024-12-15")
      ).length,
    }),
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor class performance, track at-risk students, and send interventions.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <Activity className="size-4" />
            Class Overview
          </TabsTrigger>
          <TabsTrigger value="at-risk" className="gap-1.5">
            <AlertTriangle className="size-4" />
            At-Risk Tracker
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════ Tab 1 – Class Overview ═══════════════════════ */}
        <TabsContent value="overview" className="space-y-6 pt-2">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 pt-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-xl font-bold">{stats.totalStudents}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Completion</p>
                  <p className="text-xl font-bold">{stats.avgCompletion}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                  <Target className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Quiz Score</p>
                  <p className="text-xl font-bold">{stats.avgQuizScore}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                  <p className="text-xl font-bold">{stats.activeStudents}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Course Completion Rates – Stacked Bar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Completion Rates</CardTitle>
                <CardDescription>Student progress across topics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="topic" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="completed" stackId="a" fill="oklch(0.62 0.19 163)" name="Completed" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="inProgress" stackId="a" fill="oklch(0.75 0.18 85)" name="In Progress" />
                      <Bar dataKey="pending" stackId="a" fill="oklch(0.88 0.06 70)" name="Pending" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quiz Score Distribution</CardTitle>
                <CardDescription>Number of students per score range</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="range" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} className="fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Bar dataKey="students" fill="oklch(0.55 0.16 150)" radius={[4, 4, 0, 0]} name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest student interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <BookOpen className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{a.student}</span>{" "}
                        <span className="text-muted-foreground">{a.action}</span>{" "}
                        <span className="font-medium">{a.target}</span>
                      </p>
                    </div>
                    <span className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {a.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════ Tab 2 – At-Risk Tracker ═══════════════════════ */}
        <TabsContent value="at-risk" className="space-y-4 pt-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {sortedStudents.length} student{sortedStudents.length !== 1 && "s"} found
            </p>
            <div className="relative w-full max-w-xs">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("name")}
                    >
                      Student Name{sortArrow("name")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("email")}
                    >
                      Email{sortArrow("email")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("lastActive")}
                    >
                      Last Active{sortArrow("lastActive")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("quizAvg")}
                    >
                      Quiz Avg{sortArrow("quizAvg")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("engagementScore")}
                    >
                      Engagement{sortArrow("engagementScore")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("status")}
                    >
                      Status{sortArrow("status")}
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground">{student.email}</TableCell>
                      <TableCell>{formatDate(student.lastActive)}</TableCell>
                      <TableCell>{student.quizAvg}%</TableCell>
                      <TableCell>{student.engagementScore}</TableCell>
                      <TableCell>{statusBadge(student.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openIntervention(student)}
                          className="gap-1.5"
                        >
                          <PenLine className="size-3.5" />
                          Draft Intervention
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════ Intervention Sheet ═══════════════════════ */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pr-6">
            <SheetTitle>Intervention Builder</SheetTitle>
            <SheetDescription>
              Compose a message for the selected student.
            </SheetDescription>
          </SheetHeader>

          {selectedStudent && (
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-6 pb-4">
                {/* Student metrics */}
                <Card>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                        {selectedStudent.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium">{selectedStudent.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border p-2 text-center">
                        <p className="text-xs text-muted-foreground">Quiz Avg</p>
                        <p className="text-sm font-bold">{selectedStudent.quizAvg}%</p>
                      </div>
                      <div className="rounded-lg border p-2 text-center">
                        <p className="text-xs text-muted-foreground">Engagement</p>
                        <p className="text-sm font-bold">{selectedStudent.engagementScore}</p>
                      </div>
                      <div className="rounded-lg border p-2 text-center">
                        <p className="text-xs text-muted-foreground">Last Active</p>
                        <p className="text-sm font-bold">{formatDate(selectedStudent.lastActive)}</p>
                      </div>
                    </div>
                    <div className="text-center">{statusBadge(selectedStudent.status)}</div>
                  </CardContent>
                </Card>

                {/* Subject line */}
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject Line
                  </label>
                  <Input
                    id="subject"
                    placeholder="Message subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                {/* Tone selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message Tone</label>
                  <Select value={tone} onValueChange={(v) => handleToneChange(v as Tone)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supportive">Supportive</SelectItem>
                      <SelectItem value="encouraging">Encouraging</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Message textarea */}
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    className="min-h-[200px] resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isGenerating}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="gap-1.5"
                  >
                    {isGenerating ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="size-3.5" />
                    )}
                    {isGenerating ? "Generating..." : "Generate with AI"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}

          <SheetFooter className="border-t px-4 py-3">
            <Button variant="outline" onClick={() => setSheetOpen(false)} className="gap-1.5">
              <Save className="size-3.5" />
              Save Draft
            </Button>
            <Button onClick={() => setSheetOpen(false)} className="gap-1.5">
              <Send className="size-3.5" />
              Send Message
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
