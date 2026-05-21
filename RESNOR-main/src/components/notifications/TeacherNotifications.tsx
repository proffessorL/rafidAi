"use client";

import { useState, useMemo } from "react";
import { formatDistanceToNow, subMinutes, subHours, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  Settings,
  MessageSquare,
  Bell,
  X,
  CheckCheck,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Types ---

type NotificationType = "submission" | "alert" | "system" | "message";

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
    type: "submission",
    title: "New Assignment Submission",
    message: "Fatima Rahman submitted 'Database Design Project' for CSE-411.",
    timestamp: subMinutes(new Date(), 15),
    read: false,
    action: { label: "Review Submission", href: "#" },
  },
  {
    id: "2",
    type: "alert",
    title: "Student Performance Alert",
    message:
      "3 students in CSE-423 scored below 40% on the last quiz. Consider a review session.",
    timestamp: subHours(new Date(), 1),
    read: false,
    action: { label: "View Details", href: "#" },
  },
  {
    id: "3",
    type: "system",
    title: "Course Material Approved",
    message:
      "Your uploaded lecture slides for 'Week 8: Neural Networks' have been approved.",
    timestamp: subHours(new Date(), 2),
    read: false,
  },
  {
    id: "4",
    type: "message",
    title: "New Forum Reply",
    message:
      "Tasnim Ahmed replied to your post in 'AI Ethics Discussion'.",
    timestamp: subHours(new Date(), 3),
    read: true,
    action: { label: "View Reply", href: "#" },
  },
  {
    id: "5",
    type: "alert",
    title: "Grade Review Request",
    message:
      "Rafiq Ahmed requested a grade review for Quiz #3 in CSE-411.",
    timestamp: subHours(new Date(), 5),
    read: false,
    action: { label: "Review Request", href: "#" },
  },
  {
    id: "6",
    type: "system",
    title: "Schedule Reminder",
    message:
      "Your office hours are scheduled for tomorrow, 2:00 PM - 4:00 PM.",
    timestamp: subHours(new Date(), 8),
    read: true,
  },
  {
    id: "7",
    type: "system",
    title: "Semester Deadline",
    message:
      "Final grade submission deadline for Spring 2025 is June 15.",
    timestamp: subDays(new Date(), 1),
    read: true,
  },
  {
    id: "8",
    type: "alert",
    title: "New Student Enrollment",
    message:
      "12 new students have enrolled in CSE-417: Web Technologies.",
    timestamp: subDays(new Date(), 2),
    read: true,
  },
];

// --- Helpers ---

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: typeof CheckCircle2;
    bgColor: string;
    textColor: string;
    dotColor: string;
    label: string;
  }
> = {
  submission: {
    icon: CheckCircle2,
    bgColor: "bg-emerald-100 dark:bg-emerald-950/40",
    textColor: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
    label: "Submissions",
  },
  alert: {
    icon: AlertTriangle,
    bgColor: "bg-amber-100 dark:bg-amber-950/40",
    textColor: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
    label: "Alerts",
  },
  system: {
    icon: Settings,
    bgColor: "bg-slate-100 dark:bg-slate-800/40",
    textColor: "text-slate-600 dark:text-slate-400",
    dotColor: "bg-slate-500",
    label: "System",
  },
  message: {
    icon: MessageSquare,
    bgColor: "bg-teal-100 dark:bg-teal-950/40",
    textColor: "text-teal-600 dark:text-teal-400",
    dotColor: "bg-teal-500",
    label: "Messages",
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
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}
          >
            <Icon className={`h-4 w-4 ${config.textColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-tight">
                {notification.title}
              </p>
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
            <p className="text-xs text-muted-foreground leading-relaxed">
              {notification.message}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {timeAgo(notification.timestamp)}
              </span>
              {notification.action && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                >
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

export default function TeacherNotifications() {
  const [notifications, setNotifications] =
    useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "submissions":
        return notifications.filter((n) => n.type === "submission");
      case "alerts":
        return notifications.filter((n) => n.type === "alert");
      case "messages":
        return notifications.filter((n) => n.type === "message");
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
            <TabsTrigger value="submissions" className="text-xs hidden sm:flex">
              Submissions
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs hidden sm:flex">
              Alerts
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs hidden sm:flex">
              Messages
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
