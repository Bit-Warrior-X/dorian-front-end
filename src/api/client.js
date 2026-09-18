import { getApiConfig } from './config'
import router from '@/router'
import { auth } from '@/stores/auth'
import { readStoredAuth } from '@/stores/authStorage'
import { touchSessionActivity } from '@/stores/sessionIdle'

const getStoredAuth = () => readStoredAuth()

const getStoredToken = () => getStoredAuth()?.token || null

const isLoginRequestPath = (path) => {
  const normalized = String(path || '').split('?')[0]
  return (
    normalized === '/auth/login' ||
    normalized === '/api/v1/auth/login' ||
    normalized.endsWith('/auth/login')
  )
}

const handleUnauthorized = (path) => {
  if (isLoginRequestPath(path)) return

  auth.clearSession()

  const current = router.currentRoute?.value
  if (!current || current.name === 'login') return

  const redirect = current.fullPath && current.fullPath !== '/login' ? current.fullPath : undefined
  void router.replace({
    name: 'login',
    query: redirect ? { redirect } : {},
  })
}

const parseJson = async (response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const firstNonEmptyString = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

/** Prefer actionable fields from dashboard + deploy_license error bodies. */
export const extractApiErrorMessage = (payload, response) => {
  const status = response?.status
  const statusHint =
    Number.isFinite(status) && status > 0
      ? `Request failed (HTTP ${status})`
      : 'Request failed'

  if (payload == null) {
    return firstNonEmptyString(response?.statusText, statusHint)
  }

  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    if (!trimmed) return firstNonEmptyString(response?.statusText, statusHint)
    // Cloudflare replaces many origin 502/504 JSON bodies with a short/HTML error page.
    if (
      trimmed.startsWith('<') ||
      /^error code:\s*502$/i.test(trimmed) ||
      /^error code:\s*504$/i.test(trimmed)
    ) {
      if (status === 502 || status === 504) {
        return 'Could not reach the target host from the control plane (gateway timeout/error). Check SSH IP, port, and firewall rules, or try a different server.'
      }
      return firstNonEmptyString(response?.statusText, statusHint)
    }
    try {
      return extractApiErrorMessage(JSON.parse(trimmed), response)
    } catch {
      const brace = trimmed.indexOf('{')
      if (brace >= 0) {
        try {
          const nested = extractApiErrorMessage(JSON.parse(trimmed.slice(brace)), response)
          if (nested && nested !== statusHint) return nested
        } catch {
          /* keep raw text */
        }
      }
      return trimmed.length > 800 ? `${trimmed.slice(0, 800)}…` : trimmed
    }
  }

  if (typeof payload === 'object') {
    const nestedError =
      typeof payload.error === 'string'
        ? payload.error
        : payload.error && typeof payload.error === 'object'
          ? firstNonEmptyString(payload.error.message, payload.error.description)
          : ''

    // Prefer detailed fields over generic HTTP status text in `error` (e.g. "Bad Gateway").
    const genericHttpLabel = /^(bad gateway|gateway timeout|internal server error|service unavailable|bad request|unauthorized|forbidden|not found)$/i
    const detail = firstNonEmptyString(
      payload.message,
      payload.script_error,
      payload.description,
      nestedError && !genericHttpLabel.test(nestedError) ? nestedError : '',
      payload.detail,
      nestedError,
    )
    if (detail) {
      const brace = detail.indexOf('{')
      if (brace >= 0 && detail.includes('"')) {
        try {
          const nested = extractApiErrorMessage(JSON.parse(detail.slice(brace)), response)
          if (nested && nested !== statusHint) return nested
        } catch {
          /* use detail as-is */
        }
      }
      return detail
    }
  }

  return firstNonEmptyString(response?.statusText, statusHint)
}

export const resolveApiBaseUrl = async () => {
  const { apiBaseUrl } = await getApiConfig()
  if (apiBaseUrl) return apiBaseUrl
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}

export const apiRequest = async (path, options = {}) => {
  const apiBaseUrl = await resolveApiBaseUrl()
  const url = `${apiBaseUrl}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  const token = getStoredToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
    touchSessionActivity(false)
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized(path)
    }
    const message = extractApiErrorMessage(payload, response)
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}
