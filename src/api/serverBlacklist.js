import { apiRequest } from './client'

export const fetchBlacklistEntries = async (serverId, siteId) => {
  const params = new URLSearchParams()
  if (serverId) params.set('serverId', String(serverId))
  if (siteId) params.set('siteId', String(siteId))
  const query = params.toString()
  return apiRequest(`/servers/blacklist${query ? `?${query}` : ''}`)
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
