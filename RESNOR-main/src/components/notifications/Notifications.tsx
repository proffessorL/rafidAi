"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  AlertTriangle,
  Bell,
  Info,
  X,
  CheckCheck,
  Trash2,
  Clock,
  Trophy,
  BookOpen,
  Sparkles,
  Inbox,
  PartyPopper,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationStore } from "@/stores/notifications";
import { useAuthStore } from "@/stores/auth";
import { useBrowserNotification } from "@/lib/hooks/useBrowserNotification";

type NotificationType = "achievement" | "reminder" | "warning" | "info";

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl: string | null;
  isProactive?: boolean;
}

interface GroupedNotifications {
  label: string;
  items: NotificationData[];
}

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof Star; bgColor: string; textColor: string; dotColor: string; label: string }
> = {
  achievement: {
    icon: Trophy,
    bgColor: "bg-amber-100 dark:bg-amber-950/40",
    textColor: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
    label: "Achievements",
  },
  reminder: {
    icon: BookOpen,
    bgColor: "bg-teal-100 dark:bg-teal-950/40",
    textColor: "text-teal-600 dark:text-teal-400",
    dotColor: "bg-teal-500",
    label: "Reminders",
  },
  warning: {
    icon: ShieldAlert,
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

function formatTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true });
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

function groupByDate(notifications: NotificationData[]): GroupedNotifications[] {
  const groups: { label: string; items: NotificationData[] }[] = [];
  const now = new Date();
  const today: NotificationData[] = [];
  const yesterday: NotificationData[] = [];
  const thisWeek: NotificationData[] = [];
  const earlier: NotificationData[] = [];

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    if (isToday(d)) today.push(n);
    else if (isYesterday(d)) yesterday.push(n);
    else if (now.getTime() - d.getTime() < 7 * 86400000) thisWeek.push(n);
    else earlier.push(n);
  }

  if (today.length) groups.push({ label: "Today", items: today });
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday });
  if (thisWeek.length) groups.push({ label: "This Week", items: thisWeek });
  if (earlier.length) groups.push({ label: "Earlier", items: earlier });

  return groups;
}

