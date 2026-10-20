<template>
  <div class="dashboard-view analytics-page cache-analytics-view" :aria-busy="isLoading">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>Cache</h2>
        <p>How much traffic your edges serve from cache, how much reaches the origin, and what misses most.</p>
      </div>
      <div class="dash-topbar__right">
        <PreviewDataBadge v-if="isPreview" />
        <AppTopbarActions />
      </div>
    </header>

    <AnalyticsSectionNav />

    <AnalyticsFilterBar :filters="filters" :loading="isLoading" id-prefix="cache" />

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
            <h3>Requests by cache result</h3>
            <p class="dash-panel-desc">Served from cache, fetched from origin, or never cacheable · {{ filters.rangeLabel }}</p>
          </div>
          <div class="dash-chart-readouts">
            <div class="dash-chart-readout">
              <span class="dash-chart-readout__swatch" :style="{ background: palette.cached }"></span>
              <div>
                <div class="dash-chart-readout__label">Hit ratio</div>
                <div class="dash-chart-readout__value num signal">{{ formatPercent(hitRatio, 1) }}</div>
              </div>
            </div>
            <div class="dash-chart-readout">
              <span class="dash-chart-readout__swatch" :style="{ background: palette.miss }"></span>
              <div>
                <div class="dash-chart-readout__label">Miss ratio</div>
                <div class="dash-chart-readout__value num warn">{{ formatPercent(missRatio, 1) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="dash-chart-wrap">
          <AnalyticsTimeChart
            :series="resultSeries"
            :start="filters.window.start"
            :end="filters.window.end"
            stacked
            :height="300"
            :y-formatter="formatCompact"
          />
        </div>
      </div>

      <div class="dash-panel c-8 dash-chart-panel">
        <div class="dash-panel-head">
          <div>
            <h3>Bandwidth: cache vs origin</h3>
            <p class="dash-panel-desc">Bytes sent to clients, split by where the response came from</p>
          </div>
          <div class="dash-chart-readouts">
            <div class="dash-chart-readout">
              <div>
                <div class="dash-chart-readout__label">Byte hit ratio</div>
                <div class="dash-chart-readout__value num signal">{{ formatPercent(byteHitRatio, 1) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="dash-chart-wrap">
          <AnalyticsTimeChart
            :series="bandwidthSeries"
            :start="filters.window.start"
            :end="filters.window.end"
            stacked
            :height="260"
            :y-formatter="formatBytes"
          />
        </div>
      </div>

      <div class="dash-panel c-4">
        <div class="dash-panel-head">
          <div>
            <h3>Cache status</h3>
            <p class="dash-panel-desc">Edge cache result per request</p>
          </div>
        </div>
        <ul class="cache-status-list">
          <li v-for="row in statusRows" :key="row.status" class="cache-status-row">
            <span class="cache-status-tag" :class="`cache-status-tag--${statusTone(row.status)}`">{{ row.status }}</span>
            <span class="cache-status-bar">
              <span :style="{ width: `${barWidth(row.requests, maxStatusRequests)}%` }" :class="`cache-status-fill--${statusTone(row.status)}`"></span>
            </span>
            <span class="cache-status-value num">{{ formatCompact(row.requests) }}</span>
            <span class="cache-status-share num">{{ formatPercent(ratioPercent(row.requests, summary.requests), 1) }}</span>
          </li>
          <li v-if="!statusRows.length" class="empty-row">No data</li>
        </ul>
        <p class="cache-legend">
          <strong>HIT</strong>, <strong>STALE</strong>, <strong>UPDATING</strong> and <strong>REVALIDATED</strong> count as served from cache.
          <strong>BYPASS</strong> and <strong>DYNAMIC</strong> were never cacheable.
        </p>
      </div>

      <div class="dash-panel c-6">
        <div class="dash-panel-head">
          <div>
            <h3>Hit ratio by content type</h3>
            <p class="dash-panel-desc">Low ratios on static types usually mean missing cache rules</p>
          </div>
        </div>
        <div class="analytics-table-wrap">
          <table class="analytics-table">
            <thead>
              <tr>
                <th>Type</th>
                <th class="is-num">Requests</th>
                <th class="is-num">Bandwidth</th>
                <th>Hit ratio</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in contentTypeRows" :key="row.contentType">
                <td class="analytics-table__key">{{ row.contentType }}</td>
                <td class="is-num num">{{ formatCompact(row.requests) }}</td>
                <td class="is-num num">{{ formatBytes(row.bytes) }}</td>
                <td>
                  <span class="ratio-cell">
                    <span class="ratio-cell__bar"><span :class="ratioTone(row.hitRatio)" :style="{ width: `${row.hitRatio}%` }"></span></span>
                    <span class="num">{{ formatPercent(row.hitRatio, 1) }}</span>
                  </span>
                </td>
              </tr>
              <tr v-if="!contentTypeRows.length"><td colspan="4" class="empty-row">No data</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="dash-panel c-6">
        <div class="dash-panel-head">
          <div>
            <h3>Top uncached URLs</h3>
            <p class="dash-panel-desc">URLs that send the most requests to origin (MISS + EXPIRED)</p>
          </div>
        </div>
        <div class="analytics-table-wrap">
          <table class="analytics-table">
            <thead>
              <tr>
                <th>URL</th>
                <th class="is-num">Misses</th>
                <th class="is-num">Hit ratio</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in topMissRows" :key="`${row.host}${row.url}`">
                <td class="analytics-table__url" :title="`${row.host}${row.url}`">
                  <span class="analytics-table__host">{{ row.host }}</span>{{ row.url }}
                </td>
                <td class="is-num num">{{ formatCompact(row.misses) }}</td>
                <td class="is-num num" :class="ratioTextTone(row.hitRatio)">{{ formatPercent(row.hitRatio, 1) }}</td>
              </tr>
              <tr v-if="!topMissRows.length"><td colspan="3" class="empty-row">No data</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="dash-panel c-12">
        <div class="dash-panel-head">
          <div>
            <h3>Cache by site</h3>
            <p class="dash-panel-desc">Request and byte hit ratio per site, with bandwidth the origin did not have to serve</p>
          </div>
        </div>
        <div class="analytics-table-wrap">
          <table class="analytics-table">
            <thead>
              <tr>
                <th>Site</th>
                <th class="is-num">Requests</th>
                <th>Hit ratio</th>
                <th>Byte hit ratio</th>
                <th class="is-num">Saved bandwidth</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in siteRows" :key="row.siteId">
                <td class="analytics-table__key">{{ row.domain }}</td>
                <td class="is-num num">{{ formatNumber(row.requests) }}</td>
                <td>
                  <span class="ratio-cell">
                    <span class="ratio-cell__bar"><span :class="ratioTone(row.hitRatio)" :style="{ width: `${row.hitRatio}%` }"></span></span>
                    <span class="num">{{ formatPercent(row.hitRatio, 1) }}</span>
                  </span>
                </td>
                <td>
                  <span class="ratio-cell">
                    <span class="ratio-cell__bar"><span :class="ratioTone(row.byteHitRatio)" :style="{ width: `${row.byteHitRatio}%` }"></span></span>
                    <span class="num">{{ formatPercent(row.byteHitRatio, 1) }}</span>
                  </span>
                </td>
                <td class="is-num num">{{ formatBytes(row.savedBytes) }}</td>
              </tr>
              <tr v-if="!siteRows.length"><td colspan="5" class="empty-row">No data</td></tr>
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
import { fetchCacheGroup, fetchCacheSeries, fetchCacheSummary } from '@/api/cacheAnalytics'
import { fetchSecuritySummary } from '@/api/securityAnalytics'
import { useAnalyticsFilters } from '@/composables/useAnalyticsFilters'
import { formatBytes, formatCompact, formatNumber, formatPercent, ratioPercent } from '@/utils/analyticsFormat'
import { getApexSeriesColors } from '@/utils/chartTheme'
import '@/assets/styles/analytics-panels.css'

const isLoading = ref(false)
const isPreview = ref(false)
const loadError = ref('')
const summary = ref({ requests: 0, cachedRequests: 0, bytes: 0, cachedBytes: 0, originRequests: 0, originBytes: 0 })
const statusSeriesRaw = ref([])
const bandwidthSeriesRaw = ref([])
const statusRows = ref([])
const contentTypeRows = ref([])
const topMissRows = ref([])
const siteRows = ref([])

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
      fetchCacheSummary(params, context),
      fetchCacheSeries('status', params, context),
      fetchCacheSeries('bandwidth', params, context),
      fetchCacheGroup('status', params, context),
      fetchCacheGroup('content-types', params, context),
      fetchCacheGroup('top-miss-urls', params, context),
      fetchCacheGroup('sites', params, context),
    ])
    if (token !== loadToken) return
    const [sum, statusSeries, bandwidth, status, types, misses, perSite] = results
    summary.value = { ...summary.value, ...(sum.data || {}) }
    statusSeriesRaw.value = Array.isArray(statusSeries.data) ? statusSeries.data : []
    bandwidthSeriesRaw.value = Array.isArray(bandwidth.data) ? bandwidth.data : []
    statusRows.value = Array.isArray(status.data) ? status.data : []
    contentTypeRows.value = Array.isArray(types.data) ? types.data : []
    topMissRows.value = Array.isArray(misses.data) ? misses.data : []
    siteRows.value = Array.isArray(perSite.data) ? perSite.data : []
    isPreview.value = results.some((result) => result.preview)
  } catch (error) {
    if (token === loadToken) loadError.value = error?.message || 'Cache analytics could not be loaded.'
  } finally {
    if (token === loadToken) isLoading.value = false
  }
}

