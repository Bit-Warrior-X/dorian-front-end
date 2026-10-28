<template>
  <div class="dashboard-view analytics-view" :aria-busy="isLoading">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>L7 Traffic</h2>
        <p>Application-layer bandwidth, request counts, status codes, HTTP versions, and visitors.</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <div class="dash-filterbar">
      <div class="dash-filter-field">
        <label for="analytics-server">Edge</label>
        <select id="analytics-server" v-model="selectedServer" class="dash-select" :disabled="isLoading">
          <option v-for="server in serverOptions" :key="server.value" :value="server.value">
            {{ server.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label for="analytics-site">Site</label>
        <select id="analytics-site" v-model="selectedSite" class="dash-select" :disabled="isLoading">
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
            :disabled="isLoading"
            @click="selectTimeRange(range.value)"
          >
            {{ range.label }}
          </button>
          <button
            type="button"
            class="dash-range-pill dash-range-pill--custom"
            :class="{ active: isCustomRange }"
            :disabled="isLoading"
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
      <button type="button" class="dash-filter-apply" :disabled="isLoading" @click="applyFilters">
        <span v-if="isLoading" class="dash-spinner dash-spinner--btn" aria-hidden="true"></span>
        {{ isLoading ? 'Loading…' : 'Apply' }}
      </button>
    </div>
    <p v-if="showHeavyRangeHint" class="dash-range-hint" role="note">
      Longer ranges load more data and are slower. This choice applies for this visit only — returning to Analytics restores your last short range (≤12H).
    </p>

    <nav class="dash-tabbar" aria-label="Analytics sections" role="tablist">
      <button
        v-for="tab in analyticsTabs"
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
          <template v-if="tab.id === 'bandwidth'"><path d="M3 12h4l2.5-6 5 12 2.5-6h4" /></template>
          <template v-else-if="tab.id === 'requests'"><path d="M4 19V9M10 19V5M16 19v-7M20 19H3" /></template>
          <template v-else-if="tab.id === 'audience'"><circle cx="9" cy="8" r="3" /><circle cx="16.5" cy="9.5" r="2.5" /><path d="M3.5 19c.7-3.2 3.2-5 5.5-5s4.8 1.8 5.5 5M13 19c.4-2 1.8-3.3 3.5-3.3S19.6 17 20 19" /></template>
          <template v-else><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.2 2.4 2.2 14.6 0 17M12 3.5c-2.2 2.4-2.2 14.6 0 17" /></template>
        </svg>
        <span class="dash-tab__label">{{ tab.label }}</span>
      </button>
    </nav>

    <div v-show="activeTab === 'bandwidth'" class="analytics-tab-panel">
      <section class="dash-grid12">
        <div class="dash-panel c-12 dash-panel--hero-chart">
          <div class="dash-panel-head">
            <h3>
              <span class="dash-panel-icon signal" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1.5 9h3l2-5 3 9 2-4h3" />
                </svg>
              </span>
              L7 Bandwidth
              <span class="dash-panel-hint">Application throughput · not NIC</span>
            </h3>
            <span class="dash-count-tag">{{ selectedRangeLabel }}</span>
          </div>
          <div class="dash-readout-strip" aria-label="Live L7 bandwidth">
            <div class="dash-readout-cell lead">
              <span class="dash-readout-cell__label"><i class="sw rx" aria-hidden="true"></i>Last RX</span>
              <span class="dash-readout-cell__value num">{{ statsDisplay.l7RxBandwidthLast }}</span>
            </div>
            <div class="dash-readout-cell">
              <span class="dash-readout-cell__label"><i class="sw tx" aria-hidden="true"></i>Last TX</span>
              <span class="dash-readout-cell__value num">{{ statsDisplay.l7TxBandwidthLast }}</span>
            </div>
            <div class="dash-readout-cell">
              <span class="dash-readout-cell__label">RX volume</span>
              <span class="dash-readout-cell__value num">{{ statsDisplay.totalL7RxTraffic }}</span>
            </div>
            <div class="dash-readout-cell">
              <span class="dash-readout-cell__label">TX volume</span>
              <span class="dash-readout-cell__value num">{{ statsDisplay.totalL7TxTraffic }}</span>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
            <div ref="l7BandwidthChart"></div>
          </div>
        </div>
        <div class="dash-panel c-12 dash-panel--hero-chart dash-panel--hero-chart-info">
          <div class="dash-panel-head">
            <h3>
              <span class="dash-panel-icon l7" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" />
                </svg>
              </span>
              L7 Requests
              <span class="dash-panel-hint">HTTP request count over time</span>
            </h3>
            <span class="dash-count-tag">{{ selectedRangeLabel }}</span>
          </div>
          <div class="dash-readout-strip" aria-label="L7 request summary">
            <div class="dash-readout-cell lead">
              <span class="dash-readout-cell__label"><i class="sw req" aria-hidden="true"></i>Last interval</span>
              <span class="dash-readout-cell__value num">{{ formatCompactCount(requestSeriesStats.latest) }}</span>
            </div>
            <div class="dash-readout-cell">
              <span class="dash-readout-cell__label">Total</span>
              <span class="dash-readout-cell__value num">{{ statsDisplay.totalRequest }}</span>
            </div>
            <div class="dash-readout-cell">
              <span class="dash-readout-cell__label">Average</span>
              <span class="dash-readout-cell__value num">{{ formatCompactCount(requestSeriesStats.avg) }}</span>
            </div>
            <div class="dash-readout-cell">
              <span class="dash-readout-cell__label">Peak</span>
              <span class="dash-readout-cell__value num">{{ formatCompactCount(requestSeriesStats.peak) }}</span>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
            <div ref="l7RequestChart"></div>
          </div>
        </div>
      </section>
    </div>

    <div v-show="activeTab === 'requests'" class="analytics-tab-panel">
      <section class="dash-grid12">
        <div class="dash-panel c-12 dash-panel--hero-chart">
          <div class="dash-panel-head">
            <h3>
              <span class="dash-panel-icon signal" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1.5 9h3l2-5 3 9 2-4h3" />
                </svg>
              </span>
              Request / Response
              <span class="dash-panel-hint">Requests vs answered responses (excludes 444/499/5xx/9xx)</span>
            </h3>
            <span class="dash-count-tag">{{ selectedRangeLabel }}</span>
          </div>
          <div class="dash-readout-strip" aria-label="Request / response summary">
            <div class="dash-readout-cell lead">
              <span class="dash-readout-cell__label"><i class="sw req" aria-hidden="true"></i>Requests</span>
              <span class="dash-readout-cell__value num">{{ statsDisplay.totalRequest }}</span>
            </div>
            <div class="dash-readout-cell">
              <span class="dash-readout-cell__label"><i class="sw tx" aria-hidden="true"></i>Answered</span>
              <span class="dash-readout-cell__value num">{{ statsDisplay.totalResponse }}</span>
            </div>
            <div class="dash-readout-cell">
              <span class="dash-readout-cell__label">Last req</span>
              <span class="dash-readout-cell__value num">{{ formatCompactCount(requestResponseStats.latestReq) }}</span>
            </div>
            <div class="dash-readout-cell">
              <span class="dash-readout-cell__label">Last answered</span>
              <span class="dash-readout-cell__value num">{{ formatCompactCount(requestResponseStats.latestResp) }}</span>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
            <div ref="requestResponseChart"></div>
          </div>
        </div>
        <div class="dash-panel c-12 dash-panel--hero-chart dash-panel--hero-chart-info">
          <div class="dash-panel-head">
            <h3>
              Status codes
              <span class="dash-panel-hint">4xx includes 444/499 · 5xx includes 904/929/978</span>
            </h3>
            <div class="dash-series-legend" aria-hidden="true">
              <span v-for="item in statusCodeLegend" :key="item.name" class="dash-series-legend__item">
                <span class="dash-series-legend__swatch" :style="{ background: item.color }"></span>
                {{ item.name }}
              </span>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
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
      <section class="dash-kpi-strip" aria-label="Audience summary">
        <article
          v-for="metric in audienceMetricCards"
          :key="metric.label"
          class="dash-kpi"
          :class="`dash-kpi--${metric.tone}`"
        >
          <span class="dash-kpi__label">{{ metric.label }}</span>
          <span class="dash-kpi__value num">{{ metric.value }}</span>
          <span v-if="metric.hint" class="dash-kpi__hint">{{ metric.hint }}</span>
        </article>
      </section>
      <section class="dash-grid12">
        <div class="dash-panel c-12 dash-chart-panel">
          <div class="dash-panel-head">
            <div>
              <h3>Unique IPs per interval</h3>
              <p class="dash-panel-desc">Distinct client IPs in each chart bucket — not the range-wide total</p>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
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
            <SvgMap :key="mapRenderKey" :map="world" :location-attributes="mapLocationAttributes" />
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
      <section class="dash-kpi-strip" aria-label="HTTP summary">
        <article
          v-for="metric in httpMetricCards"
          :key="metric.label"
          class="dash-kpi"
          :class="`dash-kpi--${metric.tone}`"
        >
          <span class="dash-kpi__label">{{ metric.label }}</span>
          <span class="dash-kpi__value num">{{ metric.value }}</span>
          <span v-if="metric.hint" class="dash-kpi__hint">{{ metric.hint }}</span>
        </article>
      </section>
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
        <div class="dash-panel c-12 dash-chart-panel">
          <div class="dash-panel-head">
            <div>
              <h3>HTTP Method by Time</h3>
              <p class="dash-panel-desc">Method trend based on selected range</p>
            </div>
            <div class="dash-series-legend" aria-hidden="true">
              <span v-for="item in methodLegend" :key="item.name" class="dash-series-legend__item">
                <span class="dash-series-legend__swatch" :style="{ background: item.color }"></span>
                {{ item.name }}
              </span>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
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
        <div class="dash-panel c-12 dash-chart-panel dash-chart-panel--info">
          <div class="dash-panel-head">
            <div>
              <h3>HTTP Protocol by Time</h3>
              <p class="dash-panel-desc">Protocol trend based on selected range</p>
            </div>
            <div class="dash-series-legend" aria-hidden="true">
              <span v-for="item in protocolLegend" :key="item.name" class="dash-series-legend__item">
                <span class="dash-series-legend__swatch" :style="{ background: item.color }"></span>
                {{ item.name }}
              </span>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
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
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { SvgMap } from 'vue-svg-map'
import world from '@svg-maps/world'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { fetchServers } from '@/api/servers'
import { fetchSites } from '@/api/sites'
import { fetchAnalyticsSeries, fetchAnalyticsSummary, fetchAnalyticsSummaryGroup } from '@/api/analytics'
import { notifyError } from '@/utils/notify'
import {
  isHeavyTimeRange,
  rangeDurationMs,
  readSharedTimeRange,
  sharedTimeRanges,
  writeSharedTimeRange,
} from '@/utils/timeRange'
import {
  formatApexTimeTick,
  getApexChartColors,
  getApexDatetimeXaxis,
  getApexFontFamily,
  getApexLinePalette,
  getApexPiePalette,
  getApexProductionStrokeFill,
  getApexSeriesColors,
  getApexStatusPalette,
  getApexTimeRangeAnnotations,
  padSeriesToTimeRange,
} from '@/utils/chartTheme'

const ANALYTICS_TITLE = 'Analytics'

const timeSeriesAxis = (start, end) => {
  const startMs = start.getTime()
  const endMs = end.getTime()
  return {
    startMs,
    endMs,
    xaxis: getApexDatetimeXaxis(startMs, endMs, { tickCount: 7 }),
    annotations: getApexTimeRangeAnnotations(startMs, endMs),
    tooltipX: {
      formatter: (val) => formatApexTimeTick(val, startMs, endMs),
    },
  }
}

const chartColors = () => getApexSeriesColors()
const themeChartColors = () => getApexChartColors()
const PIE_PALETTE = () => getApexPiePalette()
const LINE_SERIES_PALETTE = () => getApexLinePalette()
const STATUS_SERIES_COLORS = () => getApexStatusPalette()
const productionStrokeFill = (opts) => getApexProductionStrokeFill(opts)

const chartGridColor = () => themeChartColors().grid
const chartLabelColor = () => themeChartColors().label

const chartTooltipTheme = () =>
  typeof document !== 'undefined' &&
  document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light'

/** Shared Apex chrome for modern CDN time-series charts. */
const timeSeriesChartBase = ({
  type = 'area',
  height = 320,
  rangeAxis,
  yLabelFormatter,
  tooltipFormatter,
}) => {
  const isArea = type === 'area'
  return {
    chart: {
      foreColor: chartLabelColor(),
      fontFamily: getApexFontFamily(),
      background: 'transparent',
      type,
      height,
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 500 },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    ...productionStrokeFill(
      isArea
        ? { variant: 'area', opacityFrom: 0.35, opacityTo: 0.04, width: 2 }
        : { variant: 'line', width: 2 },
    ),
    markers: {
      size: 0,
      hover: { size: isArea ? 5 : 4 },
    },
    xaxis: {
      ...rangeAxis.xaxis,
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: {
        show: true,
        stroke: {
          color: themeChartColors().crosshair,
          width: 1,
          dashArray: 4,
        },
      },
      tooltip: { enabled: false },
    },
    annotations: rangeAxis.annotations,
    yaxis: {
      labels: {
        formatter: yLabelFormatter,
      },
    },
    grid: {
      borderColor: chartGridColor(),
      strokeDashArray: 3,
      padding: { left: 8, right: 16, top: 0, bottom: 0 },
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: { show: false },
    tooltip: {
      theme: chartTooltipTheme(),
      shared: true,
      intersect: false,
      x: rangeAxis.tooltipX,
      y: {
        formatter: tooltipFormatter || yLabelFormatter,
      },
    },
  }
}

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
  const colors = hasData ? PIE_PALETTE() : [pieEmptyColor()]
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
  renderL7BandwidthChart()
  renderL7RequestChart()
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
  { id: 'bandwidth', label: 'Bandwidth & Requests', hint: 'L7 throughput and request volume' },
  { id: 'requests', label: 'Requests & Status', hint: 'Request / response and status codes' },
  { id: 'audience', label: 'Audience', hint: 'IPs, ISPs, referers, and countries' },
  { id: 'http', label: 'HTTP', hint: 'Methods and protocol versions' },
]

const selectedServer = ref('all')
const selectedSite = ref('all')
const selectedTimeRange = ref(readSharedTimeRange())
const isCustomRange = ref(false)
const showCustomDialog = ref(false)
const customStartDate = ref(null)
const customEndDate = ref(null)
const isLoading = ref(false)
const datePickerConfig = { enableTime: true, time_24hr: true, dateFormat: 'Y-m-d H:i' }
const appliedFilters = ref({
  server: 'all',
  site: 'all',
  range: readSharedTimeRange(),
  isCustom: false,
  customStart: '',
  customEnd: '',
})
/** Tabs already fetched for the current applied-filter key. */
const loadedTabs = ref(new Set())
const loadedFilterKey = ref('')
/** Shared across bandwidth + requests tabs so request-response is fetched once. */
const requestResponseLoaded = ref(false)
const l7BandwidthChart = ref(null)
const l7RequestChart = ref(null)

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

let l7BandwidthChartInstance = null
let l7RequestChartInstance = null

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
const l7RxBandwidthSeries = ref([{ name: 'RX', data: [] }])
const l7TxBandwidthSeries = ref([{ name: 'TX', data: [] }])
const l7RequestSeries = ref([{ name: 'L7 Requests', data: [] }])
const requestResponseSeries = ref([
  { name: 'Requests', data: [] },
  { name: 'Answered', data: [] },
])
const statusCodeSeries = ref([
  { name: '2xx', data: [] },
  { name: '3xx', data: [] },
  { name: '4xx', data: [] },
  { name: '5xx + 9xx', data: [] },
])
const ipCountSeries = ref([{ name: 'Unique IPs / interval', data: [] }])
const methodSeries = ref([])
const protocolSeries = ref([])

const createDefaultAnalyticsStats = () => ({
  totalL7RxTraffic: 0,
  totalL7TxTraffic: 0,
  l7RxBandwidthLast: 0,
  l7TxBandwidthLast: 0,
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
    const code = String(item.code || '').toLowerCase()
    if (code) acc[code] = item
    return acc
  }, {})
)
const mapRenderKey = computed(() =>
  countryRequests.value.map((item) => `${item.code}:${item.count}`).join('|') || 'empty',
)
const hoveredCountry = ref('')
const tooltipPosition = ref({ x: 0, y: 0 })
const maxCountryCount = computed(() =>
  Math.max(0, ...countryRequests.value.map((item) => item.count))
)
const mapEmptyFill = () =>
  typeof document !== 'undefined' &&
  document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(148, 163, 184, 0.2)'
const mapLocationAttributes = (location) => {
  const entry = countryRequestMap.value[location.id.toLowerCase()]
  const ratio = entry && maxCountryCount.value ? entry.count / maxCountryCount.value : 0
  const fillColor = entry ? colorFromRate(ratio) : mapEmptyFill()
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
  if (ratio >= 0.8) return chartColors().danger
  if (ratio >= 0.6) return chartColors().warn
  if (ratio >= 0.4) return chartColors().gold
  if (ratio >= 0.2) return chartColors().success
  return chartColors().l4
}

const servers = ref([])
const sites = ref([])
const serverOptions = computed(() => [
  { label: 'All edges', value: 'all' },
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

const formatCompactCount = (value) => {
  const n = Number(value)
  if (value == null || !Number.isFinite(n)) return '—'
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  if (n > 0 && n < 10) return n.toFixed(n < 1 ? 2 : 1).replace(/\.?0+$/, '')
  return String(Math.round(n))
}

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
  const units = ['Kbps', 'Mbps', 'Gbps', 'Tbps']
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
  totalL7RxTraffic: formatKiloBytes(analyticsStats.value.totalL7RxTraffic),
  totalL7TxTraffic: formatKiloBytes(analyticsStats.value.totalL7TxTraffic),
  l7RxBandwidthLast: formatKiloBps(analyticsStats.value.l7RxBandwidthLast),
  l7TxBandwidthLast: formatKiloBps(analyticsStats.value.l7TxBandwidthLast),
  l7RxBandwidthLastTime: formatDateTime(analyticsStats.value.l7RxBandwidthLastTime),
  l7TxBandwidthLastTime: formatDateTime(analyticsStats.value.l7TxBandwidthLastTime),
  totalRequest: formatNumber(analyticsStats.value.totalRequest),
  totalResponse: formatNumber(analyticsStats.value.totalResponse),
  ipCount: formatNumber(analyticsStats.value.ipCount),
  referer: formatNumber(analyticsStats.value.refererCount),
  ispCount: formatNumber(analyticsStats.value.ispCount),
}))

