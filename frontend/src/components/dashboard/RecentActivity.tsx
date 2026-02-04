'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { dashboardService, ActivityItem } from '@/services/dashboardService'
import { formatDistanceToNow } from 'date-fns'

const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await dashboardService.getRecentActivity(8)
      setActivities(data.activities)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="material-symbols-outlined animate-spin text-text-secondary">refresh</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={fetchActivity}
          className="mt-2 text-xs text-primary font-semibold hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
          <span className="material-symbols-outlined text-2xl text-text-secondary">history</span>
        </div>
        <p className="text-sm text-text-secondary font-medium">No recent activity</p>
        <p className="text-xs text-text-secondary mt-1">
          Start tracking applications to see your activity here
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {activities.map((activity) => {
        const secondaryLine = activity.job_title || (activity.type === 'ai' ? 'AI tool usage' : '')
        const content = (
          <div className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors cursor-pointer">
            <div className={`p-2 rounded-lg ${activity.icon_color}`}>
              <span className="material-symbols-outlined text-lg">{activity.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-main dark:text-white">
                <span className="font-medium">{activity.action}</span>{' '}
                {activity.company && <span className="font-semibold">{activity.company}</span>}
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-text-secondary truncate">
                  {secondaryLine || '—'}
                </p>
                <p className="text-xs text-text-secondary whitespace-nowrap">
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
            </div>
          </div>
        )

        if (activity.application_id) {
          return (
            <Link key={activity.id} href={`/Applications/${activity.application_id}`}>
              {content}
            </Link>
          )
        }

        return <div key={activity.id}>{content}</div>
      })}
    </div>
  )
}

export default RecentActivity
