"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  BookOpen,
  Edit3,
  Save,
  X,
  Clock,
  Target,
  Bell,
  Moon,
  Sun,
  Award,
  Star,
  Zap,
  Trophy,
  Lock,
  Download,
  Trash2,
  TrendingUp,
  CalendarDays,
  Flame,
  Brain,
  Code,
  Palette,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ────────────────────────────────────────
// Mock Data
// ────────────────────────────────────────

const MOCK_USER = {
  name: "Rafiq Ahmed",
  email: "rafiq.ahmed@diu.edu.bd",
  phone: "+880 1712-345678",
  studentId: "CSE-331",
  department: "Computer Science & Engineering",
  university: "Daffodil International University",
  semester: "7th",
  avatar: null,
};

const MOCK_PREFERENCES = {
  studyTime: "evening" as "morning" | "afternoon" | "evening",
  dailyGoal: 3,
  emailNotifications: true,
  pushNotifications: false,
  weeklyReport: true,
  darkMode: false,
};

const MOCK_ACADEMIC = {
  gpa: 3.67,
  creditsCompleted: 92,
  creditsTotal: 160,
  academicStanding: "Good Standing",
  currentSemester: "Spring 2025",
  courses: [
    { code: "CSE-411", name: "Software Engineering", progress: 72 },
    { code: "CSE-423", name: "Artificial Intelligence", progress: 58 },
    { code: "CSE-405", name: "Computer Networks", progress: 85 },
    { code: "CSE-417", name: "Web Technologies", progress: 90 },
  ],
};

interface BadgeData {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  color: string;
  earned: boolean;
  earnedDate?: string;
}

const MOCK_BADGES: BadgeData[] = [
  {
    id: "first-quiz",
    icon: <Target className="h-5 w-5" />,
    name: "First Quiz",
    description: "Completed your very first quiz",
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40",
    earned: true,
    earnedDate: "Jan 15",
  },
  {
    id: "quiz-master",
    icon: <Trophy className="h-5 w-5" />,
    name: "Quiz Master",
    description: "Score 100% on 5 quizzes",
    color: "text-amber-600 bg-amber-100 dark:bg-amber-950/40",
    earned: true,
    earnedDate: "Feb 8",
  },
  {
    id: "streak-7",
    icon: <Flame className="h-5 w-5" />,
    name: "Week Warrior",
    description: "Study every day for a full week",
    color: "text-rose-600 bg-rose-100 dark:bg-rose-950/40",
    earned: true,
    earnedDate: "Mar 1",
  },
  {
    id: "code-ninja",
    icon: <Code className="h-5 w-5" />,
    name: "Code Ninja",
    description: "Solve 50 coding challenges",
    color: "text-teal-600 bg-teal-100 dark:bg-teal-950/40",
    earned: true,
    earnedDate: "Mar 22",
  },
  {
    id: "ai-explorer",
    icon: <Brain className="h-5 w-5" />,
    name: "AI Explorer",
    description: "Complete 10 AI Tutor sessions",
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40",
    earned: true,
    earnedDate: "Apr 10",
  },
  {
    id: "top-contributor",
    icon: <Star className="h-5 w-5" />,
    name: "Top Contributor",
    description: "Rank in the top 5% of your class",
    color: "text-amber-600 bg-amber-100 dark:bg-amber-950/40",
    earned: true,
    earnedDate: "Apr 18",
  },
  {
    id: "marathon",
    icon: <Zap className="h-5 w-5" />,
    name: "Study Marathon",
    description: "Complete 4 hours of study in one day",
    color: "text-teal-600 bg-teal-100 dark:bg-teal-950/40",
    earned: false,
  },
  {
    id: "creative-mind",
    icon: <Palette className="h-5 w-5" />,
    name: "Creative Mind",
    description: "Use 5 different study tools in one week",
    color: "text-rose-600 bg-rose-100 dark:bg-rose-950/40",
    earned: false,
  },
];

const MOCK_XP = {
  total: 12450,
  currentLevel: 7,
  levelName: "Scholar",
  currentLevelXP: 2450,
  nextLevelXP: 3500,
  prevLevelXP: 1800,
};

