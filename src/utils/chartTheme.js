/** ApexCharts theme helpers — Dorian CDN operator console. */

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
        grid: 'rgba(232, 237, 233, 0.07)',
        label: '#8B978F',
        chartBg: 'transparent',
        axis: 'rgba(232, 237, 233, 0.1)',
        crosshair: 'rgba(63, 189, 133, 0.35)',
        tooltipBg: '#171F1B',
        tooltipBorder: '#232D28',
      }
    : {
        grid: 'rgba(15, 23, 42, 0.07)',
        label: '#64748b',
        chartBg: 'transparent',
        axis: 'rgba(15, 23, 42, 0.1)',
        crosshair: 'rgba(46, 158, 108, 0.3)',
        tooltipBg: '#ffffff',
        tooltipBorder: '#e2e8f0',
      }
}

/**
 * Production series palette — cool CDN tones anchored on Viper green.
 * Avoids neon SaaS purple / electric cyan.
 */
export function getApexSeriesColors() {
  if (isDarkTheme()) {
    const palette = {
      viper: '#3FBD85',
      viperDeep: '#2E9E6C',
      viperSoft: '#6BCFA0',
      l4: '#6B9FD4',
      l7: '#8FA3B8',
      teal: '#4FA8A0',
      sand: '#C4A574',
      warn: '#D4A24A',
      danger: '#D95B4E',
      success: '#4FBD7A',
      muted: '#6E7A73',
      slate: '#7D8B96',
    }
    // Legacy aliases used by Analytics / Security views
    return { ...palette, gold: palette.sand, cyan: palette.teal }
  }
  const palette = {
    viper: '#2E9E6C',
    viperDeep: '#1F6E4A',
    viperSoft: '#3FBD85',
    l4: '#4A86C7',
    l7: '#6B7C8F',
    teal: '#3D8F88',
    sand: '#A8894E',
    warn: '#B8862E',
    danger: '#C94A3D',
    success: '#3FA86A',
    muted: '#6B756F',
    slate: '#64748B',
  }
  return { ...palette, gold: palette.sand, cyan: palette.teal }
}

/** Ordered multi-series line palette — readable on dark panels, low clash. */
export function getApexLinePalette() {
  const c = getApexSeriesColors()
  return [c.viper, c.l4, c.teal, c.sand, c.l7, c.warn, c.danger, c.viperSoft, c.slate, c.muted]
}

export function getApexPiePalette() {
  const c = getApexSeriesColors()
  return [
    c.viper,
    c.l4,
    c.teal,
    c.sand,
    c.l7,
    c.warn,
    c.danger,
    c.viperDeep,
    c.slate,
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
        width: opts.width ?? 2,
      },
      fill: {
        type: 'solid',
        opacity: 1,
      },
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: { size: 3.5 },
      },
    }
  }

  return {
    stroke: {
      ...stroke,
      width: opts.width ?? 1.75,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: isDarkTheme() ? 'dark' : 'light',
        type: 'vertical',
        shadeIntensity: 0.2,
        opacityFrom: opts.opacityFrom ?? 0.22,
        opacityTo: opts.opacityTo ?? 0.02,
        stops: [0, 85, 100],
      },
    },
    markers: {
      size: 0,
      strokeWidth: 0,
      hover: { size: 3.5 },
    },
  }
}

export function getApexFontFamily() {
  if (typeof document === 'undefined') return 'Inter, system-ui, sans-serif'
  const value = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim()
  return value || 'Inter, system-ui, sans-serif'
}

export function getApexMonoFontFamily() {
  if (typeof document === 'undefined') return 'JetBrains Mono, ui-monospace, monospace'
  const value = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()
  return value || 'JetBrains Mono, ui-monospace, monospace'
}

export function getApexAxisLabelStyle(fontSize = '11px') {
  return {
    colors: getApexChartColors().label,
    fontSize,
    fontFamily: getApexMonoFontFamily(),
    fontWeight: 450,
  }
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
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 450,
        animateGradually: { enabled: true, delay: 80 },
        dynamicAnimation: { enabled: true, speed: 280 },
      },
    },
    theme: {
      mode: dark ? 'dark' : 'light',
    },
    grid: {
      borderColor: colors.grid,
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: {
        left: 4,
        right: 12,
        top: 8,
        bottom: 0,
      },
    },
    tooltip: {
      theme: getApexTooltipTheme(),
      style: {
        fontSize: '12px',
        fontFamily: getApexFontFamily(),
      },
    },
    legend: {
      labels: {
        colors: colors.label,
      },
      fontFamily: getApexFontFamily(),
      fontSize: '11px',
      markers: {
        width: 8,
        height: 8,
        radius: 2,
      },
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
      axisBorder: { color: colors.axis },
      axisTicks: { color: colors.axis },
    },
    yaxis: {
      labels: { style: { colors: colors.label, fontFamily: getApexMonoFontFamily() } },
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
      color: colors.axis,
      height: 1,
    },
    axisTicks: {
      show: true,
      color: colors.axis,
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
        borderColor: colors.axis,
        strokeDashArray: 3,
        opacity: 0.55,
      },
      {
        x: end,
        borderColor: colors.axis,
        strokeDashArray: 3,
        opacity: 0.55,
      },
    ],
  }
}
