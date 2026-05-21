"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  BarChart3,
  Zap,
  TrendingUp,
  Brain,
  Lightbulb,
  Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// --- Mock Data ---

const ENGAGEMENT_SCORE = 76;

const METRICS = [
  {
    label: "Study Consistency",
    value: 82,
    suffix: "%",
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-950/40",
    barColor: "bg-emerald-500",
  },
  {
    label: "Avg. Session Duration",
    value: 34,
    suffix: "min",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950/40",
    barColor: "bg-amber-500",
    displayValue: "34 min",
  },
  {
    label: "Weekly Active Hours",
    value: 21.5,
    suffix: "hrs",
    icon: Timer,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-950/40",
    barColor: "bg-teal-500",
    displayValue: "21.5 hrs",
  },
  {
    label: "Interaction Density",
    value: 68,
    suffix: "%",
    icon: Zap,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-950/40",
    barColor: "bg-orange-500",
  },
];

type EngagementQuality = "high" | "medium" | "low";

interface Session {
  id: string;
  date: string;
  time: string;
  duration: string;
  durationMinutes: number;
  quality: EngagementQuality;
  course: string;
}

const SESSIONS: Session[] = [
  {
    id: "1",
    date: "Today",
    time: "2:00 PM",
    duration: "45 min",
    durationMinutes: 45,
    quality: "high",
    course: "Organic Chemistry",
  },
  {
    id: "2",
    date: "Today",
    time: "10:15 AM",
    duration: "30 min",
    durationMinutes: 30,
    quality: "medium",
    course: "Quantum Mechanics",
  },
  {
    id: "3",
    date: "Yesterday",
    time: "4:30 PM",
    duration: "60 min",
    durationMinutes: 60,
    quality: "high",
    course: "Electromagnetic Theory",
  },
  {
    id: "4",
    date: "Yesterday",
    time: "11:00 AM",
    duration: "20 min",
    durationMinutes: 20,
    quality: "low",
    course: "Thermodynamics",
  },
  {
    id: "5",
    date: "2 days ago",
    time: "3:00 PM",
    duration: "50 min",
    durationMinutes: 50,
    quality: "high",
    course: "Organic Chemistry",
  },
  {
    id: "6",
    date: "2 days ago",
    time: "9:30 AM",
    duration: "35 min",
    durationMinutes: 35,
    quality: "medium",
    course: "Mathematical Physics",
  },
];

const ENGAGEMENT_TIPS = [
  {
    icon: Brain,
    title: "Mix Up Your Study Methods",
    description:
      "Try combining videos, readings, and practice problems. Variety keeps your brain engaged and improves retention.",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-950/40",
  },
  {
    icon: Timer,
    title: "Set Micro-Goals",
    description:
      "Break study sessions into 10-minute focused blocks with clear objectives. Small wins compound into big progress.",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950/40",
  },
  {
    icon: Zap,
    title: "Review Before Bed",
    description:
      "A quick 5-minute review before sleeping helps your brain consolidate memories. Keep it light and stress-free.",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-950/40",
  },
];

// --- Helpers ---

function getScoreColor(score: number): { stroke: string; text: string; bg: string; label: string } {
  if (score >= 70) {
    return {
      stroke: "oklch(0.55 0.15 160)",
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-950/40",
      label: "Excellent",
    };
  }
  if (score >= 40) {
    return {
      stroke: "oklch(0.72 0.14 75)",
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-950/40",
      label: "Good",
    };
  }
  return {
    stroke: "oklch(0.6 0.2 25)",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-950/40",
    label: "Needs Attention",
  };
}

function getQualityConfig(quality: EngagementQuality) {
  switch (quality) {
    case "high":
      return {
        label: "High",
        dotColor: "bg-emerald-500",
        textColor: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
      };
    case "medium":
      return {
        label: "Medium",
        dotColor: "bg-amber-500",
        textColor: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
      };
    case "low":
      return {
        label: "Low",
        dotColor: "bg-red-500",
        textColor: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/10",
      };
  }
}

// --- Sub-components ---

function EngagementGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const colors = getScoreColor(score);

  // The arc spans from -135deg to 135deg (270 degrees total)
  const totalArc = 270;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalArc / 360) * circumference;
  const filledLength = (score / 100) * arcLength;
  const dashOffset = arcLength - filledLength;

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const end = score;
      const duration = 1200;
      const startTime = performance.now();

      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        start = Math.round(eased * end);
        setAnimatedScore(start);
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="160" height="100" viewBox="0 0 160 100">
          {/* Background arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="oklch(0.92 0 0)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset="0"
            transform="rotate(135 80 80)"
          />
          {/* Filled arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            transform="rotate(135 80 80)"
            className="transition-all duration-[1200ms] ease-out"
            style={{ filter: "drop-shadow(0 0 6px rgba(0,0,0,0.1))" }}
          />
        </svg>
        {/* Score overlay */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className={`text-4xl font-bold tabular-nums ${colors.text}`}>
            {animatedScore}
          </span>
          <span className="text-xs text-muted-foreground">Engagement Score</span>
        </div>
      </div>
      <Badge variant="secondary" className={`gap-1 ${colors.bg}`}>
        <span className={`text-xs font-medium ${colors.text}`}>{colors.label}</span>
      </Badge>
    </div>
  );
}

function MetricsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {METRICS.map((metric) => {
        const isTimeBased = metric.label === "Avg. Session Duration" || metric.label === "Weekly Active Hours";
        return (
          <Card key={metric.label} className="text-center">
            <CardContent className="pt-5 pb-4 px-3">
              <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl ${metric.bgColor}`}>
                <metric.icon className={`h-4.5 w-4.5 ${metric.color}`} />
              </div>
              <p className="mt-2 text-lg font-bold tabular-nums">
                {metric.displayValue ?? `${metric.value}${metric.suffix}`}
              </p>
              <p className="text-[10px] text-muted-foreground mb-2">{metric.label}</p>
              {!isTimeBased && (
                <Progress
                  value={metric.value}
                  className={`h-1.5 [&>[data-slot=progress-indicator]]:${metric.barColor}`}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SessionTimeline() {
  // Group sessions by date
  const grouped: Record<string, Session[]> = {};
  for (const session of SESSIONS) {
    if (!grouped[session.date]) grouped[session.date] = [];
    grouped[session.date].push(session);
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, sessions]) => (
        <div key={date}>
          <p className="text-xs font-medium text-muted-foreground mb-2">{date}</p>
          <div className="relative ml-3 space-y-3">
            {/* Vertical line */}
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />

            {sessions.map((session) => {
              const qConfig = getQualityConfig(session.quality);
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative flex items-start gap-3 pl-3"
                >
                  {/* Dot on the timeline */}
                  <div
                    className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${qConfig.dotColor} ring-2 ring-background`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{session.course}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] gap-1 ${qConfig.bg}`}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${qConfig.dotColor}`} />
                          <span className={qConfig.textColor}>{qConfig.label}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {session.duration}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{session.time}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function EngagementTips() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {ENGAGEMENT_TIPS.map((tip) => (
        <Card key={tip.title} className="text-left">
          <CardContent className="pt-5 pb-4 px-4">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tip.bgColor}`}>
              <tip.icon className={`h-4 w-4 ${tip.color}`} />
            </div>
            <p className="mt-2 text-xs font-semibold">{tip.title}</p>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              {tip.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ActiveNowIndicator() {
  const [isActive, setIsActive] = useState(true);

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10">
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <motion.div
              className="absolute inset-0 h-3 w-3 rounded-full bg-emerald-500"
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {isActive ? "Actively Studying" : "Not Currently Active"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isActive
                ? "Your session started 23 minutes ago"
                : "Start a session to track your engagement"}
            </p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className="text-xs px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors font-medium"
          >
            {isActive ? "End Session" : "Start Session"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Component ---

export default function EngagementTracker() {
  return (
    <div className="space-y-6">
      {/* Active Now */}
      <ActiveNowIndicator />

      {/* Engagement Score Gauge */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle>Engagement Score</CardTitle>
              <CardDescription>Your overall learning engagement this week</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EngagementGauge score={ENGAGEMENT_SCORE} />
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Engagement Metrics
        </h3>
        <MetricsGrid />
      </div>

      {/* Session Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Sessions</CardTitle>
          <CardDescription>Your latest study sessions and engagement quality</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionTimeline />
        </CardContent>
      </Card>

      {/* Engagement Tips */}
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Tips to Boost Engagement
        </h3>
        <EngagementTips />
      </div>
    </div>
  );
}
