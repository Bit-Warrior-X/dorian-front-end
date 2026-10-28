import { apiRequest, resolveApiBaseUrl } from './client'
import { readStoredAuth } from '@/stores/authStorage'

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

export const fetchSecurityEvents = async (limit = 5, serverId = 'all', range = null) => {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  if (serverId && serverId !== 'all') params.set('serverId', String(serverId))
  if (range?.start) params.set('start', String(range.start))
  if (range?.end) params.set('end', String(range.end))
  const query = params.toString()
  return apiRequest(`/dashboard/security-events${query ? `?${query}` : ''}`)
}

export const fetchBandwidthSeries = async (range, serverId = 'all', siteId = 'all') => {
  const params = new URLSearchParams()
  if (range) params.set('range', range)
  appendScopeParams(params, serverId, siteId)
  const query = params.toString()
  return apiRequest(`/dashboard/bandwidth${query ? `?${query}` : ''}`)
}

export const fetchBandwidthNicRxSeries = async (range, serverId = 'all', siteId = 'all') => {
  const params = new URLSearchParams()
  if (range) params.set('range', range)
  appendScopeParams(params, serverId, siteId)
  const query = params.toString()
  return apiRequest(`/dashboard/bandwidth-nic-rx${query ? `?${query}` : ''}`)
}

export const fetchBandwidthNicTxSeries = async (range, serverId = 'all', siteId = 'all') => {
  const params = new URLSearchParams()
  if (range) params.set('range', range)
  appendScopeParams(params, serverId, siteId)
  const query = params.toString()
  return apiRequest(`/dashboard/bandwidth-nic-tx${query ? `?${query}` : ''}`)
}

export const fetchBandwidthL7RxSeries = async (range, serverId = 'all', siteId = 'all') => {
  const params = new URLSearchParams()
  if (range) params.set('range', range)
  appendScopeParams(params, serverId, siteId)
  const query = params.toString()
  return apiRequest(`/dashboard/bandwidth-l7-rx${query ? `?${query}` : ''}`)
}

export const fetchBandwidthL7TxSeries = async (range, serverId = 'all', siteId = 'all') => {
  const params = new URLSearchParams()
  if (range) params.set('range', range)
  appendScopeParams(params, serverId, siteId)
  const query = params.toString()
  return apiRequest(`/dashboard/bandwidth-l7-tx${query ? `?${query}` : ''}`)
}

export const fetchRequestResponseSeries = async (range, serverId = 'all', siteId = 'all') => {
  const params = new URLSearchParams()
  if (range) params.set('range', String(range))
  appendScopeParams(params, serverId, siteId)
  const query = params.toString()
  return apiRequest(`/dashboard/request-response${query ? `?${query}` : ''}`)
}

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
