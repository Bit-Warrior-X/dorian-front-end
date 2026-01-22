import { apiRequest } from './client'

export const fetchL4Config = async (serverId) =>
  apiRequest(`/servers/${serverId}/l4`)

export const updateL4Config = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/l4`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
