import { reactive, readonly } from 'vue'

const state = reactive({
  queue: []
})

const enqueue = (message, type = 'success') => {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  state.queue = [...state.queue, { id, message, type }]
  setTimeout(() => {
    state.queue = state.queue.filter((note) => note.id !== id)
  }, 3500)
}

export const notifications = {
  state: readonly(state),
  enqueue
}

export const useNotifications = () => notifications
