import { apiRequest } from './client'

export const fetchBlacklistEntries = async (serverId) => {
  const query = serverId ? `?serverId=${encodeURIComponent(serverId)}` : ''
  return apiRequest(`/servers/blacklist${query}`)
}

export const createBlacklistEntry = async (payload) =>
  apiRequest('/servers/blacklist', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const deleteBlacklistEntry = async (entryId) =>
  apiRequest(`/servers/blacklist/${entryId}`, {
    method: 'DELETE',
  })

export const flushBlacklistEntries = async (serverId) => {
  const query = serverId ? `?serverId=${encodeURIComponent(serverId)}` : ''
  return apiRequest(`/servers/blacklist${query}`, {
    method: 'DELETE',
  })
}
