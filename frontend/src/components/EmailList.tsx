'use client'

import { useEffect, useState } from 'react'
import { emailService, EmailItem, UpcomingDeadline } from '@/services/emailService'

interface EmailListProps {
  onAddClick?: () => void
}

export default function EmailList({ onAddClick }: EmailListProps) {
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEmails()
    fetchDeadlines()
  }, [])

  const fetchEmails = async () => {
    try {
      const data = await emailService.listEmails(5, 0)
      setEmails(data.emails)
    } catch (err) {
      console.error('Failed to fetch emails:', err)
    }
  }

  const fetchDeadlines = async () => {
    try {
      const data = await emailService.getUpcomingDeadlines(30)
      setUpcomingDeadlines(data.deadlines.slice(0, 3)) // Show top 3
    } catch (err) {
      console.error('Failed to fetch deadlines:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (emailId: number) => {
    try {
      await emailService.deleteEmail(emailId)
      setEmails(emails.filter(e => e.id !== emailId))
    } catch (err) {
      setError('Failed to delete email')
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const getConfidenceColor = (confidence: string | null) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
      case 'low':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl flex items-start gap-2">
          <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
          {error}
        </div>
      )}

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl">
          <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">schedule</span>
            Upcoming Deadlines
          </h3>
          <div className="space-y-2">
            {upcomingDeadlines.map((deadline, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${deadline.is_critical ? 'bg-red-600' : 'bg-orange-600'}`} />
                  <span className="text-orange-900 dark:text-orange-300 font-medium">
                    {deadline.description}
                  </span>
                  {deadline.source_company && (
                    <span className="text-orange-700 dark:text-orange-400 text-xs">
                      ({deadline.source_company})
                    </span>
                  )}
                </div>
                <span className="text-orange-800 dark:text-orange-300 font-semibold">
                  {deadline.days_until === 0 ? 'Today' : `${deadline.days_until}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Emails */}
      {emails.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Emails</h3>
          <div className="space-y-2">
            {emails.map((email) => (
              <div
                key={email.id}
                className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg flex items-start justify-between group hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {email.parsed_summary || 'Parsed email'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>{formatDate(email.created_at)}</span>
                    {email.source_company && (
                      <>
                        <span>•</span>
                        <span>{email.source_company}</span>
                      </>
                    )}
                  </div>
                </div>
                {email.ai_confidence && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded ml-2 flex-shrink-0 ${getConfidenceColor(email.ai_confidence)}`}>
                    {email.ai_confidence}
                  </span>
                )}
                <button
                  onClick={() => handleDelete(email.id)}
                  className="ml-2 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-700 block mb-2">
            mail_outline
          </span>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">No emails tracked yet</p>
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
            >
              Add first email →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
