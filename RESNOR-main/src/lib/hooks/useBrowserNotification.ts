'use client'

import { useEffect, useRef } from 'react'
import { useNotificationStore } from '@/stores/notifications'

export function useBrowserNotification() {
  const lastCountRef = useRef(0)
  const notifications = useNotificationStore(s => s.notifications)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const currentCount = notifications.length

    if (currentCount > lastCountRef.current && lastCountRef.current > 0 && Notification.permission === 'granted') {
      const newNotifs = notifications.slice(lastCountRef.current)
      for (const n of newNotifs) {
        try {
          new Notification(n.title, {
            body: n.message,
            icon: '/favicon.ico',
          })
        } catch {
        }
      }
    }

    lastCountRef.current = currentCount
  }, [notifications])
}
