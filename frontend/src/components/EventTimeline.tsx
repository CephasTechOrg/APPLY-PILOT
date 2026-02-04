'use client'

import { useState } from 'react'
import { ApplicationEventListItem, eventTypeInfo, eventsService } from '@/services/eventsService'

interface EventTimelineProps {
  events: ApplicationEventListItem[]
  applicationId: number
  onEventUpdated?: () => void
}

export default function EventTimeline({ events, applicationId, onEventUpdated }: EventTimelineProps) {
  const [markingComplete, setMarkingComplete] = useState<number | null>(null)

  const handleMarkComplete = async (eventId: number) => {
    setMarkingComplete(eventId)
    try {
      await eventsService.markActionComplete(applicationId, eventId)
      onEventUpdated?.()
    } catch (error) {
      console.error('Failed to mark action complete:', error)
    } finally {
      setMarkingComplete(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-10 text-text-secondary">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <span className="material-symbols-outlined text-xl">history</span>
        </div>
        <p className="text-sm font-medium">No events logged yet</p>
        <p className="text-xs mt-1">Paste an email to log your first event</p>
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, eventIdx) => {
          const info = eventTypeInfo[event.event_type] || eventTypeInfo.other
          const isLast = eventIdx === events.length - 1

          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {/* Timeline connector */}
                {!isLast && (
                  <span
                    className="absolute left-4 top-8 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex items-start gap-3">
                  {/* Event icon */}
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900 ${
                      event.source === 'email'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : event.source === 'system'
                        ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                    }`}
                  >
                    <span className="text-base">{info.icon}</span>
                  </div>

                  {/* Event content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <span className="font-medium text-text-main dark:text-white">{info.label}</span>
                      <span
                        className="inline-flex w-fit text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-text-secondary"
                      >
                        {event.source}
                      </span>
                      <span className="text-xs text-text-secondary sm:ml-auto">
                        {formatRelativeTime(event.changed_at)}
                      </span>
                    </div>

                    {/* Summary */}
                    {event.summary && (
                      <p className="mt-1 text-sm text-text-secondary leading-relaxed">{event.summary}</p>
                    )}

                    {/* Event date (if different from logged date) */}
                    {event.event_date && (
                      <p className="mt-1 text-xs text-text-secondary">
                        Event date: {formatDate(event.event_date)}
                      </p>
                    )}

                    {/* Action required badge */}
                    {event.action_required && !event.action_completed && (
                      <div className="mt-2 inline-flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                          Action Required
                        </span>
                        <button
                          onClick={() => handleMarkComplete(event.id)}
                          disabled={markingComplete === event.id}
                          className="text-xs text-primary hover:underline disabled:opacity-50"
                        >
                          {markingComplete === event.id ? 'Marking...' : 'Mark Complete'}
                        </button>
                      </div>
                    )}

                    {/* Action completed badge */}
                    {event.action_required && event.action_completed && (
                      <span className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                        Action Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
