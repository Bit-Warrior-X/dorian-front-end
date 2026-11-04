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

/**
 * Unified attack inbox: paginated L4/L7 security periods with reqId for Attack Console.
 * @returns {{ items: Array, offset: number, limit: number, hasMore: boolean, layer?: string }}
 */
export const fetchAnalyticsAttacks = async (params = {}) => {
  const query = new URLSearchParams()
  if (params.range) query.set('range', params.range)
  if (params.serverId && params.serverId !== 'all') query.set('serverId', params.serverId)
  if (params.siteId && params.siteId !== 'all') query.set('siteId', params.siteId)
  if (params.start) query.set('start', params.start)
  if (params.end) query.set('end', params.end)
  if (params.layer) query.set('layer', params.layer)
  if (params.limit != null) query.set('limit', String(params.limit))
  if (params.offset != null) query.set('offset', String(params.offset))
  const suffix = query.toString()
  return apiRequest(`/analytics/attacks${suffix ? `?${suffix}` : ''}`)
}

/**
 * Multi-edge bandwidth series (Overview shape: [{ serverId, bucketSeconds, points, latest }]).
 * Uses ?groupBy=server on the canonical series path (by-server/* aliases still work).
 */
export const fetchAnalyticsByServerSeries = async (metric, params = {}) => {
  const query = new URLSearchParams()
  if (params.range) query.set('range', params.range)
  if (params.serverId && params.serverId !== 'all') query.set('serverId', params.serverId)
  if (params.siteId && params.siteId !== 'all') query.set('siteId', params.siteId)
  if (params.start) query.set('start', params.start)
  if (params.end) query.set('end', params.end)
  query.set('groupBy', 'server')
  const suffix = query.toString()
  return apiRequest(`/analytics/series/${metric}?${suffix}`)
}
