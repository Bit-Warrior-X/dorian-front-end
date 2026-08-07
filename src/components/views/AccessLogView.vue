<template>
  <div class="dashboard-view access-log-view">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>Access log</h2>
        <p>Live edge request stream with status breakdown and export.</p>
      </div>
      <div class="dash-topbar__right">
        <div class="status-indicator" :class="statusClass">
          <span class="status-dot" aria-hidden="true"></span>
          <span>{{ status }}</span>
        </div>
        <AppTopbarActions />
      </div>
    </header>

    <div class="dash-filterbar">
      <div class="dash-filter-field">
        <label for="access-server">Server</label>
        <select id="access-server" v-model="selectedServer" class="dash-select">
          <option v-for="server in serverOptions" :key="server.value" :value="server.value">
            {{ server.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label for="access-site">Site</label>
        <select id="access-site" v-model="selectedSite" class="dash-select">
          <option v-for="site in siteOptions" :key="site.value" :value="site.value">
            {{ site.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field dash-filter-field--grow">
        <label for="access-search">Search</label>
        <input
          id="access-search"
          v-model="searchQuery"
          type="text"
          class="dash-input"
          placeholder="Host, path, IP…"
        />
      </div>
      <div class="dash-filter-field">
        <label for="access-status">Status</label>
        <input
          id="access-status"
          v-model="statusFilter"
          type="text"
          class="dash-input dash-input--sm"
          placeholder="200, 4xx…"
        />
      </div>
      <div class="dash-filter-field">
        <label for="access-lines">Lines</label>
        <select id="access-lines" v-model="linesLimit" class="dash-select">
          <option value="100">100</option>
          <option value="200">200</option>
          <option value="1000">1000</option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label>Time range</label>
        <div class="dash-range-pills">
          <button
            v-for="time in timeRanges"
            :key="time.value"
            type="button"
            class="dash-range-pill"
            :class="{ active: selectedTimeRange === time.value && !isCustomRange }"
            @click="selectTimeRange(time.value)"
          >
            {{ time.label }}
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
        {{ timeRangeLabel }}
      </div>
      <div class="filter-actions">
        <button
          type="button"
          class="dash-filter-apply dash-filter-apply--ghost"
          :class="{ paused: isPaused }"
          @click="togglePause"
        >
          {{ isPaused ? 'Resume' : 'Pause' }}
        </button>
        <button type="button" class="dash-filter-apply" @click="exportCsv">
          Export
        </button>
      </div>
    </div>

    <section class="dash-grid12 access-log-grid">
      <div class="dash-panel c-12 log-panel">
        <div class="dash-panel-head">
          <div>
            <h3>Live stream</h3>
            <p class="dash-panel-desc">Newest entries first · {{ visibleLogs.length }} shown</p>
          </div>
        </div>
        <div class="log-table-container">
          <table class="log-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>IP address</th>
                <th>Method</th>
                <th>URL</th>
                <th>Status</th>
                <th>Response time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in visibleLogs" :key="entry.id">
                <td class="num">{{ entry.timestampLabel }}</td>
                <td class="num">{{ entry.ipAddress }}</td>
                <td>
                  <span :class="['badge', entry.methodClass]">{{ entry.method }}</span>
                </td>
                <td class="url-cell" :title="entry.url">{{ entry.url }}</td>
                <td>
                  <span :class="['badge', entry.statusClass]">{{ entry.status }}</span>
                </td>
                <td class="num">{{ entry.responseTime }}</td>
              </tr>
              <tr v-if="!visibleLogs.length">
                <td colspan="6" class="empty-row">No log entries yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="access-stats">
      <article
        v-for="metric in metricCards"
        :key="metric.label"
        class="access-stat-card"
        :class="`access-stat-card--${metric.tone}`"
      >
        <div class="access-stat-label">{{ metric.label }}</div>
        <div class="access-stat-value num">{{ metric.value }}</div>
      </article>
    </section>

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
            <input v-model="customStartDate" type="datetime-local" class="dialog-input" />
          </div>
          <div class="dialog-form-group">
            <label>End date &amp; time</label>
            <input v-model="customEndDate" type="datetime-local" class="dialog-input" />
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { fetchServers } from '@/api/servers'
import { fetchSites } from '@/api/sites'
import { resolveApiBaseUrl } from '@/api/client'
import { notifyError } from '@/utils/notify'

const ACCESS_LOG_TITLE = 'Access Log'
const searchQuery = ref('')
const selectedTimeRange = ref('1h')
const statusFilter = ref('')
const linesLimit = ref('100')
const isPaused = ref(false)
const status = ref('No Data')
const showCustomDialog = ref(false)
const isCustomRange = ref(false)
const customStartDate = ref('')
const customEndDate = ref('')
const selectedServer = ref('')
const selectedSite = ref('all')
const serverList = ref([])
const sites = ref([])
const logs = ref([])
const wsRef = ref(null)
const wsToken = ref(0)

const timeRanges = [
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '6h', value: '6h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
]

const serverOptions = computed(() => {
  let list = serverList.value
  if (selectedSite.value !== 'all') {
    const site = sites.value.find((item) => String(item.id) === selectedSite.value)
    const allowed = new Set((site?.serverIds || []).map((id) => Number(id)))
    list = list.filter((server) => allowed.has(Number(server.id)))
  }
  return [
    { label: 'Select Server', value: '' },
    ...list.map((server) => ({
      label: server.name || `Server ${server.id}`,
      value: String(server.id),
    })),
  ]
})

const siteOptions = computed(() => [
  { label: 'All Sites', value: 'all' },
  ...sites.value.map((site) => ({
    label: site.domain || `Site ${site.id}`,
    value: String(site.id),
  })),
])

const statusClass = computed(() => {
  const statusLower = status.value.toLowerCase()
  if (statusLower === 'live') return 'status-live'
  if (statusLower === 'paused') return 'status-paused'
  if (statusLower === 'connecting') return 'status-connecting'
  if (statusLower === 'disconnected' || statusLower === 'error' || statusLower === 'no data') {
    return 'status-idle'
  }
  return ''
})

const timeRangeLabel = computed(() => {
  if (isCustomRange.value && customStartDate.value && customEndDate.value) {
    return `${customStartDate.value.replace('T', ' ')} → ${customEndDate.value.replace('T', ' ')}`
  }
  const found = timeRanges.find((range) => range.value === selectedTimeRange.value)
  return found ? found.label : 'All'
})

const formatNumber = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return numeric.toLocaleString()
}

const metricCards = computed(() => [
  { label: 'Lines loaded', value: formatNumber(stats.value.total), tone: 'total' },
  { label: '2xx responses', value: formatNumber(stats.value.success), tone: 'ok' },
  { label: '3xx responses', value: formatNumber(stats.value.redirect), tone: 'info' },
  { label: '4xx errors', value: formatNumber(stats.value.clientError), tone: 'warn' },
  { label: '5xx errors', value: formatNumber(stats.value.serverError), tone: 'danger' },
])

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

const togglePause = () => {
  isPaused.value = !isPaused.value
  status.value = isPaused.value ? 'Paused' : 'Live'
}

const getWsBaseUrl = async () => {
  const base = await resolveApiBaseUrl()
  const parsed = new URL(base, window.location.origin)
  parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
  return parsed.origin
}

const disconnectStream = () => {
  if (wsRef.value) {
    wsRef.value.close()
    wsRef.value = null
  }
  wsToken.value += 1
}

const connectStream = async () => {
  disconnectStream()
  logs.value = []
  const serverId = Number(selectedServer.value)
  if (!serverId) {
    status.value = 'No Data'
    return
  }

  status.value = 'Connecting'
  try {
    const baseUrl = await getWsBaseUrl()
    const wsUrl = new URL(`${baseUrl}/servers/${serverId}/access-log/stream`)
    wsUrl.searchParams.set('lines', linesLimit.value)
    const socket = new WebSocket(wsUrl.toString())
    const token = wsToken.value + 1
    wsToken.value = token
    wsRef.value = socket

    socket.onopen = () => {
      if (wsToken.value !== token) return
      status.value = isPaused.value ? 'Paused' : 'Live'
    }

    socket.onmessage = (event) => {
      if (wsToken.value !== token) return
      let payload = null
      try {
        payload = JSON.parse(event.data)
      } catch {
        payload = { line: event.data }
      }
      const err = payload?.Error ?? payload?.error
      const msg = payload?.Message ?? payload?.message
      if (err || msg) {
        status.value = 'Error'
        notifyError(ACCESS_LOG_TITLE, msg || err || 'The access log stream could not be started.')
        if (wsRef.value) {
          wsRef.value.close()
          wsRef.value = null
        }
        return
      }
      if (isPaused.value) return
      if (payload?.line) {
        appendLogLine(payload.line)
      }
    }

    socket.onerror = () => {
      if (wsToken.value !== token) return
      status.value = 'Error'
      notifyError(ACCESS_LOG_TITLE, 'The access log stream could not be connected.')
    }

    socket.onclose = () => {
      if (wsToken.value !== token) return
      if (status.value !== 'Paused') {
        status.value = 'Disconnected'
      }
    }
  } catch (error) {
    status.value = 'Error'
    notifyError(ACCESS_LOG_TITLE, error?.message || 'The access log stream could not be connected.')
  }
}

const appendLogLine = (line) => {
  const parsed = parseLogLine(line)
  logs.value.push(parsed)

  const limit = Number(linesLimit.value) || 100
  const maxBuffer = Math.max(500, limit * 2)
  if (logs.value.length > maxBuffer) {
    logs.value.splice(0, logs.value.length - maxBuffer)
  }
}

const parseLogLine = (line) => {
  const parsed = parseNginxLine(line)
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  if (!parsed) {
    return {
      id,
      rawLine: line,
      timestamp: new Date(),
      timestampLabel: new Date().toLocaleString(),
      ipAddress: '-',
      method: '-',
      methodClass: '',
      url: line,
      status: '-',
      statusClass: '',
      responseTime: '-',
    }
  }

  const statusValue = parsed.status || '-'
  const responseTimeLabel = parsed.responseTime ? `${parsed.responseTime}ms` : '-'
  return {
    id,
    rawLine: line,
    timestamp: parsed.timestamp || new Date(),
    timestampLabel: parsed.timestampLabel || '-',
    ipAddress: parsed.ipAddress || '-',
    method: parsed.method || '-',
    methodClass: parsed.method ? `method-${parsed.method.toLowerCase()}` : '',
    url: parsed.url || '-',
    status: statusValue,
    statusClass: parsed.status ? statusBadgeClass(parsed.status) : '',
    responseTime: responseTimeLabel,
  }
}

const statusBadgeClass = (code) => {
  const numeric = Number(code)
  if (!Number.isFinite(numeric)) return ''
  if (numeric >= 500) return 'status-5xx'
  if (numeric >= 400) return 'status-4xx'
  if (numeric >= 300) return 'status-3xx'
  if (numeric >= 200) return 'status-2xx'
  return ''
}

const parseNginxLine = (line) => {
  const combined = /^(\S+) \S+ \S+ \[([^\]]+)\] "((?:\\.|[^"\\])*)" (\d{3})(?: \S+)?/
  const match = line.match(combined)
  if (!match) return null

  const [, ipAddress, timeLocal, request, statusCode] = match
  const timestamp = parseNginxTime(timeLocal)
  const { method, url } = parseNginxRequest(request)

  return {
    ipAddress,
    method,
    url,
    status: statusCode,
    responseTime: null,
    timestamp,
    timestampLabel: timestamp ? timestamp.toLocaleString() : timeLocal,
  }
}

