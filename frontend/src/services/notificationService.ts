import api from './api'
import { NotificationListResponse, NotificationUnreadCount, NotificationItem, NotificationCategory } from '@/types/notification.types'

interface ListNotificationsParams {
  unreadOnly?: boolean
  limit?: number
  offset?: number
}

interface CreateNotificationPayload {
  title: string
  message: string
  category?: NotificationCategory
  action_url?: string | null
}

class NotificationService {
  async listNotifications(params: ListNotificationsParams = {}): Promise<NotificationListResponse> {
    const response = await api.get<NotificationListResponse>('/notifications', {
      params: {
        unread_only: params.unreadOnly ?? false,
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
      },
    })
    return response.data
  }

  async getUnreadCount(): Promise<NotificationUnreadCount> {
    const response = await api.get<NotificationUnreadCount>('/notifications/unread-count')
    return response.data
  }

  async markRead(id: number): Promise<NotificationItem> {
    const response = await api.patch<NotificationItem>(`/notifications/${id}/read`)
    return response.data
  }

  async markAllRead(): Promise<NotificationUnreadCount> {
    const response = await api.post<NotificationUnreadCount>('/notifications/read-all')
    return response.data
  }

  async deleteNotification(id: number): Promise<void> {
    await api.delete(`/notifications/${id}`)
  }

  async createNotification(payload: CreateNotificationPayload): Promise<NotificationItem> {
    const response = await api.post<NotificationItem>('/notifications', {
      title: payload.title,
      message: payload.message,
      category: payload.category ?? 'general',
      action_url: payload.action_url ?? null,
    })
    return response.data
  }
}

export const notificationService = new NotificationService()