const requestSeriesStats = computed(() => {
  const points = (l7RequestSeries.value[0]?.data || []).filter((p) => p.y != null)
  const values = points.map((p) => Number(p.y) || 0)
  return {
    latest: values.length ? values[values.length - 1] : null,
    avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
    peak: values.length ? Math.max(...values) : null,
  }
})

const requestResponseStats = computed(() => {
  const req = (requestResponseSeries.value[0]?.data || []).filter((p) => p.y != null)
  const resp = (requestResponseSeries.value[1]?.data || []).filter((p) => p.y != null)
  return {
    latestReq: req.length ? Number(req[req.length - 1].y) || 0 : null,
    latestResp: resp.length ? Number(resp[resp.length - 1].y) || 0 : null,
  }
})

const audienceMetricCards = computed(() => {
  const s = statsDisplay.value
  return [
    { label: 'Unique IPs', value: s.ipCount, hint: 'distinct clients in the selected range', tone: 'ok' },
    { label: 'Referer', value: s.referer, hint: 'distinct referers', tone: 'info' },
    { label: 'ISP Count', value: s.ispCount, hint: 'distinct ISPs', tone: 'warn' },
  ]
})

const httpMetricCards = computed(() => {
  const methodTotal = methodTableRows.value.reduce((sum, row) => sum + Number(row.value ?? 0), 0)
  const protocolTotal = protocolTableRows.value.reduce((sum, row) => sum + Number(row.value ?? 0), 0)
  const largest = (rows) =>
    rows.reduce((best, row) => (Number(row.value ?? 0) > Number(best?.value ?? 0) ? row : best), null)
  const topMethod = largest(methodTableRows.value)
  const topProtocol = largest(protocolTableRows.value)
  return [
    { label: 'Method requests', value: formatNumber(methodTotal), hint: 'all methods', tone: 'info' },
    { label: 'Top method', value: topMethod?.method || '—', hint: topMethod?.rate || '', tone: 'ok' },
    { label: 'Protocol requests', value: formatNumber(protocolTotal), hint: 'all protocols', tone: 'info' },
    { label: 'Top protocol', value: topProtocol?.protocol || '—', hint: topProtocol?.rate || '', tone: 'warn' },
  ]
})

