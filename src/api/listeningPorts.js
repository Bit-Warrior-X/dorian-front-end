import { apiRequest } from './client'

export const fetchListeningPorts = async (serverId) =>
  apiRequest(`/servers/${serverId}/listening-ports`)

export const createListeningPort = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/listening-ports`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateListeningPort = async (serverId, portId, payload) =>
  apiRequest(`/servers/${serverId}/listening-ports/${portId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteListeningPort = async (serverId, portId) =>
  apiRequest(`/servers/${serverId}/listening-ports/${portId}`, {
    method: 'DELETE',
  })

export const deleteListeningPorts = async (serverId, ids) =>
  apiRequest(`/servers/${serverId}/listening-ports/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
