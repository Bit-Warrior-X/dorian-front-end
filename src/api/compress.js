import { apiRequest } from './client'

export const fetchCompressSettings = async (siteId) =>
  apiRequest(`/sites/${siteId}/compress`)

export const updateCompressSettings = async (siteId, payload) =>
  apiRequest(`/sites/${siteId}/compress`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
