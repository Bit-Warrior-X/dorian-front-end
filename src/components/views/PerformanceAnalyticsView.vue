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

    <AnalyticsFilterBar :filters="filters" :loading="isLoading" id-prefix="performance" />

    <p v-if="loadError" class="analytics-error" role="alert">{{ loadError }}</p>

    <section class="dash-kpi-strip">
      <article v-for="card in kpiCards" :key="card.label" class="dash-kpi" :class="`dash-kpi--${card.tone}`">
        <span class="dash-kpi__label info-hint-heading">
          <span>{{ card.label }}</span>
          <InfoHint :text="card.help" :aria-label="`${card.label} help`" />
        </span>
        <span class="dash-kpi__value num">{{ card.value }}</span>
        <span class="dash-kpi__hint">{{ card.hint }}</span>
      </article>
    </section>

    <section class="dash-grid12">
      <div class="dash-panel c-12 dash-chart-panel">
        <div class="dash-panel-head">
          <div>
            <h3 class="info-hint-heading">
              <span>Edge response time</span>
              <InfoHint
                text="Client-facing latency ($request_time): from the edge receiving the request until the last response byte is sent, including cache hits and origin fetches. Non-blocked requests only.
p50 / p95 / p99 are percentiles from the edge latency histogram — half of requests finish at or below p50; 95% at or below p95; 99% at or below p99."
                aria-label="Edge response time help"
              />
            </h3>
            <p class="dash-panel-desc">Time from receiving the request to sending the last byte, including origin fetches · {{ filters.rangeLabel }}</p>
          </div>
          <div class="dash-chart-readouts">
            <div v-for="readout in edgeReadouts" :key="readout.label" class="dash-chart-readout">
              <span class="dash-chart-readout__swatch" :style="{ background: readout.color }"></span>
              <div>
                <div class="dash-chart-readout__label info-hint-heading">
                  <span>{{ readout.label }}</span>
                  <InfoHint :text="readout.help" :aria-label="`Edge ${readout.label} help`" />
                </div>
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
            <h3 class="info-hint-heading">
              <span>Origin response time</span>
              <InfoHint
                text="Upstream latency ($upstream_response_time) for requests that contacted origin (not served fully from cache). Retries are summed into one sample.
p50 is the median origin wait; p95 shows the slow tail most users still see. Spikes here usually mean a slow or overloaded origin."
                aria-label="Origin response time help"
              />
            </h3>
            <p class="dash-panel-desc">Time waiting on origin for requests that were not served from cache</p>
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
            <h3 class="info-hint-heading">
              <span>Origin 5xx and timeouts</span>
              <InfoHint
                text="5xx: the origin itself returned a 5xx status (final $upstream_status). Does not include connect failures.
Timeouts: no usable origin response within proxy connect/read timeouts.
Each point is the count of failed origin contacts in that chart interval (1 min on short ranges, wider on long ranges) — useful to spot origin outages vs slow-but-successful responses."
                aria-label="Origin errors help"
              />
            </h3>
            <p class="dash-panel-desc">Origin 5xx responses, plus connect/read timeouts (no usable response)</p>
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
            <h3 class="info-hint-heading">
              <span>By edge</span>
              <InfoHint
                text="One row per edge server in the selected scope.
Requests: total edge requests in the range.
p50 / p95: edge response-time percentiles for that server.
5xx rate: origin 5xx responses ÷ origin requests on that edge (cache hits do not count in the denominator)."
                aria-label="By edge help"
              />
            </h3>
            <p class="dash-panel-desc">Response time and error rate for each edge server</p>
          </div>
        </div>
        <div class="analytics-table-wrap">
          <table class="analytics-table">
            <thead>
              <tr>
                <th>Edge</th>
                <th class="is-num">
                  <span class="info-hint-heading">
                    <span>Requests</span>
                    <InfoHint text="Total requests handled by this edge in the selected time range, including blocked ones. Latency percentiles only cover requests that were answered." aria-label="Requests column help" />
                  </span>
                </th>
                <th class="is-num">
                  <span class="info-hint-heading">
                    <span>p50</span>
                    <InfoHint text="Median edge response time on this server — half of requests finished at or below this value." aria-label="Edge p50 column help" />
                  </span>
                </th>
                <th class="is-num">
                  <span class="info-hint-heading">
                    <span>p95</span>
                    <InfoHint text="95th percentile edge response time — 95% of requests finished at or below this value. High values mean a noticeable slow tail." aria-label="Edge p95 column help" />
                  </span>
                </th>
                <th class="is-num">
                  <span class="info-hint-heading">
                    <span>5xx rate</span>
                    <InfoHint text="Share of origin contacts on this edge that returned 5xx from the origin (origin 5xx ÷ origin requests)." aria-label="Edge 5xx rate column help" />
                  </span>
                </th>
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
            <h3 class="info-hint-heading">
              <span>Slowest origins</span>
              <InfoHint
                text="Sites ranked by origin p95 (slowest first). Only traffic that contacted origin is included.
