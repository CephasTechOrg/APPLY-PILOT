export type NotificationCategory = 'follow_up' | 'interview' | 'ai' | 'system' | 'general'

export interface NotificationItem {
  id: number
  user_id: number
  title: string
  message: string
  category: NotificationCategory
  action_url?: string | null
  is_read: boolean
  read_at?: string | null
  created_at: string
}

export interface NotificationListResponse {
  items: NotificationItem[]
  total: number
}

export interface NotificationUnreadCount {
  unread_count: number
}
