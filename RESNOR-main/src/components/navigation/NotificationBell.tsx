'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'
import { Trophy, ShieldAlert, BookOpen, Info, Bell, X, CheckCheck, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useBrowserNotification } from '@/lib/hooks/useBrowserNotification'

const TYPE_ICONS: Record<string, typeof Bell> = {
  achievement: Trophy,
  warning: ShieldAlert,
  reminder: BookOpen,
  info: Info,
}

const TYPE_COLORS: Record<string, string> = {
  achievement: 'text-amber-500 bg-amber-100 dark:bg-amber-950/40',
  warning: 'text-red-500 bg-red-100 dark:bg-red-950/40',
  reminder: 'text-teal-500 bg-teal-100 dark:bg-teal-950/40',
  info: 'text-slate-500 bg-slate-100 dark:bg-slate-800/40',
}

function formatTime(createdAt: string): string {
  const date = new Date(createdAt)
  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true })
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

export function NotificationBell() {
  const { setActivePage } = useAppStore()
  const authUser = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const { notifications, unreadCounts, fetchNotifications, markAsRead, markAllAsRead, dismissNotification, logInteraction, triggerProactive } = useNotificationStore()

  const unreadCount = unreadCounts.notifications ?? notifications.filter(n => !n.isRead).length

  useBrowserNotification()

  const proactiveTriggered = useRef(false)

  useEffect(() => {
    if (authUser?.id && token) {
      fetchNotifications(token, authUser.id)
      const interval = setInterval(() => fetchNotifications(token, authUser.id), 30000)
      return () => clearInterval(interval)
    }
  }, [authUser?.id, token, fetchNotifications])

  useEffect(() => {
    if (authUser?.id && !proactiveTriggered.current) {
      proactiveTriggered.current = true
      const timer = setTimeout(() => triggerProactive(authUser.id), 10000)
      return () => clearTimeout(timer)
    }
  }, [authUser?.id, triggerProactive])

  function handleMarkAllRead(e: React.MouseEvent) {
    e.stopPropagation()
    if (authUser?.id) markAllAsRead(authUser.id)
  }

  function handleMarkRead(id: string) {
    if (authUser?.id) markAsRead(id, authUser.id)
  }

  function handleDismiss(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (authUser?.id) dismissNotification(id, authUser.id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
        >
          <motion.div
            animate={unreadCount > 0 ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Bell className="w-4 h-4" />
          </motion.div>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-background"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
              <motion.span
                className="absolute inset-0 rounded-full bg-rose-500"
                animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              />
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-88 p-0" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-medium text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="flex justify-center mb-2">
                <Bell className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground/60">No notifications yet</p>
              <p className="text-[10px] text-muted-foreground/40 mt-0.5">Complete quizzes and activities to see them here</p>
            </div>
          ) : (
            notifications.slice(0, 10).map((notif) => {
              const Icon = TYPE_ICONS[notif.type] || Bell
              const colorClass = TYPE_COLORS[notif.type] || TYPE_COLORS.info

              return (
                <DropdownMenuItem
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 cursor-pointer group',
                    !notif.isRead && 'bg-emerald-500/[0.03]',
                    'border-b border-border/30 last:border-b-0',
                  )}
                  onClick={() => handleMarkRead(notif.id)}
                >
                  <div className={cn('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5', colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        'text-xs leading-snug flex items-center gap-1.5',
                        !notif.isRead ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground',
                      )}>
                        {notif.isProactive && <Sparkles className="size-3 text-amber-500 shrink-0" />}
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-2">{notif.message}</p>
                    <span className="text-[10px] text-muted-foreground/40 mt-1 block">{formatTime(notif.createdAt)}</span>
                  </div>
                  <button
                    className="shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity mt-1 p-0.5 rounded hover:bg-muted"
                    onClick={(e) => handleDismiss(e, notif.id)}
                  >
                    <X className="w-3 h-3 text-muted-foreground/40 hover:text-muted-foreground" />
                  </button>
                </DropdownMenuItem>
              )
            })
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center justify-center px-4 py-2.5 cursor-pointer text-emerald-600 dark:text-emerald-400 font-medium text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            setActivePage('notifications')
          }}
        >
          <Bell className="w-3.5 h-3.5 mr-2" />
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