const parseNginxRequest = (request) => {
  const raw = String(request ?? '')
  if (!raw.trim()) {
    return { method: '-', url: '-' }
  }

  const httpMatch = raw.match(/^(\S+)\s+(\S+)\s+HTTP\/[\d.]+$/i)
  if (httpMatch) {
    return { method: httpMatch[1], url: httpMatch[2] }
  }

  if (/^\\x16\\x03\\x01/i.test(raw)) {
    return { method: 'TLS', url: raw }
  }

  return { method: 'RAW', url: raw }
}

const parseNginxTime = (value) => {
  const match = value.match(
    /(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})/,
  )
  if (!match) return null
  const [, day, month, year, hour, minute, second, tz] = match
  const monthIndex = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ].indexOf(month)
  if (monthIndex < 0) return null
  const offsetSign = tz.startsWith('-') ? -1 : 1
  const offsetHours = Number(tz.slice(1, 3))
  const offsetMinutes = Number(tz.slice(3, 5))
  const offsetMs = offsetSign * (offsetHours * 60 + offsetMinutes) * 60 * 1000
  const utc =
    Date.UTC(Number(year), monthIndex, Number(day), Number(hour), Number(minute), Number(second)) -
    offsetMs
  return new Date(utc)
}

const filteredLogs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const statusQuery = statusFilter.value.trim()
  const range = selectedTimeRange.value
  const now = Date.now()

  const rangeMs = (() => {
    if (range === '15m') return 15 * 60 * 1000
    if (range === '1h') return 60 * 60 * 1000
    if (range === '6h') return 6 * 60 * 60 * 1000
    if (range === '24h') return 24 * 60 * 60 * 1000
    if (range === '7d') return 7 * 24 * 60 * 60 * 1000
    return null
  })()

  const customStart = customStartDate.value ? new Date(customStartDate.value).getTime() : null
  const customEnd = customEndDate.value ? new Date(customEndDate.value).getTime() : null

  return logs.value.filter((entry) => {
    const matchesQuery =
      !query ||
      entry.ipAddress.toLowerCase().includes(query) ||
      entry.url.toLowerCase().includes(query) ||
      entry.method.toLowerCase().includes(query) ||
      entry.rawLine?.toLowerCase().includes(query)

    let matchesStatus = true
    if (statusQuery) {
      const normalized = statusQuery.toLowerCase()
      const statusText = String(entry.status)
      if (normalized.endsWith('xx')) {
        const bucket = Number(normalized.replace('xx', ''))
        const code = Number(statusText)
        matchesStatus = Number.isFinite(code) && Math.floor(code / 100) === bucket
      } else {
        matchesStatus = statusText.startsWith(normalized)
      }
    }

    let matchesTime = true
    const entryTime = entry.timestamp?.getTime?.()
    if (isCustomRange.value && customStart && customEnd && entryTime) {
      matchesTime = entryTime >= customStart && entryTime <= customEnd
    } else if (rangeMs) {
      matchesTime = entryTime ? entryTime >= now - rangeMs : false
    }

    return matchesQuery && matchesStatus && matchesTime
  })
})

