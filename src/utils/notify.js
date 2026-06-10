import { notifications } from '@/stores/notifications'

export function notify({ title, message, type = 'success', duration }) {
  return notifications.enqueue({ title, message, type, duration })
}

export function notifySuccess(title, message, duration) {
  return notify({ title, message, type: 'success', duration })
}

export function notifyError(title, message, duration) {
  return notify({ title, message, type: 'error', duration })
}
