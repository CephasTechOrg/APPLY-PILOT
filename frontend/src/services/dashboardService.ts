import api from './api'

export interface DashboardStats {
  stats: {
    applications_this_week: number
    interviews_scheduled: number
    offers_received: number
    ai_credits_left: number
    ai_daily_quota: number
  }
  pipeline: {
    saved: number
    applied: number
    interview: number
    offer: number
    rejected: number
  }
  upcoming_followups: Array<{
    id: number
    company: string
    job_title: string
    follow_up_date: string | null
    status: string
  }>
}

export interface ActivityItem {
  id: string
  type: 'application' | 'ai'
  action: string
  company: string
  job_title: string
  timestamp: string
  icon: string
  icon_color: string
  application_id: number | null
}

export interface RecentActivityResponse {
  activities: ActivityItem[]
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<DashboardStats>('/dashboard/stats')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to fetch dashboard stats'
      throw new Error(message)
    }
  }

  async getRecentActivity(limit: number = 10): Promise<RecentActivityResponse> {
    try {
      const response = await api.get<RecentActivityResponse>('/dashboard/recent-activity', {
        params: { limit },
      })
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to fetch recent activity'
      throw new Error(message)
    }
  }
}

export const dashboardService = new DashboardService()
