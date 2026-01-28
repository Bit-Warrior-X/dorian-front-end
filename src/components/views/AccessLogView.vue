<template>
  <div class="access-log-view">
    <div class="view-card">
      <div class="card-header">
        <div class="header-left">
          <div class="server-select-wrapper">
            <span class="server-select-label">Server</span>
            <select v-model="selectedServer" class="server-select header-server-select">
              <option v-for="server in serverOptions" :key="server.value" :value="server.value">
                {{ server.label }}
              </option>
            </select>
          </div>
          <h3>Access Log</h3>
          <div class="status-indicator" :class="statusClass">
            <span class="status-dot"></span>
            <span class="status-text">{{ status }}</span>
          </div>
          <div class="time-range-pill" :title="timeRangeLabel">
            {{ timeRangeLabel }}
          </div>
        </div>
        <div class="header-actions">
          <button 
            :class="['control-btn', isPaused ? 'paused' : 'playing']"
            @click="togglePause"
          >
            <svg v-if="isPaused" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            {{ isPaused ? 'Start' : 'Pause' }}
          </button>
        </div>
      </div>
      
      <!-- Filters Section -->
      <div class="filters-section">
        <div class="filter-row">
          <div class="filter-group search-group">
            <div class="search-input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search host, path, IP..." 
                class="search-input"
              />
            </div>
          </div>
          
          <div class="filter-group time-buttons-group">
            <div class="time-buttons">
              <button 
                v-for="time in timeRanges" 
                :key="time.value"
                :class="['time-btn', { active: selectedTimeRange === time.value && !isCustomRange }]"
                @click="selectTimeRange(time.value)"
              >
                {{ time.label }}
              </button>
              <button 
                :class="['time-btn', 'custom-btn', { active: isCustomRange }]"
                @click="showCustomDialog = true"
              >
                Custom
              </button>
            </div>
          </div>

          <div class="filter-group">
            <input 
              type="text" 
              v-model="statusFilter" 
              placeholder="Status (e.g. 200, 4xx)" 
              class="status-input"
            />
          </div>
          
          <div class="filter-group">
            <select v-model="linesLimit" class="lines-select">
              <option value="100">100 lines</option>
              <option value="200">200 lines</option>
              <option value="1000">1000 lines</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Custom Time Range Dialog -->
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
              <input type="datetime-local" v-model="customStartDate" class="dialog-input" />
            </div>
            <div class="dialog-form-group">
              <label>End Date & Time</label>
              <input type="datetime-local" v-model="customEndDate" class="dialog-input" />
            </div>
          </div>
          <div class="dialog-footer">
            <button class="dialog-btn cancel-btn" @click="showCustomDialog = false">Cancel</button>
            <button class="dialog-btn apply-btn" @click="applyCustomRange">Apply</button>
          </div>
        </div>
      </div>
      
      <div class="log-table-container">
        <table class="log-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>IP Address</th>
              <th>Method</th>
              <th>URL</th>
              <th>Status</th>
              <th>Response Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in visibleLogs" :key="entry.id">
              <td>{{ entry.timestampLabel }}</td>
              <td>{{ entry.ipAddress }}</td>
              <td>
                <span :class="['badge', entry.methodClass]">{{ entry.method }}</span>
              </td>
              <td>{{ entry.url }}</td>
              <td>
                <span :class="['badge', entry.statusClass]">{{ entry.status }}</span>
              </td>
              <td>{{ entry.responseTime }}</td>
            </tr>
            <tr v-if="!visibleLogs.length">
              <td colspan="6" class="empty-row">No log entries yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Stats Panels -->
    <div class="stats-panels">
      <div class="stat-panel">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="20" x2="12" y2="10"></line>
            <line x1="18" y1="20" x2="18" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="16"></line>
          </svg>
        </div>
        <div class="stat-content">
          <h3>Lines Loaded</h3>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
      </div>
      
      <div class="stat-panel success">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <h3>2xx Response</h3>
          <p class="stat-value">{{ stats.success }}</p>
        </div>
      </div>
      
      <div class="stat-panel info">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 16 12 12 16 12"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <h3>3xx Response</h3>
          <p class="stat-value">{{ stats.redirect }}</p>
        </div>
      </div>
      
      <div class="stat-panel warning">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="stat-content">
          <h3>4xx Errors</h3>
          <p class="stat-value">{{ stats.clientError }}</p>
        </div>
      </div>
      
      <div class="stat-panel error">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <div class="stat-content">
          <h3>5xx Errors</h3>
          <p class="stat-value">{{ stats.serverError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { fetchServers } from '@/api/servers'
import { getApiConfig } from '@/api/config'
import { useNotifications } from '@/stores/notifications'

const notifications = useNotifications()
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
const serverList = ref([])
const logs = ref([])
const wsRef = ref(null)
const wsToken = ref(0)

const timeRanges = [
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '6h', value: '6h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' }
]

const serverOptions = computed(() => [
  { label: 'Select Server', value: '' },
  ...serverList.value.map((server) => ({
    label: server.name || `Server ${server.id}`,
    value: String(server.id)
  }))
])

const statusClass = computed(() => {
  const statusLower = status.value.toLowerCase()
  if (statusLower === 'live') return 'status-live'
  if (statusLower === 'paused') return 'status-paused'
  if (statusLower === 'connecting') return 'status-searching'
  if (statusLower === 'disconnected') return 'status-no-data'
  if (statusLower === 'error') return 'status-no-data'
  if (statusLower === 'no data') return 'status-no-data'
  return ''
})

const timeRangeLabel = computed(() => {
  if (isCustomRange.value && customStartDate.value && customEndDate.value) {
    return `${customStartDate.value.replace('T', ' ')} → ${customEndDate.value.replace('T', ' ')}`
  }
  const found = timeRanges.find((range) => range.value === selectedTimeRange.value)
  return found ? `Range: ${found.label}` : 'Range: All'
})

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
  const { apiBaseUrl } = await getApiConfig()
  const base = apiBaseUrl || window.location.origin
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
      if (isPaused.value) return
      let payload = null
      try {
        payload = JSON.parse(event.data)
      } catch {
        payload = { line: event.data }
      }
      if (payload?.line) {
        appendLogLine(payload.line)
      }
    }

    socket.onerror = () => {
      if (wsToken.value !== token) return
      status.value = 'Error'
      notifications.enqueue('Failed to connect to access log stream.', 'error')
    }

    socket.onclose = () => {
      if (wsToken.value !== token) return
      if (status.value !== 'Paused') {
        status.value = 'Disconnected'
      }
    }
  } catch (error) {
    status.value = 'Error'
    notifications.enqueue(error?.message || 'Failed to connect to access log stream.', 'error')
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
      responseTime: '-'
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
    statusClass: parsed.status ? `status-${parsed.status}` : '',
    responseTime: responseTimeLabel
  }
}

