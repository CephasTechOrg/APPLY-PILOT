import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  date_of_birth?: string
  email_verified: boolean
  created_at: string
}

interface AuthStore {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null

  setUser: (user: User | null) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
        })
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
      },

      isAuthenticated: () => {
        const { accessToken, user } = get()
        return !!accessToken && !!user && user.email_verified
      },
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') return null
          const value = localStorage.getItem(key)
          return value ? JSON.parse(value) : null
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') return
          localStorage.setItem(key, JSON.stringify(value))
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') return
          localStorage.removeItem(key)
        },
      },
    }
  )
)
