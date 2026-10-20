<template>
  <div class="dashboard-view analytics-page performance-analytics-view" :aria-busy="isLoading">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>Performance</h2>
        <p>How fast your edges answer, how fast origins respond behind them, and where errors and timeouts come from.</p>
      </div>
      <div class="dash-topbar__right">
        <PreviewDataBadge v-if="isPreview" />
        <AppTopbarActions />
      </div>
    </header>

    <AnalyticsSectionNav />

    <AnalyticsFilterBar :filters="filters" :loading="isLoading" id-prefix="performance" />

    <p v-if="loadError" class="analytics-error" role="alert">{{ loadError }}</p>

    <section class="dash-kpi-strip">
      <article v-for="card in kpiCards" :key="card.label" class="dash-kpi" :class="`dash-kpi--${card.tone}`">
        <span class="dash-kpi__label">{{ card.label }}</span>
        <span class="dash-kpi__value num">{{ card.value }}</span>
        <span class="dash-kpi__hint">{{ card.hint }}</span>
      </article>
    </section>

    <section class="dash-grid12">
      <div class="dash-panel c-12 dash-chart-panel">
        <div class="dash-panel-head">
          <div>
            <h3>Edge response time</h3>
            <p class="dash-panel-desc">Time from receiving the request to sending the last byte, including origin fetches · {{ filters.rangeLabel }}</p>
          </div>
          <div class="dash-chart-readouts">
            <div v-for="readout in edgeReadouts" :key="readout.label" class="dash-chart-readout">
              <span class="dash-chart-readout__swatch" :style="{ background: readout.color }"></span>
              <div>
                <div class="dash-chart-readout__label">{{ readout.label }}</div>
                <div class="dash-chart-readout__value num">{{ readout.value }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="dash-chart-wrap">
          <AnalyticsTimeChart
            :series="edgeSeries"
            :start="filters.window.start"
            :end="filters.window.end"
            type="line"
            :height="280"
            :y-formatter="formatMs"
          />
        </div>
      </div>

      <div class="dash-panel c-6 dash-chart-panel">
        <div class="dash-panel-head">
          <div>
            <h3>Origin response time</h3>
            <p class="dash-panel-desc">Time to first byte from the origin, for requests that were not served from cache</p>
          </div>
        </div>
        <div class="dash-chart-wrap">
          <AnalyticsTimeChart
            :series="originSeries"
            :start="filters.window.start"
            :end="filters.window.end"
            type="line"
            :height="240"
            :y-formatter="formatMs"
          />
        </div>
      </div>

      <div class="dash-panel c-6 dash-chart-panel dash-chart-panel--danger">
        <div class="dash-panel-head">
          <div>
            <h3>Origin errors</h3>
            <p class="dash-panel-desc">5xx responses and timeouts returned by origins to the edge</p>
          </div>
        </div>
        <div class="dash-chart-wrap">
          <AnalyticsTimeChart
            :series="originErrorSeries"
            :start="filters.window.start"
            :end="filters.window.end"
            :height="240"
            :y-formatter="formatCompact"
          />
        </div>
      </div>

      <div class="dash-panel c-6">
        <div class="dash-panel-head">
          <div>
            <h3>By edge</h3>
            <p class="dash-panel-desc">Response time and error rate for each edge server</p>
          </div>
        </div>
        <div class="analytics-table-wrap">
          <table class="analytics-table">
            <thead>
              <tr>
                <th>Edge</th>
                <th class="is-num">Requests</th>
                <th class="is-num">p50</th>
                <th class="is-num">p95</th>
                <th class="is-num">5xx rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in edgeRows" :key="row.serverId">
                <td class="analytics-table__key">{{ row.name }}</td>
                <td class="is-num num">{{ formatCompact(row.requests) }}</td>
                <td class="is-num num">{{ formatMs(row.p50Ms) }}</td>
                <td class="is-num num" :class="latencyTone(row.p95Ms, 250)">{{ formatMs(row.p95Ms) }}</td>
                <td class="is-num num" :class="errorTone(row.errorRate)">{{ formatPercent(row.errorRate, 2) }}</td>
              </tr>
              <tr v-if="!edgeRows.length"><td colspan="5" class="empty-row">No data</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="dash-panel c-6">
        <div class="dash-panel-head">
          <div>
            <h3>Slowest origins</h3>
            <p class="dash-panel-desc">Sites ranked by origin p95 response time</p>
          </div>
        </div>
        <div class="analytics-table-wrap">
          <table class="analytics-table">
            <thead>
              <tr>
                <th>Site</th>
                <th class="is-num">Origin requests</th>
                <th class="is-num">p95</th>
                <th class="is-num">5xx rate</th>
                <th class="is-num">Timeouts</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in originRows" :key="row.siteId">
                <td class="analytics-table__key">{{ row.domain }}</td>
                <td class="is-num num">{{ formatCompact(row.requests) }}</td>
                <td class="is-num num" :class="latencyTone(row.p95Ms, 800)">{{ formatMs(row.p95Ms) }}</td>
                <td class="is-num num" :class="errorTone(row.errorRate)">{{ formatPercent(row.errorRate, 2) }}</td>
                <td class="is-num num">{{ formatNumber(row.timeouts) }}</td>
              </tr>
              <tr v-if="!originRows.length"><td colspan="5" class="empty-row">No data</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import AnalyticsSectionNav from '@/components/views/analytics/AnalyticsSectionNav.vue'
import AnalyticsFilterBar from '@/components/views/analytics/AnalyticsFilterBar.vue'
import AnalyticsTimeChart from '@/components/views/analytics/AnalyticsTimeChart.vue'
import PreviewDataBadge from '@/components/views/analytics/PreviewDataBadge.vue'
import { fetchPerformanceGroup, fetchPerformanceSeries, fetchPerformanceSummary } from '@/api/performanceAnalytics'
import { fetchSecuritySummary } from '@/api/securityAnalytics'
import { useAnalyticsFilters } from '@/composables/useAnalyticsFilters'
import { formatCompact, formatMs, formatNumber, formatPercent } from '@/utils/analyticsFormat'
import { getApexSeriesColors } from '@/utils/chartTheme'
import '@/assets/styles/analytics-panels.css'

const isLoading = ref(false)
const isPreview = ref(false)
const loadError = ref('')
const summary = ref({})
const edgeLatency = ref([])
const originLatency = ref([])
const originStatus = ref([])
const edgeRows = ref([])
const originRows = ref([])

let loadToken = 0

const load = async () => {
  const token = ++loadToken
  isLoading.value = true
  loadError.value = ''
  const params = filters.params
  try {
    const security = await fetchSecuritySummary(params).catch(() => null)
    const context = {
      sites: filters.sites,
      servers: filters.servers,
      totalRequests: security ? Number(security.totalRequestCounts) || 0 : undefined,
    }
    const results = await Promise.all([
      fetchPerformanceSummary(params, context),
      fetchPerformanceSeries('edge-response', params, context),
      fetchPerformanceSeries('origin-response', params, context),
      fetchPerformanceSeries('origin-status', params, context),
      fetchPerformanceGroup('edges', params, context),
      fetchPerformanceGroup('origins', params, context),
    ])
    if (token !== loadToken) return
    const [sum, edge, origin, status, edges, origins] = results
    summary.value = sum.data || {}
    edgeLatency.value = Array.isArray(edge.data) ? edge.data : []
    originLatency.value = Array.isArray(origin.data) ? origin.data : []
    originStatus.value = Array.isArray(status.data) ? status.data : []
    edgeRows.value = Array.isArray(edges.data) ? edges.data : []
    originRows.value = Array.isArray(origins.data) ? origins.data : []
    isPreview.value = results.some((result) => result.preview)
  } catch (error) {
    if (token === loadToken) loadError.value = error?.message || 'Performance analytics could not be loaded.'
  } finally {
    if (token === loadToken) isLoading.value = false
  }
}

const filters = reactive(useAnalyticsFilters(load))

const palette = computed(() => {
  const colors = getApexSeriesColors()
  return { p50: colors.viper, p95: colors.warn, p99: colors.danger, errors: colors.danger, timeouts: colors.sand }
})

const kpiCards = computed(() => {
  const s = summary.value
  return [
    { label: 'Edge response p50', value: formatMs(s.edgeResponseP50Ms), hint: 'median request', tone: 'ok' },
    { label: 'Edge response p95', value: formatMs(s.edgeResponseP95Ms), hint: `p99 ${formatMs(s.edgeResponseP99Ms)}`, tone: 'info' },
    { label: 'Origin response p95', value: formatMs(s.originResponseP95Ms), hint: `p50 ${formatMs(s.originResponseP50Ms)}`, tone: 'warn' },
    { label: 'Origin 5xx rate', value: formatPercent(s.originErrorRate, 2), hint: `${formatNumber(s.origin5xx)} of ${formatCompact(s.originRequests)} origin requests`, tone: 'danger' },
    { label: 'Origin timeouts', value: formatNumber(s.originTimeouts), hint: 'no response before timeout', tone: 'total' },
  ]
})

const toPoints = (rows, key) =>
  rows
    .map((row) => ({ x: new Date(row.timestamp).getTime(), y: Number(row[key]) || 0 }))
    .filter((point) => Number.isFinite(point.x))

const edgeSeries = computed(() => [
  { name: 'p50', color: palette.value.p50, data: toPoints(edgeLatency.value, 'p50') },
  { name: 'p95', color: palette.value.p95, data: toPoints(edgeLatency.value, 'p95') },
  { name: 'p99', color: palette.value.p99, data: toPoints(edgeLatency.value, 'p99') },
])

const originSeries = computed(() => [
  { name: 'p50', color: palette.value.p50, data: toPoints(originLatency.value, 'p50') },
  { name: 'p95', color: palette.value.p95, data: toPoints(originLatency.value, 'p95') },
])

const originErrorSeries = computed(() => [
  { name: '5xx', color: palette.value.errors, data: toPoints(originStatus.value, 's5xx') },
  { name: 'Timeouts', color: palette.value.timeouts, data: toPoints(originStatus.value, 'timeouts') },
])

const edgeReadouts = computed(() => [
  { label: 'p50', color: palette.value.p50, value: formatMs(summary.value.edgeResponseP50Ms) },
  { label: 'p95', color: palette.value.p95, value: formatMs(summary.value.edgeResponseP95Ms) },
  { label: 'p99', color: palette.value.p99, value: formatMs(summary.value.edgeResponseP99Ms) },
])

const latencyTone = (value, threshold) => ((Number(value) || 0) > threshold ? 'is-low' : '')
const errorTone = (value) => ((Number(value) || 0) >= 1 ? 'is-low' : '')

onMounted(async () => {
  await filters.loadScope()
  load()
})
</script>

<style scoped>
.performance-analytics-view {
  max-width: 1680px;
  margin: 0 auto;
}
</style>
