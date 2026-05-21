"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Star, Zap, Crown, BookOpen, Gem, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// --- Mock Data ---

const CURRENT_STREAK = 12;
const BEST_STREAK = 18;

// Generate last 30 days of activity
function generateStreakDays() {
  const days: { date: string; active: boolean }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // Create realistic pattern: mostly active for the last 12 days, then sporadic
    const daysAgo = i;
    let active = false;
    if (daysAgo <= 12) {
      active = true;
    } else if (daysAgo <= 14) {
      active = Math.random() > 0.3;
    } else if (daysAgo <= 20) {
      active = Math.random() > 0.6;
    } else {
      active = Math.random() > 0.7;
    }
    days.push({ date: d.toISOString().split("T")[0], active });
  }
  return days;
}

const CURRENT_LEVEL = 7;
const LEVEL_NAME = "Scholar";
const CURRENT_XP = 2450;
const NEXT_LEVEL_XP = 3500;
const PREV_LEVEL_XP = 1800;

interface BadgeData {
  id: string;
  emoji: string;
  name: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

const ACHIEVEMENTS: BadgeData[] = [
  { id: "first-quiz", emoji: "🎯", name: "First Quiz", description: "Complete your very first quiz", earned: true, earnedDate: "Jan 15" },
  { id: "quiz-master", emoji: "🏆", name: "Quiz Master", description: "Score 100% on 5 quizzes", earned: true, earnedDate: "Feb 8" },
  { id: "week-warrior", emoji: "🔥", name: "Week Warrior", description: "Study every day for a full week", earned: true, earnedDate: "Mar 1" },
  { id: "study-marathon", emoji: "⭐", name: "Study Marathon", description: "Complete 4 hours of study in one day", earned: true, earnedDate: "Mar 22" },
  { id: "material-explorer", emoji: "📚", name: "Material Explorer", description: "Access all study materials in a course", earned: false },
  { id: "engagement-pro", emoji: "💎", name: "Engagement Pro", description: "Maintain 90% engagement for a month", earned: false },
  { id: "quick-learner", emoji: "⚡", name: "Quick Learner", description: "Complete a course in under 2 weeks", earned: false },
  { id: "consistency-king", emoji: "👑", name: "Consistency King", description: "Maintain a 30-day study streak", earned: false },
];

const STATS = [
  { label: "Total XP", value: "12,450", icon: Star },
  { label: "Total Quizzes", value: "47", icon: Target },
  { label: "Materials Completed", value: "23", icon: BookOpen },
  { label: "Active Days", value: "68", icon: Flame },
];

const LEVEL_MILESTONES = [
  { level: 5, label: "5" },
  { level: 10, label: "10" },
  { level: 15, label: "15" },
];

// --- Components ---

function StreakCalendar({ days }: { days: { date: string; active: boolean }[] }) {
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-0.5">
        {dayLabels.map((label, i) => (
          <div key={i} className="w-7 text-center text-[10px] text-muted-foreground font-medium">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          const d = new Date(day.date);
          const offset = d.getDay();
          return (
            <Tooltip key={day.date}>
              <TooltipTrigger asChild>
                <div
                  className="w-7 h-7 rounded-sm flex items-center justify-center"
                  style={{
                    marginLeft: i === 0 && offset > 0 ? `${offset * 100}%` : undefined,
                  }}
                >
                  <div
                    className={`w-5 h-5 rounded-sm transition-all ${
                      day.active
                        ? "bg-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.3)]"
                        : "bg-muted"
                    }`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                <p className="text-[10px]">{day.active ? "Studied" : "No study"}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

function LevelProgressBar() {
  const xpRange = NEXT_LEVEL_XP - PREV_LEVEL_XP;
  const xpProgress = CURRENT_XP - PREV_LEVEL_XP;
  const percentage = Math.round((xpProgress / xpRange) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">Level {CURRENT_LEVEL} — {LEVEL_NAME}</p>
            <p className="text-xs text-muted-foreground">
              {xpProgress.toLocaleString()} / {xpRange.toLocaleString()} XP to Level {CURRENT_LEVEL + 1}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
          {percentage}%
        </Badge>
      </div>
      <div className="relative">
        <Progress value={percentage} className="h-3 [&>[data-slot=progress-indicator]]:bg-amber-500" />
        {/* Level milestones */}
        {LEVEL_MILESTONES.map((m) => {
          const pos = ((m.level * 500 - PREV_LEVEL_XP) / xpRange) * 100;
          if (pos < 0 || pos > 100) return null;
          return (
            <div
              key={m.level}
              className="absolute top-[-18px] transform -translate-x-1/2"
              style={{ left: `${pos}%` }}
            >
              <div className="w-px h-5 bg-border" />
              <span className="text-[9px] text-muted-foreground">{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AchievementBadges({ badges }: { badges: BadgeData[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {badges.map((badge) => (
        <motion.div
          key={badge.id}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className={`relative overflow-hidden text-center transition-all ${
              badge.earned
                ? "border-amber-500/30 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10"
                : "opacity-50 grayscale"
            }`}
          >
            <CardContent className="pt-5 pb-4 px-3">
              <div className="relative inline-flex">
                <span className={`text-3xl ${badge.earned ? "" : "grayscale"}`}>
                  {badge.emoji}
                </span>
                {!badge.earned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                    <Crown className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs font-semibold leading-tight">{badge.name}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                {badge.description}
              </p>
              {badge.earned && badge.earnedDate && (
                <p className="mt-1.5 text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                  Earned {badge.earnedDate}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STATS.map((stat) => (
        <Card key={stat.label} className="text-center">
          <CardContent className="pt-5 pb-4 px-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <stat.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="mt-2 text-xl font-bold tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Main Component ---

export default function Gamification() {
  const streakDays = useMemo(() => generateStreakDays(), []);

  return (
    <div className="space-y-6">
      {/* Daily Study Streak */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-amber-500">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Flame className="h-6 w-6" />
              </motion.div>
              <span className="text-2xl font-bold">{CURRENT_STREAK}</span>
            </div>
            <span>Day Streak!</span>
          </CardTitle>
          <CardDescription>
            Best streak: <span className="font-medium text-foreground">{BEST_STREAK} days</span> — Keep going!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StreakCalendar days={streakDays} />
        </CardContent>
      </Card>

      {/* Level Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <LevelProgressBar />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <StatsGrid />

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>{ACHIEVEMENTS.filter((a) => a.earned).length} of {ACHIEVEMENTS.length} earned</CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Gem className="h-3 w-3 text-amber-500" />
              <span>4</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <AchievementBadges badges={ACHIEVEMENTS} />
        </CardContent>
      </Card>
    </div>
  );
}
