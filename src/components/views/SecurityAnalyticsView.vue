<template>
  <div class="dashboard-view security-analytics-view" :aria-busy="isLoading">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>Firewall (L7)</h2>
        <p>HTTP requests blocked by WAF rules, rate limits, and IP/geo blocks, and where they came from.</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <div class="dash-filterbar">
      <div class="dash-filter-field">
        <label for="security-server">Edge</label>
        <select id="security-server" v-model="selectedServer" class="dash-select" :disabled="isLoading">
          <option v-for="server in serverOptions" :key="server.value" :value="server.value">
            {{ server.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label for="security-site">Site</label>
        <select id="security-site" v-model="selectedSite" class="dash-select" :disabled="isLoading">
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

    <nav class="dash-tabbar" aria-label="L7 attack sections" role="tablist">
      <button
        v-for="tab in securityTabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="dash-tab"
        :class="{ active: activeTab === tab.id }"
        :aria-selected="activeTab === tab.id"
        @click="activeTab = tab.id"
      >
        <svg class="dash-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <template v-if="tab.id === 'overview'"><path d="M12 3l7.5 3v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6L12 3z" /></template>
          <template v-else-if="tab.id === 'attacks'"><path d="M12 3l7.5 3v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6L12 3z" /><path d="M9.5 12h5M12 9.5v5" /></template>
          <template v-else-if="tab.id === 'geography'"><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.2 2.4 2.2 14.6 0 17M12 3.5c-2.2 2.4-2.2 14.6 0 17" /></template>
          <template v-else><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></template>
        </svg>
        <span class="dash-tab__label">{{ tab.label }}</span>
      </button>
    </nav>

    <div v-show="activeTab === 'overview'" class="analytics-tab-panel">
      <section class="dash-kpi-strip">
        <article
          v-for="metric in metricCards"
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
        <div class="dash-panel c-12 dash-chart-panel dash-chart-panel--danger">
          <div class="dash-panel-head">
            <div>
              <h3>Blocked requests over time</h3>
              <p class="dash-panel-desc">HTTP requests rejected at the edge. Long ranges average per chart point · {{ selectedRangeLabel }}</p>
            </div>
            <div class="dash-chart-readouts">
              <div class="dash-chart-readout">
                <span class="dash-chart-readout__swatch dash-chart-readout__swatch--danger"></span>
                <div>
                  <div class="dash-chart-readout__label">Latest (per min)</div>
                  <div class="dash-chart-readout__value num danger">{{ latestBlockCountLabel }}</div>
                </div>
              </div>
              <div class="dash-chart-readout">
                <div>
                  <div class="dash-chart-readout__label">Block rate</div>
                  <div class="dash-chart-readout__value num warn">{{ blockRateLabel }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
            <div ref="blockCountChart"></div>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3 class="info-hint-heading">
                <span>Blocks by rule</span>
                <InfoHint
                  text="Blocked requests attributed to the WAF rule category that made the final decision (Athens block_reason_stats). Per site and minute, these counts sum to blocked_request_count."
                  aria-label="Blocks by rule help"
                />
              </h3>
              <p class="dash-panel-desc">Which WAF rule category rejected the request</p>
            </div>
            <PreviewDataBadge v-if="ruleTypesPreview" />
          </div>
          <div class="url-bars">
            <div v-for="row in ruleTypeRows" :key="row.ruleType" class="url-bar-row">
              <div class="url-bar-label">{{ row.label }}</div>
              <div class="url-bar-line">
                <div class="url-bar-track">
                  <div
                    class="url-bar-fill url-bar-fill--danger"
                    :style="{ width: `${ruleTypeBarWidth(row.count)}%` }"
                    :title="`${row.label} — ${row.count}`"
                  ></div>
                </div>
                <div class="url-bar-value num">{{ formatNumber(row.count) }}</div>
                <div class="url-bar-share num">{{ ruleTypeShare(row.count) }}</div>
              </div>
            </div>
            <p v-if="!ruleTypeRows.length || !ruleTypeTotal" class="empty-row">No blocked requests in this window</p>
          </div>
        </div>
      </section>
    </div>

    <div v-show="activeTab === 'geography'" class="analytics-tab-panel">
      <section class="dash-grid12">
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Requests by country</h3>
              <p class="dash-panel-desc">All HTTP requests by client country, allowed and blocked</p>
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
        <div class="dash-panel c-6">
          <div class="dash-panel-head">
            <div>
              <h3>Top countries by requests</h3>
              <p class="dash-panel-desc">All requests, top 30</p>
            </div>
          </div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Requests</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in topRequestRows" :key="`req-${row.area}`">
                  <td>{{ row.area }}</td>
                  <td class="num">{{ formatNumber(row.count) }}</td>
                </tr>
                <tr v-if="!topRequestRows.length">
                  <td colspan="2" class="empty-row">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="dash-panel c-6">
          <div class="dash-panel-head">
            <div>
              <h3>Top countries by blocks</h3>
              <p class="dash-panel-desc">Blocked requests, top 30</p>
            </div>
          </div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Blocked</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in topBlockRows" :key="`blk-${row.area}`">
                  <td>{{ row.area }}</td>
                  <td class="num">{{ formatNumber(row.count) }}</td>
                </tr>
                <tr v-if="!topBlockRows.length">
                  <td colspan="2" class="empty-row">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    <div v-show="activeTab === 'attacks'" class="analytics-tab-panel">
      <section class="l7-attack-summary" aria-label="L7 attack summary">
        <article class="l7-attack-summary__card">
          <span class="l7-attack-summary__label">Temp-block events</span>
          <span class="l7-attack-summary__value num">{{ formatNumber(attackSummary.attempts) }}</span>
          <span class="l7-attack-summary__hint">every Temporary blocks add in range · not every blocked request (see Overview)</span>
        </article>
        <article class="l7-attack-summary__card">
          <span class="l7-attack-summary__label">Unique sources</span>
          <span class="l7-attack-summary__value num">{{ formatNumber(attackSummary.sources) }}</span>
          <span class="l7-attack-summary__hint">distinct IPs added to Temporary blocks</span>
        </article>
        <article class="l7-attack-summary__card">
          <span class="l7-attack-summary__label">Attacked URIs</span>
          <span class="l7-attack-summary__value num">{{ formatNumber(attackSummary.urls) }}</span>
          <span class="l7-attack-summary__hint">{{ attackSummary.topRule || 'no dominant rule' }}</span>
        </article>
      </section>

      <section class="dash-grid12">
        <div class="dash-panel c-6">
          <div class="dash-panel-head">
            <div>
              <h3 class="info-hint-heading">
                <span>Recent temp-block events</span>
                <InfoHint
                  text="One row per time an IP was added to Temporary blocks (Drop+Block / temp ban). This is not the same as Overview “Blocked requests”, which counts every refused HTTP request from Athens. Rows remain after the Temporary blocks TTL expires."
                  aria-label="Recent L7 blocks help"
                />
              </h3>
              <p class="dash-panel-desc">IPs added to Temporary blocks · kept after expiry</p>
            </div>
            <span class="dash-count-tag">{{ formatNumber(recentAttackRows.length) }} shown</span>
          </div>
          <p v-if="!recentAttackRows.length" class="empty-row">No temporary blocks in this range.</p>
          <ul v-else class="l7-attack-list" aria-label="Recent temp-block events">
            <li
              v-for="row in recentAttackRows"
              :key="`${row.id || row.sourceIp}-${row.blockedAt}-${row.url || ''}`"
            >
              <button type="button" class="l7-attack-row" @click="openL7TempBlock(row)">
                <div class="l7-attack-row__time">
                  <span class="l7-attack-row__clock num">{{ formatClock(row.blockedAt) }}</span>
                  <span class="l7-attack-row__rel">{{ formatRelativeTime(row.blockedAt) }}</span>
                </div>
                <div class="l7-attack-row__body">
                  <div class="l7-attack-row__main">
                    <span class="l7-attack-row__ip num">{{ row.sourceIp }}</span>
                    <span class="badge badge--sm">{{ ruleLabel(row.triggerRule) }}</span>
                  </div>
                  <div class="l7-attack-row__uri num" :title="row.url || ''">{{ row.url || '(no URL)' }}</div>
                  <div class="l7-attack-row__meta">
                    <span>{{ row.siteDomain || (row.siteId ? `site ${row.siteId}` : 'edge') }}</span>
                    <span v-if="row.serverName">· {{ row.serverName }}</span>
                    <span v-if="row.country">· {{ row.country }}</span>
                  </div>
                </div>
              </button>
            </li>
          </ul>
        </div>

        <div class="dash-panel c-6">
          <div class="dash-panel-head">
            <div>
              <h3 class="info-hint-heading">
                <span>Top attacking IPs</span>
                <InfoHint
                  text="Client IPs ranked by how many durable L7 block events they generated in the selected range, per edge."
                  aria-label="Top attacking IPs help"
                />
              </h3>
              <p class="dash-panel-desc">Sources ranked by temp-block events (top 20)</p>
            </div>
          </div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Source</th>
                  <th>Edge</th>
                  <th>Rules</th>
                  <th class="is-num">Temp-bans</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in topAttackIpRows" :key="`${row.serverId}-${row.ip}`">
                  <td class="num">{{ index + 1 }}</td>
                  <td class="num">{{ row.ip }}</td>
                  <td>{{ row.serverName || `edge-${row.serverId}` }}</td>
                  <td>{{ (row.triggerRules || []).slice(0, 3).map(ruleLabel).join(', ') || '—' }}</td>
                  <td class="is-num num">{{ formatNumber(row.count) }}</td>
                  <td>{{ formatRelativeTime(row.lastSeen) }}</td>
                </tr>
                <tr v-if="!topAttackIpRows.length">
                  <td colspan="6" class="empty-row">No attacking IPs in this range</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3 class="info-hint-heading">
                <span>Most attacked URIs</span>
                <InfoHint
                  text="Request URLs that triggered L7 temporary blocks most often. Unique IPs shows how many distinct clients hit that URI."
                  aria-label="Most attacked URIs help"
                />
              </h3>
              <p class="dash-panel-desc">URLs that triggered Temporary blocks (top 20)</p>
            </div>
          </div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>URI</th>
                  <th>Site</th>
                  <th>Rules</th>
                  <th class="is-num">Temp-bans</th>
                  <th class="is-num">Unique IPs</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in topAttackUrlRows" :key="`${row.siteId}-${row.url}`">
                  <td class="num" :title="row.url">{{ truncateMiddle(row.url, 96) }}</td>
                  <td>{{ row.siteDomain || (row.siteId ? `site ${row.siteId}` : '—') }}</td>
                  <td>{{ (row.triggerRules || []).slice(0, 3).map(ruleLabel).join(', ') || '—' }}</td>
                  <td class="is-num num">{{ formatNumber(row.count) }}</td>
                  <td class="is-num num">{{ formatNumber(row.uniqueIps) }}</td>
                  <td>{{ formatRelativeTime(row.lastSeen) }}</td>
                </tr>
                <tr v-if="!topAttackUrlRows.length">
                  <td colspan="6" class="empty-row">No attacked URIs in this range</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    <div v-show="activeTab === 'toplists'" class="analytics-tab-panel">
      <section class="dash-grid12">
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Top URLs</h3>
              <p class="dash-panel-desc">Most requested URLs across all traffic, allowed and blocked</p>
            </div>
          </div>
          <div class="url-bars">
            <div v-for="row in topUrlRows" :key="row.url" class="url-bar-row">
              <div class="url-bar-label">{{ row.url }}</div>
              <div class="url-bar-line">
                <div class="url-bar-track">
                  <div
                    class="url-bar-fill url-bar-fill--l4"
                    :style="{ width: `${urlBarWidth(row.count)}%` }"
                    :title="`${row.url} — ${row.count}`"
                  ></div>
                </div>
                <div class="url-bar-value num">{{ formatNumber(row.count) }}</div>
              </div>
            </div>
            <p v-if="!topUrlRows.length" class="empty-row">No data</p>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Top referers</h3>
              <p class="dash-panel-desc">Across all traffic, allowed and blocked</p>
            </div>
          </div>
          <div class="url-bars">
            <div v-for="row in topRefererRows" :key="row.referer" class="url-bar-row">
              <div class="url-bar-label">{{ row.referer }}</div>
              <div class="url-bar-line">
                <div class="url-bar-track">
                  <div
                    class="url-bar-fill url-bar-fill--viper"
                    :style="{ width: `${refererBarWidth(row.count)}%` }"
                    :title="`${row.referer} — ${row.count}`"
                  ></div>
                </div>
                <div class="url-bar-value num">{{ formatNumber(row.count) }}</div>
              </div>
            </div>
            <p v-if="!topRefererRows.length" class="empty-row">No data</p>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Top user agents</h3>
              <p class="dash-panel-desc">Across all traffic, allowed and blocked</p>
            </div>
          </div>
          <div class="url-bars">
            <div v-for="row in topUserAgentRows" :key="row.agent" class="url-bar-row">
              <div class="url-bar-label">{{ row.agent }}</div>
              <div class="url-bar-line">
                <div class="url-bar-track">
                  <div
                    class="url-bar-fill url-bar-fill--l7"
                    :style="{ width: `${userAgentBarWidth(row.count)}%` }"
                    :title="`${row.agent} — ${row.count}`"
                  ></div>
                </div>
                <div class="url-bar-value num">{{ formatNumber(row.count) }}</div>
              </div>
            </div>
            <p v-if="!topUserAgentRows.length" class="empty-row">No data</p>
          </div>
        </div>
      </section>
    </div>

    <L7TempBlockConsole
      v-if="selectedL7Event"
      :event="selectedL7Event"
      :range="appliedFilters.isCustom ? '' : appliedFilters.range"
      :start="appliedFilters.isCustom ? appliedFilters.customStart : ''"
      :end="appliedFilters.isCustom ? appliedFilters.customEnd : ''"
      :server-id="appliedFilters.server"
      :site-id="appliedFilters.site"
      :range-label="selectedRangeLabel"
      @close="selectedL7Event = null"
      @select="selectedL7Event = $event"
    />

    <div v-if="showCustomDialog" class="dialog-overlay" @click.self="showCustomDialog = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Custom time range</h3>
          <button type="button" class="dialog-close" @click="showCustomDialog = false">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-body">
          <div class="dialog-form-group">
            <label>Start date &amp; time</label>
            <FlatPickr
              v-model="customStartDate"
              :config="datePickerConfig"
              class="dialog-input"
              placeholder="Select start time"
            />
          </div>
          <div class="dialog-form-group">
            <label>End date &amp; time</label>
            <FlatPickr
              v-model="customEndDate"
              :config="datePickerConfig"
              class="dialog-input"
              placeholder="Select end time"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button type="button" class="dialog-btn cancel-btn" @click="showCustomDialog = false">Cancel</button>
          <button type="button" class="dialog-btn apply-btn" @click="applyCustomRange">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import ApexCharts from 'apexcharts'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { SvgMap } from 'vue-svg-map'
import world from '@svg-maps/world'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import InfoHint from '@/components/InfoHint.vue'
import L7TempBlockConsole from '@/components/L7TempBlockConsole.vue'
import PreviewDataBadge from '@/components/views/analytics/PreviewDataBadge.vue'
import { fetchServers } from '@/api/servers'
import { fetchSites } from '@/api/sites'
import {
  FIREWALL_RULE_TYPES,
  fetchSecuritySummary,
  fetchSecuritySeries,
  fetchSecuritySummaryGroup,
  fetchSecurityRuleTypes,
  fetchSecurityAttacks,
} from '@/api/securityAnalytics'
import { formatRelativeTime } from '@/utils/auditFormat'
import {
  formatApexTimeTick,
  getApexChartColors,
  getApexDatetimeXaxis,
  getApexFontFamily,
  getApexSeriesColors,
  getApexTimeRangeAnnotations,
  padSeriesToTimeRange,
} from '@/utils/chartTheme'
import { rangeDurationMs, readSharedTimeRange, sharedTimeRanges, writeSharedTimeRange } from '@/utils/timeRange'

const chartColors = () => getApexSeriesColors()
const themeChartColors = () => getApexChartColors()
const chartGridColor = () => themeChartColors().grid
const chartLabelColor = () => themeChartColors().label

const chartTooltipTheme = () =>
  typeof document !== 'undefined' &&
  document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light'

const mapEmptyFill = () =>
  typeof document !== 'undefined' &&
  document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(148, 163, 184, 0.2)'

const activeTab = ref('overview')
const securityTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'attacks', label: 'Attacks' },
  { id: 'geography', label: 'Geography' },
  { id: 'toplists', label: 'Request context' },
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

const servers = ref([])
const sites = ref([])
const securityStats = ref({
  totalRequestCounts: 0,
  blockRequestCounts: 0,
  totalIps: 0,
  blacklistedIps: 0,
})

const blockCountChart = ref(null)
let blockCountChartInstance = null
const blockSeries = ref([])

const countryRequests = ref([])
const topRequestRows = ref([])
const topBlockRows = ref([])
const topUrlRows = ref([])
const topRefererRows = ref([])
const topUserAgentRows = ref([])
const ruleTypeRows = ref([])
const ruleTypesPreview = ref(false)
const recentAttackRows = ref([])
const topAttackIpRows = ref([])
const topAttackUrlRows = ref([])
const selectedL7Event = ref(null)
const openL7TempBlock = (event) => {
  selectedL7Event.value = event
}

const ruleLabelMap = Object.fromEntries(FIREWALL_RULE_TYPES.map((row) => [row.ruleType, row.label]))
const ruleLabel = (value) => {
  const key = String(value || '').trim().toLowerCase()
  if (!key) return 'Unknown'
  return ruleLabelMap[key] || value
}
const formatClock = (value) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
const truncateMiddle = (value, max = 80) => {
  const text = String(value || '')
  if (text.length <= max) return text
  const keep = Math.max(12, Math.floor((max - 1) / 2))
  return `${text.slice(0, keep)}…${text.slice(-keep)}`
}
const attackTotals = ref({ events: 0, sources: 0, urls: 0 })
const attackSummary = computed(() => {
  const attempts = recentAttackRows.value.length
  const sources = new Set(topAttackIpRows.value.map((row) => row.ip)).size || new Set(recentAttackRows.value.map((row) => row.sourceIp)).size
  const urls = topAttackUrlRows.value.length || new Set(recentAttackRows.value.map((row) => row.url).filter(Boolean)).size
  const ruleCounts = {}
  recentAttackRows.value.forEach((row) => {
    const key = String(row.triggerRule || '').trim() || 'unknown'
    ruleCounts[key] = (ruleCounts[key] || 0) + 1
  })
  const topRuleKey = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  return {
    attempts: Number(attackTotals.value.events) || topAttackIpRows.value.reduce((sum, row) => sum + (Number(row.count) || 0), 0) || attempts,
    sources: Number(attackTotals.value.sources) || sources,
    urls: Number(attackTotals.value.urls) || urls,
    topRule: topRuleKey ? ruleLabel(topRuleKey) : '',
  }
})

const formatNumber = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return numeric.toLocaleString()
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

const metricCards = computed(() => {
  const total = Number(securityStats.value.totalRequestCounts) || 0
  const blocked = Number(securityStats.value.blockRequestCounts) || 0
  const rate = total > 0 ? (blocked / total) * 100 : 0
  return [
    {
      label: 'Total requests',
      value: formatNumber(total),
      hint: selectedRangeLabel.value,
      tone: 'total',
    },
    {
      label: 'Blocked requests',
      value: formatNumber(blocked),
      hint: rate > 0
        ? `${rate.toFixed(rate >= 10 ? 0 : 1)}% of traffic · every refused HTTP request`
        : 'every refused HTTP request in range',
      tone: 'danger',
    },
    {
      label: 'Source IP-minutes',
      value: formatNumber(securityStats.value.totalIps),
      hint: 'per edge-minute unique, summed (not distinct)',
      tone: 'info',
    },
    {
      label: 'Blocked IP-minutes',
      value: formatNumber(securityStats.value.blacklistedIps),
      hint: 'per edge-minute unique blocked, summed',
      tone: 'warn',
    },
  ]
})

const latestBlockPoint = computed(() => {
  const points = mapBlockPoints(blockSeries.value)
  if (!points.length) return null
  return points[points.length - 1]
})

const latestBlockCountLabel = computed(() =>
  latestBlockPoint.value ? formatNumber(latestBlockPoint.value.y) : '—',
)

const blockRateLabel = computed(() => {
  const total = Number(securityStats.value.totalRequestCounts) || 0
  const blocked = Number(securityStats.value.blockRequestCounts) || 0
  if (total <= 0) return '0%'
  const rate = (blocked / total) * 100
  return `${rate.toFixed(rate >= 10 ? 0 : 1)}%`
})

const countryRequestMap = computed(() =>
  countryRequests.value.reduce((acc, item) => {
    const code = String(item.code || '').toLowerCase()
    if (code) acc[code] = item
    return acc
  }, {}),
)

const mapRenderKey = computed(() =>
  countryRequests.value.map((item) => `${item.code}:${item.count}`).join('|') || 'empty',
)

const maxCountryCount = computed(() =>
  Math.max(0, ...countryRequests.value.map((item) => Number(item.count) || 0)),
)

const hoveredCountry = ref('')
const tooltipPosition = ref({ x: 0, y: 0 })

const colorFromRate = (ratio) => {
  if (ratio >= 0.8) return chartColors().danger
  if (ratio >= 0.6) return chartColors().warn
  if (ratio >= 0.4) return chartColors().gold
  if (ratio >= 0.2) return chartColors().success
  return chartColors().l4
}

const mapLocationAttributes = (location) => {
  const entry = countryRequestMap.value[location.id.toLowerCase()]
  const ratio = entry && maxCountryCount.value ? entry.count / maxCountryCount.value : 0
  return {
    fill: entry ? colorFromRate(ratio) : mapEmptyFill(),
    stroke: 'rgba(100, 116, 139, 0.6)',
    'stroke-width': 0.5,
    title: entry
      ? `${entry.name} — ${formatNumber(entry.count)} requests`
      : location.name,
    onMouseenter: () => {
      hoveredCountry.value = entry
        ? `${entry.name} — ${formatNumber(entry.count)} requests`
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

const urlMaxCount = computed(() => {
  const values = topUrlRows.value.map((row) => Number(row.count) || 0)
  return Math.max(...values, 1)
})
const urlBarWidth = (count) => Math.round(((Number(count) || 0) / urlMaxCount.value) * 100)

const refererMaxCount = computed(() => {
  const values = topRefererRows.value.map((row) => Number(row.count) || 0)
  return Math.max(...values, 1)
})
const refererBarWidth = (count) => Math.round(((Number(count) || 0) / refererMaxCount.value) * 100)

const userAgentMaxCount = computed(() => {
  const values = topUserAgentRows.value.map((row) => Number(row.count) || 0)
  return Math.max(...values, 1)
})
const ruleTypeTotal = computed(() => ruleTypeRows.value.reduce((sum, row) => sum + (Number(row.count) || 0), 0))
const ruleTypeBarWidth = (count) => {
  const max = Math.max(...ruleTypeRows.value.map((row) => Number(row.count) || 0), 1)
  return Math.round(((Number(count) || 0) / max) * 100)
}
const ruleTypeShare = (count) => {
  if (!ruleTypeTotal.value) return '0%'
  const share = ((Number(count) || 0) / ruleTypeTotal.value) * 100
  return `${share.toFixed(share >= 10 ? 0 : 1)}%`
}

const userAgentBarWidth = (count) =>
  Math.round(((Number(count) || 0) / userAgentMaxCount.value) * 100)

const mapBlockPoints = (points) =>
  (Array.isArray(points) ? points : [])
    .map((point) => {
      const timestamp = point.timestamp ?? point.time ?? point.x
      const timeValue =
        typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime()
      return {
        x: timeValue,
        y: Number(point.count ?? point.value ?? point.y ?? 0),
      }
    })
    .filter((point) => Number.isFinite(point.x))

const resolveRangeMs = (filters) => rangeDurationMs(filters?.range)

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

const renderBlockCountChart = () => {
  if (!blockCountChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const startMs = start.getTime()
  const endMs = end.getTime()
  const colors = chartColors()
  const series = padSeriesToTimeRange(
    [{ name: 'Blocked', data: mapBlockPoints(blockSeries.value) }],
    startMs,
    endMs,
  )
  const options = {
    chart: {
      type: 'area',
      height: 400,
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 550,
        animateGradually: { enabled: true, delay: 80 },
      },
      background: 'transparent',
      foreColor: chartLabelColor(),
      fontFamily: getApexFontFamily(),
      zoom: { enabled: false },
      selection: { enabled: false },
      pan: { enabled: false },
      dropShadow: {
        enabled: true,
        top: 6,
        left: 0,
        blur: 8,
        opacity: 0.12,
        color: colors.danger,
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2.5,
      lineCap: 'round',
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0.35,
        opacityFrom: 0.42,
        opacityTo: 0.04,
        stops: [0, 70, 100],
      },
    },
    colors: [colors.danger],
    xaxis: {
      ...getApexDatetimeXaxis(startMs, endMs, { tickCount: 7 }),
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
    annotations: getApexTimeRangeAnnotations(startMs, endMs),
    yaxis: {
      labels: {
        style: { colors: chartLabelColor(), fontSize: '11px' },
        formatter: (val) => `${Math.round(val)}`,
      },
      min: 0,
      forceNiceScale: true,
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
      x: { formatter: (val) => formatApexTimeTick(val, startMs, endMs) },
      y: { formatter: (val) => `${Math.round(val)}` },
    },
    series,
  }

  if (blockCountChartInstance) {
    blockCountChartInstance.updateOptions(options, true, true)
  } else {
    blockCountChartInstance = new ApexCharts(blockCountChart.value, options)
    blockCountChartInstance.render()
  }
}

const serverOptions = computed(() => [
  { label: 'All edges', value: 'all' },
  ...servers.value.map((server) => ({
    label: server.name || `Server ${server.id}`,
    value: server.id,
  })),
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

const selectedRangeLabel = computed(() => {
  const filters = appliedFilters.value
  if (filters.isCustom) {
    if (filters.customStart && filters.customEnd) {
      return `${formatDateTime(filters.customStart)} → ${formatDateTime(filters.customEnd)}`
    }
    return 'Custom'
  }
  const found = timeRanges.find((range) => range.value === filters.range)
  return found?.label || 'All'
})

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

const buildSecurityParams = () => {
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

const loadSecurityAnalytics = async () => {
  if (isLoading.value) return
  isLoading.value = true
  const params = buildSecurityParams()
  try {
    const [
      summary,
      blockCounts,
      countries,
      topRequests,
      topBlocks,
      topUrls,
      topReferers,
      topUserAgents,
    ] = await Promise.all([
      fetchSecuritySummary(params),
      fetchSecuritySeries('block-count', params),
      fetchSecuritySummaryGroup('countries', params),
      fetchSecuritySummaryGroup('top-requests', params),
      fetchSecuritySummaryGroup('top-blocks', params),
      fetchSecuritySummaryGroup('top-urls', params),
      fetchSecuritySummaryGroup('top-referers', params),
      fetchSecuritySummaryGroup('top-user-agents', params),
    ])

    securityStats.value = {
      totalRequestCounts: Number(summary?.totalRequestCounts ?? 0),
      blockRequestCounts: Number(summary?.blockRequestCounts ?? 0),
      totalIps: Number(summary?.totalIps ?? 0),
      blacklistedIps: Number(summary?.blacklistedIps ?? 0),
    }
    blockSeries.value = Array.isArray(blockCounts) ? blockCounts : []
    countryRequests.value = Array.isArray(countries) ? countries : []
    topRequestRows.value = Array.isArray(topRequests) ? topRequests : []
    topBlockRows.value = (Array.isArray(topBlocks) ? topBlocks : []).filter((row) => Number(row.count) > 0)
    topUrlRows.value = Array.isArray(topUrls) ? topUrls : []
    topRefererRows.value = (Array.isArray(topReferers) ? topReferers : []).map((row) => ({
      ...row,
      referer: !row.referer || row.referer === '-' ? '(direct)' : row.referer,
    }))
    topUserAgentRows.value = Array.isArray(topUserAgents) ? topUserAgents : []

    const [ruleTypes, recentAttacks, topAttackIps, topAttackUrls, attackSummaryPayload] = await Promise.all([
      fetchSecurityRuleTypes(params, securityStats.value.blockRequestCounts),
      fetchSecurityAttacks('recent', { ...params, limit: 50 }).catch(() => []),
      fetchSecurityAttacks('top-ips', { ...params, limit: 20 }).catch(() => []),
      fetchSecurityAttacks('top-urls', { ...params, limit: 20 }).catch(() => []),
      fetchSecurityAttacks('summary', params).catch(() => null),
    ])
    ruleTypeRows.value = (Array.isArray(ruleTypes.data) ? ruleTypes.data : []).filter((row) => Number(row.count) > 0)
    ruleTypesPreview.value = ruleTypes.preview
    recentAttackRows.value = Array.isArray(recentAttacks) ? recentAttacks : []
    topAttackIpRows.value = Array.isArray(topAttackIps) ? topAttackIps : []
    topAttackUrlRows.value = Array.isArray(topAttackUrls) ? topAttackUrls : []
    attackTotals.value = {
      events: Number(attackSummaryPayload?.events) || 0,
      sources: Number(attackSummaryPayload?.sources) || 0,
      urls: Number(attackSummaryPayload?.urls) || 0,
    }

    nextTick(() => renderBlockCountChart())
  } catch (error) {
    console.error('Failed to load security analytics', error)
  } finally {
    isLoading.value = false
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
  loadSecurityAnalytics()
}

watch(blockSeries, () => {
  if (activeTab.value === 'overview') renderBlockCountChart()
}, { deep: true })

watch(activeTab, (tab) => {
  if (tab === 'overview') nextTick(() => renderBlockCountChart())
})

watch(selectedServer, () => {
  if (selectedSite.value === 'all') return
  const stillValid = siteOptions.value.some((option) => option.value === selectedSite.value)
  if (!stillValid) selectedSite.value = 'all'
})

onMounted(() => {
  loadServers()
  loadSites()
  loadSecurityAnalytics()
  window.addEventListener('cdnproxy-theme-change', renderBlockCountChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('cdnproxy-theme-change', renderBlockCountChart)
  if (blockCountChartInstance) {
    blockCountChartInstance.destroy()
    blockCountChartInstance = null
  }
})
</script>

<style scoped>
.security-analytics-view {
  max-width: 1680px;
  margin: 0 auto;
}

.analytics-tab-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.world-map {
  width: 100%;
  height: fit-content;
  border-radius: 12px;
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

.table-wrap {
  max-height: 360px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.ip-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--type-caption);
}

.ip-table th,
.ip-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--app-border);
}

.ip-table th {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-label);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  position: sticky;
  top: 0;
  background: var(--app-surface);
  z-index: 1;
}

.ip-table td {
  color: var(--app-text);
}

.empty-row {
  color: var(--app-text-muted);
  text-align: center;
  padding: 16px 0;
  margin: 0;
}

.url-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.url-bar-row {
  display: grid;
  grid-template-columns: minmax(120px, 28%) 1fr;
  gap: 12px;
  align-items: center;
}

.url-bar-label {
  font-size: var(--type-caption);
  color: var(--app-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.url-bar-line {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.url-bar-track {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: var(--app-surface-muted);
  overflow: hidden;
}

.url-bar-fill {
  height: 100%;
  border-radius: 999px;
  min-width: 2px;
  transition: width 0.25s ease;
}

.url-bar-fill--l4 {
  background: linear-gradient(90deg, #6b9fd4 0%, #4a86c7 100%);
}

.url-bar-fill--viper {
  background: linear-gradient(90deg, #3fbd85 0%, #2e9e6c 100%);
}

.url-bar-fill--l7 {
  background: linear-gradient(90deg, #8fa3b8 0%, #6b7c8f 100%);
}

.url-bar-fill--danger {
  background: linear-gradient(90deg, #ef7a6c 0%, #e15241 100%);
}

.url-bar-share {
  min-width: 40px;
  text-align: right;
  font-size: 11px;
  color: var(--app-text-muted);
}

.url-bar-value {
  min-width: 56px;
  text-align: right;
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.dialog-overlay {
  position: fixed;
  inset: 0;
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
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
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
  background: var(--app-btn-primary-bg);
  color: #fff;
}

.apply-btn:hover {
  background: var(--app-btn-primary-hover);
}

[data-theme='dark'] .world-map :deep(.svg-map__location) {
  stroke: rgba(255, 255, 255, 0.12);
}

[data-theme='dark'] .world-map :deep(.svg-map__location:hover) {
  filter: brightness(1.25);
}

@media (max-width: 900px) {
  .url-bar-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}

.l7-attack-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.l7-attack-summary__card {
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface);
}

.l7-attack-summary__label {
  display: block;
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.l7-attack-summary__value {
  display: block;
  margin-top: 4px;
  font-size: var(--type-section-title);
  font-weight: 700;
  color: var(--app-heading);
}

.l7-attack-summary__hint {
  display: block;
  margin-top: 2px;
  font-size: var(--type-small);
  color: var(--app-text-muted);
}

.l7-attack-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 520px;
  overflow: auto;
}

.l7-attack-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--app-surface) 88%, transparent);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.l7-attack-row:hover {
  border-color: var(--app-border-strong);
  background: color-mix(in srgb, var(--app-surface) 96%, transparent);
}

.l7-attack-row__time {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.l7-attack-row__clock {
  font-size: var(--type-caption);
  color: var(--app-heading);
}

.l7-attack-row__rel {
  font-size: var(--type-small);
  color: var(--app-text-muted);
}

.l7-attack-row__main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.l7-attack-row__ip {
  font-weight: 600;
  color: var(--app-heading);
}

.l7-attack-row__uri {
  margin-top: 4px;
  font-size: var(--type-caption);
  color: var(--app-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.l7-attack-row__meta {
  margin-top: 4px;
  font-size: var(--type-small);
  color: var(--app-text-muted);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-btn-danger-bg, #e15241) 14%, transparent);
  color: var(--app-btn-danger-bg, #e15241);
  font-size: var(--type-small);
  font-weight: 600;
}

.badge--sm {
  padding: 1px 7px;
}

@media (max-width: 900px) {
  .l7-attack-summary {
    grid-template-columns: 1fr;
  }

  .l7-attack-row {
    grid-template-columns: 1fr;
  }
}
</style>
