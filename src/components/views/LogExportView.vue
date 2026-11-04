<template>
  <div class="dashboard-view log-export-view" :aria-busy="isListing || isExporting">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>Export &amp; history</h2>
        <p>Download retained edge hours or stream Athens L7 history.</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <AnalyticsGroupNav />

    <div class="export-toolbar">
      <nav class="export-segment" aria-label="Export modes" role="tablist">
        <button
          type="button"
          role="tab"
          class="export-segment__btn"
          :class="{ active: mode === 'browse' }"
          :aria-selected="mode === 'browse'"
          @click="mode = 'browse'"
        >
          Hourly files
        </button>
        <button
          type="button"
          role="tab"
          class="export-segment__btn"
          :class="{ active: mode === 'query' }"
          :aria-selected="mode === 'query'"
          @click="mode = 'query'"
        >
          Query export
        </button>
      </nav>
      <p class="export-toolbar__hint">
        <template v-if="mode === 'browse'">Browse L4/L7 files kept on the edge.</template>
        <template v-else>Stream L7 access and refused-HTTP rows (max {{ maxDays }}d / {{ maxRowsLabel }} rows).</template>
      </p>
    </div>

    <template v-if="mode === 'browse'">
      <div class="dash-filterbar export-filterbar">
        <div class="dash-filter-field">
          <label for="browse-server">Edge</label>
          <select
            id="browse-server"
            v-model="browseServer"
            class="dash-select"
            :disabled="isLoadingMeta || isListing"
          >
            <option disabled value="">Select an edge</option>
            <option v-for="server in browseServerOptions" :key="server.value" :value="server.value">
              {{ server.label }}
            </option>
          </select>
        </div>
        <div class="dash-filter-field">
          <label>Layer</label>
          <div class="layer-segmented" role="radiogroup" aria-label="Log layer">
            <button
              v-for="option in layerOptions"
              :key="option.value"
              type="button"
              class="layer-segmented__btn"
              :class="{ active: browseLayer === option.value }"
              :disabled="isListing"
              @click="browseLayer = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="dash-filter-field dash-filter-field--grow">
          <label>Time range</label>
          <div class="dash-range-pills">
            <button
              v-for="range in timeRanges"
              :key="`browse-${range.value}`"
              type="button"
              class="dash-range-pill"
              :class="{ active: browseTimeRange === range.value && !browseIsCustom }"
              :disabled="isListing"
              @click="selectBrowseTimeRange(range.value)"
            >
              {{ range.label }}
            </button>
            <button
              type="button"
              class="dash-range-pill dash-range-pill--custom"
              :class="{ active: browseIsCustom }"
              :disabled="isListing"
              @click="openCustomDialog('browse')"
            >
              Custom
            </button>
          </div>
        </div>
        <button
          type="button"
          class="export-toggle"
          :class="{ active: attackOnly }"
          :aria-pressed="attackOnly"
          :disabled="isListing"
          @click="attackOnly = !attackOnly"
        >
          Attack-sized
        </button>
        <div class="dash-filter-summary">{{ browseRangeLabel }}</div>
        <button
          type="button"
          class="dash-filter-apply"
          :disabled="!browseServer || isListing || isLoadingMeta"
          @click="loadLogFiles"
        >
          <span v-if="isListing" class="dash-spinner dash-spinner--btn" aria-hidden="true"></span>
          {{ isListing ? 'Loading…' : 'List logs' }}
        </button>
      </div>

      <p v-if="listError" class="export-banner export-banner--warn" role="alert">{{ listError }}</p>

      <section class="dash-panel export-panel">
        <div class="export-panel__head">
          <div>
            <h3>Edge hourly logs</h3>
            <p class="dash-panel-desc">Open to inspect lines, or download the raw hour file.</p>
          </div>
          <div v-if="filteredFiles.length" class="export-meta" aria-label="Listed files">
            <span class="export-meta__item">
              <strong class="num">{{ browseKpis.files }}</strong> files
            </span>
            <span class="export-meta__item export-meta__item--warn">
              <strong class="num">{{ browseKpis.attackCount }}</strong> attack-sized
            </span>
            <span class="export-meta__item">
              <strong class="num">{{ formatBrowseBytes(browseKpis.totalBytes) }}</strong> total
            </span>
          </div>
        </div>

        <div v-if="filteredFiles.length" class="log-table-wrap">
          <table class="log-table">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Hour</th>
                <th>Kind</th>
                <th class="num">Size</th>
                <th>Path</th>
                <th class="actions-head"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="file in filteredFiles"
                :key="file.path"
                :class="{ 'is-attack': file.attackHint }"
              >
                <td>
                  <span class="layer-pill" :data-layer="file.layer">{{ file.layer.toUpperCase() }}</span>
                </td>
                <td>
                  <div class="hour-cell">
                    <strong>{{ file.hour || file.name }}</strong>
                    <span v-if="file.attackHint" class="attack-badge">Attack</span>
                  </div>
                  <div class="muted">{{ file.name }}</div>
                </td>
                <td class="kind-cell">{{ file.kind }}</td>
                <td class="num">{{ file.sizeLabel }}</td>
                <td class="path-cell" :title="file.path">{{ shortPath(file.path) }}</td>
                <td class="actions-cell">
                  <div class="actions-cell__inner">
                    <button type="button" class="table-link" @click="openLogFile(file)">Open</button>
                    <button
                      type="button"
                      class="table-link table-link--accent"
                      :disabled="downloadingPath === file.path"
                      @click="downloadLogFile(file)"
                    >
                      {{ downloadingPath === file.path ? '…' : 'Download' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else-if="hasListed && !isListing" class="export-empty">
          <h4>No files in this window</h4>
          <p>Nothing matched {{ browseRangeLabel }} for this edge and layer{{ attackOnly ? ' with attack-sized on' : '' }}.</p>
        </div>

        <div v-else-if="!hasListed && !isListing" class="export-empty">
          <h4>Select an edge, then list logs</h4>
          <p>Hourly archives stay on the edge until you list and download them.</p>
        </div>
      </section>
    </template>

    <template v-else>
      <form class="dash-filterbar export-filterbar" @submit.prevent="handleExport">
        <div class="dash-filter-field">
          <label for="export-server">Edge</label>
          <select id="export-server" v-model="selectedServer" class="dash-select" :disabled="isLoadingMeta || isExporting">
            <option v-for="server in serverOptions" :key="server.value" :value="server.value">
              {{ server.label }}
            </option>
          </select>
        </div>
        <div class="dash-filter-field">
          <label for="export-site">Site</label>
          <select id="export-site" v-model="selectedSite" class="dash-select" :disabled="isLoadingMeta || isExporting">
            <option v-for="site in siteOptions" :key="site.value" :value="site.value">
              {{ site.label }}
            </option>
          </select>
        </div>
        <div class="dash-filter-field">
          <label for="export-type">Log type</label>
          <select id="export-type" v-model="logType" class="dash-select" :disabled="isExporting">
            <option value="access">Access logs (L7)</option>
            <option value="security">Refused HTTP (Athens)</option>
            <option value="all">Access + refused HTTP</option>
            <option value="error" disabled>Error logs (not available yet)</option>
          </select>
        </div>
        <div class="dash-filter-field">
          <label>Format</label>
          <div class="layer-segmented" role="radiogroup" aria-label="Export format">
            <button
              v-for="option in formatOptions"
              :key="option.value"
              type="button"
              class="layer-segmented__btn"
              :class="{ active: format === option.value }"
              :disabled="isExporting"
              @click="format = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="dash-filter-field dash-filter-field--grow">
          <label>Time range</label>
          <div class="dash-range-pills">
            <button
              v-for="range in timeRanges"
              :key="`query-${range.value}`"
              type="button"
              class="dash-range-pill"
              :class="{ active: selectedTimeRange === range.value && !isCustomRange }"
              :disabled="isExporting"
              @click="selectTimeRange(range.value)"
            >
              {{ range.label }}
            </button>
            <button
              type="button"
              class="dash-range-pill dash-range-pill--custom"
              :class="{ active: isCustomRange }"
              :disabled="isExporting"
              @click="openCustomDialog('query')"
            >
              Custom
            </button>
          </div>
        </div>
        <div class="dash-filter-summary">{{ rangeLabel }}</div>
        <button type="submit" class="dash-filter-apply" :disabled="!canExport || isExporting || isLoadingMeta">
          <span v-if="isExporting" class="dash-spinner dash-spinner--btn" aria-hidden="true"></span>
          {{ isExporting ? 'Preparing…' : 'Export' }}
        </button>
      </form>

      <p v-if="lastWarning" class="export-banner export-banner--warn" role="status">{{ lastWarning }}</p>

      <section class="dash-panel export-panel">
        <div class="export-panel__head">
          <div>
            <h3>Ready to export</h3>
            <p class="dash-panel-desc">Athens streams matching rows for the filters above.</p>
          </div>
        </div>
        <dl class="export-summary-inline">
          <div>
            <dt>Type</dt>
            <dd>{{ logTypeLabel }}</dd>
          </div>
          <div>
            <dt>Format</dt>
            <dd class="num">{{ format.toUpperCase() }}</dd>
          </div>
          <div>
            <dt>Scope</dt>
            <dd>{{ scopeLabel }}</dd>
          </div>
          <div>
            <dt>Range</dt>
            <dd>{{ rangeLabel }}</dd>
          </div>
        </dl>
      </section>
    </template>

    <div
      v-if="openFile"
      class="log-viewer-backdrop"
      @click.self="closeReader"
      @keydown.esc.prevent="closeReader"
    >
      <section class="log-viewer" role="dialog" aria-modal="true" aria-labelledby="log-viewer-title">
        <header class="log-viewer__head">
          <div class="log-viewer__title">
            <div class="log-viewer__title-row">
              <span class="layer-pill" :data-layer="openFile.layer">{{ openFile.layer.toUpperCase() }}</span>
              <h3 id="log-viewer-title">{{ openFile.hour || openFile.name }}</h3>
              <span v-if="openFile.attackHint" class="attack-badge">Likely attack</span>
            </div>
            <p class="log-viewer__meta mono">{{ openFile.path }}</p>
            <p class="log-viewer__meta">
              {{ openFile.sizeLabel }}
              <template v-if="readerTotal > 0"> · {{ readerTotal.toLocaleString() }} lines</template>
              <template v-if="openFile.kind"> · {{ openFile.kind }}</template>
            </p>
          </div>
          <div class="log-viewer__actions">
            <button
              type="button"
              class="ghost"
              :disabled="downloadingPath === openFile.path"
              @click="downloadLogFile(openFile)"
            >
              Download
            </button>
            <button type="button" class="ghost" @click="closeReader">Close</button>
          </div>
        </header>

        <div class="log-viewer__stats">
          <article class="viewer-stat">
            <span class="viewer-stat__label">Loaded</span>
            <span class="viewer-stat__value">{{ readerLines.length.toLocaleString() }}</span>
          </article>
          <article class="viewer-stat viewer-stat--danger">
            <span class="viewer-stat__label">{{ openFile.layer === 'l4' ? 'Attack signals' : 'Blocked' }}</span>
            <span class="viewer-stat__value">{{ viewerStats.danger.toLocaleString() }}</span>
          </article>
          <article class="viewer-stat viewer-stat--warn">
            <span class="viewer-stat__label">Warnings</span>
            <span class="viewer-stat__value">{{ viewerStats.warn.toLocaleString() }}</span>
          </article>
          <article class="viewer-stat">
            <span class="viewer-stat__label">Unique IPs</span>
            <span class="viewer-stat__value">{{ viewerStats.ips.toLocaleString() }}</span>
          </article>
        </div>

        <div class="log-viewer__toolbar">
          <input
            v-model="viewerQuery"
            type="search"
            class="viewer-search"
            placeholder="Filter lines (IP, host, path, SYN…)"
          />
          <div class="layer-segmented viewer-severity" role="radiogroup" aria-label="Severity filter">
            <button
              v-for="option in severityOptions"
              :key="option.value"
              type="button"
              class="layer-segmented__btn"
              :class="{ active: viewerSeverity === option.value }"
              @click="viewerSeverity = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <p v-if="readerError" class="log-viewer__error">{{ readerError }}</p>

        <div ref="readerEl" class="log-viewer__body" @scroll="onReaderScroll">
          <p v-if="!readerLines.length && readerLoading" class="log-viewer__empty">Loading log…</p>
          <p v-else-if="!readerLines.length && !readerLoading" class="log-viewer__empty">No lines in this file.</p>
          <p v-else-if="!visibleReaderRows.length" class="log-viewer__empty">No lines match the current filter.</p>
          <div
            v-for="row in visibleReaderRows"
            :key="row.index"
            class="log-viewer__row"
            :class="`lvl-${row.level}`"
          >
            <span class="log-viewer__lineno dim">{{ row.index + 1 }}</span>
            <span class="log-viewer__text">{{ row.text }}</span>
          </div>
          <p v-if="readerLines.length && readerLoading" class="log-viewer__more">Loading more…</p>
          <p v-else-if="readerLines.length && !readerHasMore" class="log-viewer__more">End of file</p>
        </div>
      </section>
    </div>

    <div v-if="showCustomDialog" class="dialog-overlay" @click.self="showCustomDialog = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Custom time range</h3>
          <button type="button" class="dialog-close" @click="showCustomDialog = false">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
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
          <p class="export-hint">Times are local. Maximum span is {{ maxDays }} days.</p>
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import AnalyticsGroupNav from '@/components/AnalyticsGroupNav.vue'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { notifyError, notifySuccess } from '@/utils/notify'
import {
  downloadEdgeLogFile,
  fetchEdgeLogFileContent,
  fetchEdgeLogFiles,
  requestLogExport,
} from '@/api/logExport'
import { fetchServers } from '@/api/servers'
import { fetchSites } from '@/api/sites'

const EXPORT_TITLE = 'Export & history'
const maxDays = 7
const maxRowsLabel = '100k'
const LARGE_DOWNLOAD_BYTES = 500 * 1024 * 1024

const mode = ref('browse')
const pad = (n) => String(n).padStart(2, '0')
const toLocalStamp = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const toIso = (value) => {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString()
}
const formatDisplay = (value) => {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value || '')
  return d.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resolvePresetWindow = (preset) => {
  const end = new Date()
  const start = new Date(end)
  switch (preset) {
    case '1h':
      start.setHours(start.getHours() - 1)
      break
    case '6h':
      start.setHours(start.getHours() - 6)
      break
    case '24h':
      start.setHours(start.getHours() - 24)
      break
    case 'today': {
      start.setHours(0, 0, 0, 0)
      break
    }
    case 'yesterday': {
      start.setDate(start.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() - 1)
      end.setHours(23, 59, 59, 999)
      break
    }
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    default:
      start.setHours(start.getHours() - 24)
  }
  return { start, end }
}

const timeRanges = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: '7d' },
]