const filters = reactive(useAnalyticsFilters(load))

const palette = computed(() => {
  const colors = getApexSeriesColors()
  return { cached: colors.viper, miss: colors.warn, uncacheable: colors.slate, origin: colors.l4 }
})

const hitRatio = computed(() => ratioPercent(summary.value.cachedRequests, summary.value.requests))
const byteHitRatio = computed(() => ratioPercent(summary.value.cachedBytes, summary.value.bytes))
const missRatio = computed(() => {
  const misses = statusRows.value
    .filter((row) => ['MISS', 'EXPIRED'].includes(String(row.status).toUpperCase()))
    .reduce((sum, row) => sum + (Number(row.requests) || 0), 0)
  return ratioPercent(misses, summary.value.requests)
})

const kpiCards = computed(() => [
  { label: 'Cache hit ratio', value: formatPercent(hitRatio.value, 1), hint: 'requests served from cache', tone: 'ok' },
  { label: 'Byte hit ratio', value: formatPercent(byteHitRatio.value, 1), hint: 'bytes served from cache', tone: 'ok' },
  { label: 'Served from cache', value: formatBytes(summary.value.cachedBytes), hint: `of ${formatBytes(summary.value.bytes)} total`, tone: 'info' },
  { label: 'Origin requests', value: formatCompact(summary.value.originRequests), hint: `${formatBytes(summary.value.originBytes)} pulled from origin`, tone: 'warn' },
  { label: 'Total requests', value: formatCompact(summary.value.requests), hint: filters.rangeLabel, tone: 'total' },
])

