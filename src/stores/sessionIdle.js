const IDLE_TIMEOUT_MS = 15 * 60 * 1000
const ACTIVITY_STORAGE_KEY = 'cdnproxy.lastActivity'
const CHECK_INTERVAL_MS = 15_000
const ACTIVITY_THROTTLE_MS = 1_000

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel',
]

let started = false
let checkTimer = null
let lastWriteAt = 0
let expireHandler = null
let getIsAuthenticated = () => false

const now = () => Date.now()

const readLastActivity = () => {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY)
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

const writeLastActivity = (timestamp) => {
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, String(timestamp))
  } catch {
    // ignore storage errors
  }
}

export const clearSessionActivity = () => {
  try {
    localStorage.removeItem(ACTIVITY_STORAGE_KEY)
  } catch {
    // ignore
  }
  lastWriteAt = 0
}

export const touchSessionActivity = (force = false) => {
  if (!getIsAuthenticated()) return

  const timestamp = now()
  if (!force && timestamp - lastWriteAt < ACTIVITY_THROTTLE_MS) {
    return
  }
  lastWriteAt = timestamp
  writeLastActivity(timestamp)
}

export const isSessionIdleExpired = () => {
  if (!getIsAuthenticated()) return false
  const lastActivity = readLastActivity()
  if (!lastActivity) {
    // No activity stamp yet — treat as active and seed one.
    touchSessionActivity(true)
    return false
  }
  return now() - lastActivity >= IDLE_TIMEOUT_MS
}

const expireSession = async () => {
  if (!getIsAuthenticated()) return
  clearSessionActivity()
  if (typeof expireHandler === 'function') {
    await expireHandler()
  }
}

const evaluateIdle = async () => {
  if (!getIsAuthenticated()) return
  if (isSessionIdleExpired()) {
    await expireSession()
  }
}

const onUserActivity = () => {
  touchSessionActivity(false)
}

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    void evaluateIdle()
    touchSessionActivity(false)
  }
}

const onStorage = (event) => {
  if (event.key === ACTIVITY_STORAGE_KEY && event.newValue) {
    lastWriteAt = Number(event.newValue) || lastWriteAt
  }
}

export const initSessionIdle = ({
  isAuthenticated,
  onExpire,
} = {}) => {
  if (started) return
  started = true

  getIsAuthenticated = typeof isAuthenticated === 'function' ? isAuthenticated : () => false
  expireHandler = onExpire

  if (typeof window === 'undefined') return

  ACTIVITY_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, onUserActivity, { passive: true, capture: true })
  })
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('storage', onStorage)

  checkTimer = window.setInterval(() => {
    void evaluateIdle()
  }, CHECK_INTERVAL_MS)

  if (getIsAuthenticated()) {
    if (isSessionIdleExpired()) {
      void expireSession()
    } else {
      touchSessionActivity(true)
    }
  }
}

export const syncSessionIdleForAuthChange = (authenticated) => {
  if (!started) return
  if (authenticated) {
    touchSessionActivity(true)
    return
  }
  clearSessionActivity()
}

export const SESSION_IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MS
