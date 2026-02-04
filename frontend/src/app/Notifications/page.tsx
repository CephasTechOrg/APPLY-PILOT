'use client'

import React, { useMemo } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useNotifications } from '@/hooks/useNotifications'

const categoryStyles = {
  follow_up: { icon: 'notifications', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200' },
  interview: { icon: 'event', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200' },
  ai: { icon: 'auto_awesome', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200' },
  system: { icon: 'info', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200' },
  general: { icon: 'notifications', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200' },
}

const formatTimestamp = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

const NotificationsPage = () => {
  const { notifications, loading, error, markRead, markAllRead, remove } = useNotifications()

  const hasUnread = useMemo(() => notifications.some((note) => !note.is_read), [notifications])
  const unreadCount = useMemo(() => notifications.filter((note) => !note.is_read).length, [notifications])

  return (
    <AppShell title="Notifications" subtitle="Stay on top of follow ups" showSearch={false} showActions={false}>
      <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-text-main dark:text-white">Recent Updates</h3>
            <p className="text-xs text-text-secondary mt-1">
              {notifications.length} total · {unreadCount} unread
            </p>
          </div>
          <button
            className="text-sm font-semibold text-primary hover:underline disabled:opacity-60"
            onClick={markAllRead}
            disabled={!hasUnread || loading}
            type="button"
          >
            Mark all read
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500 mb-4">{error}</p>
        )}
        {loading && notifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-secondary">
            <span className="material-symbols-outlined animate-spin text-2xl">refresh</span>
            <p className="mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center text-text-secondary">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </div>
            <p className="text-sm font-medium">You are all caught up</p>
            <p className="text-xs mt-1">New updates will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((note) => {
              const style = categoryStyles[note.category] ?? categoryStyles.general
              return (
                <div
                  key={note.id}
                  className={`flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-xl border transition ${
                    note.is_read
                      ? 'border-gray-100 dark:border-gray-800'
                      : 'border-gray-300 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${style.color}`}>
                    <span className="material-symbols-outlined text-lg">{style.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        {!note.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                        <p className="text-sm font-semibold text-text-main dark:text-white truncate">{note.title}</p>
                      </div>
                      <span className="text-xs text-text-secondary whitespace-nowrap">
                        {formatTimestamp(note.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-2 leading-relaxed">{note.message}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {note.action_url && (
                        <a
                          href={note.action_url}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          View details
                        </a>
                      )}
                      {!note.is_read && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary hover:underline"
                          onClick={() => markRead(note.id)}
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-xs font-semibold text-text-secondary hover:text-text-main"
                        onClick={() => remove(note.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </AppShell>
  )
}

export default NotificationsPage

