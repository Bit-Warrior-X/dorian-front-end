export const formatNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.round(numeric).toLocaleString() : '0'
}

export const formatCompact = (value) => {
  const numeric = Number(value) || 0
  const abs = Math.abs(numeric)
  if (abs >= 1e9) return `${(numeric / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}B`
  if (abs >= 1e6) return `${(numeric / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`
  if (abs >= 1e3) return `${(numeric / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}K`
  return `${Math.round(numeric)}`
}

export const formatBytes = (value) => {
  let numeric = Math.max(0, Number(value) || 0)
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let index = 0
  while (numeric >= 1024 && index < units.length - 1) {
    numeric /= 1024
    index += 1
  }
  return `${numeric.toFixed(numeric >= 100 || index === 0 ? 0 : 1)} ${units[index]}`
}

export const formatPercent = (value, digits) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  const places = digits ?? (Math.abs(numeric) >= 10 ? 1 : 2)
  return `${numeric.toFixed(places)}%`
}

export const ratioPercent = (part, total) => {
  const denominator = Number(total) || 0
  return denominator > 0 ? ((Number(part) || 0) / denominator) * 100 : 0
}

export const formatMs = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(2)} s`
  return `${numeric.toFixed(numeric >= 100 ? 0 : 1)} ms`
}
