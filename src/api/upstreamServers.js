import { apiRequest } from './client'

export const fetchUpstreamServers = async (serverId) =>
  apiRequest(`/servers/${serverId}/upstream-servers`)

export const createUpstreamServer = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/upstream-servers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateUpstreamServer = async (serverId, upstreamId, payload) =>
  apiRequest(`/servers/${serverId}/upstream-servers/${upstreamId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteUpstreamServer = async (serverId, upstreamId) =>
  apiRequest(`/servers/${serverId}/upstream-servers/${upstreamId}`, {
    method: 'DELETE',
  })

export const deleteUpstreamServers = async (serverId, ids) =>
  apiRequest(`/servers/${serverId}/upstream-servers/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
