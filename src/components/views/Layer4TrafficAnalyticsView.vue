<template>
  <div class="dashboard-view analytics-page l4-traffic-view" :aria-busy="isLoading">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>L4 Traffic</h2>
        <p>Everything crossing the NIC (HTTP, floods, SSH, system) — edge-wide, not per site.</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <AnalyticsFilterBar :filters="filters" :loading="isLoading" id-prefix="l4-traffic" hide-site />

    <p v-if="loadError" class="analytics-error" role="alert">{{ loadError }}</p>

    <nav class="dash-tabbar" aria-label="L4 traffic sections" role="tablist">
      <button
        v-for="tab in l4Tabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="dash-tab"
        :class="{ active: activeTab === tab.id }"
        :aria-selected="activeTab === tab.id"
        :title="tab.hint"
        @click="activeTab = tab.id"
      >
        <svg class="dash-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <template v-if="tab.id === 'nic-rx'"><path d="M12 4v12M7 11l5 5 5-5M5 20h14" /></template>
          <template v-else-if="tab.id === 'xdp'"><path d="M12 3l7.5 3v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6L12 3z" /></template>
          <template v-else-if="tab.id === 'nic-tx'"><path d="M12 20V8M7 13l5-5 5 5M5 4h14" /></template>
          <template v-else><path d="M3 12h4l2.5-6 5 12 2.5-6h4" /></template>
        </svg>
        <span class="dash-tab__label">{{ tab.label }}</span>
      </button>
    </nav>

    <div v-if="activeTab === 'nic-rx'" class="analytics-tab-panel">
      <section class="dash-kpi-strip" aria-label="NIC receive summary">
        <article v-for="card in nicRxKpiCards" :key="card.label" class="dash-kpi" :class="`dash-kpi--${card.tone}`">
          <span class="dash-kpi__label">{{ card.label }}</span>
          <span class="dash-kpi__value num">{{ card.value }}</span>
          <span class="dash-kpi__hint">{{ card.hint }}</span>
        </article>
      </section>
      <section class="dash-grid12">
        <div class="dash-panel c-12 dash-chart-panel">
          <div class="dash-panel-head">
            <div>
              <h3>NIC receive</h3>
              <p class="dash-panel-desc">
                Incoming NIC packets and NIC discards before XDP
                · <code>pps_nic_rx</code> / <code>pps_nic_dropped</code>
                · {{ filters.rangeLabel }}
              </p>
            </div>
            <div class="dash-chart-readouts">
              <div class="dash-chart-readout">
                <span class="dash-chart-readout__swatch" :style="{ background: palette.rx }"></span>
                <div>
                  <div class="dash-chart-readout__label">NIC RX now</div>
                  <div class="dash-chart-readout__value num signal">{{ formatPps(summary.ppsNicRxLast) }}</div>
                </div>
              </div>
              <div class="dash-chart-readout">
                <span class="dash-chart-readout__swatch" :style="{ background: palette.dropped }"></span>
                <div>
                  <div class="dash-chart-readout__label">NIC dropped now</div>
                  <div class="dash-chart-readout__value num">{{ formatPps(summary.ppsNicDroppedLast) }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
            <AnalyticsTimeChart
              :series="nicRxSeries"
              :start="filters.window.start"
              :end="filters.window.end"
              :height="320"
              :y-formatter="formatPps"
            />
          </div>
        </div>
      </section>
    </div>

    <div v-else-if="activeTab === 'xdp'" class="analytics-tab-panel">
      <section class="dash-kpi-strip" aria-label="XDP summary">
        <article v-for="card in xdpKpiCards" :key="card.label" class="dash-kpi" :class="`dash-kpi--${card.tone}`">
          <span class="dash-kpi__label">{{ card.label }}</span>
          <span class="dash-kpi__value num">{{ card.value }}</span>
          <span class="dash-kpi__hint">{{ card.hint }}</span>
        </article>
      </section>
      <section class="dash-grid12">
        <div class="dash-panel c-12 dash-chart-panel">
          <div class="dash-panel-head">
            <div>
              <h3>XDP</h3>
              <p class="dash-panel-desc">
                Packets seen by XDP and packets XDP dropped
                · <code>pps_xdp_rx</code> / <code>pps_xdp_blocked</code>
                · {{ filters.rangeLabel }}
              </p>
            </div>
            <div class="dash-chart-readouts">
              <div class="dash-chart-readout">
                <span class="dash-chart-readout__swatch" :style="{ background: palette.xdp }"></span>
                <div>
                  <div class="dash-chart-readout__label">XDP RX now</div>
                  <div class="dash-chart-readout__value num signal">{{ formatPps(summary.ppsXdpRxLast) }}</div>
                </div>
              </div>
              <div class="dash-chart-readout">
                <span class="dash-chart-readout__swatch" :style="{ background: palette.blocked }"></span>
                <div>
                  <div class="dash-chart-readout__label">XDP blocked now</div>
                  <div class="dash-chart-readout__value num danger">{{ formatPps(summary.ppsXdpBlockedLast) }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
            <AnalyticsTimeChart
              :series="xdpSeries"
              :start="filters.window.start"
              :end="filters.window.end"
              :height="320"
              :y-formatter="formatPps"
            />
          </div>
        </div>
      </section>
    </div>

    <div v-else-if="activeTab === 'nic-tx'" class="analytics-tab-panel">
      <section class="dash-kpi-strip" aria-label="NIC transmit summary">
        <article v-for="card in nicTxKpiCards" :key="card.label" class="dash-kpi" :class="`dash-kpi--${card.tone}`">
          <span class="dash-kpi__label">{{ card.label }}</span>
          <span class="dash-kpi__value num">{{ card.value }}</span>
          <span class="dash-kpi__hint">{{ card.hint }}</span>
        </article>
      </section>
      <section class="dash-grid12">
        <div class="dash-panel c-12 dash-chart-panel">
          <div class="dash-panel-head">
            <div>
              <h3>NIC transmit</h3>
              <p class="dash-panel-desc">
                Outgoing NIC packets · <code>pps_nic_tx</code> · {{ filters.rangeLabel }}
              </p>
            </div>
            <div class="dash-chart-readouts">
              <div class="dash-chart-readout">
                <span class="dash-chart-readout__swatch" :style="{ background: palette.tx }"></span>
                <div>
                  <div class="dash-chart-readout__label">NIC TX now</div>
                  <div class="dash-chart-readout__value num warn">{{ formatPps(summary.ppsNicTxLast) }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
            <AnalyticsTimeChart
              :series="nicTxSeries"
              :start="filters.window.start"
              :end="filters.window.end"
              :height="320"
              :y-formatter="formatPps"
            />
          </div>
        </div>
      </section>
    </div>

    <div v-else class="analytics-tab-panel">
      <section class="dash-kpi-strip" aria-label="Bandwidth summary">
        <article v-for="card in bandwidthKpiCards" :key="card.label" class="dash-kpi" :class="`dash-kpi--${card.tone}`">
          <span class="dash-kpi__label">{{ card.label }}</span>
          <span class="dash-kpi__value num">{{ card.value }}</span>
          <span class="dash-kpi__hint">{{ card.hint }}</span>
        </article>
      </section>
      <section class="dash-grid12">
        <div class="dash-panel c-12 dash-chart-panel">
          <div class="dash-panel-head">
            <div>
              <h3>NIC bandwidth</h3>
              <p class="dash-panel-desc">Receive and transmit bit rate · edge-wide · {{ filters.rangeLabel }}</p>
            </div>
            <div class="dash-chart-readouts">
              <div class="dash-chart-readout">
                <span class="dash-chart-readout__swatch" :style="{ background: palette.rx }"></span>
                <div>
                  <div class="dash-chart-readout__label">RX now</div>
                  <div class="dash-chart-readout__value num signal">{{ formatRate(summary.nicRxBandwidthLast) }}</div>
                </div>
              </div>
              <div class="dash-chart-readout">
                <span class="dash-chart-readout__swatch" :style="{ background: palette.tx }"></span>
                <div>
                  <div class="dash-chart-readout__label">TX now</div>
                  <div class="dash-chart-readout__value num warn">{{ formatRate(summary.nicTxBandwidthLast) }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
            <AnalyticsTimeChart
              :series="bandwidthSeries"
              :start="filters.window.start"
              :end="filters.window.end"
              :height="320"
              :y-formatter="formatRate"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import AnalyticsFilterBar from '@/components/views/analytics/AnalyticsFilterBar.vue'
import AnalyticsTimeChart from '@/components/views/analytics/AnalyticsTimeChart.vue'
import { fetchAnalyticsSeries, fetchAnalyticsSummary } from '@/api/analytics'
import { useAnalyticsFilters } from '@/composables/useAnalyticsFilters'
import { getApexSeriesColors } from '@/utils/chartTheme'
import '@/assets/styles/analytics-panels.css'

const l4Tabs = [
  { id: 'nic-rx', label: 'NIC receive', hint: 'Incoming packets and NIC discards' },
  { id: 'xdp', label: 'XDP', hint: 'Packets seen and dropped by XDP' },
  { id: 'nic-tx', label: 'NIC transmit', hint: 'Outgoing NIC packets' },
  { id: 'bandwidth', label: 'Bandwidth', hint: 'Receive and transmit bit rate' },
]

const activeTab = ref('nic-rx')
const isLoading = ref(false)
const loadError = ref('')
const loadedFilterKey = ref('')
const loadedTabs = ref(new Set())
const summary = ref({
  totalNicRxTraffic: 0,
  totalNicTxTraffic: 0,
  nicRxBandwidthLast: 0,
  nicTxBandwidthLast: 0,
  nicRxBandwidthLastTime: '',
  nicTxBandwidthLastTime: '',
  packetsNicRx: 0,
  packetsNicTx: 0,
  packetsNicDropped: 0,
  packetsXdpRx: 0,
  packetsXdpBlocked: 0,
  ppsNicRxLast: 0,
  ppsNicRxLastTime: '',
  ppsNicTxLast: 0,
  ppsNicTxLastTime: '',
  ppsNicDroppedLast: 0,
  ppsNicDroppedLastTime: '',
  ppsXdpRxLast: 0,
  ppsXdpRxLastTime: '',
  ppsXdpBlockedLast: 0,
  ppsXdpBlockedLastTime: '',
})
const rxSeriesRaw = ref([])
const txSeriesRaw = ref([])
const ppsRxSeriesRaw = ref([])
const ppsTxSeriesRaw = ref([])
const ppsDroppedSeriesRaw = ref([])
const ppsXdpRxSeriesRaw = ref([])
const ppsXdpBlockedSeriesRaw = ref([])

let loadToken = 0

const filterKey = () => JSON.stringify(filters.params)

const asRows = (rows) => (Array.isArray(rows) ? rows : [])

const applySummary = (sum) => {
  summary.value = {
    totalNicRxTraffic: Number(sum?.totalNicRxTraffic ?? 0),
    totalNicTxTraffic: Number(sum?.totalNicTxTraffic ?? 0),
    nicRxBandwidthLast: Number(sum?.nicRxBandwidthLast ?? 0),
    nicTxBandwidthLast: Number(sum?.nicTxBandwidthLast ?? 0),
    nicRxBandwidthLastTime: sum?.nicRxBandwidthLastTime || '',
    nicTxBandwidthLastTime: sum?.nicTxBandwidthLastTime || '',
    packetsNicRx: Number(sum?.packetsNicRx ?? 0),
    packetsNicTx: Number(sum?.packetsNicTx ?? 0),
    packetsNicDropped: Number(sum?.packetsNicDropped ?? 0),
    packetsXdpRx: Number(sum?.packetsXdpRx ?? 0),
    packetsXdpBlocked: Number(sum?.packetsXdpBlocked ?? 0),
    ppsNicRxLast: Number(sum?.ppsNicRxLast ?? 0),
    ppsNicRxLastTime: sum?.ppsNicRxLastTime || '',
    ppsNicTxLast: Number(sum?.ppsNicTxLast ?? 0),
    ppsNicTxLastTime: sum?.ppsNicTxLastTime || '',
    ppsNicDroppedLast: Number(sum?.ppsNicDroppedLast ?? 0),
    ppsNicDroppedLastTime: sum?.ppsNicDroppedLastTime || '',
    ppsXdpRxLast: Number(sum?.ppsXdpRxLast ?? 0),
    ppsXdpRxLastTime: sum?.ppsXdpRxLastTime || '',
    ppsXdpBlockedLast: Number(sum?.ppsXdpBlockedLast ?? 0),
    ppsXdpBlockedLastTime: sum?.ppsXdpBlockedLastTime || '',
  }
}

const loadTabSeries = async (tabId, params) => {
  if (tabId === 'nic-rx') {
    const [ppsRx, ppsDropped] = await Promise.all([
      fetchAnalyticsSeries('nic-rx-pps', params),
      fetchAnalyticsSeries('nic-dropped-pps', params),
    ])
    ppsRxSeriesRaw.value = asRows(ppsRx)
    ppsDroppedSeriesRaw.value = asRows(ppsDropped)
    return
  }
  if (tabId === 'xdp') {
    const [ppsXdpRx, ppsXdpBlocked] = await Promise.all([
      fetchAnalyticsSeries('xdp-rx-pps', params),
      fetchAnalyticsSeries('xdp-blocked-pps', params),
    ])
    ppsXdpRxSeriesRaw.value = asRows(ppsXdpRx)
    ppsXdpBlockedSeriesRaw.value = asRows(ppsXdpBlocked)
    return
  }
  if (tabId === 'nic-tx') {
    ppsTxSeriesRaw.value = asRows(await fetchAnalyticsSeries('nic-tx-pps', params))
    return
  }
  const [rx, tx] = await Promise.all([
    fetchAnalyticsSeries('nic-rx-bandwidth', params),
    fetchAnalyticsSeries('nic-tx-bandwidth', params),
  ])
  rxSeriesRaw.value = asRows(rx)
  txSeriesRaw.value = asRows(tx)
}

const markTabLoaded = (tabId) => {
  const next = new Set(loadedTabs.value)
  next.add(tabId)
  loadedTabs.value = next
}

const load = async (tabId = activeTab.value, { force = false } = {}) => {
  const params = filters.params
  const key = filterKey()
  const filterChanged = force || key !== loadedFilterKey.value
  if (!filterChanged && loadedTabs.value.has('__summary') && loadedTabs.value.has(tabId)) return

  const token = ++loadToken
  isLoading.value = true
  loadError.value = ''
  if (filterChanged) {
    loadedFilterKey.value = key
    loadedTabs.value = new Set()
  }
  try {
    const jobs = []
    if (!loadedTabs.value.has('__summary')) jobs.push(fetchAnalyticsSummary(params).then(applySummary))
    if (!loadedTabs.value.has(tabId)) jobs.push(loadTabSeries(tabId, params))
    await Promise.all(jobs)
    if (token !== loadToken) return
    markTabLoaded('__summary')
    markTabLoaded(tabId)
  } catch (error) {
    if (token === loadToken) loadError.value = error?.message || 'L4 traffic could not be loaded.'
  } finally {
    if (token === loadToken) isLoading.value = false
  }
}

const reload = () => load(activeTab.value, { force: true })
const filters = reactive(useAnalyticsFilters(reload))

const palette = computed(() => {
  const colors = getApexSeriesColors()
  return {
    rx: colors.l4,
    tx: colors.warn,
    dropped: colors.slate,
    xdp: colors.teal,
    blocked: colors.danger,
  }
})

const formatRate = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 Kbps'
  const units = ['Kbps', 'Mbps', 'Gbps', 'Tbps']
  let index = 0
  let current = numeric
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  return `${current.toFixed(current >= 10 ? 0 : 1)} ${units[index]}`
}

const formatVolume = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 KB'
  const units = ['KB', 'MB', 'GB', 'TB']
  let index = 0
  let current = numeric
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  return `${current.toFixed(current >= 10 ? 0 : 1)} ${units[index]}`
}

const formatPps = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 pps'
  const abs = Math.abs(numeric)
  if (abs >= 1_000_000) return `${(numeric / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M pps`
  if (abs >= 1_000) return `${(numeric / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k pps`
  return `${numeric.toFixed(abs >= 10 ? 0 : 1)} pps`
}

const formatPackets = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0'
  const abs = Math.abs(numeric)
  if (abs >= 1_000_000_000) return `${(numeric / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(numeric / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000) return `${(numeric / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`
  return numeric.toLocaleString()
}

const formatClock = (value) => {
  if (!value) return 'latest sample'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleString(undefined, { hour12: false })
}

const toPoints = (rows) =>
  rows
    .map((row) => ({ x: new Date(row.timestamp).getTime(), y: Number(row.traffic ?? 0) }))
    .filter((point) => Number.isFinite(point.x))

const nicRxSeries = computed(() => [
  { name: 'NIC RX', color: palette.value.rx, data: toPoints(ppsRxSeriesRaw.value) },
  { name: 'NIC dropped', color: palette.value.dropped, data: toPoints(ppsDroppedSeriesRaw.value) },
])

const xdpSeries = computed(() => [
  { name: 'XDP RX', color: palette.value.xdp, data: toPoints(ppsXdpRxSeriesRaw.value) },
  { name: 'XDP blocked', color: palette.value.blocked, data: toPoints(ppsXdpBlockedSeriesRaw.value) },
])

const nicTxSeries = computed(() => [
  { name: 'NIC TX', color: palette.value.tx, data: toPoints(ppsTxSeriesRaw.value) },
])

const bandwidthSeries = computed(() => [
  { name: 'NIC RX', color: palette.value.rx, data: toPoints(rxSeriesRaw.value) },
  { name: 'NIC TX', color: palette.value.tx, data: toPoints(txSeriesRaw.value) },
])

const nicRxKpiCards = computed(() => [
  {
    label: 'NIC RX pps',
    value: formatPps(summary.value.ppsNicRxLast),
    hint: formatClock(summary.value.ppsNicRxLastTime),
    tone: 'info',
  },
  {
    label: 'NIC dropped',
    value: formatPackets(summary.value.packetsNicDropped),
    hint: `${formatPps(summary.value.ppsNicDroppedLast)} latest`,
    tone: 'warn',
  },
  {
    label: 'NIC RX packets',
    value: formatPackets(summary.value.packetsNicRx),
    hint: 'total over range',
    tone: 'info',
  },
])

const xdpKpiCards = computed(() => [
  {
    label: 'XDP RX pps',
    value: formatPps(summary.value.ppsXdpRxLast),
    hint: formatClock(summary.value.ppsXdpRxLastTime),
    tone: 'ok',
  },
  {
    label: 'XDP blocked pps',
    value: formatPps(summary.value.ppsXdpBlockedLast),
    hint: formatClock(summary.value.ppsXdpBlockedLastTime),
    tone: 'danger',
  },
  {
    label: 'XDP blocked',
    value: formatPackets(summary.value.packetsXdpBlocked),
    hint: 'total over range',
    tone: 'danger',
  },
  {
    label: 'XDP RX packets',
    value: formatPackets(summary.value.packetsXdpRx),
    hint: 'total over range',
    tone: 'ok',
  },
])

const nicTxKpiCards = computed(() => [
  {
    label: 'NIC TX pps',
    value: formatPps(summary.value.ppsNicTxLast),
    hint: formatClock(summary.value.ppsNicTxLastTime),
    tone: 'warn',
  },
  {
    label: 'NIC TX packets',
    value: formatPackets(summary.value.packetsNicTx),
    hint: 'total over range',
    tone: 'warn',
  },
])

const bandwidthKpiCards = computed(() => [
  {
    label: 'NIC RX rate',
    value: formatRate(summary.value.nicRxBandwidthLast),
    hint: formatClock(summary.value.nicRxBandwidthLastTime),
    tone: 'info',
  },
  {
    label: 'NIC TX rate',
    value: formatRate(summary.value.nicTxBandwidthLast),
    hint: formatClock(summary.value.nicTxBandwidthLastTime),
    tone: 'warn',
  },
  {
    label: 'NIC RX volume',
    value: formatVolume(summary.value.totalNicRxTraffic),
    hint: 'total over range',
    tone: 'info',
  },
  {
    label: 'NIC TX volume',
    value: formatVolume(summary.value.totalNicTxTraffic),
    hint: 'total over range',
    tone: 'ok',
  },
])

watch(activeTab, (tab) => {
  load(tab)
})

onMounted(async () => {
  await filters.loadScope()
  filters.apply()
})
</script>

<style scoped>
.l4-traffic-view .dash-tabbar {
  margin-bottom: 14px;
}

.l4-traffic-view .analytics-tab-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.l4-traffic-view .dash-chart-wrap--hero {
  min-height: 280px;
}

.l4-traffic-view code {
  font-size: 11px;
  opacity: 0.85;
}

.dash-chart-readouts {
  display: inline-flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.dash-chart-readout {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dash-chart-readout__swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.dash-chart-readout__label {
  font-size: 11px;
  color: var(--app-text-muted);
  line-height: 1.2;
}

.dash-chart-readout__value {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

.dash-chart-readout__value.signal {
  color: var(--dorian-signal, #4a86c7);
}

.dash-chart-readout__value.warn {
  color: var(--dorian-warn, #b8862e);
}

.dash-chart-readout__value.danger {
  color: var(--dorian-danger, #c94a3d);
}
</style>