const parseNginxLine = (line) => {
  const regex =
    /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) ([^"]+?) HTTP\/[0-9.]+" (\d{3}) \S+(?: \S+)?(?: ".*")?(?: ".*")?(?: ([0-9.]+))?/
  const match = line.match(regex)
  if (!match) return null

  const [, ipAddress, timeLocal, method, url, status, responseTime] = match
  const timestamp = parseNginxTime(timeLocal)
  return {
    ipAddress,
    method,
    url,
    status,
    responseTime: responseTime ? Number(responseTime) * 1000 : null,
    timestamp,
    timestampLabel: timestamp ? timestamp.toLocaleString() : timeLocal
  }
}

const parseNginxTime = (value) => {
  const match = value.match(
    /(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})/
  )
  if (!match) return null
  const [, day, month, year, hour, minute, second, tz] = match
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month)
  if (monthIndex < 0) return null
  const offsetSign = tz.startsWith('-') ? -1 : 1
  const offsetHours = Number(tz.slice(1, 3))
  const offsetMinutes = Number(tz.slice(3, 5))
  const offsetMs = offsetSign * (offsetHours * 60 + offsetMinutes) * 60 * 1000
  const utc = Date.UTC(Number(year), monthIndex, Number(day), Number(hour), Number(minute), Number(second)) - offsetMs
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
    notifications.enqueue(error?.message || 'Failed to load servers.', 'error')
  }
}

watch(selectedServer, () => {
  connectStream()
})

watch(linesLimit, () => {
  if (wsRef.value) {
    connectStream()
  }
})

onMounted(async () => {
  await loadServers()
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
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  gap: 24px;
}

.stats-panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: auto;
}

.stat-panel {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-panel:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(102, 126, 234, 0.2);
}

.stat-panel .stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.stat-panel.success .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.stat-panel.info .stat-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.stat-panel.warning .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}

