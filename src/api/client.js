import { getApiConfig } from './config'
import { readStoredAuth } from '@/stores/authStorage'
import { touchSessionActivity } from '@/stores/sessionIdle'

const getStoredAuth = () => readStoredAuth()

const getStoredToken = () => getStoredAuth()?.token || null

const applyActorHeaders = (headers, skipActorHeaders) => {
  if (skipActorHeaders) return
  const user = getStoredAuth()?.user
  if (!user) return
  if (user.id != null) headers['X-Actor-Id'] = String(user.id)
  if (user.name) headers['X-Actor-Name'] = user.name
  if (user.email) headers['X-Actor-Email'] = user.email
  if (user.role) headers['X-Actor-Role'] = user.role
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
  applyActorHeaders(headers, Boolean(options.skipActorHeaders))

  const response = await fetch(url, {
    ...options,
    headers
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      response.statusText ||
      'Request failed'
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}
