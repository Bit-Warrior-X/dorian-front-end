import { apiRequest } from './client'
import { getApiConfig } from './config'

const mockTokens = []
let mockNextId = 1

const mockListApiTokens = async () => [...mockTokens]

const mockCreateApiToken = async ({ name, scopes = ['*'] }) => {
  const id = mockNextId++
  const prefix = 'dorian_pat_mock'
  const secret = `${prefix}${String(id).padStart(8, '0')}${Math.random().toString(36).slice(2, 10)}`
  const token = {
    id,
    userId: 1,
    name: String(name || '').trim() || 'Token',
    tokenPrefix: prefix,
    scopes: Array.isArray(scopes) && scopes.length ? scopes : ['*'],
    createdAt: new Date().toISOString(),
  }
  mockTokens.unshift(token)
  return { token, secret }
}

const mockRevokeApiToken = async (id) => {
  const index = mockTokens.findIndex((item) => String(item.id) === String(id))
  if (index >= 0) mockTokens.splice(index, 1)
  return null
}

export const listApiTokens = async () => {
  const { useMocks } = await getApiConfig()
  if (useMocks) return mockListApiTokens()
  return apiRequest('/api/v1/auth/api-tokens')
}

export const createApiToken = async ({ name, scopes = ['*'], expiresAt } = {}) => {
  const { useMocks } = await getApiConfig()
  if (useMocks) return mockCreateApiToken({ name, scopes })

  const body = { name, scopes }
  if (expiresAt) body.expiresAt = expiresAt
  return apiRequest('/api/v1/auth/api-tokens', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export const revokeApiToken = async (id) => {
  const { useMocks } = await getApiConfig()
  if (useMocks) return mockRevokeApiToken(id)

  return apiRequest(`/api/v1/auth/api-tokens/${id}`, {
    method: 'DELETE',
  })
}