const selectedTimeRange = ref('24h')
const isCustomRange = ref(false)
const showCustomDialog = ref(false)
const customDialogTarget = ref('browse')
const customStartDate = ref(null)
const customEndDate = ref(null)
const datePickerConfig = {
  enableTime: true,
  time_24hr: true,
  dateFormat: 'Y-m-d H:i',
  allowInput: true,
  maxDate: new Date(),
}

const initial = resolvePresetWindow('24h')
const rangeStart = ref(initial.start)
const rangeEnd = ref(initial.end)

const browseInitial = resolvePresetWindow('24h')
const browseTimeRange = ref('24h')
const browseIsCustom = ref(false)
const browseRangeStart = ref(browseInitial.start)
const browseRangeEnd = ref(browseInitial.end)

const logType = ref('access')
const format = ref('csv')
const selectedServer = ref('all')
const selectedSite = ref('all')
const servers = ref([])
const sites = ref([])
const isLoadingMeta = ref(false)
const isExporting = ref(false)
const lastWarning = ref('')

const browseServer = ref('')
const browseLayer = ref('all')
const layerOptions = [
  { value: 'all', label: 'L4 + L7' },
  { value: 'l4', label: 'L4' },
  { value: 'l7', label: 'L7' },
]
const logFiles = ref([])
const isListing = ref(false)
const hasListed = ref(false)
const listError = ref('')
const attackOnly = ref(false)
const downloadingPath = ref('')

