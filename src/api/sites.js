import { apiRequest } from './client'

export const fetchSites = async () => apiRequest('/sites')

export const fetchSite = async (id) => apiRequest(`/sites/${id}`)

export const createSite = async (payload) =>
  apiRequest('/sites', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateSite = async (id, payload) =>
  apiRequest(`/sites/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteSite = async (id) =>
  apiRequest(`/sites/${id}`, {
    method: 'DELETE',
  })

export const forkSiteWafRule = async (id) =>
  apiRequest(`/sites/${id}/waf/fork`, {
    method: 'POST',
  })