Use this to find which domains drag edge latency — a high p95 with a rising 5xx rate or timeouts usually points at origin capacity or network issues."
                aria-label="Slowest origins help"
              />
            </h3>
            <p class="dash-panel-desc">Sites ranked by origin p95 response time</p>
          </div>
        </div>
        <div class="analytics-table-wrap">
          <table class="analytics-table">
            <thead>
              <tr>
                <th>Site</th>
                <th class="is-num">
                  <span class="info-hint-heading">
                    <span>Origin requests</span>
                    <InfoHint text="Requests that contacted this site's origin (cache misses / bypass / dynamic). Cache hits are excluded." aria-label="Origin requests column help" />
                  </span>
                </th>
                <th class="is-num">
                  <span class="info-hint-heading">
                    <span>p95</span>
                    <InfoHint text="95th percentile origin wait time for this site — how long the slowest common origin fetches take." aria-label="Origin p95 column help" />
                  </span>
                </th>
                <th class="is-num">
                  <span class="info-hint-heading">
                    <span>5xx rate</span>
                    <InfoHint text="Origin 5xx responses ÷ origin requests for this site." aria-label="Origin 5xx rate column help" />
                  </span>
                </th>
                <th class="is-num">
                  <span class="info-hint-heading">
                    <span>Timeouts</span>
                    <InfoHint text="Origin contacts that hit proxy connect/read timeout with no usable response." aria-label="Timeouts column help" />
                  </span>
                </th>
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
import InfoHint from '@/components/InfoHint.vue'
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
    {
      label: 'Edge response p50',
      value: formatMs(s.edgeResponseP50Ms),
      hint: 'median request',
      tone: 'ok',
      help: 'Median client-facing response time across the selected range. Half of edge requests finished at or below this value ($request_time, last byte to client).',
    },
    {
      label: 'Edge response p95',
      value: formatMs(s.edgeResponseP95Ms),
      hint: `p99 ${formatMs(s.edgeResponseP99Ms)}`,
      tone: 'info',
      help: '95th percentile edge response time. 95% of requests finished at or below this; the hint shows p99 for the extreme tail.',
    },
    {
      label: 'Origin response p95',
      value: formatMs(s.originResponseP95Ms),
      hint: `p50 ${formatMs(s.originResponseP50Ms)}`,
      tone: 'warn',
      help: '95th percentile wait on origin ($upstream_response_time) for requests that contacted origin. Hint shows the median (p50) for comparison.',
    },
    {
      label: 'Origin 5xx rate',
      value: formatPercent(s.originErrorRate, 2),
      hint: `${formatNumber(s.origin5xx)} of ${formatCompact(s.originRequests)} origin requests`,
      tone: 'danger',
      help: 'Share of origin contacts where the origin returned 5xx (origin 5xx ÷ origin requests). Cache hits are not in the denominator.',
    },
    {
      label: 'Origin timeouts',
      value: formatNumber(s.originTimeouts),
      hint: 'no response before timeout',
      tone: 'total',
      help: 'Count of origin contacts that hit proxy connect/read timeout with no usable response in the selected range.',
    },
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
  {
    label: 'p50',
    color: palette.value.p50,
    value: formatMs(summary.value.edgeResponseP50Ms),
    help: 'Median edge response time for the selected range.',
  },
  {
    label: 'p95',
    color: palette.value.p95,
    value: formatMs(summary.value.edgeResponseP95Ms),
    help: '95th percentile edge response time — typical slow-tail latency users still feel.',
  },
  {
    label: 'p99',
    color: palette.value.p99,
    value: formatMs(summary.value.edgeResponseP99Ms),
    help: '99th percentile edge response time — the extreme tail (outliers, rare slow paths).',
  },
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