const statusCodeLegend = computed(() => {
  const colors = STATUS_SERIES_COLORS()
  return ['2xx', '3xx', '4xx', '5xx + 9xx'].map((name, index) => ({
    name,
    color: colors[index % colors.length],
  }))
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

const showHeavyRangeHint = computed(
  () => !isCustomRange.value && isHeavyTimeRange(selectedTimeRange.value),
)

const timeRanges = sharedTimeRanges

const selectTimeRange = (value) => {
  selectedTimeRange.value = value
  isCustomRange.value = false
  writeSharedTimeRange(value)
}

const applyCustomRange = () => {
  if (customStartDate.value && customEndDate.value) {
    isCustomRange.value = true
    selectedTimeRange.value = 'custom'
    showCustomDialog.value = false
    applyFilters()
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
  loadedTabs.value = new Set()
  loadedFilterKey.value = ''
  void loadAnalyticsData()
}

const resolveRangeMs = (filters) => rangeDurationMs(filters?.range)

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

const methodLegend = computed(() => {
  const colors = LINE_SERIES_PALETTE()
  return methodKeys.map((method, index) => ({
    name: method.label,
    color: colors[index % colors.length],
  }))
})

const protocolLegend = computed(() => {
  const colors = LINE_SERIES_PALETTE()
  return protocolKeys.map((protocol, index) => ({
    name: protocol.label,
    color: colors[index % colors.length],
  }))
})

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

const analyticsFilterKey = (filters = appliedFilters.value) => {
  if (filters.isCustom) {
    return `${filters.server}|${filters.site}|custom|${filters.customStart}|${filters.customEnd}`
  }
  return `${filters.server}|${filters.site}|${filters.range}`
}

const applyRequestResponseSeries = (requestResponse) => {
  const requestPoints = mapSeriesPoints(Array.isArray(requestResponse) ? requestResponse : [], 'requestCount')
  l7RequestSeries.value = [{ name: 'L7 Requests', data: requestPoints }]
  requestResponseSeries.value = [
    { name: 'Requests', data: requestPoints },
    {
      name: 'Answered',
      data: mapSeriesPoints(Array.isArray(requestResponse) ? requestResponse : [], 'responseCount'),
    },
  ]
  requestResponseLoaded.value = true
}

const ensureRequestResponse = async (params) => {
  if (requestResponseLoaded.value) return
  const requestResponse = await fetchAnalyticsSeries('request-response', params)
  applyRequestResponseSeries(requestResponse)
}

const loadSummary = async (params) => {
  try {
    const summary = await fetchAnalyticsSummary(params)
    const summaryData = summary || {}
    analyticsStats.value = {
      totalL7RxTraffic: Number(summaryData?.totalL7RxTraffic ?? 0),
      totalL7TxTraffic: Number(summaryData?.totalL7TxTraffic ?? 0),
      l7RxBandwidthLast: Number(summaryData?.l7RxBandwidthLast ?? 0),
      l7TxBandwidthLast: Number(summaryData?.l7TxBandwidthLast ?? 0),
      l7RxBandwidthLastTime: summaryData?.l7RxBandwidthLastTime || '',
      l7TxBandwidthLastTime: summaryData?.l7TxBandwidthLastTime || '',
      totalRequest: Number(summaryData?.totalRequest ?? 0),
      totalResponse: Number(summaryData?.totalResponse ?? 0),
      ipCount: Number(summaryData?.ipCount ?? 0),
      refererCount: Number(summaryData?.refererCount ?? 0),
      ispCount: Number(summaryData?.ispCount ?? 0),
    }
  } catch (error) {
    console.error('Failed to load analytics summary', error)
    analyticsStats.value = createDefaultAnalyticsStats()
    notifyError(ANALYTICS_TITLE, error?.message || 'The analytics summary could not be loaded.')
  }
}

const loadBandwidthTab = async (params) => {
  const [l7RxBandwidth, l7TxBandwidth] = await Promise.all([
    fetchAnalyticsSeries('l7-rx-bandwidth', params),
    fetchAnalyticsSeries('l7-tx-bandwidth', params),
    ensureRequestResponse(params),
  ])
  l7RxBandwidthSeries.value = [
    { name: 'RX', data: mapSeriesPoints(Array.isArray(l7RxBandwidth) ? l7RxBandwidth : [], 'traffic') },
  ]
  l7TxBandwidthSeries.value = [
    { name: 'TX', data: mapSeriesPoints(Array.isArray(l7TxBandwidth) ? l7TxBandwidth : [], 'traffic') },
  ]
}

const loadRequestsTab = async (params) => {
  const [, statusSeries, statusSummary] = await Promise.all([
    ensureRequestResponse(params),
    fetchAnalyticsSeries('status-codes', params),
    fetchAnalyticsSummaryGroup('status-codes', params),
  ])
  statusCodeSeries.value = [
    { name: '2xx', data: mapSeriesPoints(Array.isArray(statusSeries) ? statusSeries : [], 'success') },
    { name: '3xx', data: mapSeriesPoints(Array.isArray(statusSeries) ? statusSeries : [], 'redirect') },
    { name: '4xx', data: mapSeriesPoints(Array.isArray(statusSeries) ? statusSeries : [], 'client') },
    { name: '5xx + 9xx', data: mapSeriesPoints(Array.isArray(statusSeries) ? statusSeries : [], 'server') },
  ]
  const statusRows = statusCodeList.map((code) => ({
    code,
    count: Number(statusSummary?.[`code${code}`] ?? 0),
  }))
  statusCodeRows.value = buildRateRows(statusRows)
}

const loadAudienceTab = async (params) => {
  const [ipCount, topIps, topIsps, topReferers, countryRows] = await Promise.all([
    fetchAnalyticsSeries('ip-count', params),
    fetchAnalyticsSummaryGroup('top-ips', params),
    fetchAnalyticsSummaryGroup('isps', params),
    fetchAnalyticsSummaryGroup('referers', params),
    fetchAnalyticsSummaryGroup('countries', params),
  ])
  ipCountSeries.value = [
    { name: 'Unique IPs / interval', data: mapSeriesPoints(Array.isArray(ipCount) ? ipCount : [], 'count') },
  ]
  ipTableRows.value = buildRateRows(
    (Array.isArray(topIps) ? topIps : []).map((row) => ({
      ip: row.ip,
      requests: Number(row.requests ?? 0),
    })),
  )
  ispTableRows.value = buildRateRows(
    (Array.isArray(topIsps) ? topIsps : []).map((row) => ({
      isp: row.isp,
      requests: Number(row.requests ?? 0),
    })),
  )
  refererTableRows.value = buildRateRows(
    (Array.isArray(topReferers) ? topReferers : []).map((row) => ({
      referer: !row.referer || row.referer === '-' ? '(direct)' : row.referer,
      requests: Number(row.requests ?? 0),
    })),
  )
  countryRequests.value = (Array.isArray(countryRows) ? countryRows : []).map((row) => ({
    code: String(row.countryCode || '').toUpperCase(),
    name: row.countryCode ? row.countryCode.toUpperCase() : 'Unknown',
    count: Number(row.requests ?? 0),
  }))
}

const loadHttpTab = async (params) => {
  const [methodPoints, protocolPoints, methodSummary, protocolSummary] = await Promise.all([
    fetchAnalyticsSeries('methods', params),
    fetchAnalyticsSeries('protocols', params),
    fetchAnalyticsSummaryGroup('methods', params),
    fetchAnalyticsSummaryGroup('protocols', params),
  ])
  methodSeries.value = methodKeys.map((method) => ({
    name: method.label,
    data: mapSeriesPoints(Array.isArray(methodPoints) ? methodPoints : [], method.field),
  }))
  protocolSeries.value = protocolKeys.map((protocol) => ({
    name: protocol.label,
    data: mapSeriesPoints(Array.isArray(protocolPoints) ? protocolPoints : [], protocol.field),
  }))
  methodTableRows.value = buildRateRows(
    methodKeys.map((method) => ({
      method: method.label,
      requests: Number(methodSummary?.[method.field] ?? 0),
    })),
  )
  protocolTableRows.value = buildRateRows(
    protocolKeys.map((protocol) => ({
      protocol: protocol.label,
      requests: Number(protocolSummary?.[protocol.field] ?? 0),
    })),
  )
}

const loadTabData = async (tabId, params) => {
  switch (tabId) {
    case 'bandwidth':
      await loadBandwidthTab(params)
      break
    case 'requests':
      await loadRequestsTab(params)
      break
    case 'audience':
      await loadAudienceTab(params)
      break
    case 'http':
      await loadHttpTab(params)
      break
    default:
      break
  }
}

const markTabLoaded = (tabId) => {
  const next = new Set(loadedTabs.value)
  next.add(tabId)
  loadedTabs.value = next
}

let analyticsLoadSeq = 0

/** Load summary + active tab only; other tabs fetch on first visit for this filter key. */
const loadAnalyticsData = async (tabId = activeTab.value) => {
  const params = buildAnalyticsParams()
  const filterKey = analyticsFilterKey()
  const filterChanged = filterKey !== loadedFilterKey.value

  if (
    !filterChanged
    && loadedTabs.value.has('__summary')
    && loadedTabs.value.has(tabId)
  ) {
    renderChartsForTab(tabId)
    return
  }

  const seq = ++analyticsLoadSeq
  isLoading.value = true

  if (filterChanged) {
    loadedTabs.value = new Set()
    loadedFilterKey.value = filterKey
    requestResponseLoaded.value = false
  }

  try {
    if (!loadedTabs.value.has('__summary')) {
      await loadSummary(params)
      if (seq !== analyticsLoadSeq) return
      markTabLoaded('__summary')
    }
    if (!loadedTabs.value.has(tabId)) {
      await loadTabData(tabId, params)
      if (seq !== analyticsLoadSeq) return
      markTabLoaded(tabId)
    }
    if (seq !== analyticsLoadSeq) return
    renderChartsForTab(tabId)
  } catch (error) {
    if (seq !== analyticsLoadSeq) return
    console.error('Failed to load analytics data', error)
    notifyError(ANALYTICS_TITLE, error?.message || 'The analytics data could not be loaded.')
  } finally {
    if (seq === analyticsLoadSeq) isLoading.value = false
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

const renderL7BandwidthChart = () => {
  if (!l7BandwidthChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const rangeAxis = timeSeriesAxis(start, end)
  const series = padSeriesToTimeRange([
    ...(l7RxBandwidthSeries.value.length ? [{ name: 'RX', data: l7RxBandwidthSeries.value[0].data }] : []),
    ...(l7TxBandwidthSeries.value.length ? [{ name: 'TX', data: l7TxBandwidthSeries.value[0].data }] : []),
  ], rangeAxis.startMs, rangeAxis.endMs)
  const options = {
    ...timeSeriesChartBase({
      type: 'area',
      height: 360,
      rangeAxis,
      yLabelFormatter: (val) => formatKiloBps(val),
    }),
    colors: [chartColors().l7, chartColors().warn],
    series,
  }

  if (l7BandwidthChartInstance) {
    l7BandwidthChartInstance.updateOptions(options, true, true)
  } else {
    l7BandwidthChartInstance = new ApexCharts(l7BandwidthChart.value, options)
    l7BandwidthChartInstance.render()
  }
}

const renderL7RequestChart = () => {
  if (!l7RequestChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const rangeAxis = timeSeriesAxis(start, end)
  const series = padSeriesToTimeRange(l7RequestSeries.value, rangeAxis.startMs, rangeAxis.endMs)
  const options = {
    ...timeSeriesChartBase({
      type: 'area',
      height: 380,
      rangeAxis,
      yLabelFormatter: (val) => formatNumber(Math.round(val)),
    }),
    colors: [chartColors().viper],
    series,
  }

  if (l7RequestChartInstance) {
    l7RequestChartInstance.updateOptions(options, true, true)
  } else {
    l7RequestChartInstance = new ApexCharts(l7RequestChart.value, options)
    l7RequestChartInstance.render()
  }
}

const renderRequestResponseChart = () => {
  if (!requestResponseChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const rangeAxis = timeSeriesAxis(start, end)
  const series = padSeriesToTimeRange(requestResponseSeries.value, rangeAxis.startMs, rangeAxis.endMs)
  const options = {
    ...timeSeriesChartBase({
      type: 'line',
      height: 380,
      rangeAxis,
      yLabelFormatter: (val) => `${Math.round(val)}`,
    }),
    colors: [chartColors().viper, chartColors().l4],
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
  const rangeAxis = timeSeriesAxis(start, end)
  const series = padSeriesToTimeRange(statusCodeSeries.value, rangeAxis.startMs, rangeAxis.endMs)
  const options = {
    ...timeSeriesChartBase({
      type: 'line',
      height: 380,
      rangeAxis,
      yLabelFormatter: (val) => `${Math.round(val)}`,
    }),
    colors: STATUS_SERIES_COLORS(),
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
  const rangeAxis = timeSeriesAxis(start, end)
  const series = padSeriesToTimeRange(ipCountSeries.value, rangeAxis.startMs, rangeAxis.endMs)
  const options = {
    ...timeSeriesChartBase({
      type: 'area',
      height: 380,
      rangeAxis,
      yLabelFormatter: (val) => `${Math.round(val)}`,
      tooltipFormatter: (val) => `${Math.round(val)} IPs`,
    }),
    colors: [chartColors().viper],
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
  const rangeAxis = timeSeriesAxis(start, end)
  const series = padSeriesToTimeRange(methodSeries.value, rangeAxis.startMs, rangeAxis.endMs)
  const options = {
    ...timeSeriesChartBase({
      type: 'line',
      height: 400,
      rangeAxis,
      yLabelFormatter: (val) => `${Math.round(val)}`,
    }),
    colors: LINE_SERIES_PALETTE(),
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
  const rangeAxis = timeSeriesAxis(start, end)
  const series = padSeriesToTimeRange(protocolSeries.value, rangeAxis.startMs, rangeAxis.endMs)
  const options = {
    ...timeSeriesChartBase({
      type: 'line',
      height: 400,
      rangeAxis,
      yLabelFormatter: (val) => `${Math.round(val)}`,
    }),
    colors: LINE_SERIES_PALETTE(),
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
        renderL7BandwidthChart()
        renderL7RequestChart()
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

watch(activeTab, (tab) => {
  void loadAnalyticsData(tab)
})

watch(selectedServer, () => {
  if (selectedSite.value === 'all') return
  const stillValid = siteOptions.value.some((option) => option.value === selectedSite.value)
  if (!stillValid) selectedSite.value = 'all'
})

onMounted(() => {
  loadServers()
  loadSites()
  void loadAnalyticsData(activeTab.value)
  window.addEventListener('cdnproxy-theme-change', rerenderAllCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('cdnproxy-theme-change', rerenderAllCharts)
  if (l7BandwidthChartInstance) {
    l7BandwidthChartInstance.destroy()
    l7BandwidthChartInstance = null
  }
  if (l7RequestChartInstance) {
    l7RequestChartInstance.destroy()
    l7RequestChartInstance = null
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

.analytics-view .dash-panel--hero-chart {
  background:
    linear-gradient(180deg, rgba(46, 158, 108, 0.04) 0%, transparent 42%),
    var(--app-surface);
}

.analytics-view .dash-panel--hero-chart-info {
  background:
    linear-gradient(180deg, rgba(107, 159, 212, 0.06) 0%, transparent 42%),
    var(--app-surface);
}

.analytics-view .dash-panel--hero-chart .dash-panel-head {
  align-items: center;
  margin-bottom: 12px;
}

.analytics-view .dash-panel--hero-chart .dash-panel-head h3 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.analytics-view .dash-panel-icon {
  --icon-tone: var(--app-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: var(--icon-tone);
  background: color-mix(in srgb, var(--icon-tone) 14%, transparent);
  flex: none;
}

.analytics-view .dash-panel-icon.signal { --icon-tone: var(--dorian-viper-400, var(--app-accent)); }
.analytics-view .dash-panel-icon.l7 { --icon-tone: var(--dorian-l7, #8fa3b8); }

.analytics-view .dash-panel-icon svg {
  width: 12px;
  height: 12px;
}

.analytics-view .dash-panel-hint {
  font-size: var(--type-small, 11px);
  font-weight: 400;
  color: var(--app-text-muted);
}

.analytics-view .dash-readout-strip {
  display: grid;
  grid-template-columns: 1.2fr repeat(3, minmax(0, 1fr));
  border: 0.5px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-muted);
  margin-bottom: 8px;
}

.analytics-view .dash-readout-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 12px;
  min-width: 0;
}

.analytics-view .dash-readout-cell + .dash-readout-cell {
  border-left: 0.5px solid var(--app-border);
}

.analytics-view .dash-readout-cell__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.analytics-view .dash-readout-cell__label .sw {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.analytics-view .dash-readout-cell__label .sw.rx,
.analytics-view .dash-readout-cell__label .sw.req {
  background: var(--dorian-viper-400, var(--app-accent));
}

.analytics-view .dash-readout-cell__label .sw.tx {
  background: var(--dorian-warn, #e0a83f);
}

.analytics-view .dash-readout-cell__value {
  font-size: 16px;
  font-weight: 650;
  color: var(--app-heading);
  line-height: 1.15;
  white-space: nowrap;
}

.analytics-view .dash-readout-cell.lead .dash-readout-cell__value {
  font-size: 20px;
  color: var(--dorian-viper-400, var(--app-accent));
}

@media (max-width: 900px) {
  .analytics-view .dash-readout-strip {
    grid-template-columns: 1fr 1fr;
  }

  .analytics-view .dash-readout-cell:nth-child(3) {
    border-left: 0;
    border-top: 0.5px solid var(--app-border);
  }

  .analytics-view .dash-readout-cell:nth-child(n + 3) {
    border-top: 0.5px solid var(--app-border);
  }
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
  stroke: rgba(255, 255, 255, 0.12);
}

[data-theme='dark'] .world-map :deep(.svg-map__location:hover) {
  filter: brightness(1.25);
}

</style>

