import { apiRequest } from './client'

export const fetchL7Guard = async (serverId) =>
  apiRequest(`/servers/${serverId}/l7-guard`)

export const updateL7Guard = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/l7-guard`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const resetL7Guard = async (serverId) =>
  apiRequest(`/servers/${serverId}/l7-guard`, {
    method: 'PUT',
    body: JSON.stringify({ reset: true }),
  })
