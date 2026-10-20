import { apiRequest } from './client'
import {
  createRandom,
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

const round1 = (value) => Number(value.toFixed(1))

const previewBase = (params, context = {}) => {
  const random = createRandom(previewSeed('perf-base', params))
  const known = Number(context.totalRequests)
  return {
    random,
    requests: Number.isFinite(known) ? known : Math.round(scaleFor(params) * 52000 * (0.9 + random() * 0.2)),
    edgeP50: 18 + random() * 14,
    originP50: 120 + random() * 90,
    errorRate: 0.2 + random() * 0.9,
  }
}

const previewSummary = (params, context) => {
  const base = previewBase(params, context)
  const originRequests = Math.round(base.requests * 0.3)
  const origin5xx = Math.round(originRequests * (base.errorRate / 100))
  const originTimeouts = Math.round(origin5xx * 0.18)
  return {
    requests: base.requests,
    edgeResponseP50Ms: round1(base.edgeP50),
    edgeResponseP95Ms: round1(base.edgeP50 * 4.6),
    edgeResponseP99Ms: round1(base.edgeP50 * 11),
    originResponseP50Ms: round1(base.originP50),
    originResponseP95Ms: round1(base.originP50 * 3.4),
    originRequests,
    origin5xx,
    originTimeouts,
    originErrorRate: Number(((origin5xx / Math.max(originRequests, 1)) * 100).toFixed(2)),
  }
}

const latencySeries = (params, scope, p50Base, spread) => {
  const random = createRandom(previewSeed(scope, params))
  return previewBuckets(params, random).map((bucket) => {
    const load = 0.75 + bucket.wave * 0.5
    const spike = random() > 0.96 ? 1.8 + random() * 1.5 : 1
    const p50 = p50Base * load * bucket.jitter
    return {
      timestamp: new Date(bucket.timestamp).toISOString(),
      p50: round1(p50),
      p95: round1(p50 * spread * spike),
      p99: round1(p50 * spread * 2.3 * spike),
    }
  })
}

const previewOriginStatusSeries = (params, context) => {
  const base = previewBase(params, context)
  const random = createRandom(previewSeed('perf-origin-status', params))
  const buckets = previewBuckets(params, random)
  const perBucket = (base.requests * 0.3) / buckets.length
  return buckets.map((bucket) => {
    const total = perBucket * bucket.wave * bucket.jitter * 1.3
    const burst = random() > 0.95 ? 4 + random() * 6 : 1
    const s5xx = total * (base.errorRate / 100) * burst
    return {
      timestamp: new Date(bucket.timestamp).toISOString(),
      s2xx: Math.round(total * 0.86),
      s3xx: Math.round(total * 0.06),
      s4xx: Math.round(total * 0.07),
      s5xx: Math.round(s5xx),
      timeouts: Math.round(s5xx * 0.18),
    }
  })
}

const previewEdges = (params, context) => {
  const base = previewBase(params, context)
  const random = createRandom(previewSeed('perf-edges', params))
  const servers = (context.servers || []).filter(
    (server) => !params.serverId || params.serverId === 'all' || String(server.id) === String(params.serverId),
  )
  const list = servers.length ? servers : [{ id: 0, name: 'edge-1' }]
  return list.map((server) => {
    const p50 = base.edgeP50 * (0.7 + random() * 0.7)
    return {
      serverId: server.id,
      name: server.name || `Server ${server.id}`,
      requests: Math.round((base.requests / list.length) * (0.6 + random() * 0.8)),
      p50Ms: round1(p50),
      p95Ms: round1(p50 * (3.8 + random() * 1.8)),
      errorRate: round1(base.errorRate * (0.4 + random() * 1.2) * 0.3),
    }
  }).sort((a, b) => b.requests - a.requests)
}

const previewOrigins = (params, context) => {
  const base = previewBase(params, context)
  const random = createRandom(previewSeed('perf-origins', params))
  const sites = (context.sites || []).filter(
    (site) => !params.siteId || params.siteId === 'all' || String(site.id) === String(params.siteId),
  )
  const list = sites.length ? sites : [{ id: 0, domain: 'example.com' }]
  return list.map((site) => {
    const requests = Math.round(((base.requests * 0.3) / list.length) * (0.5 + random()))
    const errorRate = base.errorRate * (0.3 + random() * 1.6)
    const p50 = base.originP50 * (0.6 + random() * 0.9)
    return {
      siteId: site.id,
      domain: site.domain,
      requests,
      p50Ms: round1(p50),
      p95Ms: round1(p50 * (2.6 + random() * 1.6)),
      errorRate: round1(errorRate),
      timeouts: Math.round(requests * (errorRate / 100) * 0.18),
    }
  }).sort((a, b) => b.p95Ms - a.p95Ms)
}

export const fetchPerformanceSummary = (params = {}, context = {}) =>
  withPreviewFallback(
    () => apiRequest(`/analytics/performance/summary${buildQuery(params)}`),
    () => previewSummary(params, context),
  )

export const fetchPerformanceSeries = (metric, params = {}, context = {}) =>
  withPreviewFallback(
    () => apiRequest(`/analytics/performance/series/${metric}${buildQuery(params)}`),
    () => {
      const base = previewBase(params, context)
      if (metric === 'edge-response') return latencySeries(params, 'perf-edge', base.edgeP50, 4.6)
      if (metric === 'origin-response') return latencySeries(params, 'perf-origin', base.originP50, 3.4)
      if (metric === 'origin-status') return previewOriginStatusSeries(params, context)
      return []
    },
  )

export const fetchPerformanceGroup = (group, params = {}, context = {}) =>
  withPreviewFallback(
    () => apiRequest(`/analytics/performance/summary/${group}${buildQuery(params)}`),
    () => {
      if (group === 'edges') return previewEdges(params, context)
      if (group === 'origins') return previewOrigins(params, context)
      return []
    },
  )
