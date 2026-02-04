/**
 * Email Service
 * 
 * Handles API calls for email storage and deadline tracking.
 */

import api from './api'

// ============================================
// Types
// ============================================

export interface ExtractedDeadline {
  date: string
  description: string
  is_critical: boolean
}

export interface EmailItem {
  id: number
  parsed_summary: string | null
  source_company: string | null
  key_deadlines: ExtractedDeadline[] | null
  ai_confidence: string | null
  created_at: string
}

export interface EmailResponse {
  id: number
  user_id: number
  email_content: string
  parsed_summary: string | null
  key_deadlines: ExtractedDeadline[] | null
  extracted_dates: ExtractedDeadline[] | null
  key_details: string[] | null
  ai_confidence: string | null
  source_company: string | null
  created_at: string
  updated_at: string
}

export interface EmailListResponse {
  total: number
  emails: EmailItem[]
}

export interface UpcomingDeadline {
  email_id: number
  deadline: string
  description: string
  is_critical: boolean
  days_until: number
  source_company: string | null
}

export interface UpcomingDeadlinesResponse {
  total: number
  deadlines: UpcomingDeadline[]
}

// ============================================
// Service Class
// ============================================

class EmailService {
  /**
   * Create a new email entry from raw email content
   */
  async createEmail(emailContent: string): Promise<EmailResponse> {
    const response = await api.post<EmailResponse>('/emails', {
      email_content: emailContent,
    })
    return response.data
  }

  /**
   * List user's emails with pagination
   */
  async listEmails(limit: number = 50, offset: number = 0): Promise<EmailListResponse> {
    const response = await api.get<EmailListResponse>('/emails', {
      params: {
        limit,
        offset,
      },
    })
    return response.data
  }

  /**
   * Get a single email by ID
   */
  async getEmail(emailId: number): Promise<EmailResponse> {
    const response = await api.get<EmailResponse>(`/emails/${emailId}`)
    return response.data
  }

  /**
   * Delete an email entry
   */
  async deleteEmail(emailId: number): Promise<void> {
    await api.delete(`/emails/${emailId}`)
  }

  /**
   * Get upcoming deadlines from all emails
   */
  async getUpcomingDeadlines(daysAhead: number = 30): Promise<UpcomingDeadlinesResponse> {
    const response = await api.get<UpcomingDeadlinesResponse>('/emails/deadlines/upcoming', {
      params: {
        days_ahead: daysAhead,
      },
    })
    return response.data
  }
}

export const emailService = new EmailService()
