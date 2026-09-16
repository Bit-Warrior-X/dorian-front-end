import { notifications } from '@/stores/notifications'

export function notify({ title, message, type = 'success', duration }) {
  return notifications.enqueue({ title, message, type, duration })
}

export function notifySuccess(title, message, duration) {
  return notify({ title, message, type: 'success', duration })
}

export function notifyError(title, message, duration) {
  const text = String(message ?? '').trim()
  const resolvedDuration =
    duration != null
      ? duration
      : text.length > 160
        ? Math.min(20000, 8000 + Math.floor(text.length / 2))
        : undefined
  return notify({ title, message, type: 'error', duration: resolvedDuration })
}

export function notifyWarning(title, message, duration) {
  return notify({ title, message, type: 'warning', duration })
}
