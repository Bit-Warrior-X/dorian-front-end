import { apiRequest } from './client'
import { createRandom, pick, withPreviewFallback } from '@/utils/analyticsPreview'

const SAMPLE_PATHS = ['/', '/index.html', '/assets/app.js', '/api/v1/products', '/images/logo.svg', '/login', '/.env', '/wp-login.php']
const SAMPLE_METHODS = ['GET', 'GET', 'GET', 'POST', 'HEAD']
const SAMPLE_STATUSES = [200, 200, 200, 200, 304, 301, 404, 403, 444, 502]
const SAMPLE_CACHE = ['HIT', 'HIT', 'MISS', 'BYPASS', 'DYNAMIC']
const SAMPLE_AGENTS = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'curl/8.4.0', 'Googlebot/2.1', 'python-requests/2.31']

const sampleRows = ({ start, end, type }) => {
  const random = createRandom(`${start}|${end}|${type}`)
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime() + 24 * 3600000
  return Array.from({ length: 200 }, () => {
    const status = pick(random, SAMPLE_STATUSES)
    const row = {
      time: new Date(startMs + random() * (endMs - startMs)).toISOString(),
      clientIp: `203.0.113.${Math.floor(random() * 254) + 1}`,
      method: pick(random, SAMPLE_METHODS),
      host: 'example.com',
      path: pick(random, SAMPLE_PATHS),
      status,
      bytes: Math.floor(random() * 90000),
      requestTimeMs: Math.round(5 + random() * 400),
      cacheStatus: pick(random, SAMPLE_CACHE),
      userAgent: pick(random, SAMPLE_AGENTS),
    }
    if (type === 'security' || status === 444 || status === 403) row.action = status === 444 ? 'block' : 'allow'
    return row
  }).sort((a, b) => a.time.localeCompare(b.time))
}

const serialize = (rows, format) => {
  if (format === 'json') return JSON.stringify(rows, null, 2)
  const columns = Object.keys(rows[0] || {})
  if (format === 'txt') {
    return rows.map((row) => `${row.clientIp} - - [${row.time}] "${row.method} ${row.path} HTTP/1.1" ${row.status} ${row.bytes} "${row.userAgent}" "${row.host}"`).join('\n')
  }
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  return [columns.join(','), ...rows.map((row) => columns.map((key) => escape(row[key])).join(','))].join('\n')
}

const MIME = { csv: 'text/csv', json: 'application/json', txt: 'text/plain' }

/**
 * Requests an export job. The live endpoint answers `{ jobId, status, downloadUrl? }`;
 * the preview fallback returns a sample file as a Blob.
 */
export const requestLogExport = (payload) =>
  withPreviewFallback(
    () => apiRequest('/analytics/logs/export', { method: 'POST', body: JSON.stringify(payload) }),
    () => {
      const rows = sampleRows(payload)
      return {
        status: 'ready',
        fileName: `dorian-${payload.type}-logs-sample-${payload.start}_${payload.end}.${payload.format}`,
        blob: new Blob([serialize(rows, payload.format)], { type: MIME[payload.format] || 'text/plain' }),
        rows: rows.length,
      }
    },
  )
