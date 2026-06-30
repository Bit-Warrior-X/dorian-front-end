import { apiRequest } from './client'

export const fetchCacheRules = async (serverId) =>
  apiRequest(`/servers/${serverId}/cache-rules`)

export const createCacheRule = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/cache-rules`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateCacheRule = async (serverId, ruleId, payload) =>
  apiRequest(`/servers/${serverId}/cache-rules/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteCacheRule = async (serverId, ruleId) =>
  apiRequest(`/servers/${serverId}/cache-rules/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteCacheRules = async (serverId, ids) =>
  apiRequest(`/servers/${serverId}/cache-rules/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })

export const clearCache = async (serverId) =>
  apiRequest(`/servers/${serverId}/cache-rules/clear-cache`, {
    method: 'POST',
  })

export const clearUrlCache = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/cache-rules/clear-url-cache`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
