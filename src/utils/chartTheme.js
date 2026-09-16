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
        grid: 'rgba(148, 163, 184, 0.28)',
        label: '#64748b',
        chartBg: '#ffffff',
      }
}

/**
 * Production series palette (Dorian brand).
 * Tuned for dark/light contrast — not neon SaaS purple.
 */
export function getApexSeriesColors() {
  if (isDarkTheme()) {
    return {
      viper: '#3FBD85',
      viperDeep: '#2E9E6C',
      l4: '#6BA8F5',
      l7: '#B89AF5',
      gold: '#D4B05C',
      warn: '#E0A83F',
      danger: '#E15241',
      success: '#4FBD7A',
      muted: '#8B978F',
      cyan: '#5BB8C9',
    }
  }
  return {
    viper: '#2E9E6C',
    viperDeep: '#1F6E4A',
    l4: '#3B82F6',
    l7: '#8B6FCF',
    gold: '#B8923E',
    warn: '#C9922E',
    danger: '#D14335',
    success: '#3FA86A',
    muted: '#6B756F',
    cyan: '#3A9AAB',
  }
}

/** Ordered multi-series line palette for production charts. */
export function getApexLinePalette() {
  const c = getApexSeriesColors()
  return [c.viper, c.l4, c.l7, c.gold, c.cyan, c.warn, c.danger, c.success, c.muted]
}

export function getApexPiePalette() {
  const c = getApexSeriesColors()
  return [
    c.viper,
    c.l4,
    c.gold,
    c.danger,
    c.l7,
    c.warn,
    c.success,
    c.viperDeep,
    c.cyan,
    c.muted,
  ]
}

/** HTTP status family colors: 2xx / 3xx / 4xx / 5xx */
export function getApexStatusPalette() {
  const c = getApexSeriesColors()
  return [c.success, c.l4, c.warn, c.danger]
}

/** Shared stroke styles for production charts. */
export function getApexProductionStrokeFill(opts = {}) {
  const width = opts.width ?? 2
  const curve = opts.curve ?? 'smooth'
  const variant = opts.variant ?? (opts.opacityFrom != null && opts.opacityFrom <= 0.15 ? 'line' : 'area')

  const stroke = {
    curve,
    width,
    lineCap: 'round',
    show: true,
  }

  // ApexCharts Line.js uses fill.fillPath() as the *stroke paint* for type:'line'.
  // That path applies fill.opacity to the stroke color (hexToRgba). So opacity:0
  // makes lines fully transparent while tooltips/markers still work. Gradient fill
  // on line charts is also wrong — stroke becomes a gradient URL.
  // Use solid + opacity 1 so strokes stay opaque; no area path is drawn for lines.
  if (variant === 'line') {
    return {
      stroke: {
        ...stroke,
        width: opts.width ?? 2.5,
      },
      fill: {
        type: 'solid',
        opacity: 1,
      },
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: { size: 4 },
      },
    }
  }

  return {
    stroke,
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0.4,
        opacityFrom: opts.opacityFrom ?? 0.28,
        opacityTo: opts.opacityTo ?? 0.04,
        stops: [0, 90, 100],
      },
    },
    markers: {
      size: 0,
      strokeWidth: 0,
      hover: { size: 4 },
    },
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
      strokeDashArray: 4,
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
  const series = getApexSeriesColors()
  return {
    ...base,
    colors: getApexLinePalette(),
    xaxis: {
      labels: { style: labelStyle },
    },
    yaxis: {
      labels: { style: { colors: colors.label } },
    },
    // Keep theme patches aware of brand series for consumers that merge shallowly.
    __seriesColors: series,
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
