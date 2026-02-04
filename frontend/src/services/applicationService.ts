import api from './api'

export interface Resume {
  id: number
  title: string
  file_name: string
  is_primary: boolean
}

export interface Application {
  id: number
  user_id: number
  company: string
  job_title: string
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
  location?: string
  job_url?: string
  job_description?: string
  salary_range?: string
  notes?: string
  recruiter_name?: string
  recruiter_email?: string
  recruiter_phone?: string
  applied_at?: string
  interview_date?: string
  follow_up_date?: string
  resume_id?: number | null
  resume?: Resume | null
  created_at: string
  updated_at?: string
}

export interface ApplicationEvent {
  id: number
  application_id: number
  user_id: number
  old_status?: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | null
  new_status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
  changed_at: string
}

export interface CreateApplicationPayload {
  company: string
  job_title: string
  status?: string
  location?: string
  job_url?: string
  job_description?: string
  salary_range?: string
  notes?: string
  recruiter_name?: string
  recruiter_email?: string
  recruiter_phone?: string
  applied_at?: string
  interview_date?: string
  follow_up_date?: string
  resume_id?: number | null
}

export interface UpdateApplicationPayload {
  company?: string
  job_title?: string
  status?: string
  location?: string
  job_url?: string
  job_description?: string
  salary_range?: string
  notes?: string
  recruiter_name?: string
  recruiter_email?: string
  recruiter_phone?: string
  applied_at?: string
  interview_date?: string
  follow_up_date?: string
  resume_id?: number | null
}

class ApplicationService {
  private formatError(error: any, fallback: string): string {
    const detail = error?.response?.data?.detail
    if (typeof detail === 'string') {
      return detail
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === 'string') return item
          if (item?.msg) return item.msg
          return JSON.stringify(item)
        })
        .join(', ')
    }
    return fallback
  }

  async getApplications(status?: string, limit: number = 50, offset: number = 0): Promise<Application[]> {
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())

      const response = await api.get<Application[]>(`/applications?${params.toString()}`)
      return response.data
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Failed to fetch applications'))
    }
  }

  async getApplication(id: number): Promise<Application> {
    try {
      const response = await api.get<Application>(`/applications/${id}`)
      return response.data
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Failed to fetch application'))
    }
  }

  async createApplication(data: CreateApplicationPayload): Promise<Application> {
    try {
      const response = await api.post<Application>('/applications', data)
      return response.data
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Failed to create application'))
    }
  }

  async updateApplication(id: number, data: UpdateApplicationPayload): Promise<Application> {
    try {
      const response = await api.patch<Application>(`/applications/${id}`, data)
      return response.data
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Failed to update application'))
    }
  }

  async deleteApplication(id: number): Promise<void> {
    try {
      await api.delete(`/applications/${id}`)
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Failed to delete application'))
    }
  }

  async getApplicationEvents(id: number): Promise<ApplicationEvent[]> {
    try {
      const response = await api.get<ApplicationEvent[]>(`/applications/${id}/events`)
      return response.data
    } catch (error: any) {
      throw new Error(this.formatError(error, 'Failed to fetch application events'))
    }
  }
}

export const applicationService = new ApplicationService()
