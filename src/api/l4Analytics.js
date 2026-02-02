import { apiRequest } from './client'

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  if (params.range) query.set('range', params.range)
  if (params.serverId && params.serverId !== 'all') query.set('serverId', params.serverId)
  if (params.start) query.set('start', params.start)
  if (params.end) query.set('end', params.end)
  if (params.limit) query.set('limit', String(params.limit))
  return query.toString()
}

export const fetchL4Summary = async (params = {}) => {
  const suffix = buildQuery(params)
  return apiRequest(`/analytics/l4/summary${suffix ? `?${suffix}` : ''}`)
}

export const fetchL4Series = async (metric, params = {}) => {
  const suffix = buildQuery(params)
  return apiRequest(`/analytics/l4/series/${metric}${suffix ? `?${suffix}` : ''}`)
}

export const fetchL4Attacks = async (metric, params = {}) => {
  const suffix = buildQuery(params)
  return apiRequest(`/analytics/l4/attacks/${metric}${suffix ? `?${suffix}` : ''}`)
}
