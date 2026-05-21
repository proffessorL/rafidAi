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
  Edit3,
  Save,
  X,
  Clock,
  Bell,
  Moon,
  Star,
  Lock,
  Download,
  Trash2,
  Shield,
  BookOpen,
  Users,
  MessageSquare,
  FileText,
  Mic2,
  FlaskConical,
  MapPin,
  Briefcase,
  BarChart3,
  Sparkles,
  XCircle,
  BadgeCheck,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

const MOCK_TEACHER = {
  name: "Dr. Aminul Khan",
  email: "dr.khan@diu.edu.bd",
  phone: "+880 1815-987654",
  employeeId: "FAC-2045",
  department: "Computer Science & Engineering",
  institution: "Daffodil International University",
  designation: "Associate Professor",
  office: "Room 401, CSE Building",
  bio: "Passionate about AI education and research. 12+ years of teaching experience in Computer Science.",
  joinDate: "2012",
};

const MOCK_TEACHING = {
  totalStudents: 156,
  coursesActive: 4,
  courses: [
    { code: "CSE-411", name: "Software Engineering", students: 42, semester: "Spring 2025", progress: 65 },
    { code: "CSE-423", name: "Artificial Intelligence", students: 38, semester: "Spring 2025", progress: 52 },
    { code: "CSE-405", name: "Computer Networks", students: 45, semester: "Spring 2025", progress: 78 },
    { code: "CSE-417", name: "Web Technologies", students: 31, semester: "Spring 2025", progress: 88 },
  ],
  officeHours: "Sun-Thu, 2:00 PM - 4:00 PM",
  avgStudentRating: 4.7,
  totalReviews: 89,
};

const MOCK_RESEARCH = {
  interests: [
    "Artificial Intelligence",
    "Machine Learning",
    "Natural Language Processing",
    "Computer Vision",
  ],
  publications: 34,
  conferences: 18,
};

interface TeacherData {
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  department: string;
  institution: string;
  designation: string;
  office: string;
  bio: string;
  joinDate: string;
}

interface TeachingPreferences {
  communicationMethod: "email" | "in-app" | "both";
  defaultQuizTime: number;
  newSubmissions: boolean;
  gradeReviewRequests: boolean;
  studentMessages: boolean;
  courseAnnouncements: boolean;
  weeklySummary: boolean;
  darkMode: boolean;
}

