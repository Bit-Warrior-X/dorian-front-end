import { apiRequest } from './client'

export const fetchOriginRoutes = async (siteId) =>
  apiRequest(`/sites/${siteId}/origin-routes`)

export const updateOriginRoutes = async (siteId, payload) =>
  apiRequest(`/sites/${siteId}/origin-routes`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
