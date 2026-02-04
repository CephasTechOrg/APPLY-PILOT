'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'

interface HeaderProps {
  title?: string
  subtitle?: string
  showSearch?: boolean
  showActions?: boolean
  primaryActionLabel?: string
  secondaryActionLabel?: string
  onPrimaryAction?: () => void
  primaryActionDisabled?: boolean
  showLogout?: boolean
  onMenuClick?: () => void
}

const Header = ({
  title = 'Dashboard',
  subtitle = 'Overview & follow-ups',
  showSearch = true,
  showActions = true,
  primaryActionLabel = 'New Application',
  secondaryActionLabel = 'This week',
  onPrimaryAction,
  primaryActionDisabled = false,
  showLogout = true,
  onMenuClick,
}: HeaderProps) => {
  const router = useRouter()

  const handleLogout = () => {
    authService.logout()
    router.replace('/Login')
  }

  return (
    <header className="h-16 md:h-20 bg-card-light dark:bg-card-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-text-main dark:text-white">menu</span>
        </button>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-text-main dark:text-white">{title}</h2>
          <p className="text-sm text-text-secondary hidden sm:block">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-1 justify-end">
        {/* Search */}
        {showSearch && (
          <div className="relative hidden md:block w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
            <input
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 dark:text-white transition-shadow placeholder:text-gray-400"
              placeholder="Search jobs, companies..."
              type="text"
            />
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {showActions && (
            <>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                <span>{secondaryActionLabel}</span>
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={onPrimaryAction}
                disabled={primaryActionDisabled}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span className="hidden sm:inline">{primaryActionLabel}</span>
              </button>
            </>
          )}
          {showLogout && (
            <button
              className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-text-secondary hover:text-text-main hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={handleLogout}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
