'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const MobileSidebar = ({ isOpen, onClose }: MobileSidebarProps) => {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)

  // Close on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const navItems = [
    { href: '/Dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/Applications', label: 'Applications', icon: 'work' },
    { href: '/Resumes', label: 'Resumes', icon: 'description' },
    { href: '/CoverLetters', label: 'Cover Letters', icon: 'mail' },
    { href: '/AITools', label: 'AI Tools', icon: 'smart_toy' },
    { href: '/Notifications', label: 'Notifications', icon: 'notifications' },
    { href: '/Settings', label: 'Settings', icon: 'settings' },
  ]

  const isActive = (href: string) => {
    if (href === '/Dashboard') {
      return pathname === '/Dashboard'
    }
    return pathname?.startsWith(href)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-card-light dark:bg-card-dark z-50 lg:hidden transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-text-main dark:text-white text-lg font-bold leading-none">ApplyPilot</h1>
                <p className="text-text-secondary text-xs font-medium">AI Career Copilot</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-text-secondary">close</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? 'flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary'
                      : 'flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-text-main transition-colors'
                  }
                >
                  <span className={`material-symbols-outlined ${active ? 'fill' : ''}`}>{item.icon}</span>
                  <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <Link
              href="/Profile"
              className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-500">person</span>
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-text-main dark:text-white truncate">
                  {user?.full_name ?? 'Guest User'}
                </span>
                <span className="text-xs text-text-secondary truncate">
                  {user?.email ?? 'guest@applypilot.com'}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}

export default MobileSidebar
