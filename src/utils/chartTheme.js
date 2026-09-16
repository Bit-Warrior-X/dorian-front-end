/** ApexCharts theme helpers — sync with app dark mode (true black). */

export function isDarkTheme() {
  if (typeof document === 'undefined') return false
  return document.documentElement.getAttribute('data-theme') === 'dark'
}

export function getApexTooltipTheme() {
  return isDarkTheme() ? 'dark' : 'light'
}

export function getApexChartColors() {
  return isDarkTheme()
    ? {
        grid: 'rgba(255, 255, 255, 0.08)',
        label: '#a3a3a3',
        chartBg: '#0a0a0a',
      }
    : {
        grid: 'rgba(148, 163, 184, 0.35)',
        label: '#64748b',
        chartBg: '#ffffff',
      }
}

export function getApexFontFamily() {
  if (typeof document === 'undefined') return 'Inter, system-ui, sans-serif'
  const value = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim()
  return value || 'Inter, system-ui, sans-serif'
}

export function getApexAxisLabelStyle(fontSize = '11px') {
  return { colors: getApexChartColors().label, fontSize, fontFamily: getApexFontFamily() }
}

/** Shared Apex options for chart background, grid, labels, tooltip. */
export function getApexBaseChartOptions() {
  const colors = getApexChartColors()
  const dark = isDarkTheme()
  return {
    chart: {
      background: colors.chartBg,
      foreColor: colors.label,
      fontFamily: getApexFontFamily(),
    },
    theme: {
      mode: dark ? 'dark' : 'light',
    },
    grid: {
      borderColor: colors.grid,
      strokeDashArray: 6,
      padding: {
        left: 4,
        right: 12,
      },
    },
    tooltip: {
      theme: getApexTooltipTheme(),
    },
  }
}

/** Patch object for live theme toggle on existing chart instances. */
export function getApexThemePatch() {
  const colors = getApexChartColors()
  const base = getApexBaseChartOptions()
  const labelStyle = getApexAxisLabelStyle()
  return {
    ...base,
    xaxis: {
      labels: { style: labelStyle },
    },
    yaxis: {
      labels: { style: { colors: colors.label } },
    },
  }
}

function toPointTs(point) {
  if (Array.isArray(point)) return Number(point[0])
  if (point && typeof point === 'object') return Number(point.x)
  return NaN
}

function toPointValue(point) {
  if (Array.isArray(point)) return Number(point[1]) || 0
  if (point && typeof point === 'object') return Number(point.y) || 0
  return 0
}

function makePoint(ts, value, asObject) {
  if (asObject) return { x: ts, y: value }
  return [ts, value]
}

/**
 * Format a tick for a time window — denser clocks for short ranges,
 * date+time when the window spans days.
 */
export function formatApexTimeTick(ms, startMs, endMs) {
  const d = new Date(Number(ms))
  if (Number.isNaN(d.getTime())) return ''
  const span = Math.max(0, Number(endMs) - Number(startMs))
  if (span <= 3 * 60 * 60 * 1000) {
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }
  if (span <= 48 * 60 * 60 * 1000) {
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Datetime-like x-axis that always includes the exact range start and end.
 * ApexCharts' default `type: 'datetime'` tick generation often skips min/max,
 * which leaves the window edges unlabeled and looking clipped.
 *
 * Uses numeric axis + forceNiceScale:false so ticks are evenly spaced
 * from min → max (first and last labels = selected window).
 */
export function getApexDatetimeXaxis(startMs, endMs, opts = {}) {
  const start = Number(startMs)
  const end = Number(endMs)
  const safeEnd = Number.isFinite(end) && end > start ? end : start + 1
  const tickCount = Math.max(2, opts.tickCount ?? 7)
  const colors = getApexChartColors()
  const labelStyle = getApexAxisLabelStyle(opts.fontSize || '10px')

  return {
    type: 'numeric',
    min: start,
    max: safeEnd,
    tickAmount: tickCount - 1,
    forceNiceScale: false,
    decimalsInFloat: 0,
    axisBorder: {
      show: true,
      color: colors.grid,
      height: 1,
    },
    axisTicks: {
      show: true,
      color: colors.grid,
      height: 4,
    },
    labels: {
      show: true,
      hideOverlappingLabels: true,
      showDuplicates: false,
      trim: false,
      rotate: 0,
      style: labelStyle,
      formatter: (value) => formatApexTimeTick(value, start, safeEnd),
    },
    tooltip: {
      enabled: true,
      formatter: (value) => formatApexTimeTick(value, start, safeEnd),
    },
  }
}

/**
 * Extend each series so it has points on the range start and end.
 * Keeps the line flush with both chart edges for the selected window.
 */
export function padSeriesToTimeRange(series, startMs, endMs, opts = {}) {
  const start = Number(startMs)
  const end = Number(endMs)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return series
  }
  const fillValue = opts.fillValue
  const list = Array.isArray(series) ? series : []

  return list.map((entry) => {
    const raw = Array.isArray(entry?.data) ? [...entry.data] : []
    if (!raw.length) {
      const empty = fillValue == null ? 0 : Number(fillValue) || 0
      return {
        ...entry,
        data: [makePoint(start, empty, true), makePoint(end, empty, true)],
      }
    }

    const asObject = !Array.isArray(raw[0])
    const sorted = raw
      .map((p) => makePoint(toPointTs(p), toPointValue(p), asObject))
      .filter((p) => Number.isFinite(toPointTs(p)))
      .sort((a, b) => toPointTs(a) - toPointTs(b))

    if (!sorted.length) {
      const empty = fillValue == null ? 0 : Number(fillValue) || 0
      return {
        ...entry,
        data: [makePoint(start, empty, true), makePoint(end, empty, true)],
      }
    }

    const firstTs = toPointTs(sorted[0])
    const lastTs = toPointTs(sorted[sorted.length - 1])
    const startVal = fillValue == null ? toPointValue(sorted[0]) : Number(fillValue) || 0
    const endVal = fillValue == null ? toPointValue(sorted[sorted.length - 1]) : Number(fillValue) || 0

    if (firstTs > start) {
      sorted.unshift(makePoint(start, startVal, asObject))
    }
    if (lastTs < end) {
      sorted.push(makePoint(end, endVal, asObject))
    }

    return { ...entry, data: sorted }
  })
}

/** Optional vertical guides at the selected window edges. */
export function getApexTimeRangeAnnotations(startMs, endMs) {
  const colors = getApexChartColors()
  const start = Number(startMs)
  const end = Number(endMs)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return {}
  return {
    xaxis: [
      {
        x: start,
        borderColor: colors.label,
        strokeDashArray: 3,
        opacity: 0.45,
      },
      {
        x: end,
        borderColor: colors.label,
        strokeDashArray: 3,
        opacity: 0.45,
      },
    ],
  }
}