const visibleLogs = computed(() => {
  const limit = Number(linesLimit.value) || 100
  return filteredLogs.value.slice(-limit).reverse()
})

const exportCsv = () => {
  if (!visibleLogs.value.length) {
    notifyError(ACCESS_LOG_TITLE, 'There are no log entries to export.')
    return
  }

  const resolveServerName = () => {
    const currentId = String(selectedServer.value || '')
    const server = serverList.value.find((item) => String(item.id) === currentId)
    return server?.name || (currentId ? `server_${currentId}` : 'server')
  }

  const sanitizeName = (value) =>
    String(value)
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .toLowerCase()

  const escapeCsv = (value) => {
    const text = String(value ?? '')
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`
    }
    return text
  }

  const header = ['Timestamp', 'IP Address', 'Method', 'URL', 'Status', 'Response Time']
  const rows = visibleLogs.value.map((entry) =>
    [
      entry.timestampLabel,
      entry.ipAddress,
      entry.method,
      entry.url,
      entry.status,
      entry.responseTime,
    ]
      .map(escapeCsv)
      .join(','),
  )
  const csv = [header.join(','), ...rows].join('\n')

  const now = new Date()
  const pad = (val) => String(val).padStart(2, '0')
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const filename = `${sanitizeName(resolveServerName())}_${timestamp}.csv`

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const stats = computed(() => {
  const total = filteredLogs.value.length
  let success = 0
  let redirect = 0
  let clientError = 0
  let serverError = 0

  filteredLogs.value.forEach((entry) => {
    const code = Number(entry.status)
    if (!Number.isFinite(code)) return
    if (code >= 200 && code < 300) success += 1
    else if (code >= 300 && code < 400) redirect += 1
    else if (code >= 400 && code < 500) clientError += 1
    else if (code >= 500) serverError += 1
  })

  return { total, success, redirect, clientError, serverError }
})

const loadServers = async () => {
  try {
    const list = await fetchServers()
    serverList.value = Array.isArray(list) ? list : []
    if (!selectedServer.value && serverList.value.length) {
      selectedServer.value = String(serverList.value[0].id)
    }
  } catch (error) {
    notifyError(ACCESS_LOG_TITLE, error?.message || 'The servers could not be loaded.')
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

watch(selectedServer, () => {
  connectStream()
})

watch(selectedSite, () => {
  if (!selectedServer.value) return
  const stillValid = serverOptions.value.some((option) => option.value === selectedServer.value)
  if (!stillValid) {
    selectedServer.value =
      serverOptions.value.find((option) => option.value !== '')?.value || ''
  }
})

watch(linesLimit, () => {
  if (wsRef.value) {
    connectStream()
  }
})

onMounted(async () => {
  await Promise.all([loadServers(), loadSites()])
  if (selectedServer.value) {
    connectStream()
  }
})

onBeforeUnmount(() => {
  disconnectStream()
})
</script>

<style scoped>
.access-log-view {
  max-width: 1680px;
  width: 100%;
  margin: 0 auto;
  height: calc(100dvh - 112px);
  max-height: calc(100dvh - 112px);
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1 1 auto;
  overflow: hidden;
  box-sizing: border-box;
}

.access-log-view :deep(.dash-topbar),
.access-log-view :deep(.dash-filterbar),
.access-log-view > .dash-topbar,
.access-log-view > .dash-filterbar {
  flex-shrink: 0;
}

.access-log-grid {
  flex: 1 1 auto;
  min-height: 0;
  display: flex !important;
  grid-template-columns: none !important;
  overflow: hidden;
}

.access-log-grid > .log-panel {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.access-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  flex-shrink: 0;
}

.access-stat-card {
  border-radius: 12px;
  padding: 14px 16px;
  border: 1.5px solid var(--app-border);
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 84px;
}

.access-stat-label {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-label);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.access-stat-value {
  font-size: var(--type-metric-value, 1.5rem);
  font-weight: 700;
  line-height: 1.2;
  color: var(--app-heading);
}

.access-stat-card--total {
  border-color: #3fbd85;
}

.access-stat-card--total .access-stat-label,
.access-stat-card--total .access-stat-value {
  color: #3fbd85;
}

.access-stat-card--ok {
  border-color: #4fbd7a;
}

.access-stat-card--ok .access-stat-label,
.access-stat-card--ok .access-stat-value {
  color: #4fbd7a;
}

.access-stat-card--info {
  border-color: #5b9df0;
}

.access-stat-card--info .access-stat-label,
.access-stat-card--info .access-stat-value {
  color: #5b9df0;
}

.access-stat-card--warn {
  border-color: #e0a83f;
}

.access-stat-card--warn .access-stat-label,
.access-stat-card--warn .access-stat-value {
  color: #e0a83f;
}

.access-stat-card--danger {
  border-color: #e15241;
}

.access-stat-card--danger .access-stat-label,
.access-stat-card--danger .access-stat-value {
  color: #e15241;
}

.dash-filter-field--grow {
  flex: 1 1 180px;
  min-width: 160px;
}

.dash-input {
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: var(--type-base);
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
  min-width: 140px;
}

.dash-input--sm {
  min-width: 110px;
  max-width: 140px;
}

.dash-input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.dash-filter-apply--ghost {
  background: transparent;
  color: var(--app-text-secondary);
  border: 1px solid var(--app-border-strong);
}

.dash-filter-apply--ghost:hover,
.dash-filter-apply--ghost.paused {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: var(--type-caption);
  font-weight: 600;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  animation: access-pulse 2s ease-in-out infinite;
}

.status-live {
  background: rgba(63, 189, 133, 0.14);
  color: #3fbd85;
}

.status-live .status-dot {
  background: #3fbd85;
}

.status-paused {
  background: rgba(224, 168, 63, 0.14);
  color: #e0a83f;
}

.status-paused .status-dot {
  background: #e0a83f;
  animation: none;
}

.status-connecting {
  background: rgba(91, 157, 240, 0.14);
  color: #5b9df0;
}

.status-connecting .status-dot {
  background: #5b9df0;
}

.status-idle {
  background: rgba(139, 151, 143, 0.14);
  color: #8b978f;
}

.status-idle .status-dot {
  background: #8b978f;
  animation: none;
}

@keyframes access-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.log-panel {
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.log-panel :deep(.dash-panel-head),
.log-panel .dash-panel-head {
  flex-shrink: 0;
}

.log-table-container {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  overflow: auto;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-muted);
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--type-caption);
}

.log-table th,
.log-table td {
  padding: 9px 12px;
  text-align: left;
  border-bottom: 1px solid var(--app-border);
  vertical-align: top;
}

.log-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--app-surface);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-label);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.log-table td {
  color: var(--app-text);
}

.log-table tbody tr:hover {
  background: var(--app-accent-soft);
}

.url-cell {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
}

.empty-row {
  text-align: center;
  color: var(--app-text-muted);
  padding: 28px 12px !important;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.method-get,
.method-head,
.method-options {
  background: rgba(91, 157, 240, 0.16);
  color: #5b9df0;
}

.method-post,
.method-put,
.method-patch {
  background: rgba(63, 189, 133, 0.16);
  color: #3fbd85;
}

.method-delete {
  background: rgba(225, 82, 65, 0.16);
  color: #e15241;
}

.method-tls,
.method-raw {
  background: rgba(176, 140, 240, 0.16);
  color: #b08cf0;
}

.status-2xx {
  background: rgba(79, 189, 122, 0.16);
  color: #4fbd7a;
}

.status-3xx {
  background: rgba(91, 157, 240, 0.16);
  color: #5b9df0;
}

.status-4xx {
  background: rgba(224, 168, 63, 0.16);
  color: #e0a83f;
}

.status-5xx {
  background: rgba(225, 82, 65, 0.16);
  color: #e15241;
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
  color: var(--app-text-muted);
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

@media (max-width: 900px) {
  .filter-actions {
    margin-left: 0;
    width: 100%;
  }

  .url-cell {
    max-width: 220px;
  }

  .access-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .access-stats {
    grid-template-columns: 1fr;
  }
}
</style>
