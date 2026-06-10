import { reactive, readonly } from 'vue'

const DEFAULT_DURATION_MS = 8000

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
      duration: Number.isFinite(Number(input.duration)) ? Number(input.duration) : DEFAULT_DURATION_MS,
    }
  }

  const resolvedType = type || 'success'
  return {
    title: TITLE_BY_TYPE[resolvedType] || 'Notification',
    message: String(input ?? '').trim(),
    type: resolvedType,
    duration: DEFAULT_DURATION_MS,
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
