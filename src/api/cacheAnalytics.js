import { apiRequest } from './client'
import {
  createRandom,
  pick,
  previewBuckets,
  previewSeed,
  scaleFor,
  withPreviewFallback,
} from '@/utils/analyticsPreview'

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  if (params.range) query.set('range', params.range)
  if (params.serverId && params.serverId !== 'all') query.set('serverId', params.serverId)
  if (params.siteId && params.siteId !== 'all') query.set('siteId', params.siteId)
  if (params.start) query.set('start', params.start)
  if (params.end) query.set('end', params.end)
  const text = query.toString()
  return text ? `?${text}` : ''
}

export const CACHE_STATUSES = ['HIT', 'MISS', 'EXPIRED', 'STALE', 'UPDATING', 'REVALIDATED', 'BYPASS', 'DYNAMIC']

const STATUS_SHARE = {
  HIT: 0.62,
  MISS: 0.13,
  EXPIRED: 0.04,
  STALE: 0.015,
  UPDATING: 0.005,
  REVALIDATED: 0.03,
  BYPASS: 0.05,
  DYNAMIC: 0.11,
}

const CACHED_STATUSES = new Set(['HIT', 'STALE', 'UPDATING', 'REVALIDATED'])

const CONTENT_TYPES = [
  { contentType: 'image', share: 0.34, hit: 0.94, avgBytes: 92000 },
  { contentType: 'javascript', share: 0.16, hit: 0.91, avgBytes: 48000 },
  { contentType: 'css', share: 0.08, hit: 0.95, avgBytes: 21000 },
  { contentType: 'font', share: 0.03, hit: 0.98, avgBytes: 38000 },
  { contentType: 'html', share: 0.14, hit: 0.41, avgBytes: 26000 },
  { contentType: 'json', share: 0.17, hit: 0.22, avgBytes: 4200 },
  { contentType: 'video', share: 0.02, hit: 0.88, avgBytes: 2400000 },
  { contentType: 'other', share: 0.06, hit: 0.35, avgBytes: 12000 },
]

const MISS_PATHS = [
  '/api/v1/products?page=2',
  '/search?q=',
  '/api/v1/cart',
  '/',
  '/account/orders',
  '/api/v1/session',
  '/blog/feed.xml',
  '/sitemap.xml',
  '/assets/app.js?v=',
  '/images/banner-hero.webp',
  '/api/v1/recommendations',
  '/checkout',
]

const AVG_BYTES = 38000

const previewTotals = (params, context = {}) => {
  const random = createRandom(previewSeed('cache-total', params))
  const known = Number(context.totalRequests)
  const requests = Number.isFinite(known) ? known : Math.round(scaleFor(params) * 52000 * (0.9 + random() * 0.2))
  const hitShift = (random() - 0.5) * 0.08
  return { random, requests, hitShift }
}

const statusRows = (params, context) => {
  const { random, requests, hitShift } = previewTotals(params, context)
  return CACHE_STATUSES.map((status) => {
    let share = STATUS_SHARE[status]
    if (status === 'HIT') share += hitShift
    if (status === 'MISS') share -= hitShift * 0.7
    const count = Math.max(0, Math.round(requests * share * (0.92 + random() * 0.16)))
    const bytesPer = status === 'HIT' ? AVG_BYTES * 1.6 : status === 'DYNAMIC' ? AVG_BYTES * 0.3 : AVG_BYTES
    return { status, requests: count, bytes: Math.round(count * bytesPer) }
  })
}

const previewSummary = (params, context) => {
  const rows = statusRows(params, context)
  const requests = rows.reduce((sum, row) => sum + row.requests, 0)
  const bytes = rows.reduce((sum, row) => sum + row.bytes, 0)
  const cached = rows.filter((row) => CACHED_STATUSES.has(row.status))
  const cachedRequests = cached.reduce((sum, row) => sum + row.requests, 0)
  const cachedBytes = cached.reduce((sum, row) => sum + row.bytes, 0)
  return {
    requests,
    cachedRequests,
    bytes,
    cachedBytes,
    originRequests: requests - cachedRequests,
    originBytes: bytes - cachedBytes,
  }
}

const previewStatusSeries = (params, context) => {
  const random = createRandom(previewSeed('cache-series', params))
  const totals = statusRows(params, context)
  const buckets = previewBuckets(params, random)
  const waveSum = buckets.reduce((sum, bucket) => sum + bucket.wave * bucket.jitter, 0) || 1
  return buckets.map((bucket) => {
    const weight = (bucket.wave * bucket.jitter) / waveSum
    const point = { timestamp: new Date(bucket.timestamp).toISOString() }
    for (const row of totals) {
      point[row.status.toLowerCase()] = Math.round(row.requests * weight * (0.9 + random() * 0.2))
    }
    return point
  })
}

