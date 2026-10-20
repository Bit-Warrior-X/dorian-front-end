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
      <div class="edge-nic__chart">
        <p><i class="rx" aria-hidden="true" />Receive</p>
        <div ref="rxChart"></div>
      </div>
      <div class="edge-nic__chart">
        <p><i class="tx" aria-hidden="true" />Send</p>
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
  padding: 12px 14px 6px;
  border: 0.5px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-muted);
}

.edge-nic__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 0.5px solid var(--app-border);
}

.edge-nic__kicker {
  margin: 0 0 2px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.edge-nic__head h4 {
  margin: 0;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
}

.edge-nic__range {
  padding: 3px 8px;
  border-radius: 999px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10.5px;
  font-weight: 650;
  color: var(--app-text-muted);
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
}

.edge-nic__empty {
  margin: 0;
  padding: 28px 0;
  text-align: center;
  color: var(--app-text-muted);
  font-size: 12.5px;
}

.edge-nic__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.edge-nic__chart p {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0 0;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.edge-nic__chart p i {
  width: 8px;
  height: 3px;
  border-radius: 2px;
}

.edge-nic__chart p i.rx { background: var(--dorian-l4, #6b9fd4); }
.edge-nic__chart p i.tx { background: var(--dorian-viper-400, #3fbd85); }

@media (max-width: 860px) {
  .edge-nic__grid {
    grid-template-columns: 1fr;
  }
}
</style>
