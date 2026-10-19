import { apiRequest } from './client'

const base = '/api/v1/notifications'

export const fetchNotifications = async (limit = 40) => {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  const query = params.toString()
  return apiRequest(`${base}${query ? `?${query}` : ''}`)
}

export const upsertNotification = async (payload) =>
  apiRequest(`${base}/upsert`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const markNotificationRead = async (eventKey) =>
  apiRequest(`${base}/read`, {
    method: 'POST',
    body: JSON.stringify({ eventKey }),
  })

export const markAllNotificationsRead = async () =>
  apiRequest(`${base}/read-all`, { method: 'POST', body: '{}' })

export const dismissNotification = async (eventKey) =>
  apiRequest(`${base}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({ eventKey }),
  })

export const dismissAllNotifications = async () =>
  apiRequest(`${base}/dismiss-all`, { method: 'POST', body: '{}' })