.stat-panel.error .stat-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.stat-panel .stat-icon svg {
  width: 28px;
  height: 28px;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  font-size: 0.875rem;
  color: #718096;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.stat-content .stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.view-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.server-select-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.06);
}

.server-select-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
}

.server-select-wrapper:focus-within {
  border-color: #c7d2fe;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1a202c 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.5px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.status-live {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.status-indicator.status-live .status-dot {
  background: #10b981;
}

.status-indicator.status-paused {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.status-indicator.status-paused .status-dot {
  background: #f59e0b;
  animation: none;
}

.status-indicator.status-searching {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.status-indicator.status-searching .status-dot {
  background: #3b82f6;
  animation: spin 1s linear infinite;
}

.status-indicator.status-no-data {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.status-indicator.status-no-data .status-dot {
  background: #6b7280;
  animation: none;
}

.time-range-pill {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
  font-size: 0.8rem;
  font-weight: 600;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.header-actions {
  display: flex;
  gap: 12px;
}


.filters-section {
  background: #f7fafc;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
  width: 100%;
}

@media (max-width: 1200px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    width: 100%;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 150px;
}

.filter-group.search-group {
  flex: 2 1 auto;
  min-width: 200px;
}

.filter-group.time-buttons-group {
  flex: 2 1 auto;
  min-width: 350px;
  max-width: 100%;
  overflow: visible;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #9ca3af;
  pointer-events: none;
}

.search-input, .status-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
  outline: none;
  background: white;
}

.status-input {
  padding: 10px 12px;
}

.search-input:focus, .status-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.time-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: 2px;
}

.time-buttons::-webkit-scrollbar {
  height: 4px;
}

.time-buttons::-webkit-scrollbar-track {
  background: transparent;
}

.time-buttons::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 2px;
}

.time-buttons::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.time-btn {
  padding: 8px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  color: #374151;
  white-space: nowrap;
  flex-shrink: 0;
}

.time-btn:hover {
  border-color: #cbd5e0;
  background: #f9fafb;
}

.time-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.lines-select {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
}

.server-select {
  padding: 4px 24px 4px 6px;
  border: none;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  background: transparent;
  color: #1f2937;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 8 10 12 14 8'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  background-size: 12px;
}

.server-select:focus {
  box-shadow: none;
}

.lines-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.control-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.control-btn svg {
  width: 18px;
  height: 18px;
}

.control-btn.playing {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.control-btn.playing:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
}

.control-btn.paused {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.control-btn.paused:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}

.custom-btn {
  border-left: 2px solid #e5e7eb;
  margin-left: 4px;
  padding-left: 12px;
}

.custom-btn.active {
  border-left-color: transparent;
}

/* Dialog Styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.dialog-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: color 0.2s;
  border-radius: 6px;
}

.dialog-close:hover {
  color: #1a202c;
  background: #f3f4f6;
}

.dialog-close svg {
  width: 20px;
  height: 20px;
}

.dialog-body {
  padding: 24px;
}

.dialog-form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.dialog-form-group:last-child {
  margin-bottom: 0;
}

.dialog-form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.dialog-input {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
  outline: none;
  background: white;
}

.dialog-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.dialog-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.apply-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.apply-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.log-table-container {
  flex: 1 1 auto;
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 420px);
  min-height: 360px;
  background: #1a202c;
  border-radius: 12px;
  padding: 1px;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  background: #1a202c;
}

.log-table thead {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  position: sticky;
  top: 0;
  z-index: 10;
}

.log-table th {
  padding: 16px;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #e2e8f0;
  border-bottom: 2px solid #374151;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.log-table td {
  padding: 16px;
  border-bottom: 1px solid #2d3748;
  color: #cbd5e0;
  font-size: 0.9rem;
}

.log-table tbody tr {
  transition: background 0.2s;
}

.log-table tbody tr:hover {
  background: rgba(102, 126, 234, 0.15);
}

.log-table tbody tr:nth-child(even) {
  background: rgba(45, 55, 72, 0.3);
}

.log-table tbody tr:nth-child(even):hover {
  background: rgba(102, 126, 234, 0.2);
}

.empty-row {
  text-align: center;
  color: #94a3b8;
}

.badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
}

.badge.method-get {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge.method-post {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge.status-200 {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge.status-201 {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}
</style>

