import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: 'student' | 'teacher'
  avatar: string | null
  studentId: string | null
  institution: string | null
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: AuthUser, token: string) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('resnor_token', token)
      localStorage.setItem('resnor_user', JSON.stringify(user))
    }
    set({ user, token, isAuthenticated: true, isLoading: false })
  },

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('resnor_token')
      localStorage.removeItem('resnor_user')
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false })
  },

  hydrate: async () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false })
      return
    }
    const token = localStorage.getItem('resnor_token')
    const userJson = localStorage.getItem('resnor_user')
    if (token && userJson) {
      try {
        const user: AuthUser = JSON.parse(userJson)
        // Verify session with server
        const res = await fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          set({ user, token, isAuthenticated: true, isLoading: false })
        } else {
          localStorage.removeItem('resnor_token')
          localStorage.removeItem('resnor_user')
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        }
      } catch {
        // Network error - still allow offline access
        const user: AuthUser = JSON.parse(userJson)
        set({ user, token, isAuthenticated: true, isLoading: false })
      }
    } else {
      set({ isLoading: false })
    }
  },
}))
