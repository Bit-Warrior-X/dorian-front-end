import { apiRequest, resolveApiBaseUrl } from './client'
import { readStoredAuth } from '@/stores/authStorage'
import { fetchAnalyticsAttacks, fetchAnalyticsByServerSeries } from './analytics'

const appendScopeParams = (params, serverId = 'all', siteId = 'all') => {
  if (serverId && serverId !== 'all') params.set('serverId', String(serverId))
  if (siteId && siteId !== 'all') params.set('siteId', String(siteId))
}

export const fetchDashboardSummary = async () => apiRequest('/dashboard/summary')

export const fetchAttackConsole = async (reqId) => {
  const params = new URLSearchParams()
  params.set('reqId', String(reqId))
  return apiRequest(`/dashboard/attack-console?${params}`)
}

/** Paged blocked sources for the attack console (search + scroll). */
export const fetchAttackSources = async (reqId, { offset = 0, limit = 25, q = '', active = false } = {}) => {
  const params = new URLSearchParams()
  params.set('reqId', String(reqId))
  params.set('offset', String(Math.max(0, Number(offset) || 0)))
  params.set('limit', String(Math.max(1, Number(limit) || 25)))
  const query = String(q || '').trim()
  if (query) params.set('q', query)
  if (active) params.set('active', '1')
  return apiRequest(`/dashboard/attack-console/sources?${params}`)
}

/** Paged Sparta console counters (newest page first; offset skips newest lines). */
export const fetchAttackSpartaConsole = async (reqId, { offset = 0, limit = 80, skipTotal = false } = {}) => {
  const params = new URLSearchParams()
  params.set('reqId', String(reqId))
  params.set('offset', String(Math.max(0, Number(offset) || 0)))
  params.set('limit', String(Math.max(1, Number(limit) || 80)))
  if (skipTotal) params.set('skipTotal', '1')
  return apiRequest(`/dashboard/attack-console/sparta-log?${params}`)
}

/** Paged raw Sparta attack archive (`…/sparta/logs/attacks/*-req_<id>.log`). */
export const fetchAttackSpartaArchive = async (reqId, { offset = 0, limit = 200, skipTotal = false } = {}) => {
  const params = new URLSearchParams()
  params.set('reqId', String(reqId))
  params.set('offset', String(Math.max(0, Number(offset) || 0)))
  params.set('limit', String(Math.max(1, Number(limit) || 200)))
  if (skipTotal) params.set('skipTotal', '1')
  return apiRequest(`/dashboard/attack-console/sparta-archive?${params}`)
}

/** Download the full Sparta attack archive file from the edge (streamed). */
export const downloadAttackSpartaArchive = async (reqId) => {
  const apiBaseUrl = await resolveApiBaseUrl()
  const params = new URLSearchParams()
  params.set('reqId', String(reqId))
  const token = readStoredAuth()?.token || ''
  const response = await fetch(`${apiBaseUrl}/dashboard/attack-console/sparta-archive/download?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    let message = `Download failed (HTTP ${response.status})`
    try {
      const payload = await response.json()
      if (payload?.message) message = payload.message
      else if (payload?.error) message = payload.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || ''
  const match = /filename="?([^";]+)"?/i.exec(disposition)
  const fileName = match?.[1] || `sparta-attack-${reqId}.log`
  return { blob, fileName, size: blob.size }
}

/**
 * Compact period list for Overview/alerts. Uses /analytics/attacks and returns the
 * items array so callers stay unchanged. Prefer fetchAnalyticsAttacks for pagination.
 */
export const fetchSecurityEvents = async (limit = 5, serverId = 'all', range = null, layer = '') => {
  const payload = await fetchAnalyticsAttacks({
    limit,
    offset: 0,
    serverId,
    layer: layer || undefined,
    start: range?.start || undefined,
    end: range?.end || undefined,
  })
  return Array.isArray(payload?.items) ? payload.items : []
}

// Multi-edge bandwidth via /analytics/series/by-server/* (legacy /dashboard/bandwidth* still registered).

export const fetchBandwidthSeries = async (range, serverId = 'all', siteId = 'all') => {
  // Aggregate L7 delivery helper kept for rare callers; Overview uses nic/l7 by-server.
  return fetchAnalyticsByServerSeries('l7-tx-bandwidth', { range, serverId, siteId })
}

export const fetchBandwidthNicRxSeries = async (range, serverId = 'all', siteId = 'all') =>
  fetchAnalyticsByServerSeries('nic-rx-bandwidth', { range, serverId, siteId })

export const fetchBandwidthNicTxSeries = async (range, serverId = 'all', siteId = 'all') =>
  fetchAnalyticsByServerSeries('nic-tx-bandwidth', { range, serverId, siteId })

export const fetchBandwidthL7RxSeries = async (range, serverId = 'all', siteId = 'all') =>
  fetchAnalyticsByServerSeries('l7-rx-bandwidth', { range, serverId, siteId })

export const fetchBandwidthL7TxSeries = async (range, serverId = 'all', siteId = 'all') =>
  fetchAnalyticsByServerSeries('l7-tx-bandwidth', { range, serverId, siteId })

/** @deprecated Prefer fetchAnalyticsSeries('request-response', params) from @/api/analytics */
export const fetchRequestResponseSeries = async (range, serverId = 'all', siteId = 'all') => {
  const params = new URLSearchParams()
  if (range) params.set('range', String(range))
  appendScopeParams(params, serverId, siteId)
  const query = params.toString()
  return apiRequest(`/dashboard/request-response${query ? `?${query}` : ''}`)
}

/** @deprecated Prefer fetchAnalyticsSeries('status-codes', params) from @/api/analytics */
export const fetchStatusCodeSeries = async (range, serverId = 'all', siteId = 'all') => {
  const params = new URLSearchParams()
  if (range) params.set('range', String(range))
  appendScopeParams(params, serverId, siteId)
  const query = params.toString()
  return apiRequest(`/dashboard/status-codes${query ? `?${query}` : ''}`)
}

export const fetchDashboardTopDomains = async (range, serverId = 'all', siteId = 'all') => {
  const params = new URLSearchParams()
  if (range) params.set('range', String(range))
  appendScopeParams(params, serverId, siteId)
  const query = params.toString()
  return apiRequest(`/dashboard/top-domains${query ? `?${query}` : ''}`)
}
