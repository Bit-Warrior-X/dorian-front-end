import { apiRequest } from './client'

export const fetchAuditLogs = async (params = {}) => {
  const search = new URLSearchParams()
  if (params.limit) search.set('limit', String(params.limit))
  if (params.category) search.set('category', params.category)
  if (params.action) search.set('action', params.action)
  if (params.search) search.set('search', params.search)
  if (params.actorUserId) search.set('actorUserId', String(params.actorUserId))

  const query = search.toString()
  return apiRequest(`/api/v1/audit-logs${query ? `?${query}` : ''}`)
}
