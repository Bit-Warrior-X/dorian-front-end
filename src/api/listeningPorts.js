import { apiRequest } from './client'

export const fetchListeningPorts = async (siteId) =>
  apiRequest(`/sites/${siteId}/listening-ports`)

export const fetchBoundListeningPorts = async (siteId) =>
  apiRequest(`/sites/${siteId}/listening-ports/bound`)

export const createListeningPort = async (siteId, payload) =>
  apiRequest(`/sites/${siteId}/listening-ports`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateListeningPort = async (siteId, portId, payload) =>
  apiRequest(`/sites/${siteId}/listening-ports/${portId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteListeningPort = async (siteId, portId) =>
  apiRequest(`/sites/${siteId}/listening-ports/${portId}`, {
    method: 'DELETE',
  })

export const deleteListeningPorts = async (siteId, ids) =>
  apiRequest(`/sites/${siteId}/listening-ports/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