const openFile = ref(null)
const readerLines = ref([])
const readerTotal = ref(0)
const readerOffset = ref(0)
const readerHasMore = ref(false)
const readerLoading = ref(false)
const readerError = ref('')
const readerEl = ref(null)
const viewerQuery = ref('')
const viewerSeverity = ref('all')
const severityOptions = [
  { value: 'all', label: 'All' },
  { value: 'signals', label: 'Signals' },
  { value: 'danger', label: 'Attack' },
]

const formatOptions = [
  { label: 'CSV', value: 'csv' },
  { label: 'JSON', value: 'json' },
  { label: 'TXT', value: 'txt' },
]

const serverOptions = computed(() => [
  { value: 'all', label: 'All edges' },
  ...servers.value.map((server) => ({
    value: String(server.id),
    label: server.name || server.ip || `edge-${server.id}`,
  })),
])

const browseServerOptions = computed(() => serverOptions.value.filter((s) => s.value !== 'all'))

const siteOptions = computed(() => {
  const serverId = selectedServer.value === 'all' ? null : Number(selectedServer.value)
  const filtered = sites.value.filter((site) => {
    if (!serverId) return true
    return Array.isArray(site.serverIds) && site.serverIds.some((id) => Number(id) === serverId)
  })
  return [
    { value: 'all', label: 'All sites' },
    ...filtered.map((site) => ({
      value: String(site.id),
      label: site.domain || `site-${site.id}`,
    })),
  ]
})