const DEFAULT_PREFERENCES: TeachingPreferences = {
  communicationMethod: "both",
  defaultQuizTime: 45,
  newSubmissions: true,
  gradeReviewRequests: true,
  studentMessages: true,
  courseAnnouncements: true,
  weeklySummary: false,
  darkMode: false,
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

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

export default function TeacherProfileSettings() {
  const [teacher, setTeacher] = useState<TeacherData>(MOCK_TEACHER);
  const [preferences, setPreferences] = useState<TeachingPreferences>(DEFAULT_PREFERENCES);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<TeacherData>(MOCK_TEACHER);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBio, setEditBio] = useState(MOCK_TEACHER.bio);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });

  const initials = useMemo(
    () =>
      teacher.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    [teacher.name]
  );

  // ── Handlers ──

  const handleSaveProfile = () => {
    if (!editForm.name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    setTeacher(editForm);
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleCancelEdit = () => {
    setEditForm(teacher);
    setIsEditing(false);
  };

  const handleSaveBio = () => {
    setTeacher({ ...teacher, bio: editBio });
    setIsEditingBio(false);
    toast.success("Bio updated successfully!");
  };

  const handleCancelBio = () => {
    setEditBio(teacher.bio);
    setIsEditingBio(false);
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

  const handlePreferenceChange = <K extends keyof TeachingPreferences>(
    key: K,
    value: TeachingPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    toast.success("Preference updated.");
  };

  return (
    <motion.div
      className="space-y-6 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ════════════════════════════════════════════
          1. Profile Header (full width)
      ════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden relative">
          {/* Gradient banner — teal-to-emerald for teacher distinction */}
          <div className="h-28 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
          </div>
          <CardContent className="pt-0 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
              {/* Avatar with gradient ring */}
              <div className="relative">
                <div className="p-[3px] rounded-full bg-gradient-to-br from-teal-400 via-emerald-400 to-teal-500 shadow-lg">
                  <div className="bg-background rounded-full p-[3px]">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-950 dark:to-emerald-950 flex items-center justify-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                        {initials}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-teal-500 border-2 border-background" />
              </div>

              {/* Name + info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-2xl font-bold">{teacher.name}</h1>
                  <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-800 w-fit mx-auto sm:mx-0">
                    {teacher.designation}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{teacher.email}</p>
                <p className="text-sm text-muted-foreground">
                  {teacher.department} &middot; {teacher.institution}
                </p>
              </div>

              {/* Edit button */}
              <Button
                onClick={() => {
                  setEditForm(teacher);
                  setIsEditing(true);
                }}
                className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md"
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two-column grid on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ════════════════════════════════════════════
            2. Personal Information (left column)
        ════════════════════════════════════════════ */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-teal-200 dark:hover:border-teal-800 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/40">
                  <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
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
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-eid">Employee ID</Label>
                      <Input
                        id="edit-eid"
                        value={editForm.employeeId}
                        onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-dept">Department</Label>
                      <Input
                        id="edit-dept"
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-designation">Designation</Label>
                      <Input
                        id="edit-designation"
                        value={editForm.designation}
                        onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="edit-office">Office</Label>
                      <Input
                        id="edit-office"
                        value={editForm.office}
                        onChange={(e) => setEditForm({ ...editForm, office: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSaveProfile}
                      size="sm"
                      className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save Changes
                    </Button>
                    <Button onClick={handleCancelEdit} size="sm" variant="outline" className="gap-1.5">
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: User, label: "Full Name", value: teacher.name },
                    { icon: Mail, label: "Email", value: teacher.email },
                    { icon: Phone, label: "Phone", value: teacher.phone },
                    { icon: Briefcase, label: "Employee ID", value: teacher.employeeId },
                    { icon: Building2, label: "Department", value: teacher.department },
                    { icon: GraduationCap, label: "Designation", value: teacher.designation },
                    { icon: MapPin, label: "Office", value: teacher.office },
                  ].map((field) => (
                    <div key={field.label} className="flex items-center gap-3 py-1.5">
                      <field.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{field.label}</p>
                        <p className="text-sm font-medium truncate">{field.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ════════════════════════════════════════════
            3. Teaching Overview (right column)
        ════════════════════════════════════════════ */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-teal-200 dark:hover:border-teal-800 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
                  <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                Teaching Overview
              </CardTitle>
              <CardDescription>
                Your teaching activity this semester &middot;{" "}
                <span className="text-teal-600 dark:text-teal-400 font-medium">
                  Spring 2025
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Users className="h-4 w-4 text-teal-500" />
                    <p className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                      {MOCK_TEACHING.totalStudents}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <FileText className="h-4 w-4 text-amber-500" />
                    <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {MOCK_TEACHING.coursesActive}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Active Courses</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
                    <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                      {MOCK_TEACHING.avgStudentRating}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Student Rating</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                    <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {MOCK_TEACHING.totalReviews}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
              </div>

              <Separator />

              {/* Active Courses List */}
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  Active Courses
                </p>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {MOCK_TEACHING.courses.map((course) => (
                    <div key={course.code} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-mono font-medium text-teal-600 dark:text-teal-400">
                            {course.code}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2 truncate">
                            {course.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {course.students}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {course.students} students enrolled
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                            {course.progress}%
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={course.progress}
                        className="h-1.5 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-teal-500 [&>[data-slot=progress-indicator]]:to-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Office Hours */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/40 shrink-0">
                  <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Office Hours</p>
                  <p className="text-sm font-medium">{MOCK_TEACHING.officeHours}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ════════════════════════════════════════════
            4. Teaching Preferences (left column)
        ════════════════════════════════════════════ */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-teal-200 dark:hover:border-teal-800 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/40">
                  <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                Teaching Preferences
              </CardTitle>
              <CardDescription>
                Customize your teaching experience and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preferred Communication Method */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Preferred Communication
                </Label>
                <Select
                  value={preferences.communicationMethod}
                  onValueChange={(val) =>
                    handlePreferenceChange(
                      "communicationMethod",
                      val as "email" | "in-app" | "both"
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <span className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-teal-500" /> Email Only
                      </span>
                    </SelectItem>
                    <SelectItem value="in-app">
                      <span className="flex items-center gap-2">
                        <Bell className="h-3.5 w-3.5 text-amber-500" /> In-App Only
                      </span>
                    </SelectItem>
                    <SelectItem value="both">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Both Email &amp; In-App
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Default Quiz Time Limit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Default Quiz Time Limit
                  </Label>
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                    {preferences.defaultQuizTime} min
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={120}
                  step={5}
                  value={preferences.defaultQuizTime}
                  onChange={(e) =>
                    handlePreferenceChange("defaultQuizTime", Number(e.target.value))
                  }
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-teal-100 dark:bg-teal-950/40 accent-teal-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                  <span>15 min</span>
                  <span>60 min</span>
                  <span>120 min</span>
                </div>
              </div>

              <Separator />

              {/* Notification Toggles */}
              <div className="space-y-4">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Notifications
                </p>

                {[
                  {
                    key: "newSubmissions" as const,
                    icon: FileText,
                    title: "New Submissions",
                    desc: "Get notified when students submit assignments",
                  },
                  {
                    key: "gradeReviewRequests" as const,
                    icon: Star,
                    title: "Grade Review Requests",
                    desc: "Students requesting grade re-evaluation",
                  },
                  {
                    key: "studentMessages" as const,
                    icon: MessageSquare,
                    title: "Student Messages",
                    desc: "Direct messages from students",
                  },
                  {
                    key: "courseAnnouncements" as const,
                    icon: Mic2,
                    title: "Course Announcements",
                    desc: "Updates and announcements for your courses",
                  },
                  {
                    key: "weeklySummary" as const,
                    icon: BarChart3,
                    title: "Weekly Summary",
                    desc: "Weekly overview of class performance",
                  },
                ].map((item, idx) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences[item.key]}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange(item.key, checked)
                      }
                      className={cn(
                        idx % 2 === 0
                          ? "data-[state=checked]:bg-teal-500"
                          : "data-[state=checked]:bg-amber-500"
                      )}
                    />
                  </div>
                ))}

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
                    onCheckedChange={(checked) => handlePreferenceChange("darkMode", checked)}
                    className="data-[state=checked]:bg-teal-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ════════════════════════════════════════════
            5. Research & Bio (right column)
        ════════════════════════════════════════════ */}
        <motion.div variants={itemVariants}>
          <Card className="hover:border-amber-200 dark:hover:border-amber-800 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
                      <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    Research &amp; Bio
                  </CardTitle>
                  <CardDescription>Your research interests and academic bio</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditBio(teacher.bio);
                    setIsEditingBio(true);
                  }}
                  className="gap-1.5 text-teal-600 hover:text-teal-700 dark:text-teal-400"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Bio */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  About
                </p>
                {isEditingBio ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Write your bio..."
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveBio}
                        size="sm"
                        className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save
                      </Button>
                      <Button onClick={handleCancelBio} size="sm" variant="outline" className="gap-1.5">
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">{teacher.bio}</p>
                )}
              </div>

              <Separator />

              {/* Research Interests */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Research Interests
                </p>
                <div className="flex flex-wrap gap-2">
                  {MOCK_RESEARCH.interests.map((interest) => (
                    <motion.span
                      key={interest}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-300"
                    >
                      <BadgeCheck className="h-3 w-3" />
                      {interest}
                    </motion.span>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Research Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <FileText className="h-4 w-4 text-amber-500" />
                    <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {MOCK_RESEARCH.publications}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Publications</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Mic2 className="h-4 w-4 text-teal-500" />
                    <p className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                      {MOCK_RESEARCH.conferences}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Conference Talks</p>
                </div>
              </div>

              {/* Joined Since */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/40 shrink-0">
                  <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Faculty Member Since</p>
                  <p className="text-sm font-medium">{teacher.joinDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════
          6. Account Actions (full width)
      ════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <Card className="hover:border-rose-200 dark:hover:border-rose-800 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/40">
                <Shield className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              Account Actions
            </CardTitle>
            <CardDescription>Manage your account security and data</CardDescription>
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
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-pw">New Password</Label>
                      <Input
                        id="new-pw"
                        type="password"
                        placeholder="Enter new password"
                        value={passwords.newPass}
                        onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
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
                          setPasswords({ ...passwords, confirm: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPasswordOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Update Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Export Data */}
              <Button variant="outline" className="gap-2 flex-1" onClick={handleExportData}>
                <Download className="h-4 w-4" />
                Export Data
              </Button>

              {/* Delete Account */}
              <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 flex-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-800">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-rose-500" />
                      Delete Account
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your teacher account,
                      all courses, student records, and remove your data from our servers.
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
    </motion.div>
  );
}
