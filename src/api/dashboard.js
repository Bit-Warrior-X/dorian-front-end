import { apiRequest } from './client'

export const fetchDashboardSummary = async () => apiRequest('/dashboard/summary')

export const fetchSecurityEvents = async (limit = 5) => {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  const query = params.toString()
  return apiRequest(`/dashboard/security-events${query ? `?${query}` : ''}`)
}
