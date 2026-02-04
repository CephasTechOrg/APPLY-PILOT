'use client'

import React, { useState, memo } from 'react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import MobileSidebar from '@/components/layout/MobileSidebar'

interface AppShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  showSearch?: boolean
  showActions?: boolean
  primaryActionLabel?: string
  secondaryActionLabel?: string
  onPrimaryAction?: () => void
  primaryActionDisabled?: boolean
}

const AppShell = ({
  title,
  subtitle,
  children,
  showSearch = true,
  showActions = true,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled,
}: AppShellProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Header
          title={title}
          subtitle={subtitle}
          showSearch={showSearch}
          showActions={showActions}
          primaryActionLabel={primaryActionLabel}
          secondaryActionLabel={secondaryActionLabel}
          onPrimaryAction={onPrimaryAction}
          primaryActionDisabled={primaryActionDisabled}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        <div className="p-4 md:p-8 max-w-[1400px] w-full mx-auto flex flex-col gap-4 md:gap-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default memo(AppShell)
