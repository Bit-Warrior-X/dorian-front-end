<template>
  <section class="edge-nic" aria-label="Interface traffic">
    <header class="edge-nic__head">
      <div>
        <p class="edge-nic__kicker">Interface</p>
        <h4>Receive and send</h4>
      </div>
      <span class="edge-nic__range">{{ rangeLabel }}</span>
    </header>
    <p v-if="loadError" class="edge-nic__empty">{{ loadError }}</p>
    <p v-else-if="!hasSamples && !loading" class="edge-nic__empty">No interface samples in this range.</p>
    <div v-show="hasSamples" class="edge-nic__grid">
      <div>
        <p>Receive</p>
        <div ref="rxChart"></div>
      </div>
      <div>
        <p>Send</p>
        <div ref="txChart"></div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ApexCharts from 'apexcharts'
import { fetchBandwidthNicRxSeries, fetchBandwidthNicTxSeries } from '@/api/dashboard'
import {
  getApexAxisLabelStyle,
  getApexBaseChartOptions,
  getApexDatetimeXaxis,
  getApexSeriesColors,
  getApexTimeRangeAnnotations,
  padSeriesToTimeRange,
} from '@/utils/chartTheme'
import { rangeDurationMs, readSharedTimeRange, sharedTimeRanges } from '@/utils/timeRange'

const props = defineProps({
  serverId: {
    type: [Number, String],
    required: true,
  },
})

const rxChart = ref(null)
const txChart = ref(null)
const loading = ref(false)
const loadError = ref('')
const hasSamples = ref(false)
const range = ref(readSharedTimeRange())

let rxInstance = null
let txInstance = null
let timer = 0

const rangeLabel = computed(() =>
  sharedTimeRanges.find((item) => item.value === range.value)?.label || range.value,
)

const formatBandwidthValue = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 Kbps'
  if (numeric >= 1024 * 1024) return `${(numeric / (1024 * 1024)).toFixed(1)} Gbps`
  if (numeric >= 1024) return `${(numeric / 1024).toFixed(1)} Mbps`
  return `${Math.round(numeric)} Kbps`
}

const pointsForServer = (payload) => {
  const rows = Array.isArray(payload) ? payload : []
  const match = rows.find((row) => String(row?.serverId) === String(props.serverId)) || rows[0]
  const points = Array.isArray(match?.points) ? match.points : []
  return points
    .map((point) => ({ x: new Date(point.timestamp).getTime(), y: Number(point.bandwidth ?? 0) }))
    .filter((point) => Number.isFinite(point.x))
    .sort((a, b) => a.x - b.x)
}

const destroyCharts = () => {
  rxInstance?.destroy()
  txInstance?.destroy()
  rxInstance = null
  txInstance = null
}

const renderChart = (el, existing, name, data, color) => {
  const now = Date.now()
  const startMs = now - rangeDurationMs(range.value)
  const base = getApexBaseChartOptions()
  const options = {
    ...base,
    chart: {
      ...base.chart,
      type: 'area',
      height: 180,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false },
    },
    colors: [color],
    stroke: { width: 2, curve: 'smooth' },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.28, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: getApexDatetimeXaxis(startMs, now, { tickCount: 4, fontSize: '10px' }),
    annotations: getApexTimeRangeAnnotations(startMs, now),
    yaxis: {
      min: 0,
      labels: {
        formatter: (value) => formatBandwidthValue(value),
        style: getApexAxisLabelStyle('10px'),
      },
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (value) => formatBandwidthValue(value) },
    },
    series: padSeriesToTimeRange([{ name, data }], startMs, now),
  }
  if (existing) {
    existing.updateOptions(options, false, false)
    return existing
  }
  const chart = new ApexCharts(el, options)
  chart.render()
  return chart
}

const load = async () => {
  if (!props.serverId) return
  loading.value = true
  loadError.value = ''
  range.value = readSharedTimeRange()
  try {
    const [rxPayload, txPayload] = await Promise.all([
      fetchBandwidthNicRxSeries(range.value, props.serverId),
      fetchBandwidthNicTxSeries(range.value, props.serverId),
    ])
    const rx = pointsForServer(rxPayload)
    const tx = pointsForServer(txPayload)
    hasSamples.value = rx.length > 0 || tx.length > 0
    if (!hasSamples.value) {
      destroyCharts()
      return
    }
    await nextTick()
    const colors = getApexSeriesColors()
    if (rxChart.value) rxInstance = renderChart(rxChart.value, rxInstance, 'Receive', rx, colors.l4)
    if (txChart.value) txInstance = renderChart(txChart.value, txInstance, 'Send', tx, colors.viper)
  } catch (error) {
    hasSamples.value = false
    destroyCharts()
    loadError.value = error?.message || 'Interface traffic could not be loaded.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
  timer = window.setInterval(() => void load(), 60 * 1000)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
  destroyCharts()
})

watch(() => props.serverId, () => {
  destroyCharts()
  void load()
})
</script>

<style scoped>
.edge-nic {
  margin-top: 16px;
  padding: 16px 18px 8px;
  border: 0.5px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface);
}

.edge-nic__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.edge-nic__kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.edge-nic__head h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.edge-nic__range {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  color: var(--app-text-muted);
}

.edge-nic__empty {
  margin: 14px 0 10px;
  color: var(--app-text-muted);
  font-size: 13px;
}

.edge-nic__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.edge-nic__grid p {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

@media (max-width: 860px) {
  .edge-nic__grid {
    grid-template-columns: 1fr;
  }
}
</style>
