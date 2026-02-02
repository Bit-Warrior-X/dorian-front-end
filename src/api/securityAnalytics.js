import { apiRequest } from './client'

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  if (params.range) query.set('range', params.range)
  if (params.serverId && params.serverId !== 'all') query.set('serverId', params.serverId)
  if (params.start) query.set('start', params.start)
  if (params.end) query.set('end', params.end)
  return query.toString()
}

export const fetchSecuritySummary = async (params = {}) => {
  const suffix = buildQuery(params)
  return apiRequest(`/analytics/security/summary${suffix ? `?${suffix}` : ''}`)
}

export const fetchSecuritySeries = async (metric, params = {}) => {
  const suffix = buildQuery(params)
  return apiRequest(`/analytics/security/series/${metric}${suffix ? `?${suffix}` : ''}`)
}

export const fetchSecuritySummaryGroup = async (metric, params = {}) => {
  const suffix = buildQuery(params)
  return apiRequest(`/analytics/security/summary/${metric}${suffix ? `?${suffix}` : ''}`)
}
