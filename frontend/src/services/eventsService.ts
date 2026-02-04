/**
 * Application Events Service
 * 
 * Handles AI-powered email parsing and event management for applications.
 */

import api from './api'

// ============================================
// Types
// ============================================

export type EventType = 
  | 'status_change'
  | 'confirmation'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'assessment'
  | 'offer'
  | 'rejection'
  | 'request'
  | 'follow_up'
  | 'other'

export type EventSource = 'email' | 'manual' | 'system'

export interface ExtractedDate {
  date: string
  description: string
  is_deadline: boolean
}

export interface AISuggestions {
  suggested_event_type: EventType
  suggested_status: string | null
  confidence: number
  extracted_dates: ExtractedDate[]
  key_details: string[]
  next_steps: string[]
  action_required: boolean
  action_description: string | null
  action_deadline: string | null
}

export interface EmailParseRequest {
  email_content: string
  additional_context?: string
}

export interface EmailParseResponse {
  success: boolean
  summary: string
  suggestions: AISuggestions
  raw_content: string
}

export interface ApplicationEvent {
  id: number
  application_id: number
  event_type: EventType
  source: EventSource
  summary: string | null
  raw_content: string | null
  old_status: string | null
  new_status: string | null
  action_required: boolean
  action_description: string | null
  action_deadline: string | null
  action_completed: boolean
  ai_suggestions: AISuggestions | null
  event_date: string | null
  changed_at: string
}

export interface ApplicationEventListItem {
  id: number
  application_id: number
  event_type: EventType
  source: EventSource
  summary: string | null
  action_required: boolean
  action_completed: boolean
  event_date: string | null
  changed_at: string
}

export interface CreateEventData {
  event_type: EventType
  source?: EventSource
  summary?: string
  raw_content?: string
  event_date?: string
  action_required?: boolean
  action_description?: string
  action_deadline?: string
  old_status?: string
  new_status?: string
  ai_suggestions?: Record<string, unknown>
}

export interface CreateEventFromEmailData {
  email_content: string
  event_type?: EventType
  summary?: string
  event_date?: string
  action_required?: boolean
  action_description?: string
  action_deadline?: string
  update_status?: boolean
  new_status?: string
}

export interface UpdateEventData {
  event_type?: EventType
  summary?: string
  event_date?: string
  action_required?: boolean
  action_description?: string
  action_deadline?: string
  action_completed?: boolean
}

// ============================================
// Event Type Display Info
// ============================================

export const eventTypeInfo: Record<EventType, { label: string; icon: string; color: string }> = {
  status_change: { label: 'Status Change', icon: '🔄', color: 'gray' },
  confirmation: { label: 'Application Received', icon: '✅', color: 'green' },
  interview_scheduled: { label: 'Interview Scheduled', icon: '📅', color: 'blue' },
  interview_completed: { label: 'Interview Completed', icon: '🎤', color: 'purple' },
  assessment: { label: 'Assessment', icon: '📝', color: 'orange' },
  offer: { label: 'Job Offer', icon: '🎉', color: 'emerald' },
  rejection: { label: 'Rejection', icon: '❌', color: 'red' },
  request: { label: 'Request for Info', icon: '📨', color: 'yellow' },
  follow_up: { label: 'Follow Up', icon: '📤', color: 'indigo' },
  other: { label: 'Other', icon: '📌', color: 'gray' },
}

// ============================================
// Service Class
// ============================================

class EventsService {
  /**
   * Parse email content using AI to extract event information
   */
  async parseEmail(applicationId: number, data: EmailParseRequest): Promise<EmailParseResponse> {
    const response = await api.post<EmailParseResponse>(
      `/applications/${applicationId}/events/parse-email`,
      data
    )
    return response.data
  }

  /**
   * Create a new event manually
   */
  async createEvent(applicationId: number, data: CreateEventData): Promise<ApplicationEvent> {
    const response = await api.post<ApplicationEvent>(
      `/applications/${applicationId}/events`,
      data
    )
    return response.data
  }

  /**
   * Create an event from email content with AI parsing
   */
  async createEventFromEmail(
    applicationId: number, 
    data: CreateEventFromEmailData
  ): Promise<ApplicationEvent> {
    const response = await api.post<ApplicationEvent>(
      `/applications/${applicationId}/events/from-email`,
      data
    )
    return response.data
  }

  /**
   * List all events for an application
   */
  async listEvents(applicationId: number): Promise<ApplicationEventListItem[]> {
    const response = await api.get<ApplicationEventListItem[]>(
      `/applications/${applicationId}/events`
    )
    return response.data
  }

  /**
   * Get a specific event
   */
  async getEvent(applicationId: number, eventId: number): Promise<ApplicationEvent> {
    const response = await api.get<ApplicationEvent>(
      `/applications/${applicationId}/events/${eventId}`
    )
    return response.data
  }

  /**
   * Update an event
   */
  async updateEvent(
    applicationId: number, 
    eventId: number, 
    data: UpdateEventData
  ): Promise<ApplicationEvent> {
    const response = await api.patch<ApplicationEvent>(
      `/applications/${applicationId}/events/${eventId}`,
      data
    )
    return response.data
  }

  /**
   * Delete an event
   */
  async deleteEvent(applicationId: number, eventId: number): Promise<void> {
    await api.delete(`/applications/${applicationId}/events/${eventId}`)
  }

  /**
   * Mark an event's action as complete
   */
  async markActionComplete(applicationId: number, eventId: number): Promise<ApplicationEvent> {
    const response = await api.post<ApplicationEvent>(
      `/applications/${applicationId}/events/${eventId}/complete`
    )
    return response.data
  }
}

export const eventsService = new EventsService()
export default eventsService
