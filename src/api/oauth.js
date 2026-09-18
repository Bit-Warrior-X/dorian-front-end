import { apiRequest, resolveApiBaseUrl } from './client'
import { getApiConfig } from './config'

export const fetchOAuthProviders = async () => {
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    return { google: false, github: false, sso: false }
  }
  try {
    return await apiRequest('/api/v1/auth/oauth/providers')
  } catch {
    return { google: false, github: false, sso: false }
  }
}

export const buildGoogleOAuthStartURL = async ({ redirect = '/app', remember = false } = {}) => {
  const apiBaseUrl = await resolveApiBaseUrl()
  const params = new URLSearchParams()
  if (redirect) params.set('redirect', redirect)
  if (remember) params.set('remember', '1')
  const query = params.toString()
  return `${apiBaseUrl}/api/v1/auth/oauth/google/start${query ? `?${query}` : ''}`
}

export const completeOAuthSession = async (token) => {
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    return {
      token,
      user: {
        id: 1,
        email: 'oauth@example.com',
        role: 'User',
        name: 'OAuth User',
      },
    }
  }

  // Decode JWT payload for UI identity (signature already verified by API on next requests).
  const claims = decodeJwtPayload(token)
  if (!claims) {
    throw new Error('Invalid sign-in token from Google.')
  }
  return {
    token,
    user: {
      id: Number(claims.uid || claims.sub) || null,
      email: claims.email || '',
      role: claims.role || 'User',
      name: claims.name || '',
    },
  }
}

const decodeJwtPayload = (token) => {
  try {
    const parts = String(token || '').split('.')
    if (parts.length < 2) return null
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}
