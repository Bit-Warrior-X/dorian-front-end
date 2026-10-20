import { rangeDurationMs } from '@/utils/timeRange'

const PREVIEW_STATUSES = new Set([404, 405, 501])

export const isMissingEndpoint = (error) => PREVIEW_STATUSES.has(Number(error?.status))

/**
 * Calls the live endpoint and falls back to generated preview data while the
 * backend does not implement it yet. Resolves to `{ data, preview }`.
 */
export const withPreviewFallback = async (request, buildPreview) => {
  try {
    return { data: await request(), preview: false }
  } catch (error) {
    if (!isMissingEndpoint(error)) throw error
    return { data: buildPreview(), preview: true }
  }
}

export const createRandom = (seedText) => {
  let seed = 2166136261
  for (const char of String(seedText)) {
    seed ^= char.charCodeAt(0)
    seed = Math.imul(seed, 16777619)
  }
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const previewSeed = (scope, params = {}) =>
  [scope, params.serverId || 'all', params.siteId || 'all', params.range || '', params.start || '', params.end || ''].join('|')

export const resolvePreviewWindow = (params = {}) => {
  if (params.start && params.end) {
    const start = new Date(params.start).getTime()
    const end = new Date(params.end).getTime()
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) return { start, end }
  }
  const end = Date.now()
  return { start: end - rangeDurationMs(params.range), end }
}

/** Evenly spaced buckets with a day/night wave, so charts look like real traffic. */
export const previewBuckets = (params, random, count = 72) => {
  const { start, end } = resolvePreviewWindow(params)
  const step = (end - start) / count
  return Array.from({ length: count }, (_, index) => {
    const timestamp = Math.round(start + step * (index + 0.5))
    const hour = new Date(timestamp).getUTCHours() + 3
    const wave = 0.62 + 0.38 * Math.sin(((hour - 8) / 24) * Math.PI * 2)
    return { timestamp, wave, jitter: 0.85 + random() * 0.3 }
  })
}

export const pick = (random, list) => list[Math.floor(random() * list.length) % list.length]

export const scaleFor = (params = {}) => {
  const { start, end } = resolvePreviewWindow(params)
  const hours = (end - start) / 3600000
  const siteFactor = params.siteId && params.siteId !== 'all' ? 0.35 : 1
  const serverFactor = params.serverId && params.serverId !== 'all' ? 0.5 : 1
  return Math.max(1, hours) * siteFactor * serverFactor
}
