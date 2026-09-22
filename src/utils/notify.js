import { notifications } from '@/stores/notifications'

export function notify({ title, message, type = 'success', duration, details }) {
  return notifications.enqueue({ title, message, type, duration, details })
}

export function notifySuccess(title, message, duration) {
  return notify({ title, message, type: 'success', duration })
}

export function notifyError(title, message, duration, details) {
  const text = String(message ?? '').trim()
  const resolvedDuration =
    duration != null
      ? duration
      : text.length > 160 || (details && Object.keys(details).length)
        ? Math.min(24000, 9000 + Math.floor(text.length / 2))
        : undefined
  return notify({ title, message, type: 'error', duration: resolvedDuration, details })
}

export function notifyWarning(title, message, duration) {
  return notify({ title, message, type: 'warning', duration })
}