function NotificationCard({
  notification,
  onDismiss,
  onMarkRead,
}: {
  notification: NotificationData;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}) {
  const type = (notification.type in TYPE_CONFIG ? notification.type : "info") as NotificationType;
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.3, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -80) onDismiss(notification.id);
      }}
    >
      <div
        className={`group relative flex items-start gap-3 rounded-xl border p-3.5 transition-all ${
          notification.isRead
            ? "bg-card border-border/50"
            : "bg-card border-l-[3px] shadow-sm dark:shadow-emerald-950/10"
        } hover:border-border hover:shadow-md cursor-pointer`}
        onClick={() => {
          if (!notification.isRead) onMarkRead(notification.id);
        }}
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.isProactive ? 'bg-gradient-to-br from-amber-100 to-purple-100 dark:from-amber-950/40 dark:to-purple-950/40' : config.bgColor}`}>
          {notification.isProactive ? <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" /> : <Icon className={`h-5 w-5 ${config.textColor}`} />}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm leading-tight ${notification.isRead ? "font-medium text-muted-foreground" : "font-semibold"}`}>
              {notification.title}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {!notification.isRead && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: config.dotColor.replace("bg-", "") }}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground/40 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <p className={`text-xs leading-relaxed ${notification.isRead ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
            {notification.message}
          </p>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(notification.createdAt)}
            </span>
            {notification.actionUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                onClick={(e) => { e.stopPropagation(); }}
                asChild
              >
                <a href={notification.actionUrl}>View</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  const configs: Record<string, { icon: typeof Bell; title: string; desc: string }> = {
    all: { icon: Inbox, title: "No notifications yet", desc: "When you get notifications, they'll show up here." },
    unread: { icon: Bell, title: "All caught up!", desc: "You've read every notification. Great focus!" },
    achievements: { icon: PartyPopper, title: "No achievements yet", desc: "Complete quizzes and earn badges to see achievements here." },
    reminders: { icon: BookOpen, title: "No reminders", desc: "Study reminders will appear here when you have pending materials." },
    warnings: { icon: ShieldAlert, title: "All clear!", desc: "No warnings — you're doing great." },
    proactive: { icon: Sparkles, title: "No AI insights yet", desc: "AI-powered learning insights will appear here as you study." },
    info: { icon: Info, title: "No updates", desc: "General updates and info will show up here." },
  };

  const c = configs[filter] || configs.all;
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <p className="text-sm font-semibold text-foreground/80">{c.title}</p>
      <p className="mt-1 text-xs text-muted-foreground/60 max-w-[260px]">{c.desc}</p>
    </motion.div>
  );
}

export default function Notifications() {
  const authUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const { notifications, unreadCounts, isLoading, fetchNotifications, markAsRead, markAllAsRead, dismissNotification } = useNotificationStore();
  const [activeTab, setActiveTab] = useState("all");

  useBrowserNotification();

  useEffect(() => {
    if (authUser?.id && token) {
      fetchNotifications(token, authUser.id);
    }
  }, [authUser?.id, token, fetchNotifications]);

  const unreadCount = unreadCounts.notifications ?? notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "unread": return notifications.filter((n) => !n.isRead);
      case "achievements": return notifications.filter((n) => n.type === "achievement");
      case "reminders": return notifications.filter((n) => n.type === "reminder");
      case "warnings": return notifications.filter((n) => n.type === "warning");
      case "proactive": return notifications.filter((n) => n.isProactive);
      default: return notifications;
    }
  }, [notifications, activeTab]);

  const grouped = useMemo(() => groupByDate(filteredNotifications), [filteredNotifications]);

  const handleDismiss = useCallback((id: string) => {
    if (authUser?.id) dismissNotification(id, authUser.id);
  }, [authUser?.id, dismissNotification]);

  const handleMarkRead = useCallback((id: string) => {
    if (authUser?.id) markAsRead(id, authUser.id);
  }, [authUser?.id, markAsRead]);

  const handleMarkAllRead = useCallback(() => {
    if (authUser?.id) markAllAsRead(authUser.id);
  }, [authUser?.id, markAllAsRead]);

  const handleClearAll = useCallback(() => {
    if (authUser?.id) {
      notifications.forEach((n) => dismissNotification(n.id, authUser.id));
    }
  }, [authUser?.id, notifications, dismissNotification]);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Stay updated on your learning journey
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-red-500 gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear all</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 pt-0 pb-2">
            <TabsList className="w-full h-9 bg-muted/50 p-0.5">
                <TabsTrigger value="all" className="text-xs h-7 data-[state=active]:shadow-sm">
                  All {notifications.length > 0 && `(${notifications.length})`}
                </TabsTrigger>
                {unreadCount > 0 && (
                  <TabsTrigger value="unread" className="text-xs h-7 data-[state=active]:shadow-sm">
                    Unread ({unreadCount})
                  </TabsTrigger>
                )}
                <TabsTrigger value="achievements" className="text-xs h-7 data-[state=active]:shadow-sm">
                  🏆 Achievements
                </TabsTrigger>
                <TabsTrigger value="reminders" className="text-xs h-7 data-[state=active]:shadow-sm">
                  📚 Reminders
                </TabsTrigger>
                <TabsTrigger value="warnings" className="text-xs h-7 data-[state=active]:shadow-sm">
                  ⚠️ Warnings
                </TabsTrigger>
                <TabsTrigger value="proactive" className="text-xs h-7 data-[state=active]:shadow-sm">
                  ✨ AI Insights
                </TabsTrigger>
              </TabsList>
          </div>

          {["all", "unread", "achievements", "reminders", "warnings", "proactive"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0 px-6 pb-6">
              {isLoading ? (
                <div className="space-y-2 pt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex gap-3 rounded-xl border border-border/50 p-3.5">
                      <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-muted" />
                        <div className="h-3 w-full rounded bg-muted/70" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <EmptyState filter={tab} />
              ) : (
                <ScrollArea className="max-h-[560px] -mr-2 pr-2">
                  <AnimatePresence mode="popLayout">
                    {grouped.map((group) => (
                      <div key={group.label} className="mt-3 first:mt-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                            {group.label}
                          </span>
                          <div className="flex-1 h-px bg-border/30" />
                        </div>
                        <div className="space-y-2">
                          {group.items.map((notification) => (
                            <NotificationCard
                              key={notification.id}
                              notification={notification}
                              onDismiss={handleDismiss}
                              onMarkRead={handleMarkRead}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                </ScrollArea>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
