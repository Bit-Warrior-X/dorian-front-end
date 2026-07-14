import { apiRequest } from './client'

export const fetchCompressSettings = async (serverId) =>
  apiRequest(`/servers/${serverId}/compress`)

export const updateCompressSettings = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/compress`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
