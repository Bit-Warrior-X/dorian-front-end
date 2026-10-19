import { computed, reactive, readonly } from 'vue'
import {
  dismissAllNotifications,
  dismissNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  upsertNotification,
} from '@/api/notifications'

const MAX_ITEMS = 40

const state = reactive({
  items: [],
  loaded: false,
  loading: false,
})

let loadPromise = null

const sortItems = () => {
  state.items.sort((a, b) => {
    const live = Number(b.status === 'ongoing') - Number(a.status === 'ongoing')
    if (live) return live
    return Date.parse(b.at || 0) - Date.parse(a.at || 0)
  })
}

const mapServerItem = (item) => {
  if (!item || item.dismissed) return null
  return {
    id: String(item.eventKey || item.id),
    dbId: Number(item.id) || 0,
    kind: String(item.kind || 'info'),
    severity: String(item.severity || 'warning'),
    title: String(item.title || 'Alarm').trim(),
    body: String(item.body || '').trim(),
    status: item.status ? String(item.status) : '',
    at: item.at || item.createdAt || new Date().toISOString(),
    reqId: item.reqId ? String(item.reqId) : '',
    serverId: item.serverId ?? null,
    serverName: item.serverName ? String(item.serverName) : '',
    read: Boolean(item.read),
  }
}

const replaceItems = (list) => {
  state.items = (Array.isArray(list) ? list : [])
    .map(mapServerItem)
    .filter(Boolean)
    .slice(0, MAX_ITEMS)
  sortItems()
}

const mergeItem = (mapped) => {
  if (!mapped) return
  const index = state.items.findIndex((item) => item.id === mapped.id)
  if (index >= 0) state.items[index] = mapped
  else state.items.unshift(mapped)
  sortItems()
  state.items = state.items.slice(0, MAX_ITEMS)
}

export const loadAlarms = async () => {
  if (loadPromise) return loadPromise
  state.loading = true
  loadPromise = (async () => {
    try {
      const payload = await fetchNotifications(MAX_ITEMS)
      replaceItems(payload)
      state.loaded = true
    } catch {
      // Keep whatever is already in memory; the next poll/load retries.
    } finally {
      state.loading = false
      loadPromise = null
    }
  })()
  return loadPromise
}

/**
 * Upsert an alarm into the server-backed Alarms queue.
 * New attacks are unread (red badge). Dismissed rows stay dismissed.
 */
export const upsertAlarm = async (input) => {
  const eventKey = String(input?.id || input?.eventKey || '').trim()
  if (!eventKey) return null

  const payload = {
    eventKey,
    kind: String(input.kind || 'info'),
    severity: String(input.severity || 'warning'),
    title: String(input.title || 'Alarm').trim(),
    body: String(input.body || '').trim(),
    status: input.status ? String(input.status) : '',
    at: input.at || new Date().toISOString(),
    reqId: input.reqId ? String(input.reqId) : '',
    serverId: input.serverId ?? null,
    serverName: input.serverName ? String(input.serverName) : '',
    read: Boolean(input.read),
  }

  // Show in the bell immediately; server confirms right after.
  if (!payload.read) {
    mergeItem({
      id: eventKey,
      dbId: 0,
      kind: payload.kind,
      severity: payload.severity,
      title: payload.title,
      body: payload.body,
      status: payload.status,
      at: payload.at,
      reqId: payload.reqId,
      serverId: payload.serverId,
      serverName: payload.serverName,
      read: false,
    })
  }

  try {
    const saved = await upsertNotification(payload)
    if (saved?.dismissed) {
      state.items = state.items.filter((item) => item.id !== eventKey)
      return null
    }
    mergeItem(mapServerItem(saved))
    return eventKey
  } catch (error) {
    console.error('Failed to persist alarm', eventKey, error)
    return null
  }
}

export const markAlarmRead = async (id) => {
  const eventKey = String(id || '').trim()
  if (!eventKey) return
  const item = state.items.find((entry) => entry.id === eventKey)
  if (item) item.read = true
  try {
    await markNotificationRead(eventKey)
  } catch {
    // Local mark still applied; next load reconciles.
  }
}

export const markAllAlarmsRead = async () => {
  state.items.forEach((item) => {
    item.read = true
  })
  try {
    await markAllNotificationsRead()
  } catch {
    /* ignore */
  }
}

export const dismissAlarm = async (id) => {
  const eventKey = String(id || '').trim()
  if (!eventKey) return
  state.items = state.items.filter((item) => item.id !== eventKey)
  try {
    await dismissNotification(eventKey)
  } catch {
    void loadAlarms()
  }
}

export const clearAlarms = async () => {
  state.items = []
  try {
    await dismissAllNotifications()
  } catch {
    void loadAlarms()
  }
}

export const unreadAlarmCount = computed(() => state.items.filter((item) => !item.read).length)
export const liveAlarmCount = computed(() =>
  state.items.filter((item) => item.status === 'ongoing').length,
)

export const alarms = {
  state: readonly(state),
  load: loadAlarms,
  upsert: upsertAlarm,
  markRead: markAlarmRead,
  markAllRead: markAllAlarmsRead,
  dismiss: dismissAlarm,
  clear: clearAlarms,
  unreadCount: unreadAlarmCount,
  liveCount: liveAlarmCount,
}

export const useAlarms = () => alarms