const toPoints = (rows, pickValue) =>
  rows
    .map((row) => ({ x: new Date(row.timestamp).getTime(), y: pickValue(row) }))
    .filter((point) => Number.isFinite(point.x))

const resultSeries = computed(() => {
  const rows = statusSeriesRaw.value
  const n = (value) => Number(value) || 0
  return [
    { name: 'From cache', color: palette.value.cached, data: toPoints(rows, (r) => n(r.hit) + n(r.stale) + n(r.updating) + n(r.revalidated)) },
    { name: 'Miss / expired', color: palette.value.miss, data: toPoints(rows, (r) => n(r.miss) + n(r.expired)) },
    { name: 'Not cacheable', color: palette.value.uncacheable, data: toPoints(rows, (r) => n(r.bypass) + n(r.dynamic)) },
  ]
})

const bandwidthSeries = computed(() => [
  { name: 'From cache', color: palette.value.cached, data: toPoints(bandwidthSeriesRaw.value, (r) => Number(r.cachedBytes) || 0) },
  { name: 'From origin', color: palette.value.origin, data: toPoints(bandwidthSeriesRaw.value, (r) => Number(r.uncachedBytes) || 0) },
])

const maxStatusRequests = computed(() => Math.max(1, ...statusRows.value.map((row) => Number(row.requests) || 0)))
const barWidth = (value, max) => Math.max(1, Math.round(((Number(value) || 0) / max) * 100))

const statusTone = (status) => {
  const key = String(status).toUpperCase()
  if (key === 'HIT') return 'hit'
  if (['STALE', 'UPDATING', 'REVALIDATED'].includes(key)) return 'served'
  if (['MISS', 'EXPIRED'].includes(key)) return 'miss'
  return 'none'
}

const ratioTone = (value) => {
  const ratio = Number(value) || 0
  if (ratio >= 80) return 'ratio-fill--good'
  if (ratio >= 50) return 'ratio-fill--ok'
  return 'ratio-fill--low'
}

const ratioTextTone = (value) => ((Number(value) || 0) < 50 ? 'is-low' : '')

onMounted(async () => {
  await filters.loadScope()
  load()
})
</script>

<style scoped>
.cache-analytics-view {
  max-width: 1680px;
  margin: 0 auto;
}

.cache-status-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cache-status-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) 48px 46px;
  align-items: center;
  gap: 10px;
}

.cache-status-tag {
  justify-self: start;
  padding: 2px 8px;
  border-radius: 999px;
  border: 0.5px solid transparent;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.03em;
}

.cache-status-tag--hit { color: #3fbd85; background: rgba(63, 189, 133, 0.12); border-color: rgba(63, 189, 133, 0.3); }
.cache-status-tag--served { color: #4fa8a0; background: rgba(79, 168, 160, 0.12); border-color: rgba(79, 168, 160, 0.3); }
.cache-status-tag--miss { color: #d4a24a; background: rgba(212, 162, 74, 0.12); border-color: rgba(212, 162, 74, 0.3); }
.cache-status-tag--none { color: var(--app-text-muted); background: var(--app-surface-muted); border-color: var(--app-border); }

.cache-status-bar {
  height: 7px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--app-surface-muted);
}

.cache-status-bar > span {
  display: block;
  height: 100%;
  border-radius: 999px;
}

.cache-status-fill--hit { background: #3fbd85; }
.cache-status-fill--served { background: #4fa8a0; }
.cache-status-fill--miss { background: #d4a24a; }
.cache-status-fill--none { background: #7d8b96; }

.cache-status-value,
.cache-status-share {
  text-align: right;
  font-size: 12px;
}

.cache-status-value { color: var(--app-heading); }
.cache-status-share { color: var(--app-text-muted); font-size: 11px; }

.cache-legend {
  margin: 14px 0 0;
  padding-top: 12px;
  border-top: 0.5px solid var(--app-border);
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--app-text-muted);
}

.cache-legend strong {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10.5px;
  font-weight: 650;
  color: var(--app-text);
}

</style>
