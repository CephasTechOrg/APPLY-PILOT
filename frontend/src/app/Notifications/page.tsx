'use client'

import React, { useMemo } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useNotifications } from '@/hooks/useNotifications'

const categoryStyles = {
  follow_up: { icon: 'notifications', color: 'bg-blue-50 text-blue-600' },
  interview: { icon: 'event', color: 'bg-purple-50 text-purple-600' },
  ai: { icon: 'auto_awesome', color: 'bg-primary/10 text-primary' },
  system: { icon: 'info', color: 'bg-gray-100 text-gray-600' },
  general: { icon: 'notifications', color: 'bg-gray-100 text-gray-600' },
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

  return (
    <AppShell title="Notifications" subtitle="Stay on top of follow ups" showSearch={false} showActions={false}>
      <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-text-main dark:text-white">Recent Updates</h3>
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
          <p className="text-sm text-text-secondary">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-text-secondary">You are all caught up.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((note) => {
              const style = categoryStyles[note.category] ?? categoryStyles.general
              return (
                <div
                  key={note.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border ${
                    note.is_read ? 'border-gray-100 dark:border-gray-800' : 'border-primary/30 bg-primary/5'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${style.color}`}>
                    <span className="material-symbols-outlined text-lg">{style.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-text-main dark:text-white">{note.title}</p>
                      <span className="text-xs text-text-secondary">{formatTimestamp(note.created_at)}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{note.message}</p>
                    <div className="flex items-center gap-3 mt-3">
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

