<template>
  <div class="security-analytics-view">
    <div class="filters-card">
      <div class="filters-row">
        <div class="filters-left">
          <span class="filter-inline-label">Server</span>
          <select id="security-server" v-model="selectedServer" class="inline-select">
            <option v-for="server in serverOptions" :key="server.value" :value="server.value">
              {{ server.label }}
            </option>
          </select>
          <span class="filter-inline-label">Time Range</span>
          <div class="time-buttons">
            <button
              v-for="range in timeRanges"
              :key="range.value"
              type="button"
              class="time-btn"
              :class="{ active: selectedTimeRange === range.value && !isCustomRange }"
              @click="selectTimeRange(range.value)"
            >
              {{ range.label }}
            </button>
            <button
              type="button"
              class="time-btn custom-btn"
              :class="{ active: isCustomRange }"
              @click="showCustomDialog = true"
            >
              Custom
            </button>
          </div>
        </div>
        <div class="filters-right">
          <div class="selected-range-group">
            <span class="selected-range-label">Selected</span>
            <span class="selected-range-value">{{ selectedRangeLabel }}</span>
          </div>
          <button type="button" class="apply-filter-btn" @click="applyFilters">
            Apply
          </button>
        </div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="7" r="3.5"></circle>
            <path d="M12 11v8"></path>
            <path d="M8.5 15.5L12 19l3.5-3.5"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>RX Bandwidth of NIC (Last)</h3>
          <p class="stat-value">{{ statsDisplay.nicRxBandwidthLast }}</p>
          <p class="stat-subvalue">{{ statsDisplay.nicRxBandwidthLastTime }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="7" r="3.5"></circle>
            <path d="M12 11v8"></path>
            <path d="M9 15l3 4 3-4"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>RX Bandwidth of L7 (Last)</h3>
          <p class="stat-value">{{ statsDisplay.l7RxBandwidthLast }} </p>
          <p class="stat-subvalue">{{ statsDisplay.l7RxBandwidthLastTime }} </p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon security">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="7" r="3.5"></circle>
            <path d="M12 11v8"></path>
            <path d="M8.5 15.5L12 19l3.5-3.5"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>RX Traffic of NIC/L7</h3>
          <p class="stat-value">{{ statsDisplay.totalNicRxTraffic }} / {{ statsDisplay.totalL7RxTraffic }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon security">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="17" r="3.5"></circle>
            <path d="M12 13V5"></path>
            <path d="M8.5 8.5L12 5l3.5 3.5"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>TX Traffic of NIC/L7</h3>
          <p class="stat-value">{{ statsDisplay.totalNicTxTraffic }} / {{ statsDisplay.totalL7TxTraffic }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="17" r="3.5"></circle>
            <path d="M12 13V5"></path>
            <path d="M9 8l3-3 3 3"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>TX Bandwidth of NIC (Last)</h3>
          <p class="stat-value">{{ statsDisplay.nicTxBandwidthLast }} </p>
          <p class="stat-subvalue">{{ statsDisplay.nicTxBandwidthLastTime }} </p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="17" r="3.5"></circle>
            <path d="M12 13V5"></path>
            <path d="M8.5 8.5L12 5l3.5 3.5"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>TX Bandwidth of L7 (Last)</h3>
          <p class="stat-value">{{ statsDisplay.l7TxBandwidthLast }} </p>
          <p class="stat-subvalue">{{ statsDisplay.l7TxBandwidthLastTime }} </p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19h16"></path>
            <path d="M6 15l3-3 3 3 6-8"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Total Request</h3>
          <p class="stat-value">{{ statsDisplay.totalRequest }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon security">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2"></rect>
            <path d="M8 12h8"></path>
            <path d="M12 8v8"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Total Response</h3>
          <p class="stat-value">{{ statsDisplay.totalResponse }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M4 20c1.5-3 4-4.5 8-4.5s6.5 1.5 8 4.5"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>IP Count</h3>
          <p class="stat-value">{{ statsDisplay.ipCount }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 5h18"></path>
            <path d="M3 12h12"></path>
            <path d="M3 19h8"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Referer</h3>
          <p class="stat-value">{{ statsDisplay.referer }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon security">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="7" cy="7" r="3"></circle>
            <circle cx="17" cy="7" r="3"></circle>
            <circle cx="7" cy="17" r="3"></circle>
            <circle cx="17" cy="17" r="3"></circle>
          </svg>
        </div>
        <div class="stat-info">
          <h3>ISP Count</h3>
          <p class="stat-value">{{ statsDisplay.ispCount }}</p>
        </div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Bandwidth by Time</h3>
          <p>RX bandwidth trend based on selected range for NIC / L7</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="rxBandwidthChart"></div>
      </div>
      <div class="bandwidth-header">
        <div>
          <p>TX bandwidth trend based on selected range for NIC / L7</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="txBandwidthChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Traffic by Time</h3>  
          <p>NIC / L7 RX traffic trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="rxTrafficChart"></div>
      </div>
      <div class="bandwidth-header">
        <div>
          <p>NIC / L7 TX traffic trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="txTrafficChart"></div>
      </div>
    </div>
    
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Request / Response by Time</h3>
          <p>Request and response trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="requestResponseChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Status Code by Time</h3>
          <p>Status code trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="statusCodeChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Status Code Summary</h3>
          <p>Pie distribution and table summary</p>
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
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>IP Count by Time</h3>
          <p>Unique IP count trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="ipCountChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Top IPs</h3>
          <p>Pie distribution and table summary</p>
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
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>ISP Summary</h3>
          <p>Pie distribution and table summary</p>
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
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Referer Summary</h3>
          <p>Pie distribution and table summary</p>
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
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>HTTP Method Summary</h3>
          <p>Pie distribution and table summary</p>
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
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>HTTP Method by Time</h3>
          <p>Method trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="methodChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>HTTP Protocol Summary</h3>
          <p>Pie distribution and table summary</p>
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
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>HTTP Protocol by Time</h3>
          <p>Protocol trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="protocolChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Requests by Country</h3>
          <p>World map with request counts by country</p>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ApexCharts from 'apexcharts'
import { SvgMap } from 'vue-svg-map'
import world from '@svg-maps/world'
import { fetchServers } from '@/api/servers'
import { fetchAnalyticsSeries, fetchAnalyticsSummary, fetchAnalyticsSummaryGroup } from '@/api/analytics'
import { useNotifications } from '@/stores/notifications'

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

const PIE_COLORS_TOP_IPS = [
  '#8b5cf6',
  '#f59e0b',
  '#22c55e',
  '#ef4444',
  '#38bdf8',
  '#ec4899',
  '#14b8a6',
]

const PIE_COLORS_STATUS = [
  '#8b5cf6',
  '#f59e0b',
  '#22c55e',
  '#ef4444',
  '#3b82f6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#f97316',
  '#e11d48',
  '#a855f7',
  '#64748b',
  '#14b8a6',
  '#dc2626',
  '#2563eb',
  '#0f766e',
]

const PIE_COLORS_ISP = ['#22c55e', '#f59e0b', '#8b5cf6', '#38bdf8', '#ef4444']
const PIE_COLORS_REFERER = ['#3b82f6', '#f59e0b', '#8b5cf6', '#22c55e', '#ef4444']
const PIE_COLORS_METHOD = [
  '#2563eb',
  '#16a34a',
  '#ef4444',
  '#f59e0b',
  '#0ea5e9',
  '#8b5cf6',
  '#22c55e',
  '#64748b',
]
const PIE_COLORS_PROTOCOL = ['#8b5cf6', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444']

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

const buildPieChartOptions = (labels, series, hasData, palette, mountEl) => {
  const safeLabels = hasData ? labels : ['No data']
  const safeSeries = hasData ? series : [1]
  const colors = hasData ? palette : [pieEmptyColor()]
  const chartHeight = getPieChartHeight(mountEl)

  return {
    safeLabels,
    safeSeries,
    chartHeight,
    options: {
      chart: {
        foreColor: chartLabelColor(),
        type: 'pie',
        height: chartHeight,
        width: '100%',
        toolbar: { show: false },
        background: 'transparent',
        offsetX: 0,
        offsetY: 0,
      },
      labels: safeLabels,
      series: safeSeries,
      colors,
      legend: { show: false },
      dataLabels: { enabled: false },
      stroke: {
        show: true,
        width: 1,
        colors: [pieSliceStrokeColor()],
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          offsetX: 0,
          offsetY: 0,
          customScale: 1,
          dataLabels: {
            offset: 0,
          },
        },
      },
      states: {
        hover: {
          filter: {
            type: 'lighten',
          },
        },
        active: {
          filter: {
            type: 'darken',
          },
        },
      },
      tooltip: {
        theme: chartTooltipTheme(),
        y: {
          formatter: (val) => `${Math.round(val)}`,
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
      return current
    }
    const chart = new ApexCharts(el, built.options)
    chart.render()
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

const selectedServer = ref('all')
const selectedTimeRange = ref('1h')
const isCustomRange = ref(false)
const showCustomDialog = ref(false)
const customStartDate = ref(null)
const customEndDate = ref(null)
const datePickerConfig = { enableTime: true, dateFormat: 'Y-m-d H:i' }
const appliedFilters = ref({
  server: 'all',
  range: '1h',
  isCustom: false,
  customStart: '',
  customEnd: '',
})
const notifications = useNotifications()

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
  if (ratio >= 0.8) return '#ef4444'
  if (ratio >= 0.6) return '#f97316'
  if (ratio >= 0.4) return '#f59e0b'
  if (ratio >= 0.2) return '#22c55e'
  return '#60a5fa'
}

const servers = ref([])
const serverOptions = computed(() => [
  { label: 'All Servers', value: 'all' },
  ...servers.value.map((server) => ({ label: server.name || `Server ${server.id}`, value: server.id })),
])

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

const loadAnalyticsData = async () => {
  const params = buildAnalyticsParams()

  let summary = null
  try {
    summary = await fetchAnalyticsSummary(params)
  } catch (error) {
    console.error('Failed to load analytics summary', error)
    analyticsStats.value = createDefaultAnalyticsStats()
    notifications.enqueue(error?.message || 'Failed to load analytics summary.', 'error')
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
  } catch (error) {
    console.error('Failed to load analytics data', error)
    notifications.enqueue(error?.message || 'Failed to load analytics data.', 'error')
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
  const params = { serverId: filters.server }
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
    colors: ['#3b82f6', '#f97316'],
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
    colors: ['#3b82f6', '#f97316'],
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
    colors: ['#22c55e', '#facc15'],
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
    colors: ['#22c55e', '#facc15'],
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
    colors: ['#6366f1', '#f59e0b'],
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
    colors: ['#8b5cf6'],
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
  const built = buildPieChartOptions(labels, series, hasData, PIE_COLORS_PROTOCOL, protocolPieChart.value)
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
  const built = buildPieChartOptions(labels, series, hasData, PIE_COLORS_TOP_IPS, topIpsPieChart.value)
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
  const built = buildPieChartOptions(labels, series, hasData, PIE_COLORS_STATUS, statusCodePieChart.value)
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
  const built = buildPieChartOptions(labels, series, hasData, PIE_COLORS_ISP, ispPieChart.value)
  ispPieChartInstance = updatePieChartInstance(ispPieChartInstance, ispPieChart.value, built)
}

const renderRefererPie = () => {
  if (!refererPieChart.value) return
  const labels = refererTableRows.value.map((row) => row.referer || 'Unknown')
  const series = refererTableRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const built = buildPieChartOptions(labels, series, hasData, PIE_COLORS_REFERER, refererPieChart.value)
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
  const built = buildPieChartOptions(labels, series, hasData, PIE_COLORS_METHOD, methodPieChart.value)
  methodPieChartInstance = updatePieChartInstance(
    methodPieChartInstance,
    methodPieChart.value,
    built,
  )
}

onMounted(() => {
  loadServers()
  loadAnalyticsData()
  renderTopIpsPie()
  renderIspPie()
  renderRefererPie()
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
.security-analytics-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filters-card {
  background: var(--app-surface);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
}

.filters-header h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-heading);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.filters-left,
.filters-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filters-left {
  flex: 1 1 420px;
  gap: 12px;
}

.filters-right {
  flex: 0 1 auto;
  justify-content: flex-end;
  margin-left: auto;
  gap: 12px;
}

.selected-range-group {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--app-text-secondary);
  font-weight: 600;
}

.filter-inline-label {
  font-size: 0.85rem;
  color: var(--app-text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.inline-select {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.95rem;
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-width: 200px;
}

.inline-select:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.selected-range-label {
  font-size: 0.85rem;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.selected-range-value {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 0.85rem;
  font-weight: 600;
}

.time-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.time-btn {
  border: 1px solid var(--app-border-strong);
  cursor: pointer;
  background: var(--app-surface-solid);
  color: var(--app-text-secondary);
  transition: all 0.2s ease;
}

.time-btn:hover {
  border-color: var(--app-accent);
  background: var(--app-surface-hover);
  color: var(--app-text);
}

.time-btn.active {
  /* primary fill from theme.css */
}

.custom-btn {
  border-left: 2px solid var(--app-border-strong);
  margin-left: 4px;
}

.custom-btn.active {
  border-left-color: transparent;
}

.apply-filter-btn {
  cursor: pointer;
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
  font-size: 1.1rem;
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
  font-size: 0.85rem;
  color: var(--app-text-secondary);
}

.dialog-input {
  padding: 10px 12px;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  font-size: 0.95rem;
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
  font-size: 0.9rem;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.bandwidth-card {
  background: var(--app-surface);
  border-radius: 18px;
  padding: 24px;
  border: 1px solid var(--app-border);
  box-shadow: 0 4px 18px var(--app-shadow);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bandwidth-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.bandwidth-header h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--app-heading);
}

.bandwidth-header p {
  margin: 6px 0 0;
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.bandwidth-pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0f766e;
  background: rgba(20, 184, 166, 0.15);
}

.bandwidth-chart {
  width: 100%;
  height: 280px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--app-border);
  background: var(--chart-surface, var(--app-surface-elevated));
}

.bandwidth-chart div {
  width: 100%;
  height: 100%;
  display: block;
}

.bandwidth-chart :deep(.apexcharts-canvas),
.bandwidth-chart :deep(.apexcharts-svg),
.bandwidth-chart :deep(.apexcharts-inner) {
  background: transparent !important;
}

.top-ips-pie :deep(.apexcharts-canvas),
.top-ips-pie :deep(.apexcharts-svg),
.top-ips-pie :deep(.apexcharts-inner),
.top-ips-pie :deep(.apexcharts-graphical) {
  background: transparent !important;
}

.top-ips-pie :deep(.apexcharts-pie-series path) {
  transition: filter 0.15s ease, opacity 0.15s ease;
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
  fill: rgba(37, 99, 235, 0.85);
}

.map-tooltip {
  position: absolute;
  z-index: 5;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
  font-size: 0.85rem;
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
  border-radius: 10px;
  background: var(--chart-surface, var(--app-surface-elevated));
  overflow: visible;
  padding: 0;
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
  font-size: 0.95rem;
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
  font-size: 0.9rem;
  border-bottom: 1px solid var(--app-border-strong);
  color: var(--app-text);
}

.ip-table th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--app-text-muted);
}
.stat-card {
  background: var(--app-surface);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px var(--app-shadow), 0 0 0 1px var(--app-accent-soft);
}

.stat-icon {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.stat-icon.security {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-icon svg {
  width: 36px;
  height: 36px;
}

.stat-info h3 {
  font-size: 0.875rem;
  color: var(--app-text-muted);
  margin: 0 0 8px 0;
  font-weight: 500;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--app-heading);
  margin: 0;
}

.stat-subvalue {
  margin: 6px 0 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #10b981;
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

[data-theme='dark'] .bandwidth-pill {
  color: #5eead4;
  background: rgba(20, 184, 166, 0.2);
}

[data-theme='dark'] .stat-subvalue {
  color: #4ade80;
}

[data-theme='dark'] .world-map :deep(.svg-map__location) {
  fill: #1a1a2e;
  stroke: rgba(255, 255, 255, 0.12);
}

[data-theme='dark'] .world-map :deep(.svg-map__location:hover) {
  fill: rgba(168, 85, 247, 0.85);
}

</style>