// Generate 12 weeks of activity data (84 days)
function generateActivityData(): number[] {
  const data: number[] = [];
  const now = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    // Simulate realistic study patterns
    if (dayOfWeek === 0) {
      data.push(Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0);
    } else if (dayOfWeek === 5) {
      data.push(Math.floor(Math.random() * 3) + 1);
    } else if (dayOfWeek === 6) {
      data.push(Math.random() > 0.3 ? Math.floor(Math.random() * 2) + 1 : 0);
    } else {
      data.push(Math.floor(Math.random() * 4) + 1);
    }
  }
  return data;
}

// ────────────────────────────────────────
// Activity Graph
// ────────────────────────────────────────

const ACTIVITY_COLORS = [
  "bg-muted",
  "bg-emerald-200 dark:bg-emerald-900/60",
  "bg-emerald-400 dark:bg-emerald-700",
  "bg-emerald-500 dark:bg-emerald-500",
  "bg-emerald-700 dark:bg-emerald-400",
];

const ACTIVITY_LABELS = ["No activity", "1-30 min", "31-60 min", "1-2 hrs", "2+ hrs"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function ActivityGraph({ data }: { data: number[] }) {
  const weeks: number[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div className="flex gap-[3px] pl-8">
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
          (month) => (
            <div
              key={month}
              className="flex-1 text-[10px] text-muted-foreground text-center"
            >
              {month}
            </div>
          )
        )}
      </div>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] pt-0">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="h-[13px] w-7 flex items-center justify-end pr-1 text-[10px] text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-[3px] flex-1 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((level, di) => (
                <Tooltip key={`${wi}-${di}`}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: (wi * 7 + di) * 0.003,
                        duration: 0.2,
                      }}
                      className={cn(
                        "h-[13px] w-[13px] rounded-sm cursor-pointer transition-colors hover:ring-1 hover:ring-foreground/20",
                        ACTIVITY_COLORS[level]
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {ACTIVITY_LABELS[level]}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        {ACTIVITY_COLORS.map((color, i) => (
          <div
            key={i}
            className={cn("h-[13px] w-[13px] rounded-sm", color)}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

export default function ProfileSettings() {
  const [user, setUser] = useState(MOCK_USER);
  const [preferences, setPreferences] = useState(MOCK_PREFERENCES);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(MOCK_USER);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });

  const activityData = useMemo(() => generateActivityData(), []);
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const xpProgress = Math.round(
    ((MOCK_XP.currentLevelXP - MOCK_XP.prevLevelXP) /
      (MOCK_XP.nextLevelXP - MOCK_XP.prevLevelXP)) *
      100
  );

  const earnedCount = MOCK_BADGES.filter((b) => b.earned).length;
  const creditsProgress = Math.round(
    (MOCK_ACADEMIC.creditsCompleted / MOCK_ACADEMIC.creditsTotal) * 100
  );

  const handleSaveProfile = () => {
    setUser(editForm);
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleCancelEdit = () => {
    setEditForm(user);
    setIsEditing(false);
  };

  const handleExportData = () => {
    toast.success("Your data export has been started. You'll receive a download link via email.");
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmOpen(false);
    toast.success("Account deletion requested. You'll receive a confirmation email.");
  };

  const handleChangePassword = () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwords.newPass.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setPasswordOpen(false);
    setPasswords({ current: "", newPass: "", confirm: "" });
    toast.success("Password changed successfully!");
  };

  // ────────────────────────────────────────
  // Animation variants
  // ────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      className="space-y-6 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── 1. Profile Header ── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden relative">
          {/* Gradient banner */}
          <div className="h-28 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
          </div>
          <CardContent className="pt-0 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
              {/* Avatar with gradient ring */}
              <div className="relative">
                <div className="p-[3px] rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-500 shadow-lg">
                  <div className="bg-background rounded-full p-[3px]">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {initials}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
              </div>

              {/* Name + info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 w-fit mx-auto sm:mx-0">
                    {user.studentId}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  {user.department} &middot; {user.university}
                </p>
              </div>

              {/* Edit button */}
              <Button
                onClick={() => {
                  setEditForm(user);
                  setIsEditing(true);
                }}
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 2. Personal Information ── */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Personal Information
              </CardTitle>
              <CardDescription>
                Manage your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Full Name</Label>
                      <Input
                        id="edit-name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-sid">Student ID</Label>
                      <Input
                        id="edit-sid"
                        value={editForm.studentId}
                        onChange={(e) =>
                          setEditForm({ ...editForm, studentId: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-dept">Department</Label>
                      <Input
                        id="edit-dept"
                        value={editForm.department}
                        onChange={(e) =>
                          setEditForm({ ...editForm, department: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-sem">Semester</Label>
                      <Input
                        id="edit-sem"
                        value={editForm.semester}
                        onChange={(e) =>
                          setEditForm({ ...editForm, semester: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSaveProfile}
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save Changes
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: User, label: "Full Name", value: user.name },
                    { icon: Mail, label: "Email", value: user.email },
                    { icon: Phone, label: "Phone", value: user.phone },
                    {
                      icon: GraduationCap,
                      label: "Student ID",
                      value: user.studentId,
                    },
                    { icon: Building2, label: "Department", value: user.department },
                    { icon: CalendarDays, label: "Semester", value: user.semester },
                  ].map((field) => (
                    <div
                      key={field.label}
                      className="flex items-center gap-3 py-1.5"
                    >
                      <field.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {field.label}
                        </p>
                        <p className="text-sm font-medium truncate">
                          {field.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 3. Study Preferences ── */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-teal-200 dark:hover:border-teal-800 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/40">
                  <Target className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                Study Preferences
              </CardTitle>
              <CardDescription>
                Customize your study experience and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preferred Study Time */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Preferred Study Time
                </Label>
                <Select
                  value={preferences.studyTime}
                  onValueChange={(val) =>
                    setPreferences({
                      ...preferences,
                      studyTime: val as "morning" | "afternoon" | "evening",
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">
                      <span className="flex items-center gap-2">
                        <Sun className="h-3.5 w-3.5 text-amber-500" /> Morning
                        (6AM - 12PM)
                      </span>
                    </SelectItem>
                    <SelectItem value="afternoon">
                      <span className="flex items-center gap-2">
                        <Sun className="h-3.5 w-3.5 text-orange-500" /> Afternoon
                        (12PM - 6PM)
                      </span>
                    </SelectItem>
                    <SelectItem value="evening">
                      <span className="flex items-center gap-2">
                        <Moon className="h-3.5 w-3.5 text-teal-500" /> Evening
                        (6PM - 12AM)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Daily Study Goal */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Daily Study Goal
                  </Label>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {preferences.dailyGoal} hours
                  </span>
                </div>
                <Slider
                  value={[preferences.dailyGoal]}
                  onValueChange={([val]) =>
                    setPreferences({ ...preferences, dailyGoal: val })
                  }
                  min={1}
                  max={8}
                  step={1}
                  className="[&>[data-slot=slider-track]]:bg-emerald-100 dark:[&>[data-slot=slider-track]]:bg-emerald-950/40 [&>[data-slot=slider-range]]:bg-emerald-500 [&>[data-slot=slider-thumb]]:border-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                  <span>1 hr</span>
                  <span>8 hrs</span>
                </div>
              </div>

              <Separator />

              {/* Notification Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Receive study reminders via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        emailNotifications: checked,
                      })
                    }
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Get real-time browser notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        pushNotifications: checked,
                      })
                    }
                    className="data-[state=checked]:bg-teal-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Weekly Report</p>
                      <p className="text-xs text-muted-foreground">
                        Receive a weekly progress summary
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.weeklyReport}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        weeklyReport: checked,
                      })
                    }
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">
                        Switch between light and dark theme
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.darkMode}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, darkMode: checked })
                    }
                    className="data-[state=checked]:bg-teal-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 4. Academic Overview ── */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                  <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Academic Overview
              </CardTitle>
              <CardDescription>
                {MOCK_ACADEMIC.currentSemester} &middot;{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {MOCK_ACADEMIC.academicStanding}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* GPA and Credits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {MOCK_ACADEMIC.gpa}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current GPA
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {MOCK_ACADEMIC.creditsCompleted}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Credits Earned
                  </p>
                </div>
              </div>

              {/* Credits Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Credits Progress</span>
                  <span className="font-medium">
                    {MOCK_ACADEMIC.creditsCompleted} / {MOCK_ACADEMIC.creditsTotal}
                  </span>
                </div>
                <Progress
                  value={creditsProgress}
                  className="h-2.5 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-emerald-500 [&>[data-slot=progress-indicator]]:to-teal-500"
                />
              </div>

              <Separator />

              {/* Current Courses */}
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  Current Courses
                </p>
                <div className="space-y-3">
                  {MOCK_ACADEMIC.courses.map((course) => (
                    <div key={course.code} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono font-medium text-teal-600 dark:text-teal-400">
                            {course.code}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {course.name}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {course.progress}%
                        </span>
                      </div>
                      <Progress
                        value={course.progress}
                        className="h-1.5 [&>[data-slot=progress-indicator]]:bg-teal-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 5. Achievement Showcase ── */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-amber-200 dark:hover:border-amber-800 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
                      <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    Achievements
                  </CardTitle>
                  <CardDescription>
                    {earnedCount} of {MOCK_BADGES.length} badges earned
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1"
                >
                  <Star className="h-3 w-3" />
                  Level {MOCK_XP.currentLevel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* XP and Level */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-sm">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {MOCK_XP.total.toLocaleString()} XP Total
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {MOCK_XP.levelName} &middot; {xpProgress}% to Level{" "}
                      {MOCK_XP.currentLevel + 1}
                    </p>
                  </div>
                </div>
              </div>
              <Progress
                value={xpProgress}
                className="h-2.5 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-amber-400 [&>[data-slot=progress-indicator]]:to-orange-400"
              />

              <Separator />

              {/* Badge Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MOCK_BADGES.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all cursor-pointer",
                            badge.earned
                              ? "border-foreground/10 bg-background hover:border-foreground/20 hover:shadow-sm"
                              : "opacity-40 grayscale border-dashed"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full",
                              badge.earned
                                ? badge.color
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {badge.icon}
                          </div>
                          <p className="text-[11px] font-medium leading-tight">
                            {badge.name}
                          </p>
                          {badge.earned && badge.earnedDate && (
                            <p className="text-[9px] text-muted-foreground">
                              {badge.earnedDate}
                            </p>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[180px] text-center">
                        <p className="font-medium">{badge.name}</p>
                        <p className="text-[10px] opacity-80">{badge.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── 6. Account Actions ── */}
      <motion.div variants={itemVariants}>
        <Card className="hover:border-rose-200 dark:hover:border-rose-800 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/40">
                <Shield className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              Account Actions
            </CardTitle>
            <CardDescription>
              Manage your account security and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Change Password */}
              <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 flex-1">
                    <Lock className="h-4 w-4" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="current-pw">Current Password</Label>
                      <Input
                        id="current-pw"
                        type="password"
                        placeholder="Enter current password"
                        value={passwords.current}
                        onChange={(e) =>
                          setPasswords({ ...passwords, current: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-pw">New Password</Label>
                      <Input
                        id="new-pw"
                        type="password"
                        placeholder="Enter new password"
                        value={passwords.newPass}
                        onChange={(e) =>
                          setPasswords({ ...passwords, newPass: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pw">Confirm New Password</Label>
                      <Input
                        id="confirm-pw"
                        type="password"
                        placeholder="Confirm new password"
                        value={passwords.confirm}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            confirm: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setPasswordOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Update Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Export Data */}
              <Button
                variant="outline"
                onClick={handleExportData}
                className="gap-2 flex-1"
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>

              {/* Delete Account */}
              <AlertDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 flex-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to delete your account?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All your data, including
                      study progress, quiz results, and achievements, will be
                      permanently deleted from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 7. Activity Graph ── */}
      <motion.div variants={itemVariants}>
        <Card className="hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Study Activity
            </CardTitle>
            <CardDescription>
              Your daily study activity over the last 12 weeks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityGraph data={activityData} />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
