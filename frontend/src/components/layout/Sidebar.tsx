'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import ImageViewer from '@/components/ui/ImageViewer'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { authService } from '@/services/authService'
import { profileService } from '@/services/profileService'
import { notificationService } from '@/services/notificationService'

const Sidebar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const avatarUrl = useProfileStore((state) => state.profile.avatar_url)
  const setProfile = useProfileStore((state) => state.setProfile)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState<number | null>(null)

  useEffect(() => {
    if (!accessToken || !user?.email_verified || avatarUrl) return

    let active = true
    const timer = setTimeout(() => {
      profileService
        .getProfile()
        .then((profile) => {
          if (active) {
            setProfile(profile)
          }
        })
        .catch(() => {
          // Ignore profile load errors in navigation UI.
        })
    }, 100)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [accessToken, user?.email_verified, avatarUrl, setProfile])

  useEffect(() => {
    if (!accessToken || !user?.email_verified) return
    let active = true
    const timer = setTimeout(() => {
      notificationService
        .getUnreadCount()
        .then((data) => {
          if (active) {
            setUnreadCount(data.unread_count)
          }
        })
        .catch(() => {
          // Ignore badge load errors.
        })
    }, 200)
    
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [accessToken, user?.email_verified])

  const navItems = [
    { href: '/Dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/Applications', label: 'Applications', icon: 'work' },
    { href: '/Resumes', label: 'Resumes', icon: 'description' },
    { href: '/CoverLetters', label: 'Cover Letters', icon: 'mail' },
    { href: '/AITools', label: 'AI Tools', icon: 'smart_toy' },
    {
      href: '/Notifications',
      label: 'Notifications',
      icon: 'notifications',
      badge: unreadCount && unreadCount > 0 ? String(unreadCount) : undefined,
    },
    { href: '/Settings', label: 'Settings', icon: 'settings' },
  ]

  const isActive = (href: string) => {
    if (href === '/Dashboard') {
      return pathname === '/Dashboard'
    }
    return pathname?.startsWith(href)
  }

  const handleLogout = () => {
    authService.logout()
    router.replace('/Login')
  }

  return (
    <aside className="w-64 bg-card-light dark:bg-card-dark border-r border-gray-100 dark:border-gray-800 flex flex-col justify-between p-6 flex-shrink-0 h-screen sticky top-0">
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-text-main dark:text-white text-lg font-bold leading-none tracking-tight">ApplyPilot</h1>
            <p className="text-text-secondary text-xs font-medium">AI Career Copilot</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={
                  active
                    ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 text-primary group'
                    : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-text-main transition-colors group'
                }
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className={`material-symbols-outlined ${active ? 'fill' : ''}`}>{item.icon}</span>
                  <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
      
      {/* Upgrade & Profile */}
      <div className="flex flex-col gap-4">
        {/* Upgrade Card */}
        <div className="bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden group cursor-pointer">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all"></div>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-sm font-bold">Pro Plan</span>
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md">Upgrade</span>
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Credits</span>
              <span>420 left</span>
            </div>
            <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[42%] rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* User Profile */}
        <Link
          className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          href="/Profile"
          aria-label="Open profile"
        >
          <div
            onClick={(e) => {
              e.preventDefault()
              avatarUrl && setIsImageViewerOpen(true)
            }}
            className="size-9 rounded-full bg-gray-200 bg-cover bg-center border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            style={avatarUrl ? { backgroundImage: `url("${encodeURI(avatarUrl)}")` } : undefined}
          >
            {!avatarUrl && (
              <span className="material-symbols-outlined text-[18px] text-gray-500">person</span>
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <h4 className="text-sm font-bold truncate dark:text-white">{user?.full_name ?? 'Guest User'}</h4>
            <p className="text-xs text-text-secondary truncate">{user?.email ?? 'guest@applypilot.com'}</p>
          </div>
          <span className="ml-auto material-symbols-outlined text-xl text-text-secondary">chevron_right</span>
        </Link>
        <button
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-text-secondary hover:text-text-main hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={handleLogout}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Logout
        </button>
      </div>
      <ImageViewer
        isOpen={isImageViewerOpen}
        imageUrl={avatarUrl || ''}
        alt={`${user?.full_name ?? 'User'} avatar`}
        onClose={() => setIsImageViewerOpen(false)}
      />
    </aside>
  )
}

export default Sidebar
