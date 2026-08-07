export const AUTH_STORAGE_KEY = 'cdnproxy.auth'
export const AUTH_REMEMBER_KEY = 'cdnproxy.auth.remember'
export const ACTIVITY_STORAGE_KEY = 'cdnproxy.lastActivity'

export const isRememberMeEnabled = () => {
  try {
    return localStorage.getItem(AUTH_REMEMBER_KEY) === '1'
  } catch {
    return false
  }
}

export const getAuthStorage = () => (isRememberMeEnabled() ? localStorage : sessionStorage)

export const getActivityStorage = () => getAuthStorage()

export const clearAllAuthStorage = () => {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(AUTH_REMEMBER_KEY)
    sessionStorage.removeItem(ACTIVITY_STORAGE_KEY)
    localStorage.removeItem(ACTIVITY_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

export const readStoredAuth = () => {
  try {
    const remembered = isRememberMeEnabled()
    const raw = remembered
      ? localStorage.getItem(AUTH_STORAGE_KEY)
      : sessionStorage.getItem(AUTH_STORAGE_KEY)

    if (!remembered) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }

    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const writeStoredAuth = (payload, rememberMe) => {
  const serialized = JSON.stringify(payload)
  try {
    if (rememberMe) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      sessionStorage.removeItem(ACTIVITY_STORAGE_KEY)
      localStorage.setItem(AUTH_STORAGE_KEY, serialized)
      localStorage.setItem(AUTH_REMEMBER_KEY, '1')
      return
    }

    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(AUTH_REMEMBER_KEY)
    localStorage.removeItem(ACTIVITY_STORAGE_KEY)
    sessionStorage.setItem(AUTH_STORAGE_KEY, serialized)
  } catch {
    // ignore storage errors
  }
}
