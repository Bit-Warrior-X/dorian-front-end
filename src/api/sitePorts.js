import { apiRequest } from './client'

export const fetchSitePorts = async (siteId) =>
  apiRequest(`/sites/${siteId}/ports`)

export const updateSitePorts = async (siteId, payload) =>
  apiRequest(`/sites/${siteId}/ports`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