const previewBandwidthSeries = (params, context) =>
  previewStatusSeries(params, context).map((point) => {
    const cached = (point.hit + point.stale + point.updating + point.revalidated) * AVG_BYTES * 1.6
    const uncached = (point.miss + point.expired + point.bypass) * AVG_BYTES + point.dynamic * AVG_BYTES * 0.3
    return { timestamp: point.timestamp, cachedBytes: Math.round(cached), uncachedBytes: Math.round(uncached) }
  })

const previewContentTypes = (params, context) => {
  const random = createRandom(previewSeed('cache-types', params))
  const { requests, bytes } = previewSummary(params, context)
  const rows = CONTENT_TYPES.map((type) => {
    const count = requests * type.share * (0.85 + random() * 0.3)
    const hitRatio = Math.min(0.995, Math.max(0.02, type.hit + (random() - 0.5) * 0.08))
    return { contentType: type.contentType, count, weight: count * type.avgBytes, hitRatio }
  })
  const countSum = rows.reduce((sum, row) => sum + row.count, 0) || 1
  const weightSum = rows.reduce((sum, row) => sum + row.weight, 0) || 1
  return rows.map((row) => ({
    contentType: row.contentType,
    requests: Math.round((row.count / countSum) * requests),
    bytes: Math.round((row.weight / weightSum) * bytes),
    hitRatio: Number((row.hitRatio * 100).toFixed(1)),
  })).sort((a, b) => b.requests - a.requests)
}

const previewTopMissUrls = (params, context) => {
  const random = createRandom(previewSeed('cache-miss', params))
  const { requests } = previewTotals(params, context)
  const hosts = (context.sites || []).map((site) => site.domain).filter(Boolean)
  return MISS_PATHS.map((path, index) => {
    const misses = Math.round((requests * 0.02 * (1 - index * 0.07)) * (0.7 + random() * 0.6))
    const total = Math.round(misses / (0.15 + random() * 0.8))
    const suffix = path.endsWith('=') ? Math.floor(random() * 900 + 100) : ''
    return {
      host: hosts.length ? pick(random, hosts) : 'example.com',
      url: `${path}${suffix}`,
      misses,
      requests: total,
      hitRatio: Number((((total - misses) / Math.max(total, 1)) * 100).toFixed(1)),
    }
  }).sort((a, b) => b.misses - a.misses).slice(0, 10)
}

const previewSites = (params, context) => {
  const random = createRandom(previewSeed('cache-sites', params))
  const { requests, cachedBytes } = previewSummary(params, context)
  const list = (context.sites || []).filter((site) => params.siteId === 'all' || !params.siteId || String(site.id) === String(params.siteId))
  const sites = list.length ? list : [{ id: 0, domain: 'example.com' }]
  const rows = sites.map((site) => {
    const hitRatio = 55 + random() * 38
    return {
      site,
      share: 0.4 + random() * 1.2,
      hitRatio,
      byteHitRatio: Math.min(99, hitRatio + 4 + random() * 8),
    }
  })
  const shareSum = rows.reduce((sum, row) => sum + row.share, 0) || 1
  const savedSum = rows.reduce((sum, row) => sum + row.share * row.byteHitRatio, 0) || 1
  return rows.map((row) => ({
    siteId: row.site.id,
    domain: row.site.domain,
    requests: Math.round((row.share / shareSum) * requests),
    hitRatio: Number(row.hitRatio.toFixed(1)),
    byteHitRatio: Number(row.byteHitRatio.toFixed(1)),
    savedBytes: Math.round(((row.share * row.byteHitRatio) / savedSum) * cachedBytes),
  })).sort((a, b) => b.requests - a.requests)
}

export const fetchCacheSummary = (params = {}, context = {}) =>
  withPreviewFallback(
    () => apiRequest(`/analytics/cache/summary${buildQuery(params)}`),
    () => previewSummary(params, context),
  )

export const fetchCacheSeries = (metric, params = {}, context = {}) =>
  withPreviewFallback(
    () => apiRequest(`/analytics/cache/series/${metric}${buildQuery(params)}`),
    () => (metric === 'bandwidth' ? previewBandwidthSeries(params, context) : previewStatusSeries(params, context)),
  )

export const fetchCacheGroup = (group, params = {}, context = {}) =>
  withPreviewFallback(
    () => apiRequest(`/analytics/cache/summary/${group}${buildQuery(params)}`),
    () => {
      if (group === 'status') return statusRows(params, context)
      if (group === 'content-types') return previewContentTypes(params, context)
      if (group === 'top-miss-urls') return previewTopMissUrls(params, context)
      if (group === 'sites') return previewSites(params, context)
      return []
    },
  )

export const isCachedStatus = (status) => CACHED_STATUSES.has(String(status || '').toUpperCase())
