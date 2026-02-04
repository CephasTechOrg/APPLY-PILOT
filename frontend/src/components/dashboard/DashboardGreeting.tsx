'use client'

import React from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '@/store/authStore'

interface DashboardGreetingProps {
  lastUpdated?: Date | null
}

const DashboardGreeting: React.FC<DashboardGreetingProps> = ({ lastUpdated }) => {
  const user = useAuthStore((state) => state.user)
  const fullName = user?.full_name ?? 'there'
  const todayLabel = format(new Date(), 'EEEE, MMM d')
  const updatedLabel = lastUpdated
    ? `Updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}`
    : 'Updated just now'

  return (
    <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-text-secondary">Welcome back</p>
          <h2 className="text-2xl font-bold text-text-main dark:text-white">{fullName}</h2>
          <p className="text-xs text-text-secondary mt-1">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="material-symbols-outlined text-base">schedule</span>
          <span>{updatedLabel}</span>
        </div>
      </div>
    </section>
  )
}

export default DashboardGreeting
