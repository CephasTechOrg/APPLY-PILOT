import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProfileData {
  id?: number
  user_id?: number
  created_at?: string
  updated_at?: string
  avatar_url: string
  headline: string
  phone: string
  location: string
  time_zone: string
  current_title: string
  current_company: string
  experience_level: string
  preferred_role: string
  portfolio_url: string
  linkedin_url: string
  github_url: string
  skills: string
  bio: string
  open_to_work: boolean
  education_level: string
  school: string
  graduation_year: string | number
  certifications: string
  work_authorization: string
  visa_sponsorship_required: boolean
  years_experience: string | number
  industry: string
  languages: string
  relocation_open: boolean
  remote_preference: string
  salary_expectation: string
  notice_period: string
}

interface ProfileStore {
  profile: ProfileData
  loaded: boolean
  setProfile: (profile: ProfileData) => void
  updateProfile: (updates: Partial<ProfileData>) => void
  resetProfile: () => void
  setLoaded: (loaded: boolean) => void
}

const defaultProfile: ProfileData = {
  avatar_url: '',
  headline: '',
  phone: '',
  location: '',
  time_zone: '',
  current_title: '',
  current_company: '',
  experience_level: '',
  preferred_role: '',
  portfolio_url: '',
  linkedin_url: '',
  github_url: '',
  skills: '',
  bio: '',
  open_to_work: true,
  education_level: '',
  school: '',
  graduation_year: '',
  certifications: '',
  work_authorization: '',
  visa_sponsorship_required: false,
  years_experience: '',
  industry: '',
  languages: '',
  relocation_open: false,
  remote_preference: '',
  salary_expectation: '',
  notice_period: '',
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      loaded: false,
      setProfile: (profile) => set({ profile, loaded: true }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),
      resetProfile: () => set({ profile: defaultProfile, loaded: false }),
      setLoaded: (loaded) => set({ loaded }),
    }),
    {
      name: 'profile-storage',
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
