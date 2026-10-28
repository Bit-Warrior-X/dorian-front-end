<template>
  <div ref="host" class="analytics-time-chart"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ApexCharts from 'apexcharts'
import {
  formatApexTimeTick,
  getApexChartColors,
  getApexDatetimeXaxis,
  getApexFontFamily,
  getApexTooltipTheme,
  padSeriesToTimeRange,
} from '@/utils/chartTheme'

const props = defineProps({
  series: { type: Array, default: () => [] },
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  type: { type: String, default: 'area' },
  stacked: { type: Boolean, default: false },
  height: { type: Number, default: 300 },
  yFormatter: { type: Function, default: (value) => `${Math.round(value)}` },
  legend: { type: Boolean, default: true },
})

const host = ref(null)
let chart = null

const buildOptions = () => {
  const theme = getApexChartColors()
  const paddedSeries = padSeriesToTimeRange(props.series, props.start, props.end)
  return {
    chart: {
      type: props.type,
      height: props.height,
      stacked: props.stacked,
      toolbar: { show: false },
      zoom: { enabled: false },
      selection: { enabled: false },
      background: 'transparent',
      foreColor: theme.label,
      fontFamily: getApexFontFamily(),
      animations: { enabled: true, easing: 'easeinout', speed: 450 },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: props.type === 'area' && props.stacked ? 1.5 : 2.2, lineCap: 'round' },
    fill:
      props.type === 'area'
        ? { type: 'gradient', gradient: { shadeIntensity: 0.3, opacityFrom: props.stacked ? 0.55 : 0.38, opacityTo: props.stacked ? 0.18 : 0.04, stops: [0, 80, 100] } }
        : { type: 'solid', opacity: 1 },
    colors: paddedSeries.map((entry) => entry.color),
    xaxis: {
      ...getApexDatetimeXaxis(props.start, props.end, { tickCount: 7 }),
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      crosshairs: { show: true, stroke: { color: theme.crosshair, width: 1, dashArray: 4 } },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      tickAmount: 4,
      labels: { style: { colors: theme.label, fontSize: '10px' }, formatter: props.yFormatter },
    },
    grid: {
      borderColor: theme.grid,
      strokeDashArray: 3,
      padding: { left: 8, right: 14, top: 0, bottom: 0 },
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: {
      show: props.legend && paddedSeries.length > 1,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
      labels: { colors: theme.label },
      markers: { width: 8, height: 8, radius: 2 },
    },
    tooltip: {
      theme: getApexTooltipTheme(),
      shared: true,
      intersect: false,
      x: { formatter: (value) => formatApexTimeTick(value, props.start, props.end) },
      y: { formatter: props.yFormatter },
    },
    series: paddedSeries.map((entry) => ({ name: entry.name, data: entry.data })),
  }
}

const render = () => {
  if (!host.value) return
  const options = buildOptions()
  if (chart) {
    chart.updateOptions(options, true, true)
  } else {
    chart = new ApexCharts(host.value, options)
    chart.render()
  }
}

watch(() => [props.series, props.start, props.end], render, { deep: true })

onMounted(() => {
  render()
  window.addEventListener('cdnproxy-theme-change', render)
})

onBeforeUnmount(() => {
  window.removeEventListener('cdnproxy-theme-change', render)
  chart?.destroy()
  chart = null
})
</script>

<style scoped>
.analytics-time-chart {
  width: 100%;
  min-height: 1px;
}
</style>
