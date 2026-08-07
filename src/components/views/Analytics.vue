<template>
  <div class="dashboard-view analytics-view">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>Traffic analytics</h2>
        <p>Edge and server traffic metrics across bandwidth, requests, audience, and HTTP breakdowns.</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <div class="dash-filterbar">
      <div class="dash-filter-field">
        <label for="analytics-server">Server</label>
        <select id="analytics-server" v-model="selectedServer" class="dash-select">
          <option v-for="server in serverOptions" :key="server.value" :value="server.value">
            {{ server.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label for="analytics-site">Site</label>
        <select id="analytics-site" v-model="selectedSite" class="dash-select">
          <option v-for="site in siteOptions" :key="site.value" :value="site.value">
            {{ site.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label>Time range</label>
        <div class="dash-range-pills">
          <button
            v-for="range in timeRanges"
            :key="range.value"
            type="button"
            class="dash-range-pill"
            :class="{ active: selectedTimeRange === range.value && !isCustomRange }"
            @click="selectTimeRange(range.value)"
          >
            {{ range.label }}
          </button>
          <button
            type="button"
            class="dash-range-pill dash-range-pill--custom"
            :class="{ active: isCustomRange }"
            @click="showCustomDialog = true"
          >
            Custom
          </button>
        </div>
      </div>
      <div class="dash-filter-summary">
        <span class="dash-live-dot" aria-hidden="true"></span>
        {{ selectedRangeLabel }}
      </div>
      <button type="button" class="dash-filter-apply" @click="applyFilters">
        Apply
      </button>
    </div>

    <nav class="dash-tabbar" aria-label="Analytics sections">
      <button
        v-for="tab in analyticsTabs"
        :key="tab.id"
        type="button"
        class="dash-tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div v-show="activeTab === 'bandwidth'" class="analytics-tab-panel">
      <section class="dash-metrics">
        <article v-for="metric in bandwidthMetricCards" :key="metric.label" class="dash-metric-card">
          <div class="dash-metric-label">{{ metric.label }}</div>
          <div class="dash-metric-value num">{{ metric.value }}</div>
          <div v-if="metric.sub" class="dash-metric-delta">{{ metric.sub }}</div>
        </article>
      </section>
      <section class="dash-grid12">
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Bandwidth by Time</h3>
              <p class="dash-panel-desc">RX bandwidth trend based on selected range for NIC / L7</p>
            </div>
          </div>
          <div class="dash-chart-wrap">
            <div ref="rxBandwidthChart"></div>
          </div>
          <p class="dash-panel-desc">TX bandwidth trend based on selected range for NIC / L7</p>
          <div class="dash-chart-wrap">
            <div ref="txBandwidthChart"></div>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Traffic by Time</h3>
              <p class="dash-panel-desc">NIC / L7 RX traffic trend based on selected range</p>
            </div>
          </div>
          <div class="dash-chart-wrap">
            <div ref="rxTrafficChart"></div>
          </div>
          <p class="dash-panel-desc">NIC / L7 TX traffic trend based on selected range</p>
          <div class="dash-chart-wrap">
            <div ref="txTrafficChart"></div>
          </div>
        </div>
      </section>
    </div>

    <div v-show="activeTab === 'requests'" class="analytics-tab-panel">
      <section class="dash-metrics">
        <article v-for="metric in requestsMetricCards" :key="metric.label" class="dash-metric-card">
          <div class="dash-metric-label">{{ metric.label }}</div>
          <div class="dash-metric-value num">{{ metric.value }}</div>
        </article>
      </section>
      <section class="dash-grid12">
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Request / Response by Time</h3>
              <p class="dash-panel-desc">Request and response trend based on selected range</p>
            </div>
          </div>
          <div class="dash-chart-wrap">
            <div ref="requestResponseChart"></div>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Status Code by Time</h3>
              <p class="dash-panel-desc">Status code trend based on selected range</p>
            </div>
          </div>
          <div class="dash-chart-wrap">
            <div ref="statusCodeChart"></div>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Status Code Summary</h3>
              <p class="dash-panel-desc">Pie distribution and table summary</p>
            </div>
          </div>
          <div class="ip-table-layout">
            <div class="table-card table-card--compact">
              <div class="table-title">Status Codes (Pie)</div>
              <div class="top-ips-pie">
                <div ref="statusCodePieChart"></div>
              </div>
            </div>
            <div class="table-card table-card--compact">
              <div class="table-title">Status Codes</div>
              <div class="table-wrap">
                <table class="ip-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Count</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in statusCodeRows" :key="row.code">
                      <td>{{ row.code }}</td>
                      <td>{{ row.count }}</td>
                      <td>{{ row.rate }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-show="activeTab === 'audience'" class="analytics-tab-panel">
      <section class="dash-metrics">
        <article v-for="metric in audienceMetricCards" :key="metric.label" class="dash-metric-card">
          <div class="dash-metric-label">{{ metric.label }}</div>
          <div class="dash-metric-value num">{{ metric.value }}</div>
        </article>
      </section>
      <section class="dash-grid12">
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>IP Count by Time</h3>
              <p class="dash-panel-desc">Unique IP count trend based on selected range</p>
            </div>
          </div>
          <div class="dash-chart-wrap">
            <div ref="ipCountChart"></div>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Top IPs</h3>
              <p class="dash-panel-desc">Pie distribution and table summary</p>
            </div>
          </div>
          <div class="ip-table-layout">
            <div class="table-card table-card--compact">
              <div class="table-title">Top IPs (Pie)</div>
              <div class="top-ips-pie">
                <div ref="topIpsPieChart"></div>
              </div>
            </div>
            <div class="table-card table-card--compact">
              <div class="table-title">Top IPs</div>
              <div class="table-wrap">
                <table class="ip-table">
                  <thead>
                    <tr>
                      <th>IP</th>
                      <th>Requests</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in ipTableRows" :key="row.ip">
                      <td>{{ row.ip }}</td>
                      <td>{{ row.requests }}</td>
                      <td>{{ row.rate }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>ISP Summary</h3>
              <p class="dash-panel-desc">Pie distribution and table summary</p>
            </div>
          </div>
          <div class="ip-table-layout">
            <div class="table-card table-card--compact">
              <div class="table-title">ISP (Pie)</div>
              <div class="top-ips-pie">
                <div ref="ispPieChart"></div>
              </div>
            </div>
            <div class="table-card table-card--compact">
              <div class="table-title">ISP</div>
              <div class="table-wrap">
                <table class="ip-table">
                  <thead>
                    <tr>
                      <th>ISP</th>
                      <th>Requests</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in ispTableRows" :key="row.isp">
                      <td>{{ row.isp }}</td>
                      <td>{{ row.requests }}</td>
                      <td>{{ row.rate }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Referer Summary</h3>
              <p class="dash-panel-desc">Pie distribution and table summary</p>
            </div>
          </div>
          <div class="ip-table-layout">
            <div class="table-card table-card--compact">
              <div class="table-title">Referer (Pie)</div>
              <div class="top-ips-pie">
                <div ref="refererPieChart"></div>
              </div>
            </div>
            <div class="table-card table-card--compact">
              <div class="table-title">Referer</div>
              <div class="table-wrap">
                <table class="ip-table">
                  <thead>
                    <tr>
                      <th>Referer</th>
                      <th>Requests</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in refererTableRows" :key="row.referer">
                      <td>{{ row.referer }}</td>
                      <td>{{ row.requests }}</td>
                      <td>{{ row.rate }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Requests by Country</h3>
              <p class="dash-panel-desc">World map with request counts by country</p>
            </div>
          </div>
          <div class="world-map">
            <SvgMap :map="world" :location-attributes="mapLocationAttributes" />
            <div
              v-if="hoveredCountry"
              class="map-tooltip"
              :style="{ left: `${tooltipPosition.x}px`, top: `${tooltipPosition.y}px` }"
            >
              {{ hoveredCountry }}
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-show="activeTab === 'http'" class="analytics-tab-panel">
      <section class="dash-grid12">
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>HTTP Method Summary</h3>
              <p class="dash-panel-desc">Pie distribution and table summary</p>
            </div>
          </div>
          <div class="ip-table-layout">
            <div class="table-card table-card--compact">
              <div class="table-title">Methods (Pie)</div>
              <div class="top-ips-pie">
                <div ref="methodPieChart"></div>
              </div>
            </div>
            <div class="table-card table-card--compact">
              <div class="table-title">HTTP Methods</div>
              <div class="table-wrap">
                <table class="ip-table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Requests</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in methodTableRows" :key="row.method">
                      <td>{{ row.method }}</td>
                      <td>{{ row.requests }}</td>
                      <td>{{ row.rate }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>HTTP Method by Time</h3>
              <p class="dash-panel-desc">Method trend based on selected range</p>
            </div>
          </div>
          <div class="dash-chart-wrap">
            <div ref="methodChart"></div>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>HTTP Protocol Summary</h3>
              <p class="dash-panel-desc">Pie distribution and table summary</p>
            </div>
          </div>
          <div class="ip-table-layout">
            <div class="table-card table-card--compact">
              <div class="table-title">Protocols (Pie)</div>
              <div class="top-ips-pie">
                <div ref="protocolPieChart"></div>
              </div>
            </div>
            <div class="table-card table-card--compact">
              <div class="table-title">HTTP Protocols</div>
              <div class="table-wrap">
                <table class="ip-table">
                  <thead>
                    <tr>
                      <th>Protocol</th>
                      <th>Requests</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in protocolTableRows" :key="row.protocol">
                      <td>{{ row.protocol }}</td>
                      <td>{{ row.requests }}</td>
                      <td>{{ row.rate }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>HTTP Protocol by Time</h3>
              <p class="dash-panel-desc">Protocol trend based on selected range</p>
            </div>
          </div>
          <div class="dash-chart-wrap">
            <div ref="protocolChart"></div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="showCustomDialog" class="dialog-overlay" @click.self="showCustomDialog = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Custom Time Range</h3>
          <button class="dialog-close" @click="showCustomDialog = false">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-body">
          <div class="dialog-form-group">
            <label>Start Date & Time</label>
            <FlatPickr
              v-model="customStartDate"
              :config="datePickerConfig"
              class="dialog-input"
              placeholder="Select start time"
            />
          </div>
          <div class="dialog-form-group">
            <label>End Date & Time</label>
            <FlatPickr
              v-model="customEndDate"
              :config="datePickerConfig"
              class="dialog-input"
              placeholder="Select end time"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn cancel-btn" @click="showCustomDialog = false">Cancel</button>
          <button class="dialog-btn apply-btn" @click="applyCustomRange">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import ApexCharts from 'apexcharts'
import { SvgMap } from 'vue-svg-map'
import world from '@svg-maps/world'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { fetchServers } from '@/api/servers'
import { fetchSites } from '@/api/sites'
import { fetchAnalyticsSeries, fetchAnalyticsSummary, fetchAnalyticsSummaryGroup } from '@/api/analytics'
import { notifyError } from '@/utils/notify'

const ANALYTICS_TITLE = 'Analytics'

const chartGridColor = () => {
  if (typeof document === 'undefined') return 'rgba(148, 163, 184, 0.2)'
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim() ||
    'rgba(148, 163, 184, 0.2)'
  )
}

const chartLabelColor = () => {
  if (typeof document === 'undefined') return '#64748b'
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--chart-label').trim() ||
    '#64748b'
  )
}

const chartTooltipTheme = () =>
  typeof document !== 'undefined' &&
  document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light'

const isDarkTheme = () =>
  typeof document !== 'undefined' &&
  document.documentElement.getAttribute('data-theme') === 'dark'

const pieEmptyColor = () => (isDarkTheme() ? '#2a2a2a' : '#e2e8f0')

const pieSliceStrokeColor = () => (isDarkTheme() ? '#0a0a0a' : '#ffffff')

const pieCenterValueColor = () => {
  if (typeof document === 'undefined') return '#f1f5f9'
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--app-heading').trim() ||
    '#f1f5f9'
  )
}

/** Brand chart colors from dorian-brand (Viper / L4 / L7 / Gold / Warn / Danger). */
const CHART_COLORS = {
  viper: '#3FBD85',
  viperDeep: '#2E9E6C',
  l4: '#5B9DF0',
  l7: '#B08CF0',
  gold: '#C9A24A',
  warn: '#E0A83F',
  danger: '#E15241',
  success: '#4FBD7A',
  muted: '#8B978F',
}

const PIE_PALETTE = [
  CHART_COLORS.viper,
  CHART_COLORS.l4,
  CHART_COLORS.gold,
  CHART_COLORS.danger,
  CHART_COLORS.l7,
  CHART_COLORS.warn,
  CHART_COLORS.success,
  CHART_COLORS.viperDeep,
  CHART_COLORS.muted,
  '#5B6560',
  '#333F38',
  '#171F1B',
]

const LINE_SERIES_PALETTE = [
  CHART_COLORS.viper,
  CHART_COLORS.l4,
  CHART_COLORS.l7,
  CHART_COLORS.gold,
  CHART_COLORS.warn,
  CHART_COLORS.danger,
  CHART_COLORS.success,
  CHART_COLORS.muted,
]

const STATUS_SERIES_COLORS = [
  CHART_COLORS.success,
  CHART_COLORS.l4,
  CHART_COLORS.warn,
  CHART_COLORS.danger,
]

const formatPieTotal = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  if (numeric >= 1_000_000_000) return `${(numeric / 1_000_000_000).toFixed(1)}B`
  if (numeric >= 1_000_000) return `${(numeric / 1_000_000).toFixed(1)}M`
  if (numeric >= 10_000) return `${(numeric / 1_000).toFixed(1)}K`
  return numeric.toLocaleString()
}

const getDonutCenterElements = (w) => {
  const root = w?.globals?.dom?.baseEl
  if (!root) return { elLabel: null, elValue: null }
  return {
    elLabel: root.querySelector('.apexcharts-datalabel-label'),
    elValue: root.querySelector('.apexcharts-datalabel-value'),
  }
}

const setDonutCenterLabels = (w, nameText, valueText) => {
  const { elLabel, elValue } = getDonutCenterElements(w)
  if (elLabel) {
    elLabel.textContent = nameText
    elLabel.style.fill = chartLabelColor()
  }
  if (elValue) {
    elValue.textContent = valueText
    elValue.style.fill = pieCenterValueColor()
  }
}

const updateDonutCenterForSlice = (w, index, labels, series, hasData) => {
  if (!hasData || !w) return
  const label = labels[index] ?? 'Unknown'
  const value = Number(series[index] ?? 0)
  const total = series.reduce((sum, entry) => sum + Number(entry ?? 0), 0)
  const pct = total ? ((value / total) * 100).toFixed(1) : '0.0'
  setDonutCenterLabels(w, label, `${formatPieTotal(value)} (${pct}%)`)
}

const resetDonutCenterToTotal = (w, series, hasData) => {
  if (!w) return
  if (!hasData) {
    setDonutCenterLabels(w, 'No data', '—')
    return
  }
  const total = series.reduce((sum, entry) => sum + Number(entry ?? 0), 0)
  setDonutCenterLabels(w, 'Total', formatPieTotal(total))
}

const buildPieChartEvents = (labels, series, hasData) => ({
  dataPointMouseEnter(_event, _ctx, config) {
    updateDonutCenterForSlice(config.w, config.dataPointIndex, labels, series, hasData)
  },
  dataPointMouseLeave(_event, _ctx, config) {
    resetDonutCenterToTotal(config.w, series, hasData)
  },
  dataPointSelection(_event, _ctx, config) {
    updateDonutCenterForSlice(config.w, config.dataPointIndex, labels, series, hasData)
  },
})

const PIE_BOX_HEIGHT = 208
const PIE_CHART_MIN_HEIGHT = 120
const PIE_CHART_DEFAULT_HEIGHT = PIE_BOX_HEIGHT

/** Drawable height: fill `.top-ips-pie` (fills pie card below title). */
const getPieChartHeight = (mountEl) => {
  const wrap = mountEl?.parentElement
  if (!wrap) return PIE_CHART_DEFAULT_HEIGHT
  const styles = getComputedStyle(wrap)
  const paddingY =
    (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0)
  const inner = Math.floor(wrap.clientHeight - paddingY)
  if (inner >= PIE_CHART_MIN_HEIGHT) return inner
  return PIE_CHART_DEFAULT_HEIGHT
}

const buildPieChartOptions = (labels, series, hasData, mountEl) => {
  const safeLabels = hasData ? labels : ['No data']
  const safeSeries = hasData ? series : [1]
  const colors = hasData ? PIE_PALETTE : [pieEmptyColor()]
  const chartHeight = getPieChartHeight(mountEl)
  const labelColor = chartLabelColor()
  const centerColor = pieCenterValueColor()

  return {
    safeLabels,
    safeSeries,
    hasData,
    chartHeight,
    options: {
      chart: {
        foreColor: labelColor,
        type: 'donut',
        height: chartHeight,
        width: '100%',
        toolbar: { show: false },
        background: 'transparent',
        offsetX: 0,
        offsetY: 0,
        events: buildPieChartEvents(safeLabels, safeSeries, hasData),
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 450,
          animateGradually: {
            enabled: true,
            delay: 80,
          },
        },
        dropShadow: {
          enabled: true,
          top: 2,
          left: 0,
          blur: 6,
          opacity: isDarkTheme() ? 0.18 : 0.08,
        },
      },
      labels: safeLabels,
      series: safeSeries,
      colors,
      legend: { show: false },
      dataLabels: { enabled: false },
      stroke: {
        show: true,
        width: 3,
        colors: [pieSliceStrokeColor()],
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          offsetX: 0,
          offsetY: 0,
          customScale: 0.96,
          donut: {
            size: '70%',
            background: 'transparent',
            labels: {
              show: true,
              name: {
                show: hasData,
                fontSize: '11px',
                fontWeight: 500,
                color: labelColor,
                offsetY: -8,
                formatter: (name, isTotal) => (isTotal ? name : name),
              },
              value: {
                show: hasData,
                fontSize: '17px',
                fontWeight: 700,
                color: centerColor,
                offsetY: 4,
                formatter: (val) => formatPieTotal(val),
              },
              total: {
                show: true,
                showAlways: false,
                label: hasData ? 'Total' : 'No data',
                fontSize: '11px',
                fontWeight: 500,
                color: labelColor,
                formatter: (w) => {
                  if (!hasData) return '—'
                  const total = w.globals.seriesTotals.reduce((sum, value) => sum + value, 0)
                  return formatPieTotal(total)
                },
              },
            },
          },
        },
      },
      states: {
        hover: {
          filter: {
            type: 'lighten',
            value: 0.08,
          },
        },
        active: {
          filter: {
            type: 'darken',
            value: 0.12,
          },
        },
      },
      tooltip: {
        theme: chartTooltipTheme(),
        fillSeriesColor: false,
        y: {
          formatter: (val, { w }) => {
            const total = w.globals.seriesTotals.reduce((sum, value) => sum + value, 0)
            const pct = total ? ((val / total) * 100).toFixed(1) : '0.0'
            return `${Math.round(val).toLocaleString()} (${pct}%)`
          },
        },
      },
    },
  }
}

const pieChartPatchOptions = (built, chartHeight) => ({
  chart: {
    foreColor: chartLabelColor(),
    height: chartHeight,
    width: '100%',
    events: built.options.chart.events,
  },
  labels: built.safeLabels,
  colors: built.options.colors,
  stroke: built.options.stroke,
  plotOptions: built.options.plotOptions,
  tooltip: built.options.tooltip,
})

const updatePieChartInstance = (instance, el, built) => {
  if (!el) return instance

  const apply = (current) => {
    const chartHeight = getPieChartHeight(el)
    built.options.chart.height = chartHeight

    if (current) {
      current.updateOptions(pieChartPatchOptions(built, chartHeight), false, true)
      current.updateSeries(built.safeSeries, true)
      nextTick(() => resetDonutCenterToTotal(current.w, built.safeSeries, built.hasData))
      return current
    }
    const chart = new ApexCharts(el, built.options)
    chart.render().then(() => {
      resetDonutCenterToTotal(chart.w, built.safeSeries, built.hasData)
    })
    return chart
  }

  let chart = apply(instance)
  const wrap = el.parentElement
  if (wrap && wrap.clientHeight < PIE_CHART_MIN_HEIGHT) {
    requestAnimationFrame(() => {
      apply(chart)
    })
  }

  return chart
}

const rerenderAllCharts = () => {
  renderRxBandwidthChart()
  renderTxBandwidthChart()
  renderRxTrafficChart()
  renderTxTrafficChart()
  renderRequestResponseChart()
  renderStatusCodeChart()
  renderIpCountChart()
  renderMethodChart()
  renderProtocolChart()
  renderTopIpsPie()
  renderStatusCodePie()
  renderIspPie()
  renderRefererPie()
  renderMethodPie()
  renderProtocolPie()
}

const activeTab = ref('bandwidth')

const analyticsTabs = [
  { id: 'bandwidth', label: 'Bandwidth & Traffic' },
  { id: 'requests', label: 'Requests & Status' },
  { id: 'audience', label: 'Audience' },
  { id: 'http', label: 'HTTP' },
]

const selectedServer = ref('all')
const selectedSite = ref('all')
const selectedTimeRange = ref('1h')
const isCustomRange = ref(false)
const showCustomDialog = ref(false)
const customStartDate = ref(null)
const customEndDate = ref(null)
const datePickerConfig = { enableTime: true, dateFormat: 'Y-m-d H:i' }
const appliedFilters = ref({
  server: 'all',
  site: 'all',
  range: '1h',
  isCustom: false,
  customStart: '',
  customEnd: '',
})
const rxBandwidthChart = ref(null)
const txBandwidthChart = ref(null)

const rxTrafficChart = ref(null)
const txTrafficChart = ref(null)

const requestResponseChart = ref(null)
const statusCodeChart = ref(null)
const ipCountChart = ref(null)
const topIpsPieChart = ref(null)
const statusCodePieChart = ref(null)
const ispPieChart = ref(null)
const refererPieChart = ref(null)
const methodPieChart = ref(null)
const methodChart = ref(null)
const protocolPieChart = ref(null)
const protocolChart = ref(null)

let rxBandwidthChartInstance = null
let txBandwidthChartInstance = null

let rxTrafficChartInstance = null
let txTrafficChartInstance = null

let requestResponseChartInstance = null
let statusCodeChartInstance = null
let ipCountChartInstance = null
let topIpsPieChartInstance = null
let statusCodePieChartInstance = null
let ispPieChartInstance = null
let refererPieChartInstance = null
let methodPieChartInstance = null
let methodChartInstance = null
let protocolPieChartInstance = null
let protocolChartInstance = null
const nicRxBandwidthSeries = ref([{ name: 'NIC RX Bandwidth', data: [] }])
const nicTxBandwidthSeries = ref([{ name: 'NIC TX Bandwidth', data: [] }])
const l7RxBandwidthSeries = ref([{ name: 'L7 RX Bandwidth', data: [] }])
const l7TxBandwidthSeries = ref([{ name: 'L7 TX Bandwidth', data: [] }])
const nicRxTrafficSeries = ref([{ name: 'NIC RX Traffic', data: [] }])
const nicTxTrafficSeries = ref([{ name: 'NIC TX Traffic', data: [] }])
const l7RxTrafficSeries = ref([{ name: 'L7 RX Traffic', data: [] }])
const l7TxTrafficSeries = ref([{ name: 'L7 TX Traffic', data: [] }])
const requestResponseSeries = ref([
  { name: 'Requests', data: [] },
  { name: 'Responses', data: [] },
])
const statusCodeSeries = ref([
  { name: '2xx', data: [] },
  { name: '3xx', data: [] },
  { name: '4xx', data: [] },
  { name: '5xx', data: [] },
])
const ipCountSeries = ref([{ name: 'IP Count', data: [] }])
const methodSeries = ref([])
const protocolSeries = ref([])

const createDefaultAnalyticsStats = () => ({
  totalNicRxTraffic: 0,
  totalNicTxTraffic: 0,
  totalL7RxTraffic: 0,
  totalL7TxTraffic: 0,
  nicRxBandwidthLast: 0,
  nicTxBandwidthLast: 0,
  l7RxBandwidthLast: 0,
  l7TxBandwidthLast: 0,
  nicRxBandwidthLastTime: '',
  nicTxBandwidthLastTime: '',
  l7RxBandwidthLastTime: '',
  l7TxBandwidthLastTime: '',
  totalRequest: 0,
  totalResponse: 0,
  ipCount: 0,
  refererCount: 0,
  ispCount: 0,
})

const analyticsStats = ref(createDefaultAnalyticsStats())
const ipTableRows = ref([])
const statusCodeRows = ref([])
const ispTableRows = ref([])
const refererTableRows = ref([])
const methodTableRows = ref([])
const protocolTableRows = ref([])
const countryRequests = ref([])
const countryRequestMap = computed(() =>
  countryRequests.value.reduce((acc, item) => {
    acc[item.code.toLowerCase()] = item
    return acc
  }, {})
)
const hoveredCountry = ref('')
const tooltipPosition = ref({ x: 0, y: 0 })
const maxCountryCount = computed(() =>
  Math.max(0, ...countryRequests.value.map((item) => item.count))
)
const mapLocationAttributes = (location) => {
  const entry = countryRequestMap.value[location.id.toLowerCase()]
  const ratio = entry && maxCountryCount.value ? entry.count / maxCountryCount.value : 0
  const fillColor = entry ? colorFromRate(ratio) : 'rgba(148, 163, 184, 0.2)'
  return {
    fill: fillColor,
    stroke: 'rgba(100, 116, 139, 0.6)',
    'stroke-width': 0.5,
    title: entry
      ? `${entry.name} — ${entry.count.toLocaleString()} requests`
      : location.name,
    onMouseenter: () => {
      hoveredCountry.value = entry
        ? `${entry.name} — ${entry.count.toLocaleString()} requests`
        : location.name
    },
    onMousemove: (event) => {
      tooltipPosition.value = {
        x: event.offsetX + 12,
        y: event.offsetY + 12,
      }
    },
    onMouseleave: () => {
      hoveredCountry.value = ''
    },
  }
}

const colorFromRate = (ratio) => {
  if (ratio >= 0.8) return CHART_COLORS.danger
  if (ratio >= 0.6) return CHART_COLORS.warn
  if (ratio >= 0.4) return CHART_COLORS.gold
  if (ratio >= 0.2) return CHART_COLORS.success
  return CHART_COLORS.l4
}

const servers = ref([])
const sites = ref([])
const serverOptions = computed(() => [
  { label: 'All Servers', value: 'all' },
  ...servers.value.map((server) => ({ label: server.name || `Server ${server.id}`, value: server.id })),
])
const siteOptions = computed(() => {
  let list = sites.value
  if (selectedServer.value !== 'all') {
    const serverId = Number(selectedServer.value)
    list = list.filter(
      (site) =>
        Array.isArray(site.serverIds) && site.serverIds.some((id) => Number(id) === serverId),
    )
  }
  return [
    { label: 'All Sites', value: 'all' },
    ...list.map((site) => ({
      label: site.domain || `Site ${site.id}`,
      value: String(site.id),
    })),
  ]
})

const formatNumber = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return numeric.toLocaleString()
}

const formatKiloBytes = (value) => {
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

const formatKiloBps = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 Kbps'
  const units = ['KBps', 'MBps', 'GBps', 'TBps']
  let index = 0
  let current = numeric
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  return `${current.toFixed(current >= 10 ? 0 : 1)} ${units[index]}`
}

const formatMegabytes = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 MB'
  if (numeric >= 1024) {
    return `${(numeric / 1024).toFixed(numeric >= 10240 ? 0 : 1)} GB`
  }
  return `${numeric.toFixed(numeric >= 10 ? 0 : 1)} MB`
}

const formatMegabps = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 Mbps'
  if (numeric >= 1024) {
    return `${(numeric / 1024).toFixed(numeric >= 10240 ? 0 : 1)} Gbps`
  }
  return `${numeric.toFixed(numeric >= 10 ? 0 : 1)} Mbps`
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

const formatDateInput = (value) => {
  if (!value) return ''
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
}

const statsDisplay = computed(() => ({
  totalNicRxTraffic: formatKiloBytes(analyticsStats.value.totalNicRxTraffic),
  totalNicTxTraffic: formatKiloBytes(analyticsStats.value.totalNicTxTraffic),
  totalL7RxTraffic: formatKiloBytes(analyticsStats.value.totalL7RxTraffic),
  totalL7TxTraffic: formatKiloBytes(analyticsStats.value.totalL7TxTraffic),
  nicRxBandwidthLast: formatKiloBps(analyticsStats.value.nicRxBandwidthLast),
  nicTxBandwidthLast: formatKiloBps(analyticsStats.value.nicTxBandwidthLast),
  l7RxBandwidthLast: formatKiloBps(analyticsStats.value.l7RxBandwidthLast),
  l7TxBandwidthLast: formatKiloBps(analyticsStats.value.l7TxBandwidthLast),
  nicRxBandwidthLastTime: formatDateTime(analyticsStats.value.nicRxBandwidthLastTime),
  nicTxBandwidthLastTime: formatDateTime(analyticsStats.value.nicTxBandwidthLastTime),
  l7RxBandwidthLastTime: formatDateTime(analyticsStats.value.l7RxBandwidthLastTime),
  l7TxBandwidthLastTime: formatDateTime(analyticsStats.value.l7TxBandwidthLastTime),
  totalRequest: formatNumber(analyticsStats.value.totalRequest),
  totalResponse: formatNumber(analyticsStats.value.totalResponse),
  ipCount: formatNumber(analyticsStats.value.ipCount),
  referer: formatNumber(analyticsStats.value.refererCount),
  ispCount: formatNumber(analyticsStats.value.ispCount),
}))

const bandwidthMetricCards = computed(() => {
  const s = statsDisplay.value
  return [
    { label: 'RX Bandwidth of NIC (Last)', value: s.nicRxBandwidthLast, sub: s.nicRxBandwidthLastTime },
    { label: 'RX Bandwidth of L7 (Last)', value: s.l7RxBandwidthLast, sub: s.l7RxBandwidthLastTime },
    { label: 'TX Bandwidth of NIC (Last)', value: s.nicTxBandwidthLast, sub: s.nicTxBandwidthLastTime },
    { label: 'TX Bandwidth of L7 (Last)', value: s.l7TxBandwidthLast, sub: s.l7TxBandwidthLastTime },
    { label: 'RX Traffic of NIC / L7', value: `${s.totalNicRxTraffic} / ${s.totalL7RxTraffic}` },
    { label: 'TX Traffic of NIC / L7', value: `${s.totalNicTxTraffic} / ${s.totalL7TxTraffic}` },
  ]
})

const requestsMetricCards = computed(() => {
  const s = statsDisplay.value
  return [
    { label: 'Total Request', value: s.totalRequest },
    { label: 'Total Response', value: s.totalResponse },
  ]
})

const audienceMetricCards = computed(() => {
  const s = statsDisplay.value
  return [
    { label: 'IP Count', value: s.ipCount },
    { label: 'Referer', value: s.referer },
    { label: 'ISP Count', value: s.ispCount },
  ]
})

const selectedRangeLabel = computed(() => {
  if (isCustomRange.value) {
    if (customStartDate.value && customEndDate.value) {
      return `${formatDateTime(customStartDate.value)} → ${formatDateTime(customEndDate.value)}`
    }
    return 'Custom'
  }
  const found = timeRanges.find((range) => range.value === selectedTimeRange.value)
  return found?.label || 'All'
})

const timeRanges = [
  { label: '1h', value: '1h' },
  { label: '2h', value: '2h' },
  { label: '4h', value: '4h' },
  { label: '6h', value: '6h' },
  { label: '12h', value: '12h' },
  { label: '24h', value: '24h' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Today', value: 'today' },
]

const selectTimeRange = (value) => {
  selectedTimeRange.value = value
  isCustomRange.value = false
}

const applyCustomRange = () => {
  if (customStartDate.value && customEndDate.value) {
    isCustomRange.value = true
    selectedTimeRange.value = 'custom'
    showCustomDialog.value = false
  }
}

const applyFilters = () => {
  appliedFilters.value = {
    server: selectedServer.value,
    site: selectedSite.value,
    range: selectedTimeRange.value,
    isCustom: isCustomRange.value,
    customStart: isCustomRange.value ? formatDateInput(customStartDate.value) : '',
    customEnd: isCustomRange.value ? formatDateInput(customEndDate.value) : '',
  }
  loadAnalyticsData()
}

const resolveRangeMs = (filters) => {
  switch (filters.range) {
    case '30m':
      return 30 * 60 * 1000
    case '1h':
      return 60 * 60 * 1000
    case '2h':
      return 2 * 60 * 60 * 1000
    case '4h':
      return 4 * 60 * 60 * 1000
    case '6h':
      return 6 * 60 * 60 * 1000
    case '8h':
      return 8 * 60 * 60 * 1000
    case '12h':
      return 12 * 60 * 60 * 1000
    case '24h':
      return 24 * 60 * 60 * 1000
    case 'today': {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return now.getTime() - start.getTime()
    }
    case 'yesterday':
      return 24 * 60 * 60 * 1000
    default:
      return 60 * 60 * 1000
  }
}

const statusCodeList = [
  '200', '206', '301', '302', '400', '403', '404', '444',
  '499', '500', '502', '503', '504', '904', '929', '978',
]

const methodKeys = [
  { label: 'GET', field: 'getCount' },
  { label: 'POST', field: 'postCount' },
  { label: 'DELETE', field: 'deleteCount' },
  { label: 'PUT', field: 'putCount' },
  { label: 'HEAD', field: 'headCount' },
  { label: 'PATCH', field: 'patchCount' },
  { label: 'OPTIONS', field: 'optionsCount' },
  { label: 'OTHER', field: 'othersCount' },
]

const protocolKeys = [
  { label: 'HTTP/1.0', field: 'http1_0' },
  { label: 'HTTP/1.1', field: 'http1_1' },
  { label: 'HTTP/2', field: 'http2' },
  { label: 'HTTP/3', field: 'http3' },
]

const loadServers = async () => {
  try {
    const list = await fetchServers()
    servers.value = Array.isArray(list) ? list : []
  } catch (error) {
    console.error('Failed to load servers', error)
    servers.value = []
  }
}

const loadSites = async () => {
  try {
    const list = await fetchSites()
    sites.value = Array.isArray(list) ? list : []
  } catch (error) {
    console.error('Failed to load sites', error)
    sites.value = []
  }
}

const loadAnalyticsData = async () => {
  const params = buildAnalyticsParams()

  let summary = null
  try {
    summary = await fetchAnalyticsSummary(params)
  } catch (error) {
    console.error('Failed to load analytics summary', error)
    analyticsStats.value = createDefaultAnalyticsStats()
    notifyError(ANALYTICS_TITLE, error?.message || 'The analytics summary could not be loaded.')
  }

  try {
    const [
      nicRxBandwidth,
      nicTxBandwidth,
      l7RxBandwidth,
      l7TxBandwidth,
      nicRxTraffic, 
      nicTxTraffic,
      l7RxTraffic,
      l7TxTraffic,
      requestResponse,
      statusSeries,
      ipCount,
      methodPoints,
      protocolPoints,
      statusSummary,
      topIps,
      topIsps,
      topReferers,
      countryRows,
      methodSummary,
      protocolSummary,
    ] = await Promise.all([
      fetchAnalyticsSeries('nic-rx-bandwidth', params),
      fetchAnalyticsSeries('nic-tx-bandwidth', params),
      fetchAnalyticsSeries('l7-rx-bandwidth', params),
      fetchAnalyticsSeries('l7-tx-bandwidth', params),
      fetchAnalyticsSeries('nic-rx-traffic', params),
      fetchAnalyticsSeries('nic-tx-traffic', params),
      fetchAnalyticsSeries('l7-rx-traffic', params),
      fetchAnalyticsSeries('l7-tx-traffic', params),
      fetchAnalyticsSeries('request-response', params),
      fetchAnalyticsSeries('status-codes', params),
      fetchAnalyticsSeries('ip-count', params),
      fetchAnalyticsSeries('methods', params),
      fetchAnalyticsSeries('protocols', params),
      fetchAnalyticsSummaryGroup('status-codes', params),
      fetchAnalyticsSummaryGroup('top-ips', params),
      fetchAnalyticsSummaryGroup('isps', params),
      fetchAnalyticsSummaryGroup('referers', params),
      fetchAnalyticsSummaryGroup('countries', params),
      fetchAnalyticsSummaryGroup('methods', params),
      fetchAnalyticsSummaryGroup('protocols', params),
    ])

    const summaryData = summary || {}

    analyticsStats.value = {
      totalNicRxTraffic: Number(summaryData?.totalNicRxTraffic ?? 0),
      totalNicTxTraffic: Number(summaryData?.totalNicTxTraffic ?? 0),
      totalL7RxTraffic: Number(summaryData?.totalL7RxTraffic ?? 0),
      totalL7TxTraffic: Number(summaryData?.totalL7TxTraffic ?? 0),
      nicRxBandwidthLast: Number(summaryData?.nicRxBandwidthLast ?? 0),
      nicTxBandwidthLast: Number(summaryData?.nicTxBandwidthLast ?? 0),
      l7RxBandwidthLast: Number(summaryData?.l7RxBandwidthLast ?? 0),
      l7TxBandwidthLast: Number(summaryData?.l7TxBandwidthLast ?? 0),
      nicRxBandwidthLastTime: summaryData?.nicRxBandwidthLastTime || '',
      nicTxBandwidthLastTime: summaryData?.nicTxBandwidthLastTime || '',
      l7RxBandwidthLastTime: summaryData?.l7RxBandwidthLastTime || '',
      l7TxBandwidthLastTime: summaryData?.l7TxBandwidthLastTime || '',
      totalRequest: Number(summaryData?.totalRequest ?? 0),
      totalResponse: Number(summaryData?.totalResponse ?? 0),
      ipCount: Number(summaryData?.ipCount ?? 0),
      refererCount: Number(summaryData?.refererCount ?? 0),
      ispCount: Number(summaryData?.ispCount ?? 0),
    }

    nicRxBandwidthSeries.value = [
      { name: 'NIC RX Bandwidth', data: mapSeriesPoints(Array.isArray(nicRxBandwidth) ? nicRxBandwidth : [], 'traffic') },
    ]
    nicTxBandwidthSeries.value = [
      { name: 'NIC TX Bandwidth', data: mapSeriesPoints(Array.isArray(nicTxBandwidth) ? nicTxBandwidth : [], 'traffic') },
    ]
    l7RxBandwidthSeries.value = [
      { name: 'L7 RX Bandwidth', data: mapSeriesPoints(Array.isArray(l7RxBandwidth) ? l7RxBandwidth : [], 'traffic') },
    ]
    l7TxBandwidthSeries.value = [
      { name: 'L7 TX Bandwidth', data: mapSeriesPoints(Array.isArray(l7TxBandwidth) ? l7TxBandwidth : [], 'traffic') },
    ]
    nicRxTrafficSeries.value = [
      { name: 'NIC RX Traffic', data: mapSeriesPoints(Array.isArray(nicRxTraffic) ? nicRxTraffic : [], 'traffic') },
    ]
    nicTxTrafficSeries.value = [
      { name: 'NIC TX Traffic', data: mapSeriesPoints(Array.isArray(nicTxTraffic) ? nicTxTraffic : [], 'traffic') },
    ]
    l7RxTrafficSeries.value = [
      { name: 'L7 RX Traffic', data: mapSeriesPoints(Array.isArray(l7RxTraffic) ? l7RxTraffic : [], 'traffic') },
    ]
    l7TxTrafficSeries.value = [
      { name: 'L7 TX Traffic', data: mapSeriesPoints(Array.isArray(l7TxTraffic) ? l7TxTraffic : [], 'traffic') },
    ]
    requestResponseSeries.value = [
      {
        name: 'Requests',
        data: mapSeriesPoints(Array.isArray(requestResponse) ? requestResponse : [], 'requestCount'),
      },
      {
        name: 'Responses',
        data: mapSeriesPoints(Array.isArray(requestResponse) ? requestResponse : [], 'responseCount'),
      },
    ]
    statusCodeSeries.value = [
      { name: '2xx', data: mapSeriesPoints(Array.isArray(statusSeries) ? statusSeries : [], 'success') },
      { name: '3xx', data: mapSeriesPoints(Array.isArray(statusSeries) ? statusSeries : [], 'redirect') },
      { name: '4xx', data: mapSeriesPoints(Array.isArray(statusSeries) ? statusSeries : [], 'client') },
      { name: '5xx', data: mapSeriesPoints(Array.isArray(statusSeries) ? statusSeries : [], 'server') },
    ]
    ipCountSeries.value = [
      { name: 'IP Count', data: mapSeriesPoints(Array.isArray(ipCount) ? ipCount : [], 'count') },
    ]
    methodSeries.value = methodKeys.map((method) => ({
      name: method.label,
      data: mapSeriesPoints(Array.isArray(methodPoints) ? methodPoints : [], method.field),
    }))
    protocolSeries.value = protocolKeys.map((protocol) => ({
      name: protocol.label,
      data: mapSeriesPoints(Array.isArray(protocolPoints) ? protocolPoints : [], protocol.field),
    }))

    const statusRows = statusCodeList.map((code) => ({
      code,
      count: Number(statusSummary?.[`code${code}`] ?? 0),
    }))
    statusCodeRows.value = buildRateRows(statusRows)

    const topIpRows = (Array.isArray(topIps) ? topIps : []).map((row) => ({
      ip: row.ip,
      requests: Number(row.requests ?? 0),
    }))
    ipTableRows.value = buildRateRows(topIpRows)

    const ispRows = (Array.isArray(topIsps) ? topIsps : []).map((row) => ({
      isp: row.isp,
      requests: Number(row.requests ?? 0),
    }))
    ispTableRows.value = buildRateRows(ispRows)

    const refererRows = (Array.isArray(topReferers) ? topReferers : []).map((row) => ({
      referer: row.referer,
      requests: Number(row.requests ?? 0),
    }))
    refererTableRows.value = buildRateRows(refererRows)

    const countries = (Array.isArray(countryRows) ? countryRows : []).map((row) => ({
      code: String(row.countryCode || '').toUpperCase(),
      name: row.countryCode ? row.countryCode.toUpperCase() : 'Unknown',
      count: Number(row.requests ?? 0),
    }))
    countryRequests.value = countries

    const methodRows = methodKeys.map((method) => ({
      method: method.label,
      requests: Number(methodSummary?.[method.field] ?? 0),
    }))
    methodTableRows.value = buildRateRows(methodRows)

    const protocolRows = protocolKeys.map((protocol) => ({
      protocol: protocol.label,
      requests: Number(protocolSummary?.[protocol.field] ?? 0),
    }))
    protocolTableRows.value = buildRateRows(protocolRows)

    renderChartsForTab(activeTab.value)
  } catch (error) {
    console.error('Failed to load analytics data', error)
    notifyError(ANALYTICS_TITLE, error?.message || 'The analytics data could not be loaded.')
  }
}

const resolveRangeWindow = (filters) => {
  const now = new Date()
  if (filters.isCustom && filters.customStart && filters.customEnd) {
    return {
      start: new Date(filters.customStart),
      end: new Date(filters.customEnd),
    }
  }
  if (filters.range === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) }
  }
  if (filters.range === 'yesterday') {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { start: new Date(end.getTime() - 24 * 60 * 60 * 1000), end }
  }
  const duration = resolveRangeMs(filters)
  return { start: new Date(now.getTime() - duration), end: now }
}

const buildAnalyticsParams = () => {
  const filters = appliedFilters.value
  const params = { serverId: filters.server, siteId: filters.site }
  if (filters.isCustom && filters.customStart && filters.customEnd) {
    params.start = filters.customStart
    params.end = filters.customEnd
  } else {
    params.range = filters.range
  }
  return params
}

const mapSeriesPoints = (points, field) =>
  points
    .map((point) => ({
      x: new Date(point.timestamp).getTime(),
      y: Number(point[field] ?? 0),
    }))
    .filter((point) => !Number.isNaN(point.x))

const buildRateRows = (rows) => {
  const total = rows.reduce((sum, row) => sum + Number(row.count ?? row.requests ?? 0), 0)
  return rows.map((row) => {
    const value = Number(row.count ?? row.requests ?? 0)
    const rate = total ? `${((value / total) * 100).toFixed(1)}%` : '0%'
    return {
      ...row,
      value,
      count: formatNumber(value),
      requests: formatNumber(value),
      rate,
    }
  })
}

const renderRxBandwidthChart = () => {
  if (!rxBandwidthChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = [
    ...(nicRxBandwidthSeries.value.length ? [{ name: 'NIC RX Bandwidth', data: nicRxBandwidthSeries.value[0].data }] : []),
    ...(l7RxBandwidthSeries.value.length ? [{ name: 'L7 RX Bandwidth', data: l7RxBandwidthSeries.value[0].data }] : []),
  ]
  const options = {
    chart: {
      foreColor: chartLabelColor(),
      type: 'area',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: [CHART_COLORS.l4, CHART_COLORS.l7],
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => formatKiloBps(val),
      },
    },
    grid: {
      borderColor: chartGridColor(),
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '11px',
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    tooltip: {
      theme: chartTooltipTheme(),
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => formatKiloBps(val),
      },
    },
    series,
  }

  if (rxBandwidthChartInstance) {
    rxBandwidthChartInstance.updateOptions(options, true, true)
  } else {
    rxBandwidthChartInstance = new ApexCharts(rxBandwidthChart.value, options)
    rxBandwidthChartInstance.render()
  }
}


const renderTxBandwidthChart = () => {
  if (!txBandwidthChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = [
    ...(nicTxBandwidthSeries.value.length ? [{ name: 'NIC TX Bandwidth', data: nicTxBandwidthSeries.value[0].data }] : []),
    ...(l7TxBandwidthSeries.value.length ? [{ name: 'L7 TX Bandwidth', data: l7TxBandwidthSeries.value[0].data }] : []),
  ]
  const options = {
    chart: {
      foreColor: chartLabelColor(),
      type: 'area',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: [CHART_COLORS.l4, CHART_COLORS.l7],
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => formatKiloBps(val),
      },
    },
    grid: {
      borderColor: chartGridColor(),
    },
    tooltip: {
      theme: chartTooltipTheme(),
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => formatKiloBps(val),
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '11px',
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    series,
  }

  if (txBandwidthChartInstance) {
    txBandwidthChartInstance.updateOptions(options, true, true)
  } else {
    txBandwidthChartInstance = new ApexCharts(txBandwidthChart.value, options)
    txBandwidthChartInstance.render()
  }
}

const renderRxTrafficChart = () => {
  if (!rxTrafficChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = [
    ...(nicRxTrafficSeries.value.length ? [{ name: 'NIC RX Traffic', data: nicRxTrafficSeries.value[0].data }] : []),
    ...(l7RxTrafficSeries.value.length ? [{ name: 'L7 RX Traffic', data: l7RxTrafficSeries.value[0].data }] : []),
  ]
  const options = {
    chart: {
      foreColor: chartLabelColor(),
      type: 'area',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: [CHART_COLORS.viper, CHART_COLORS.gold],
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => formatKiloBytes(val),
      },
    },
    grid: {
      borderColor: chartGridColor(),
    },
    tooltip: {
      theme: chartTooltipTheme(),
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => formatKiloBytes(val),
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '11px',
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    series,
  }

  if (rxTrafficChartInstance) {
    rxTrafficChartInstance.updateOptions(options, true, true)
  } else {
    rxTrafficChartInstance = new ApexCharts(rxTrafficChart.value, options)
    rxTrafficChartInstance.render()
  }
}


const renderTxTrafficChart = () => {
  if (!txTrafficChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = [
    ...(nicTxTrafficSeries.value.length ? [{ name: 'NIC TX Traffic', data: nicTxTrafficSeries.value[0].data }] : []),
    ...(l7TxTrafficSeries.value.length ? [{ name: 'L7 TX Traffic', data: l7TxTrafficSeries.value[0].data }] : []),
  ]
  const options = {
    chart: {
      foreColor: chartLabelColor(),
      type: 'area',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: [CHART_COLORS.viper, CHART_COLORS.gold],
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => formatKiloBytes(val),
      },
    },
    grid: {
      borderColor: chartGridColor(),
    },
    tooltip: {
      theme: chartTooltipTheme(),
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => formatKiloBytes(val),
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '11px',
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    series,
  }

  if (txTrafficChartInstance) {
    txTrafficChartInstance.updateOptions(options, true, true)
  } else {
    txTrafficChartInstance = new ApexCharts(txTrafficChart.value, options)
    txTrafficChartInstance.render()
  }
}

const renderRequestResponseChart = () => {
  if (!requestResponseChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = requestResponseSeries.value
  const options = {
    chart: {
      foreColor: chartLabelColor(),
      type: 'line',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    colors: [CHART_COLORS.viper, CHART_COLORS.warn],
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    grid: {
      borderColor: chartGridColor(),
    },
    tooltip: {
      theme: chartTooltipTheme(),
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    series,
  }

  if (requestResponseChartInstance) {
    requestResponseChartInstance.updateOptions(options, true, true)
  } else {
    requestResponseChartInstance = new ApexCharts(requestResponseChart.value, options)
    requestResponseChartInstance.render()
  }
}

const renderStatusCodeChart = () => {
  if (!statusCodeChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = statusCodeSeries.value
  const options = {
    chart: {
      foreColor: chartLabelColor(),
      type: 'line',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    colors: STATUS_SERIES_COLORS,
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    grid: {
      borderColor: chartGridColor(),
    },
    tooltip: {
      theme: chartTooltipTheme(),
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '10px',
      itemMargin: { horizontal: 6, vertical: 2 },
    },
    series,
  }

  if (statusCodeChartInstance) {
    statusCodeChartInstance.updateOptions(options, true, true)
  } else {
    statusCodeChartInstance = new ApexCharts(statusCodeChart.value, options)
    statusCodeChartInstance.render()
  }
}

const renderIpCountChart = () => {
  if (!ipCountChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = ipCountSeries.value
  const options = {
    chart: {
      foreColor: chartLabelColor(),
      type: 'area',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: [CHART_COLORS.viper],
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    grid: {
      borderColor: chartGridColor(),
    },
    tooltip: {
      theme: chartTooltipTheme(),
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => `${Math.round(val)} IPs`,
      },
    },
    series,
  }

  if (ipCountChartInstance) {
    ipCountChartInstance.updateOptions(options, true, true)
  } else {
    ipCountChartInstance = new ApexCharts(ipCountChart.value, options)
    ipCountChartInstance.render()
  }
}

const renderMethodChart = () => {
  if (!methodChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = methodSeries.value
  const options = {
    chart: {
      foreColor: chartLabelColor(),
      type: 'line',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    colors: LINE_SERIES_PALETTE,
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    grid: {
      borderColor: chartGridColor(),
    },
    tooltip: {
      theme: chartTooltipTheme(),
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '10px',
      itemMargin: { horizontal: 6, vertical: 2 },
    },
    series,
  }

  if (methodChartInstance) {
    methodChartInstance.updateOptions(options, true, true)
  } else {
    methodChartInstance = new ApexCharts(methodChart.value, options)
    methodChartInstance.render()
  }
}

const renderProtocolPie = () => {
  if (!protocolPieChart.value) return
  const labels = protocolTableRows.value.map((row) => row.protocol || 'Unknown')
  const series = protocolTableRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const built = buildPieChartOptions(labels, series, hasData, protocolPieChart.value)
  protocolPieChartInstance = updatePieChartInstance(
    protocolPieChartInstance,
    protocolPieChart.value,
    built,
  )
}

const renderProtocolChart = () => {
  if (!protocolChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = protocolSeries.value
  const options = {
    chart: {
      foreColor: chartLabelColor(),
      type: 'line',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    colors: LINE_SERIES_PALETTE,
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    grid: {
      borderColor: chartGridColor(),
    },
    tooltip: {
      theme: chartTooltipTheme(),
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '10px',
      itemMargin: { horizontal: 6, vertical: 2 },
    },
    series,
  }

  if (protocolChartInstance) {
    protocolChartInstance.updateOptions(options, true, true)
  } else {
    protocolChartInstance = new ApexCharts(protocolChart.value, options)
    protocolChartInstance.render()
  }
}

const renderTopIpsPie = () => {
  if (!topIpsPieChart.value) return
  const labels = ipTableRows.value.map((row) => row.ip || 'Unknown')
  const series = ipTableRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const built = buildPieChartOptions(labels, series, hasData, topIpsPieChart.value)
  topIpsPieChartInstance = updatePieChartInstance(
    topIpsPieChartInstance,
    topIpsPieChart.value,
    built,
  )
}

const renderStatusCodePie = () => {
  if (!statusCodePieChart.value) return
  const labels = statusCodeRows.value.map((row) => row.code || 'Unknown')
  const series = statusCodeRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const built = buildPieChartOptions(labels, series, hasData, statusCodePieChart.value)
  statusCodePieChartInstance = updatePieChartInstance(
    statusCodePieChartInstance,
    statusCodePieChart.value,
    built,
  )
}

const renderIspPie = () => {
  if (!ispPieChart.value) return
  const labels = ispTableRows.value.map((row) => row.isp || 'Unknown')
  const series = ispTableRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const built = buildPieChartOptions(labels, series, hasData, ispPieChart.value)
  ispPieChartInstance = updatePieChartInstance(ispPieChartInstance, ispPieChart.value, built)
}

const renderRefererPie = () => {
  if (!refererPieChart.value) return
  const labels = refererTableRows.value.map((row) => row.referer || 'Unknown')
  const series = refererTableRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const built = buildPieChartOptions(labels, series, hasData, refererPieChart.value)
  refererPieChartInstance = updatePieChartInstance(
    refererPieChartInstance,
    refererPieChart.value,
    built,
  )
}

const renderMethodPie = () => {
  if (!methodPieChart.value) return
  const labels = methodTableRows.value.map((row) => row.method || 'Unknown')
  const series = methodTableRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const built = buildPieChartOptions(labels, series, hasData, methodPieChart.value)
  methodPieChartInstance = updatePieChartInstance(
    methodPieChartInstance,
    methodPieChart.value,
    built,
  )
}

const renderChartsForTab = (tabId) => {
  nextTick(() => {
    switch (tabId) {
      case 'bandwidth':
        renderRxBandwidthChart()
        renderTxBandwidthChart()
        renderRxTrafficChart()
        renderTxTrafficChart()
        break
      case 'requests':
        renderRequestResponseChart()
        renderStatusCodeChart()
        renderStatusCodePie()
        break
      case 'audience':
        renderIpCountChart()
        renderTopIpsPie()
        renderIspPie()
        renderRefererPie()
        break
      case 'http':
        renderMethodPie()
        renderMethodChart()
        renderProtocolPie()
        renderProtocolChart()
        break
    }
  })
}

watch(activeTab, (tab) => renderChartsForTab(tab))

watch(selectedServer, () => {
  if (selectedSite.value === 'all') return
  const stillValid = siteOptions.value.some((option) => option.value === selectedSite.value)
  if (!stillValid) selectedSite.value = 'all'
})

onMounted(() => {
  loadServers()
  loadSites()
  loadAnalyticsData()
  window.addEventListener('cdnproxy-theme-change', rerenderAllCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('cdnproxy-theme-change', rerenderAllCharts)
  if (rxBandwidthChartInstance) {
    rxBandwidthChartInstance.destroy()
    rxBandwidthChartInstance = null
  }
  if (txBandwidthChartInstance) {
    txBandwidthChartInstance.destroy()
    txBandwidthChartInstance = null
  }
  if (rxTrafficChartInstance) {
    rxTrafficChartInstance.destroy()
    rxTrafficChartInstance = null
  }
  if (txTrafficChartInstance) {
    txTrafficChartInstance.destroy()
    txTrafficChartInstance = null
  }
  if (requestResponseChartInstance) {
    requestResponseChartInstance.destroy()
    requestResponseChartInstance = null
  }
  if (statusCodeChartInstance) {
    statusCodeChartInstance.destroy()
    statusCodeChartInstance = null
  }
  if (ipCountChartInstance) {
    ipCountChartInstance.destroy()
    ipCountChartInstance = null
  }
  if (topIpsPieChartInstance) {
    topIpsPieChartInstance.destroy()
    topIpsPieChartInstance = null
  }
  if (statusCodePieChartInstance) {
    statusCodePieChartInstance.destroy()
    statusCodePieChartInstance = null
  }
  if (ispPieChartInstance) {
    ispPieChartInstance.destroy()
    ispPieChartInstance = null
  }
  if (refererPieChartInstance) {
    refererPieChartInstance.destroy()
    refererPieChartInstance = null
  }
  if (methodPieChartInstance) {
    methodPieChartInstance.destroy()
    methodPieChartInstance = null
  }
  if (methodChartInstance) {
    methodChartInstance.destroy()
    methodChartInstance = null
  }
  if (protocolPieChartInstance) {
    protocolPieChartInstance.destroy()
    protocolPieChartInstance = null
  }
  if (protocolChartInstance) {
    protocolChartInstance.destroy()
    protocolChartInstance = null
  }
})
</script>

<style scoped>
.analytics-view .dash-chart-wrap > div {
  width: 100%;
  height: 100%;
  min-height: 280px;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--app-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: var(--app-surface-solid);
  border: 1px solid var(--app-border-strong);
  border-radius: 16px;
  box-shadow: 0 20px 60px var(--app-shadow);
  width: 90%;
  max-width: 500px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--app-border-strong);
}

.dialog-header h3 {
  margin: 0;
  font-size: var(--type-section-title);
  font-weight: 700;
  color: var(--app-heading);
}

.dialog-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-muted);
  border-radius: 6px;
}

.dialog-body {
  padding: 20px 24px;
}

.dialog-form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.dialog-form-group label {
  font-size: var(--type-caption);
  color: var(--app-text-secondary);
}

.dialog-input {
  padding: 10px 12px;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  font-size: var(--type-base);
  outline: none;
  background: var(--app-input-bg);
  color: var(--app-text);
}

.dialog-input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--app-border-strong);
}

.dialog-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: var(--type-base);
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background: var(--app-surface-hover);
  color: var(--app-text-secondary);
}

.apply-btn {
  /* primary fill from theme.css */
}

.top-ips-pie :deep(.apexcharts-canvas),
.top-ips-pie :deep(.apexcharts-svg),
.top-ips-pie :deep(.apexcharts-inner),
.top-ips-pie :deep(.apexcharts-graphical) {
  background: transparent !important;
}

.top-ips-pie :deep(.apexcharts-pie-series path) {
  transition: filter 0.2s ease, opacity 0.2s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.06));
}

.top-ips-pie :deep(.apexcharts-datalabels-group text),
.top-ips-pie :deep(.apexcharts-datalabel-label),
.top-ips-pie :deep(.apexcharts-datalabel-value) {
  font-family: inherit;
}

.top-ips-pie :deep(.apexcharts-datalabel-label) {
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.world-map {
  width: 100%;
  height: fit-content;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  padding: 12px;
  position: relative;
}

.world-map :deep(.svg-map) {
  width: 70%;
  height: auto;
  display: block;
  margin: 0 auto;
}

.world-map :deep(.svg-map__location) {
  transition: fill 0.2s ease;
}

.world-map :deep(.svg-map__location:hover) {
  fill: rgba(63, 189, 133, 0.85);
}

.map-tooltip {
  position: absolute;
  z-index: 5;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
  font-size: var(--type-caption);
  font-weight: 600;
  pointer-events: none;
  white-space: nowrap;
}

.table-card {
  background: var(--app-surface-muted);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid var(--app-border);
}

.ip-table-layout {
  --analytics-pie-box: 208px;
  --analytics-summary-title: 30px;
  --analytics-panel-padding: 32px;
  --analytics-panel-height: calc(
    var(--analytics-panel-padding) + var(--analytics-summary-title) + var(--analytics-pie-box)
  );
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(240px, 1fr);
  gap: 16px;
  align-items: start;
}

.table-card--compact {
  height: var(--analytics-panel-height);
  max-height: var(--analytics-panel-height);
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.table-card--compact .table-title {
  flex-shrink: 0;
  margin-bottom: 8px;
  line-height: 1.3;
}

.table-card--compact:has(.top-ips-pie) {
  padding-bottom: 12px;
}

.top-ips-pie {
  width: 100%;
  flex: 1 1 0;
  min-height: 0;
  height: 100%;
  margin-bottom: 0;
  border: none;
  border-radius: 12px;
  background: transparent;
  overflow: visible;
  padding: 4px 0;
  box-sizing: border-box;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.top-ips-pie > div {
  width: 100% !important;
  height: 100% !important;
  min-height: 0;
  flex: 1 1 auto;
}

.top-ips-pie :deep(.apexcharts-canvas),
.top-ips-pie :deep(svg.apexcharts-svg) {
  margin: 0 auto;
}

.table-title {
  font-size: var(--type-base);
  font-weight: 700;
  color: var(--app-heading);
  margin-bottom: 12px;
}

.ip-table-layout .table-wrap {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.ip-table-layout .ip-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--app-surface-muted);
  box-shadow: 0 1px 0 var(--app-border-strong);
}

.table-wrap {
  overflow-x: auto;
}

.ip-table {
  width: 100%;
  border-collapse: collapse;
}

.ip-table th,
.ip-table td {
  text-align: left;
  padding: 10px 12px;
  font-size: var(--type-base);
  border-bottom: 1px solid var(--app-border-strong);
  color: var(--app-text);
}

.ip-table th {
  font-size: var(--type-caption);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--app-text-muted);
}

@media (max-width: 900px) {
  .ip-table-layout {
    grid-template-columns: 1fr;
  }

  .ip-table-layout .table-card--compact {
    height: auto;
    max-height: none;
  }

  .ip-table-layout .table-wrap {
    max-height: var(--analytics-pie-box);
  }
}

[data-theme='dark'] .world-map :deep(.svg-map__location) {
  fill: #121815;
  stroke: rgba(255, 255, 255, 0.12);
}

[data-theme='dark'] .world-map :deep(.svg-map__location:hover) {
  fill: rgba(63, 189, 133, 0.85);
}

</style>

