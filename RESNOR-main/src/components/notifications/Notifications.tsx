"use client";

import { useState, useMemo } from "react";
import { formatDistanceToNow, subMinutes, subHours, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  AlertTriangle,
  Bell,
  Info,
  X,
  CheckCheck,
  Trophy,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Types ---

type NotificationType = "achievement" | "reminder" | "warning" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: { label: string; href: string };
}

// --- Mock Data ---

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "achievement",
    title: "New Achievement Unlocked!",
    message: "You earned the 'Week Warrior' badge for studying 7 days in a row. Amazing work!",
    timestamp: subMinutes(new Date(), 12),
    read: false,
    action: { label: "View Badge", href: "#" },
  },
  {
    id: "2",
    type: "reminder",
    title: "Study Reminder",
    message: "You haven't studied 'Organic Chemistry' in 2 days. Keep your momentum going!",
    timestamp: subHours(new Date(), 3),
    read: false,
    action: { label: "Start Studying", href: "#" },
  },
  {
    id: "3",
    type: "warning",
    title: "Assignment Deadline Approaching",
    message: "Your 'Quantum Mechanics Problem Set 4' is due in 18 hours. Don't forget to submit!",
    timestamp: subHours(new Date(), 6),
    read: false,
    action: { label: "Go to Assignment", href: "#" },
  },
  {
    id: "4",
    type: "info",
    title: "New Material Available",
    message: "A new chapter 'Thermodynamics: Entropy & Gibbs Free Energy' has been added to your course.",
    timestamp: subHours(new Date(), 12),
    read: true,
    action: { label: "View Material", href: "#" },
  },
  {
    id: "5",
    type: "achievement",
    title: "Quiz Score: Perfect!",
    message: "You scored 100% on 'Electromagnetic Waves Quiz'. You're on fire!",
    timestamp: subDays(new Date(), 1),
    read: true,
    action: { label: "Review Quiz", href: "#" },
  },
  {
    id: "6",
    type: "reminder",
    title: "Weekly Goal Progress",
    message: "You've completed 4 out of 5 weekly study sessions. One more to hit your target!",
    timestamp: subDays(new Date(), 1),
    read: false,
  },
  {
    id: "7",
    type: "info",
    title: "Community Update",
    message: "3 classmates have commented on your study group discussion about 'Wave Functions'.",
    timestamp: subDays(new Date(), 2),
    read: true,
  },
  {
    id: "8",
    type: "warning",
    title: "Streak at Risk",
    message: "Today's the last day to maintain your 12-day streak. Even 10 minutes counts!",
    timestamp: subMinutes(new Date(), 30),
    read: false,
    action: { label: "Quick Study", href: "#" },
  },
];

// --- Helpers ---

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof Star; bgColor: string; textColor: string; dotColor: string; label: string }
> = {
  achievement: {
    icon: Star,
    bgColor: "bg-amber-100 dark:bg-amber-950/40",
    textColor: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
    label: "Achievements",
  },
  reminder: {
    icon: Bell,
    bgColor: "bg-teal-100 dark:bg-teal-950/40",
    textColor: "text-teal-600 dark:text-teal-400",
    dotColor: "bg-teal-500",
    label: "Reminders",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-red-100 dark:bg-red-950/40",
    textColor: "text-red-600 dark:text-red-400",
    dotColor: "bg-red-500",
    label: "Warnings",
  },
  info: {
    icon: Info,
    bgColor: "bg-slate-100 dark:bg-slate-800/40",
    textColor: "text-slate-600 dark:text-slate-400",
    dotColor: "bg-slate-500",
    label: "Info",
  },
};

function timeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

// --- Sub-components ---

function NotificationCard({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={`relative transition-all hover:shadow-md ${
          !notification.read ? "border-l-2 border-l-amber-500" : ""
        }`}
      >
        <CardContent className="flex gap-3 py-4 px-4">
          {/* Icon */}
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}>
            <Icon className={`h-4 w-4 ${config.textColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-tight">{notification.title}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onDismiss(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {timeAgo(notification.timestamp)}
              </span>
              {notification.action && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                  {notification.action.label}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Bell className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium">No notifications</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-[240px]">
        {filter === "unread"
          ? "You're all caught up! No unread notifications to show."
          : `No ${filter} notifications at the moment.`}
      </p>
    </div>
  );
}

// --- Main Component ---

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "achievements":
        return notifications.filter((n) => n.type === "achievement");
      case "reminders":
        return notifications.filter((n) => n.type === "reminder");
      case "warnings":
        return notifications.filter((n) => n.type === "warning");
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge className="bg-amber-500 text-white border-amber-500 hover:bg-amber-500">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex">
            <TabsTrigger value="all" className="text-xs">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs hidden sm:flex">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="reminders" className="text-xs hidden sm:flex">
              Reminders
            </TabsTrigger>
            <TabsTrigger value="warnings" className="text-xs hidden sm:flex">
              Warnings
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="max-h-[520px]">
              <div className="space-y-2 pr-3">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onDismiss={dismissNotification}
                      />
                    ))
                  ) : (
                    <EmptyState filter={activeTab} />
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
