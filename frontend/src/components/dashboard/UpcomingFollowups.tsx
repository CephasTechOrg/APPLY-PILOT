import React from 'react'
import Link from 'next/link'

interface FollowUp {
  id: string
  company: string
  position: string
  dueDate: string
  status?: string
}

interface UpcomingFollowupsProps {
  items?: FollowUp[]
}

const UpcomingFollowups: React.FC<UpcomingFollowupsProps> = ({ items = [] }) => {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'applied':
        return 'mail'
      case 'interview':
        return 'event'
      case 'offer':
        return 'verified'
      case 'rejected':
        return 'close'
      default:
        return 'schedule'
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'saved':
        return 'Saved'
      case 'applied':
        return 'Applied'
      case 'interview':
        return 'Interview'
      case 'offer':
        return 'Offer'
      case 'rejected':
        return 'Rejected'
      default:
        return 'Follow-up'
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'applied':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      case 'interview':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
      case 'offer':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'rejected':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800'
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
          <span className="material-symbols-outlined text-2xl text-text-secondary">event_available</span>
        </div>
        <p className="text-sm text-text-secondary font-medium">No upcoming follow-ups</p>
        <p className="text-xs text-text-secondary mt-1">
          Add follow-up dates to your applications to see them here
        </p>
        <Link href="/Applications" className="mt-3 text-xs font-semibold text-primary hover:underline">
          Go to applications
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 flex-1">
      {items.map((followup) => (
        <Link
          key={followup.id}
          href={`/Applications/${followup.id}`}
          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <span className="material-symbols-outlined text-lg">{getStatusIcon(followup.status)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-main dark:text-white truncate">{followup.company}</p>
            <p className="text-xs text-text-secondary truncate">{followup.position}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${getStatusBadge(
                followup.status
              )}`}
            >
              {getStatusLabel(followup.status)}
            </span>
            <span className="text-xs font-medium text-text-secondary whitespace-nowrap">{followup.dueDate}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default UpcomingFollowups
