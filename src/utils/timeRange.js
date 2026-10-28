export const sharedTimeRanges = [
  { label: '1H', value: '1h' },
  { label: '2H', value: '2h' },
  { label: '4H', value: '4h' },
  { label: '12H', value: '12h' },
  { label: '1D', value: '1d' },
  { label: '2D', value: '2d' },
  { label: '7D', value: '7d' },
  { label: '1M', value: '1m' },
]

const STORAGE_KEY = 'dorian.timeRange'
const DEFAULT_RANGE = '4h'

/** Ranges ≤ 12h are safe to remember across navigation. */
const PERSISTABLE_RANGES = new Set(['1h', '2h', '4h', '12h'])

/** Longer windows pull much more series data — do not sticky-restore them. */
const HEAVY_RANGES = new Set(['1d', '2d', '7d', '1m', '24h', '48h'])

export function isHeavyTimeRange(value) {
  return HEAVY_RANGES.has(String(value || '').trim().toLowerCase())
}

export function isPersistableTimeRange(value) {
  return PERSISTABLE_RANGES.has(String(value || '').trim().toLowerCase())
}

export function readSharedTimeRange() {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY)
    if (isPersistableTimeRange(value)) return value
    // Legacy sticky 7d/1m (or unknown) → fall back to a light default.
    if (value && sharedTimeRanges.some((range) => range.value === value)) {
      return DEFAULT_RANGE
    }
  } catch {
    // sessionStorage can be unavailable
  }
  return DEFAULT_RANGE
}

export function writeSharedTimeRange(value) {
  if (!sharedTimeRanges.some((range) => range.value === value)) return
  // Heavy ranges still apply for the current visit, but do not overwrite the
  // last light range so revisiting Analytics stays fast.
  if (!isPersistableTimeRange(value)) return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, value)
  } catch {
    // ignore
  }
}

export function rangeDurationMs(value) {
  switch (value) {
    case '30m':
      return 30 * 60 * 1000
    case '1h':
      return 60 * 60 * 1000
    case '2h':
      return 2 * 60 * 60 * 1000
    case '4h':
      return 4 * 60 * 60 * 1000
    case '6h':
      return 6 * 60 * 60 * 1000
    case '8h':
      return 8 * 60 * 60 * 1000
    case '12h':
      return 12 * 60 * 60 * 1000
    case '24h':
    case '1d':
    case 'yesterday':
      return 24 * 60 * 60 * 1000
    case '48h':
    case '2d':
      return 2 * 24 * 60 * 60 * 1000
    case '7d':
      return 7 * 24 * 60 * 60 * 1000
    case '1m':
      return 30 * 24 * 60 * 60 * 1000
    case 'today': {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return Math.max(60 * 1000, now.getTime() - start.getTime())
    }
    default:
      return 4 * 60 * 60 * 1000
  }
}
