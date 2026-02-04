'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { profileService } from '@/services/profileService'

interface AuthGateProps {
  children: React.ReactNode
}

const AuthGate = ({ children }: AuthGateProps) => {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const setUser = useAuthStore((state) => state.setUser)
  const setTokens = useAuthStore((state) => state.setTokens)
  const setProfile = useProfileStore((state) => state.setProfile)
  const hasFetchedProfile = useRef(false)

  useEffect(() => {
    if (accessToken && user?.email_verified) {
      setReady(true)
      return
    }

    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { state?: { user?: any; accessToken?: string; refreshToken?: string } }
        if (parsed?.state?.accessToken && parsed?.state?.user?.email_verified) {
          setUser(parsed.state.user)
          if (parsed.state.refreshToken) {
            setTokens(parsed.state.accessToken, parsed.state.refreshToken)
          }
          setReady(true)
          return
        }
      } catch {
        // ignore invalid storage
      }
    }

    const timer = setTimeout(() => router.replace('/Login'), 100)
    return () => clearTimeout(timer)
  }, [accessToken, user?.email_verified, router, setTokens, setUser])

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      if (!accessToken || !user?.email_verified || hasFetchedProfile.current) {
        return
      }

      hasFetchedProfile.current = true
      
      // Delay profile fetch to not block initial render
      await new Promise(resolve => setTimeout(resolve, 50))
      
      try {
        const profile = await profileService.getProfile()
        if (active) {
          setProfile(profile)
        }
      } catch {
        // Ignore profile load errors to avoid blocking navigation.
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [accessToken, user?.email_verified, setProfile])

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-text-secondary">
        <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
        Checking session...
      </div>
    )
  }

  return <>{children}</>
}

export default AuthGate
