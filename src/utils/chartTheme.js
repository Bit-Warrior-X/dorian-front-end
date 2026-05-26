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

export function getApexAxisLabelStyle(fontSize = '13px') {
  return { colors: getApexChartColors().label, fontSize }
}

/** Shared Apex options for chart background, grid, labels, tooltip. */
export function getApexBaseChartOptions() {
  const colors = getApexChartColors()
  const dark = isDarkTheme()
  return {
    chart: {
      background: colors.chartBg,
      foreColor: colors.label,
    },
    theme: {
      mode: dark ? 'dark' : 'light',
    },
    grid: {
      borderColor: colors.grid,
      strokeDashArray: 6,
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
