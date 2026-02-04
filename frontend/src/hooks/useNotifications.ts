'use client'

import { useCallback, useEffect, useState } from 'react'
import { notificationService } from '@/services/notificationService'
import { NotificationItem } from '@/types/notification.types'
import { useAuthStore } from '@/store/authStore'

interface UseNotificationsState {
	notifications: NotificationItem[]
	total: number
	loading: boolean
	error: string | null
	refresh: () => Promise<void>
	markRead: (id: number) => Promise<void>
	markAllRead: () => Promise<void>
	remove: (id: number) => Promise<void>
}

export const useNotifications = (): UseNotificationsState => {
	const accessToken = useAuthStore((state) => state.accessToken)
	const [notifications, setNotifications] = useState<NotificationItem[]>([])
	const [total, setTotal] = useState(0)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const refresh = useCallback(async () => {
		if (!accessToken) return
		setLoading(true)
		setError(null)
		try {
			const data = await notificationService.listNotifications()
			setNotifications(data.items)
			setTotal(data.total)
		} catch (err: any) {
			setError(err?.message ?? 'Unable to load notifications')
		} finally {
			setLoading(false)
		}
	}, [accessToken])

	const markRead = useCallback(async (id: number) => {
		if (!accessToken) return
		const updated = await notificationService.markRead(id)
		setNotifications((prev) => prev.map((item) => (item.id === id ? updated : item)))
	}, [accessToken])

	const markAllRead = useCallback(async () => {
		if (!accessToken) return
		await notificationService.markAllRead()
		setNotifications((prev) =>
			prev.map((item) => ({
				...item,
				is_read: true,
				read_at: item.read_at ?? new Date().toISOString(),
			}))
		)
	}, [accessToken])

	const remove = useCallback(async (id: number) => {
		if (!accessToken) return
		await notificationService.deleteNotification(id)
		setNotifications((prev) => prev.filter((item) => item.id !== id))
		setTotal((prev) => Math.max(0, prev - 1))
	}, [accessToken])

	useEffect(() => {
		refresh()
	}, [refresh])

	return { notifications, total, loading, error, refresh, markRead, markAllRead, remove }
}
