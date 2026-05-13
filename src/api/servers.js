import { apiRequest } from './client'
import { serverList } from '@/data/servers'
import { getApiConfig } from './config'

export const fetchServers = async () => {
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    return serverList.map((server) => ({ ...server }))
  }

  return apiRequest('/servers')
}

export const updateServerUsers = async (serverId, userIds) =>
  apiRequest(`/servers/${serverId}/users`, {
    method: 'PUT',
    body: JSON.stringify({ userIds }),
  })

export const createServer = async (payload, extraHeaders = {}) => {
  const opts = {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { ...extraHeaders },
  }
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    opts.signal = AbortSignal.timeout(960_000)
  }
  return apiRequest('/servers', opts)
}

export const updateServer = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteServer = async (serverId) =>
  apiRequest(`/servers/${serverId}`, {
    method: 'DELETE',
  })
