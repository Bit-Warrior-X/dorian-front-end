import { apiRequest, resolveApiBaseUrl } from './client'
import { readStoredAuth } from '@/stores/authStorage'

const MIME = { csv: 'text/csv', json: 'application/json', txt: 'text/plain' }

const fileNameFromDisposition = (header, fallback) => {
  const match = /filename="?([^";]+)"?/i.exec(String(header || ''))
  return match?.[1] || fallback
}

const authHeaders = () => {
  const token = readStoredAuth()?.token || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Requests a real log export from Athens (access / security). Returns a downloadable Blob.
 * Error logs are rejected by the API until an error-log pipeline exists.
 */
export const requestLogExport = async (payload) => {
  const apiBaseUrl = await resolveApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/analytics/logs/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = `Export failed (HTTP ${response.status})`
    try {
      const body = await response.json()
      if (body?.message) message = body.message
      else if (body?.error) message = body.error
    } catch {
      /* ignore */
    }
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  const blob = await response.blob()
  const rows = Number(response.headers.get('X-Export-Rows') || 0)
  const warnings = String(response.headers.get('X-Export-Warnings') || '').trim()
  const fileName = fileNameFromDisposition(
    response.headers.get('Content-Disposition'),
    `dorian-${payload.type}-logs-${payload.start}_${payload.end}.${payload.format}`,
  )
  return {
    status: 'ready',
    fileName,
    blob,
    rows,
    warnings,
    contentType: MIME[payload.format] || blob.type,
  }
}

/** List hourly L4/L7 log files retained on one edge. */
export const fetchEdgeLogFiles = async ({ serverId, layer = 'all' } = {}) => {
  const params = new URLSearchParams()
  params.set('serverId', String(serverId))
  if (layer) params.set('layer', layer)
  return apiRequest(`/analytics/logs/files?${params.toString()}`)
}

/** Page into an allowlisted edge log file. */
export const fetchEdgeLogFileContent = async ({
  serverId,
  path,
  offset = 0,
  limit = 200,
  skipTotal = false,
} = {}) => {
  const params = new URLSearchParams()
  params.set('serverId', String(serverId))
  params.set('path', path)
  params.set('offset', String(offset))
  params.set('limit', String(limit))
  if (skipTotal) params.set('skipTotal', '1')
  return apiRequest(`/analytics/logs/files/content?${params.toString()}`)
}

/** Download a full hourly / attack log file from the edge. */
export const downloadEdgeLogFile = async ({ serverId, path, fileName } = {}) => {
  const apiBaseUrl = await resolveApiBaseUrl()
  const params = new URLSearchParams()
  params.set('serverId', String(serverId))
  params.set('path', path)
  const response = await fetch(`${apiBaseUrl}/analytics/logs/files/download?${params.toString()}`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  })
  if (!response.ok) {
    let message = `Download failed (HTTP ${response.status})`
    try {
      const body = await response.json()
      if (body?.message) message = body.message
      else if (body?.error) message = body.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  const blob = await response.blob()
  const name = fileNameFromDisposition(
    response.headers.get('Content-Disposition'),
    fileName || path.split('/').pop() || 'edge-log.bin',
  )
  return { blob, fileName: name, size: Number(response.headers.get('X-Log-Size') || blob.size || 0) }
}
