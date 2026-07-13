import { reactive, readonly } from 'vue'

const DURATION_BY_TYPE = {
  success: 3500,
  error: 8000,
  warning: 6000,
  info: 5000,
}

const defaultDurationFor = (type) => DURATION_BY_TYPE[type] ?? DURATION_BY_TYPE.success

const TITLE_BY_TYPE = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
}

const timeouts = new Map()

const state = reactive({
  queue: [],
})

const normalizeNotification = (input, type = 'success') => {
  if (input != null && typeof input === 'object' && !Array.isArray(input)) {
    const resolvedType = input.type || type || 'success'
    return {
      title: String(input.title || TITLE_BY_TYPE[resolvedType] || 'Notification').trim(),
      message: String(input.message ?? input.content ?? '').trim(),
      type: resolvedType,
      duration: Number.isFinite(Number(input.duration))
        ? Number(input.duration)
        : defaultDurationFor(resolvedType),
    }
  }

  const resolvedType = type || 'success'
  return {
    title: TITLE_BY_TYPE[resolvedType] || 'Notification',
    message: String(input ?? '').trim(),
    type: resolvedType,
    duration: defaultDurationFor(resolvedType),
  }
}

const dismiss = (id) => {
  const timeoutId = timeouts.get(id)
  if (timeoutId != null) {
    clearTimeout(timeoutId)
    timeouts.delete(id)
  }
  state.queue = state.queue.filter((note) => note.id !== id)
}

const enqueue = (input, type = 'success') => {
  const normalized = normalizeNotification(input, type)
  if (!normalized.message) return null

  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  state.queue = [...state.queue, { id, ...normalized }]

  const timeoutId = setTimeout(() => {
    dismiss(id)
  }, normalized.duration)
  timeouts.set(id, timeoutId)

  return id
}

export const notifications = {
  state: readonly(state),
  enqueue,
  dismiss,
}

export const useNotifications = () => notifications
