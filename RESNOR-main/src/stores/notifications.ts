import { create } from 'zustand'

export interface ApiNotification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  actionUrl: string | null
  source?: string
  isProactive?: boolean
  scheduledFor?: string | null
  priorityScore?: number
}

interface NotificationState {
  unreadCounts: Record<string, number>
  notifications: ApiNotification[]
  isLoading: boolean
  fetchNotifications: (token: string, studentId: string) => Promise<void>
  markAsRead: (id: string, studentId: string) => void
  markAllAsRead: (studentId: string) => void
  dismissNotification: (id: string, studentId: string) => void
  logInteraction: (notificationId: string, studentId: string, action: string) => void
  triggerProactive: (studentId: string) => Promise<number>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCounts: {},
  notifications: [],
  isLoading: true,

  fetchNotifications: async (token, studentId) => {
    try {
      const res = await fetch(`/api/notifications?student_id=${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      const notifs: ApiNotification[] = data.notifications || []

      const apiUnread = data.unreadCount ?? notifs.filter((n) => !n.isRead).length
      const counts: Record<string, number> = { notifications: apiUnread }

      set({ notifications: notifs, unreadCounts: counts, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  markAsRead: (id, studentId) => {
    const { notifications } = get()
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    )
    const unreadCount = updated.filter((n) => !n.isRead).length
    set({
      notifications: updated,
      unreadCounts: { ...get().unreadCounts, notifications: unreadCount },
    })

    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_ids: [id], student_id: studentId }),
    }).catch(() => {})

    get().logInteraction(id, studentId, 'opened')
  },

  markAllAsRead: (studentId) => {
    set({
      unreadCounts: {},
      notifications: get().notifications.map((n) => ({ ...n, isRead: true })),
    })

    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all: true, student_id: studentId }),
    }).catch(() => {})
  },

  dismissNotification: (id, studentId) => {
    set({ notifications: get().notifications.filter((n) => n.id !== id) })

    fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_id: id }),
    }).catch(() => {})

    get().logInteraction(id, studentId, 'dismissed')
  },

  logInteraction: (notificationId, studentId, action) => {
    fetch('/api/notifications/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId, studentId, action }),
    }).catch(() => {})
  },

  triggerProactive: async (studentId) => {
    try {
      const res = await fetch('/api/notifications/proactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const data = await res.json()
      return data.created || 0
    } catch {
      return 0
    }
  },
}))
