import { apiRequest } from './client'
import { getApiConfig } from './config'

const mockUsers = [
  {
    email: 'superadmin@gmail.com',
    password: '123456',
    role: 'Admin',
    name: 'Super Admin',
    status: 'Active',
    id: 1,
  },
  {
    email: 'user@gmail.com',
    password: '123456',
    role: 'User',
    name: 'User',
    status: 'Active',
    id: 2,
  }
]

const mockLogin = async ({ email, password }) => {
  await new Promise((resolve) => setTimeout(resolve, 150))
  const matchedUser = mockUsers.find(
    (user) =>
      user.email.toLowerCase().trim() === email.toLowerCase().trim() &&
      user.password === password
  )

  if (!matchedUser) {
    throw new Error('Invalid email or password. Please try again.')
  }

  if (matchedUser.status === 'Block') {
    throw new Error('Your account is blocked. Please contact an administrator.')
  }

  if (matchedUser.status === 'Waiting') {
    throw new Error('Please wait while admin accept your login.')
  }

  return {
    token: `mock-jwt-${matchedUser.id}-${Date.now()}`,
    user: {
      id: matchedUser.id,
      email: matchedUser.email,
      role: matchedUser.role,
      name: matchedUser.name
    }
  }
}

export const login = async ({ email, password, rememberMe = false }) => {
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    return mockLogin({ email, password })
  }

  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, remember: Boolean(rememberMe) }),
  })
}

export const fetchAuthOptions = () => apiRequest('/auth/options')

export const fetchMe = () => apiRequest('/auth/me')

export const listSessions = () => apiRequest('/auth/sessions')

export const revokeSession = (id) =>
  apiRequest(`/auth/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const revokeOtherSessions = () =>
  apiRequest('/auth/sessions/revoke-others', { method: 'POST' })

export const requestPasswordReset = (email) =>
  apiRequest('/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

export const peekPasswordLink = ({ token, purpose }) =>
  apiRequest('/auth/password/token', {
    method: 'POST',
    body: JSON.stringify({ token, purpose }),
  })

export const completePasswordLink = ({ token, purpose, password }) =>
  apiRequest('/auth/password/complete', {
    method: 'POST',
    body: JSON.stringify({ token, purpose, password }),
  })

export const fetchSecuritySettings = () => apiRequest('/settings/security')

export const updateSecuritySettings = (payload) =>
  apiRequest('/settings/security', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const loginWithMFA = async ({ mfaToken, code }) =>
  apiRequest('/auth/login/mfa', {
    method: 'POST',
    body: JSON.stringify({ mfaToken, code }),
  })

export const logout = async (reason = 'manual') => {
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    return null
  }

  try {
    return await apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  } catch {
    return null
  }
}
