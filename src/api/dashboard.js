import { apiRequest } from './client'

export const fetchDashboardSummary = async () => apiRequest('/dashboard/summary')

export const fetchSecurityEvents = async (limit = 5) => {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  const query = params.toString()
  return apiRequest(`/dashboard/security-events${query ? `?${query}` : ''}`)
}

export const fetchBandwidthSeries = async (range, serverId = 'all') => {
  const params = new URLSearchParams()
  if (range) params.set('range', range)
  if (serverId && serverId !== 'all') params.set('serverId', String(serverId))
  const query = params.toString()
  return apiRequest(`/dashboard/bandwidth${query ? `?${query}` : ''}`)
}

export const fetchRequestResponseSeries = async (range, serverId = 'all') => {
  const params = new URLSearchParams()
  if (range) params.set('range', String(range))
  if (serverId && serverId !== 'all') params.set('serverId', String(serverId))
  const query = params.toString()
  return apiRequest(`/dashboard/request-response${query ? `?${query}` : ''}`)
}

export const fetchStatusCodeSeries = async (range, serverId = 'all') => {
  const params = new URLSearchParams()
  if (range) params.set('range', String(range))
  if (serverId && serverId !== 'all') params.set('serverId', String(serverId))
  const query = params.toString()
  return apiRequest(`/dashboard/status-codes${query ? `?${query}` : ''}`)
}
