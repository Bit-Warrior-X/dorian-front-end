import { apiRequest } from './client'

export const fetchCacheRules = async (siteId) =>
  apiRequest(`/sites/${siteId}/cache-rules`)

export const createCacheRule = async (siteId, payload) =>
  apiRequest(`/sites/${siteId}/cache-rules`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateCacheRule = async (siteId, ruleId, payload) =>
  apiRequest(`/sites/${siteId}/cache-rules/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteCacheRule = async (siteId, ruleId) =>
  apiRequest(`/sites/${siteId}/cache-rules/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteCacheRules = async (siteId, ids) =>
  apiRequest(`/sites/${siteId}/cache-rules/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })

export const clearCache = async (siteId) =>
  apiRequest(`/sites/${siteId}/cache-rules/clear-cache`, {
    method: 'POST',
  })

export const clearUrlCache = async (siteId, payload) =>
  apiRequest(`/sites/${siteId}/cache-rules/clear-url-cache`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