const logTypeLabel = computed(() => {
  const map = {
    access: 'Access',
    error: 'Error',
    security: 'Refused HTTP',
    all: 'Access + refused HTTP',
  }
  return map[logType.value] || logType.value
})

const rangeMs = computed(() => {
  const start = rangeStart.value?.getTime?.() ?? NaN
  const end = rangeEnd.value?.getTime?.() ?? NaN
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0
  return end - start
})

const canExport = computed(() => (
  logType.value !== 'error'
  && rangeStart.value
  && rangeEnd.value
  && rangeMs.value >= 0
  && rangeMs.value <= maxDays * 24 * 3600000
))

const rangeLabel = computed(() => {
  if (!rangeStart.value || !rangeEnd.value) return '—'
  return `${formatDisplay(rangeStart.value)} → ${formatDisplay(rangeEnd.value)}`
})

const browseRangeLabel = computed(() => {
  if (!browseRangeStart.value || !browseRangeEnd.value) return '—'
  return `${formatDisplay(browseRangeStart.value)} → ${formatDisplay(browseRangeEnd.value)}`
})

const rangeHint = computed(() => {
  if (!rangeStart.value || !rangeEnd.value) return 'Select a time range'
  if (rangeEnd.value < rangeStart.value) return 'Start must be on or before end'
  const hours = rangeMs.value / 3600000
  if (hours > maxDays * 24) return `Max ${maxDays} days`
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min · ready`
  if (hours < 48) return `${hours.toFixed(hours >= 10 ? 0 : 1)} h · ready`
  return `${(hours / 24).toFixed(1)} days · ready`
})

const scopeLabel = computed(() => {
  const server = serverOptions.value.find((item) => item.value === selectedServer.value)?.label || 'All edges'
  const site = siteOptions.value.find((item) => item.value === selectedSite.value)?.label || 'All sites'
  return `${server} · ${site}`
})

const parseHourBucket = (hour) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})$/.exec(String(hour || ''))
  if (!match) return null
  const start = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    0,
    0,
    0,
  )
  if (Number.isNaN(start.getTime())) return null
  return { start, end: new Date(start.getTime() + 3600000) }
}

const fileOverlapsBrowseRange = (file) => {
  const rangeStartMs = browseRangeStart.value?.getTime?.() ?? NaN
  const rangeEndMs = browseRangeEnd.value?.getTime?.() ?? NaN
  if (!Number.isFinite(rangeStartMs) || !Number.isFinite(rangeEndMs)) return true

  const bucket = parseHourBucket(file.hour)
  if (bucket) {
    return bucket.end.getTime() > rangeStartMs && bucket.start.getTime() < rangeEndMs
  }
  if (file.modTime) {
    const mod = new Date(file.modTime).getTime()
    if (Number.isFinite(mod)) return mod >= rangeStartMs && mod <= rangeEndMs
  }
  // Keep undated attack/latest files visible when browsing.
  return file.kind === 'attack' || file.kind === 'latest'
}

const filteredFiles = computed(() => {
  let rows = Array.isArray(logFiles.value) ? logFiles.value : []
  rows = rows.filter(fileOverlapsBrowseRange)
  if (attackOnly.value) rows = rows.filter((f) => f.attackHint)
  return rows
})

const browseKpis = computed(() => {
  const rows = filteredFiles.value
  const attackCount = rows.filter((f) => f.attackHint).length
  const totalBytes = rows.reduce((sum, f) => {
    const bytes = Number(f.sizeBytes ?? f.size) || 0
    return sum + bytes
  }, 0)
  return {
    files: rows.length,
    attackCount,
    totalBytes,
  }
})

const formatBrowseBytes = (value) => {
  const n = Number(value) || 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n >= 10 * 1024 ? 0 : 1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(n >= 10 * 1024 * 1024 ? 0 : 1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const shortPath = (path) => {
  const raw = String(path || '')
  if (raw.includes('/sparta/logs/')) return raw.slice(raw.indexOf('/sparta/logs/'))
  if (raw.includes('/athens/nginx/logs/')) return raw.slice(raw.indexOf('/athens/nginx/logs/'))
  return raw
}

const classifyLine = (text, layer) => {
  const raw = String(text || '')
  const lower = raw.toLowerCase()
  if (layer === 'l4') {
    if (/\b(attack|drop|block|flood|stomp|blacklist|deny)\b/i.test(raw)) return 'danger'
    if (/\b(SYN|ACK|UDP|ICMP|PSH|RST|GRE)\b/.test(raw) && /\b\d{3,}\b/.test(raw)) return 'warn'
    if (/\bDEBUG\b/.test(raw)) return 'muted'
    if (/\b(NOTICE|ALERT|WARN)\b/i.test(raw)) return 'warn'
    return 'normal'
  }
  try {
    const obj = JSON.parse(raw)
    if (obj.blocked === true || obj.blocked === 'true' || String(obj.action || '').toLowerCase() === 'block') {
      return 'danger'
    }
    const status = Number(obj.status)
    if (Number.isFinite(status) && status >= 500) return 'warn'
    if (Number.isFinite(status) && status >= 400) return 'notice'
  } catch {
    /* plain text */
  }
  if (/\b(blocked|deny|waf|attack)\b/i.test(lower)) return 'danger'
  return 'normal'
}

const extractIp = (text) => {
  const match = /\b(?:\d{1,3}\.){3}\d{1,3}\b/.exec(String(text || ''))
  return match?.[0] || ''
}

const classifiedRows = computed(() => {
  const layer = openFile.value?.layer || 'l7'
  return readerLines.value.map((text, index) => ({
    index,
    text,
    level: classifyLine(text, layer),
    ip: extractIp(text),
  }))
})

const viewerStats = computed(() => {
  const ips = new Set()
  let danger = 0
  let warn = 0
  for (const row of classifiedRows.value) {
    if (row.level === 'danger') danger += 1
    if (row.level === 'warn' || row.level === 'notice') warn += 1
    if (row.ip) ips.add(row.ip)
  }
  return { danger, warn, ips: ips.size }
})

const visibleReaderRows = computed(() => {
  const q = viewerQuery.value.trim().toLowerCase()
  return classifiedRows.value.filter((row) => {
    if (viewerSeverity.value === 'danger' && row.level !== 'danger') return false
    if (viewerSeverity.value === 'signals' && row.level !== 'danger' && row.level !== 'warn' && row.level !== 'notice') {
      return false
    }
    if (!q) return true
    return row.text.toLowerCase().includes(q)
  })
})

const selectTimeRange = (value) => {
  selectedTimeRange.value = value
  isCustomRange.value = false
  const { start, end } = resolvePresetWindow(value)
  rangeStart.value = start
  rangeEnd.value = end
}

const selectBrowseTimeRange = (value) => {
  browseTimeRange.value = value
  browseIsCustom.value = false
  const { start, end } = resolvePresetWindow(value)
  browseRangeStart.value = start
  browseRangeEnd.value = end
}

const openCustomDialog = (target) => {
  customDialogTarget.value = target
  const start = target === 'browse' ? browseRangeStart.value : rangeStart.value
  const end = target === 'browse' ? browseRangeEnd.value : rangeEnd.value
  customStartDate.value = toLocalStamp(start || new Date())
  customEndDate.value = toLocalStamp(end || new Date())
  showCustomDialog.value = true
}

const applyCustomRange = () => {
  if (!customStartDate.value || !customEndDate.value) {
    notifyError(EXPORT_TITLE, 'Select both a start and end time.')
    return
  }
  const start = new Date(customStartDate.value)
  const end = new Date(customEndDate.value)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    notifyError(EXPORT_TITLE, 'Invalid date or time.')
    return
  }
  if (end < start) {
    notifyError(EXPORT_TITLE, 'Start must be on or before end.')
    return
  }
  if (end - start > maxDays * 24 * 3600000) {
    notifyError(EXPORT_TITLE, `Date range cannot exceed ${maxDays} days.`)
    return
  }
  if (customDialogTarget.value === 'browse') {
    browseRangeStart.value = start
    browseRangeEnd.value = end
    browseIsCustom.value = true
  } else {
    rangeStart.value = start
    rangeEnd.value = end
    isCustomRange.value = true
  }
  showCustomDialog.value = false
}

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const loadMeta = async () => {
  isLoadingMeta.value = true
  try {
    const [serverList, siteList] = await Promise.all([fetchServers(), fetchSites()])
    servers.value = Array.isArray(serverList) ? serverList : []
    sites.value = Array.isArray(siteList) ? siteList : []
    if (!browseServer.value && browseServerOptions.value.length) {
      browseServer.value = browseServerOptions.value[0].value
    }
  } catch (error) {
    notifyError(EXPORT_TITLE, error?.message || 'Could not load edges and sites.')
  } finally {
    isLoadingMeta.value = false
  }
}

const loadLogFiles = async () => {
  if (!browseServer.value) {
    notifyError(EXPORT_TITLE, 'Select an edge server.')
    return
  }
  isListing.value = true
  listError.value = ''
  hasListed.value = true
  closeReader()
  try {
    const data = await fetchEdgeLogFiles({
      serverId: Number(browseServer.value),
      layer: browseLayer.value,
    })
    logFiles.value = Array.isArray(data?.files) ? data.files : []
  } catch (error) {
    logFiles.value = []
    listError.value = error?.message || 'Could not list edge log files.'
    notifyError(EXPORT_TITLE, listError.value)
  } finally {
    isListing.value = false
  }
}

const closeReader = () => {
  openFile.value = null
  readerLines.value = []
  readerTotal.value = 0
  readerOffset.value = 0
  readerHasMore.value = false
  readerError.value = ''
  readerLoading.value = false
  viewerQuery.value = ''
  viewerSeverity.value = 'all'
  document.body.style.overflow = ''
}

const openLogFile = async (file) => {
  openFile.value = file
  readerLines.value = []
  readerTotal.value = 0
  readerOffset.value = 0
  readerHasMore.value = true
  readerError.value = ''
  viewerQuery.value = ''
  viewerSeverity.value = file.attackHint ? 'signals' : 'all'
  document.body.style.overflow = 'hidden'
  await nextTick()
  await loadReaderPage(false)
}

const loadReaderPage = async (append) => {
  if (!openFile.value || !browseServer.value || readerLoading.value) return
  if (append && !readerHasMore.value) return
  readerLoading.value = true
  readerError.value = ''
  try {
    const data = await fetchEdgeLogFileContent({
      serverId: Number(browseServer.value),
      path: openFile.value.path,
      offset: append ? readerOffset.value : 0,
      limit: 200,
      skipTotal: append && readerTotal.value > 0,
    })
    if (data?.error) readerError.value = data.error
    const lines = Array.isArray(data?.lines) ? data.lines : []
    if (append) readerLines.value = readerLines.value.concat(lines)
    else readerLines.value = lines
    if (Number.isFinite(data?.total) && data.total > 0) readerTotal.value = data.total
    readerOffset.value = Number.isFinite(data?.next) ? data.next : readerLines.value.length
    readerHasMore.value = Boolean(data?.hasMore)
  } catch (error) {
    readerError.value = error?.message || 'Could not read log file.'
  } finally {
    readerLoading.value = false
  }
}

const onReaderScroll = (event) => {
  const el = event?.target
  if (!el || readerLoading.value || !readerHasMore.value) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
    loadReaderPage(true)
  }
}

const downloadLogFile = async (file) => {
  if (!browseServer.value || !file?.path) return
  if (file.sizeBytes >= LARGE_DOWNLOAD_BYTES) {
    const ok = window.confirm(
      `${file.name} is ${file.sizeLabel}. Large downloads can take a long time and fill disk. Continue?`,
    )
    if (!ok) return
  }
  downloadingPath.value = file.path
  try {
    const data = await downloadEdgeLogFile({
      serverId: Number(browseServer.value),
      path: file.path,
      fileName: file.name,
    })
    downloadBlob(data.blob, data.fileName)
    notifySuccess(EXPORT_TITLE, `Downloaded ${data.fileName}`)
  } catch (error) {
    notifyError(EXPORT_TITLE, error?.message || 'Download failed.')
  } finally {
    downloadingPath.value = ''
  }
}

const onKeydown = (event) => {
  if (event.key === 'Escape' && openFile.value) closeReader()
}

watch(selectedServer, () => {
  if (selectedSite.value === 'all') return
  const stillVisible = siteOptions.value.some((site) => site.value === selectedSite.value)
  if (!stillVisible) selectedSite.value = 'all'
})

watch([browseServer, browseLayer], () => {
  if (!hasListed.value) return
  logFiles.value = []
  hasListed.value = false
  listError.value = ''
})

const handleExport = async () => {
  lastWarning.value = ''
  if (!canExport.value) {
    notifyError(EXPORT_TITLE, rangeHint.value || 'Select a valid time range.')
    return
  }

  isExporting.value = true
  try {
    const payload = {
      start: toIso(rangeStart.value),
      end: toIso(rangeEnd.value),
      type: logType.value,
      format: format.value,
    }
    if (selectedServer.value !== 'all') payload.serverId = Number(selectedServer.value)
    if (selectedSite.value !== 'all') payload.siteId = Number(selectedSite.value)

    const data = await requestLogExport(payload)
    if (data?.blob) {
      downloadBlob(data.blob, data.fileName)
      const rowLabel = Number.isFinite(data.rows) ? `${data.rows.toLocaleString()} rows` : 'file'
      notifySuccess(EXPORT_TITLE, `Downloaded ${format.value.toUpperCase()} (${rowLabel}).`)
      if (data.warnings) lastWarning.value = data.warnings
    } else {
      notifyError(EXPORT_TITLE, 'Export returned an empty response.')
    }
  } catch (error) {
    notifyError(EXPORT_TITLE, error?.message || 'Export could not be started.')
  } finally {
    isExporting.value = false
  }
}

onMounted(() => {
  loadMeta()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.log-export-view {
  max-width: 1680px;
  margin: 0 auto;
}

.export-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
  margin: 0 0 12px;
}

.export-segment {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
}

.export-segment__btn {
  height: 34px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--app-text-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.export-segment__btn.active {
  color: var(--app-heading, var(--app-text));
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 14%, var(--app-surface-muted));
  box-shadow: inset 0 0 0 0.5px color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 35%, transparent);
}

.export-toolbar__hint {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-muted);
}

.export-filterbar {
  margin-bottom: 12px;
  align-items: flex-end;
}

.dash-filter-field--grow {
  flex: 1 1 220px;
  min-width: 180px;
}

.export-toggle {
  align-self: flex-end;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.export-toggle.active {
  color: var(--dorian-warn, #c48a00);
  border-color: color-mix(in srgb, var(--dorian-warn, #c48a00) 40%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-warn, #c48a00) 12%, var(--app-surface));
}

.export-toggle:disabled {
  opacity: 0.55;
  cursor: default;
}

.export-banner {
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  font-size: 13px;
  line-height: 1.4;
}

.export-banner--warn {
  color: var(--dorian-warn, #c48a00);
  border-color: color-mix(in srgb, var(--dorian-warn, #c48a00) 35%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-warn, #c48a00) 8%, var(--app-surface));
}

.export-panel {
  grid-column: span 12;
  padding: 0;
  overflow: hidden;
}

.export-panel__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 20px;
  padding: 16px 18px 14px;
  border-bottom: 0.5px solid var(--app-border);
}

.export-panel__head h3 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 650;
}

.export-meta {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.export-meta__item {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted, transparent);
  font-size: 12px;
  color: var(--app-text-muted);
}

.export-meta__item strong {
  font-size: 13px;
  font-weight: 650;
  color: var(--app-heading, var(--app-text));
  font-variant-numeric: tabular-nums;
}

.export-meta__item--warn {
  border-color: color-mix(in srgb, var(--dorian-warn, #c48a00) 35%, var(--app-border));
  color: color-mix(in srgb, var(--dorian-warn, #c48a00) 80%, var(--app-text-muted));
}

.export-meta__item--warn strong {
  color: var(--dorian-warn, #c48a00);
}

.export-empty {
  padding: 56px 24px;
  text-align: center;
}

.export-empty h4 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text);
}

.export-empty p {
  margin: 0 auto;
  max-width: 34rem;
  font-size: 13px;
  line-height: 1.45;
  color: var(--app-text-muted);
}

.layer-segmented {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: 9px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
}

.layer-segmented__btn {
  height: 30px;
  padding: 0 11px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--app-text-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.layer-segmented__btn.active {
  color: var(--app-heading, var(--app-text));
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 12%, var(--app-surface-muted));
  box-shadow: inset 0 0 0 0.5px color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 35%, transparent);
}

.layer-segmented__btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.log-table-wrap {
  overflow: auto;
  max-height: min(70vh, 820px);
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  font-size: 13px;
}

.log-table th,
.log-table td {
  padding: 12px 16px;
  border-bottom: 0.5px solid var(--app-border);
  text-align: left;
  vertical-align: middle;
}

.log-table th {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  background: var(--app-surface);
  position: sticky;
  top: 0;
  z-index: 1;
}

.log-table tbody tr:last-child td {
  border-bottom: 0;
}

.log-table tbody tr:hover td {
  background: color-mix(in srgb, var(--app-surface-muted, var(--app-surface)) 65%, transparent);
}

.log-table .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.log-table tr.is-attack td {
  background: color-mix(in srgb, var(--dorian-warn, #c48a00) 7%, transparent);
}

.log-table tr.is-attack:hover td {
  background: color-mix(in srgb, var(--dorian-warn, #c48a00) 11%, transparent);
}

.layer-pill {
  display: inline-flex;
  min-width: 2.2rem;
  justify-content: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
}

.layer-pill[data-layer='l4'] {
  color: #6ea8ff;
  background: color-mix(in srgb, #6ea8ff 14%, transparent);
}

.layer-pill[data-layer='l7'] {
  color: var(--dorian-viper-400, #3ecf8e);
  background: color-mix(in srgb, var(--dorian-viper-500, #3ecf8e) 14%, transparent);
}

.hour-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.hour-cell strong {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.attack-badge {
  display: inline-flex;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dorian-warn, #c48a00);
  background: color-mix(in srgb, var(--dorian-warn, #c48a00) 12%, transparent);
}

.kind-cell {
  color: var(--app-text-muted);
  font-size: 12px;
  text-transform: lowercase;
}

.muted,
.mono {
  color: var(--app-text-muted);
  font-size: 12px;
}

.mono {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  word-break: break-all;
}

.path-cell {
  max-width: 26rem;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  color: var(--app-text-muted);
  word-break: break-all;
}

.actions-head,
.actions-cell {
  width: 1%;
  text-align: right;
  white-space: nowrap;
}

.actions-cell__inner {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.table-link {
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--app-text-secondary, var(--app-text-muted));
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.table-link:hover:not(:disabled) {
  color: var(--app-heading, var(--app-text));
}

.table-link--accent {
  color: var(--dorian-viper-400, var(--app-accent));
}

.table-link--accent:hover:not(:disabled) {
  color: var(--dorian-viper-300, var(--dorian-viper-400, var(--app-accent)));
}

.table-link:disabled {
  opacity: 0.5;
  cursor: default;
}

.log-viewer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: color-mix(in srgb, var(--app-overlay, rgba(0, 0, 0, 0.45)) 88%, transparent);
}

.log-viewer {
  display: flex;
  flex-direction: column;
  width: min(1280px, calc(100vw - 40px));
  height: min(860px, calc(100vh - 40px));
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-bg, var(--app-surface));
  box-shadow: 0 18px 48px color-mix(in srgb, #000 35%, transparent);
}

.log-viewer__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--app-border);
}

.log-viewer__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.log-viewer__title-row h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
}

.log-viewer__meta {
  margin: 4px 0 0;
  color: var(--app-text-muted);
  font-size: 12px;
}

.log-viewer__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.log-viewer__actions .ghost {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-muted, transparent);
  color: var(--app-text-secondary, var(--app-text));
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.log-viewer__actions .ghost:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.log-viewer__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface-muted, transparent) 65%, transparent);
}

.viewer-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
}

.viewer-stat__label {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.viewer-stat__value {
  font-size: 18px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.viewer-stat--danger .viewer-stat__value {
  color: var(--dorian-danger, #e85d5d);
}

.viewer-stat--warn .viewer-stat__value {
  color: var(--dorian-warn, #c48a00);
}

.log-viewer__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid var(--app-border);
}

.viewer-search {
  flex: 1 1 240px;
  min-width: 180px;
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-input-bg, var(--app-surface));
  color: var(--app-text);
  font: inherit;
  font-size: 13px;
}

.log-viewer__error {
  margin: 0;
  padding: 10px 18px;
  color: var(--dorian-danger);
  border-bottom: 1px solid var(--app-border);
  font-size: 13px;
}

.log-viewer__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px 0 14px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  line-height: 1.4;
  background: color-mix(in srgb, #000 22%, var(--app-surface));
}

.log-viewer__row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 10px;
  padding: 2px 16px;
  white-space: pre-wrap;
  word-break: break-word;
}

.log-viewer__row:hover {
  background: color-mix(in srgb, var(--app-accent, #3fbd85) 6%, transparent);
}

.log-viewer__lineno {
  text-align: right;
  user-select: none;
}

.log-viewer__row .dim {
  color: var(--app-text-muted);
}

.log-viewer__text {
  color: var(--app-text-secondary, var(--app-text));
}

.log-viewer__row.lvl-danger .log-viewer__text {
  color: var(--dorian-danger, #e85d5d);
}

.log-viewer__row.lvl-warn .log-viewer__text,
.log-viewer__row.lvl-notice .log-viewer__text {
  color: var(--dorian-warn, #c48a00);
}

.log-viewer__row.lvl-muted .log-viewer__text {
  color: var(--app-text-muted);
}

.log-viewer__empty,
.log-viewer__more {
  margin: 12px 18px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.export-hint {
  margin: 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.dash-select,
.dialog-input {
  background: var(--app-input-bg);
  border: 0.5px solid var(--app-border-strong);
  color: var(--app-text);
  font-size: var(--type-caption);
  padding: 8px 10px;
  border-radius: 6px;
  width: 100%;
}

.export-summary-inline {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
}

.export-summary-inline > div {
  padding: 16px 18px 18px;
  border-right: 0.5px solid var(--app-border);
  min-width: 0;
}

.export-summary-inline > div:last-child {
  border-right: 0;
}

.export-summary-inline dt {
  margin: 0 0 6px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.export-summary-inline dd {
  margin: 0;
  font-size: 14px;
  font-weight: 550;
  color: var(--app-text);
  word-break: break-word;
  line-height: 1.4;
}

.export-summary-inline .num {
  font-variant-numeric: tabular-nums;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 95;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--app-overlay, rgba(0, 0, 0, 0.45));
}

.dialog-content {
  width: min(420px, 100%);
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-bg, var(--app-surface));
  box-shadow: 0 18px 48px color-mix(in srgb, #000 35%, transparent);
}

.dialog-header,
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.dialog-header {
  border-bottom: 1px solid var(--app-border);
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
}

.dialog-close {
  border: 0;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.dialog-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-form-group label {
  font-size: 12px;
  color: var(--app-text-muted);
}

.dialog-footer {
  border-top: 1px solid var(--app-border);
  justify-content: flex-end;
}

.dialog-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted, transparent);
  color: var(--app-text);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.dialog-btn.apply-btn {
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 40%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 14%, var(--app-surface));
  color: var(--dorian-viper-400, var(--app-accent));
}

@media (max-width: 1100px) {
  .log-viewer__stats {
    grid-template-columns: 1fr 1fr;
  }

  .export-summary-inline {
    grid-template-columns: 1fr 1fr;
  }

  .export-summary-inline > div:nth-child(2) {
    border-right: 0;
  }

  .export-summary-inline > div:nth-child(1),
  .export-summary-inline > div:nth-child(2) {
    border-bottom: 0.5px solid var(--app-border);
  }
}

@media (max-width: 720px) {
  .log-viewer__stats,
  .export-summary-inline {
    grid-template-columns: 1fr;
  }

  .export-summary-inline > div {
    border-right: 0;
    border-bottom: 0.5px solid var(--app-border);
  }

  .export-summary-inline > div:last-child {
    border-bottom: 0;
  }

  .actions-cell__inner {
    gap: 10px;
  }
}
</style>
