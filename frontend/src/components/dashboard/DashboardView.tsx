'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import StatCard from '@/components/dashboard/StatCard'
import PipelineChart from '@/components/dashboard/PipelineChart'
import UpcomingFollowups from '@/components/dashboard/UpcomingFollowups'
import RecentActivity from '@/components/dashboard/RecentActivity'
import QuickActions from '@/components/dashboard/QuickActions'
import DashboardGreeting from '@/components/dashboard/DashboardGreeting'
import EmailList from '@/components/EmailList'
import EmailModal from '@/components/EmailModal'
import { dashboardService, DashboardStats } from '@/services/dashboardService'
import { EmailResponse } from '@/services/emailService'
import { format } from 'date-fns'

const initialDashboardData: DashboardStats = {
  stats: {
    applications_this_week: 0,
    interviews_scheduled: 0,
    offers_received: 0,
    ai_credits_left: 0,
    ai_daily_quota: 0,
  },
  pipeline: {
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  },
  upcoming_followups: [],
}

const DashboardView = () => {
  const [dashboardData, setDashboardData] = useState<DashboardStats>(initialDashboardData)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const data = await dashboardService.getStats()
      setDashboardData(data)
      setLastUpdated(new Date())
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load dashboard stats')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <>
      <DashboardGreeting lastUpdated={lastUpdated} />
      {errorMessage && (
        <div className="bg-red-50 text-red-600 border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{errorMessage}</span>
          <button
            className="text-sm font-semibold text-red-600 hover:underline"
            onClick={fetchStats}
            type="button"
          >
            Retry
          </button>
        </div>
      )}
      {isLoading && !errorMessage ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="skeleton h-3 w-24 mb-3 rounded" />
                  <div className="skeleton h-8 w-16 rounded" />
                </div>
                <div className="skeleton w-10 h-10 rounded-xl" />
              </div>
            </div>
          ))}
        </section>
      ) : (
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Applications this week"
          value={dashboardData.stats.applications_this_week}
          icon="send"
          iconColor="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Interviews Scheduled"
          value={dashboardData.stats.interviews_scheduled}
          icon="video_camera_front"
          iconColor="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          title="Offers Received"
          value={dashboardData.stats.offers_received}
          icon="verified"
          iconColor="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
        />

        <div className="bg-card-light dark:bg-card-dark p-5 rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-text-secondary text-sm font-medium">AI Credits Usage</p>
              <Link href="/Settings" className="text-xs font-semibold text-primary hover:underline">
                Manage
              </Link>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <h3 className="text-3xl font-bold text-text-main dark:text-white tracking-tight">
                {dashboardData.stats.ai_credits_left}
              </h3>
              <span className="text-sm text-text-secondary font-medium">
                / {Math.max(dashboardData.stats.ai_daily_quota || 0, 0)}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Used{' '}
              {Math.max(
                0,
                (dashboardData.stats.ai_daily_quota || 0) - dashboardData.stats.ai_credits_left
              )}{' '}
              today
            </p>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    (dashboardData.stats.ai_credits_left /
                      Math.max(dashboardData.stats.ai_daily_quota || 1, 1)) *
                      100
                  )
                )}%`,
              }}
            />
          </div>
        </div>
      </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-main dark:text-white">Application Pipeline</h3>
            <Link href="/Applications" className="text-sm text-primary font-semibold hover:underline">
              View all
            </Link>
          </div>
          <PipelineChart data={dashboardData.pipeline} />
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-main dark:text-white">Upcoming Follow-ups</h3>
          </div>
          <UpcomingFollowups
            items={dashboardData.upcoming_followups.map((item) => ({
              id: String(item.id),
              company: item.company,
              position: item.job_title,
              dueDate: item.follow_up_date ? formatFollowUpDate(item.follow_up_date) : 'Upcoming',
              status: item.status,
            }))}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-main dark:text-white">Recent Activity</h3>
          </div>
          <RecentActivity />
        </div>
        <QuickActions />
      </section>

      {/* Email Tracking Section */}
      <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">mail</span>
              Email Deadline Tracking
            </h3>
            <p className="text-sm text-text-secondary mt-1">Track email deadlines and get AI-powered alerts</p>
          </div>
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-sm flex items-center gap-2 transition"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Add Email
          </button>
        </div>
        <EmailList onAddClick={() => setIsEmailModalOpen(true)} />
      </section>

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <EmailModal
            onEmailSaved={(email: EmailResponse) => {
              setIsEmailModalOpen(false)
            }}
            onClose={() => setIsEmailModalOpen(false)}
          />
        </div>
      )}
    </>
  )
}

/**
 * Format follow-up date in a human-friendly way
 */
function formatFollowUpDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (targetDate.getTime() === today.getTime()) {
      return 'Today'
    }
    if (targetDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow'
    }

    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    if (diffDays > 0 && diffDays <= 7) {
      return `In ${diffDays} days`
    }

    return format(date, 'MMM d')
  } catch {
    return 'Upcoming'
  }
}

export default DashboardView
