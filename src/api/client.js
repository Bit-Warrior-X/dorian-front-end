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
        return 'Deploy timed out or the target host became unreachable from the control plane. Confirm SSH IP/port/firewall, then retry (large GeoIP sync no longer blocks create).'
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

/** Structured fields for expandable deploy/API error panels. */
export const extractApiErrorDetails = (payload, response) => {
  if (!payload || typeof payload !== 'object') {
    return {
      status: response?.status || undefined,
    }
  }
  return {
    status: response?.status || undefined,
    req_id: firstNonEmptyString(payload.req_id, payload.reqId),
    op: firstNonEmptyString(payload.op),
    script_error: firstNonEmptyString(payload.script_error, payload.scriptError),
    detail: firstNonEmptyString(payload.detail),
    description: firstNonEmptyString(payload.description),
    hint: firstNonEmptyString(payload.hint),
    stderr: firstNonEmptyString(payload.stderr),
    stdout: firstNonEmptyString(payload.stdout),
  }
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
  const reqId =
    (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const headers = {
    'Content-Type': 'application/json',
    'X-Request-Id': reqId,
    ...(options.headers || {}),
  }

  const token = getStoredToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
    touchSessionActivity(false)
  }

  const t0 = performance.now?.() ?? Date.now()
  const response = await fetch(url, {
    ...options,
    headers,
  })

  const payload = await parseJson(response)
  const durationMs = Math.round((performance.now?.() ?? Date.now()) - t0)
  const responseReqId = response.headers.get('X-Request-Id') || reqId

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized(path)
    }
    const message = extractApiErrorMessage(payload, response)
    const error = new Error(message)
    error.status = response.status
    error.payload = payload && typeof payload === 'object' ? { ...payload, req_id: payload.req_id || responseReqId } : payload
    error.reqId = responseReqId
    // Structured browser console line for DevTools filtering.
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: 'error',
        component: 'frontend',
        event: 'api_request_failed',
        req_id: responseReqId,
        method: options.method || 'GET',
        path,
        status: response.status,
        duration_ms: durationMs,
        message,
      })
    )
    throw error
  }

  return payload
}
