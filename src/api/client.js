import { getApiConfig } from './config'

const STORAGE_KEY = 'cdnproxy.auth'

const getStoredToken = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.token || null
  } catch {
    return null
  }
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
  }

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
