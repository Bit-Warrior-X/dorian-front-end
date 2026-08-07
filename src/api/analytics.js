import { apiRequest } from './client'

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  if (params.range) query.set('range', params.range)
  if (params.serverId && params.serverId !== 'all') query.set('serverId', params.serverId)
  if (params.siteId && params.siteId !== 'all') query.set('siteId', params.siteId)
  if (params.start) query.set('start', params.start)
  if (params.end) query.set('end', params.end)
  return query.toString()
}

export const fetchAnalyticsSummary = async (params = {}) => {
  const suffix = buildQuery(params)
  return apiRequest(`/analytics/summary${suffix ? `?${suffix}` : ''}`)
}

export const fetchAnalyticsSeries = async (metric, params = {}) => {
  const suffix = buildQuery(params)
  return apiRequest(`/analytics/series/${metric}${suffix ? `?${suffix}` : ''}`)
}

export const fetchAnalyticsSummaryGroup = async (metric, params = {}) => {
  const suffix = buildQuery(params)
  return apiRequest(`/analytics/summary/${metric}${suffix ? `?${suffix}` : ''}`)
}
