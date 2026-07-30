import { apiRequest } from './client'

export const fetchUpstreamServers = async (siteId) =>
  apiRequest(`/sites/${siteId}/upstream-servers`)

export const createUpstreamServer = async (siteId, payload) =>
  apiRequest(`/sites/${siteId}/upstream-servers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateUpstreamServer = async (siteId, upstreamId, payload) =>
  apiRequest(`/sites/${siteId}/upstream-servers/${upstreamId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteUpstreamServer = async (siteId, upstreamId) =>
  apiRequest(`/sites/${siteId}/upstream-servers/${upstreamId}`, {
    method: 'DELETE',
  })

export const deleteUpstreamServers = async (siteId, ids) =>
  apiRequest(`/sites/${siteId}/upstream-servers/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
