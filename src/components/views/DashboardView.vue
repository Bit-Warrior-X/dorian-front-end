<template>
  <div class="dashboard-view">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon users">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Total Users</h3>
          <p class="stat-value">12,345</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon servers">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="8" rx="2"></rect>
            <rect x="2" y="13" width="20" height="8" rx="2"></rect>
            <line x1="6" y1="7" x2="6.01" y2="7"></line>
            <line x1="6" y1="17" x2="6.01" y2="17"></line>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Total Servers</h3>
          <p class="stat-value">1,234</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active-servers">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l7 3v6c0 5-7 9-7 9s-7-4-7-9V5l7-3z"></path>
            <path d="M9 12l2 2 4-4"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Active Servers</h3>
          <p class="stat-value">987</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blocked">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Blocked IPs</h3>
          <p class="stat-value">456</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon connections">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l7 3v6c0 5-7 9-7 9s-7-4-7-9V5l7-3z"></path>
            <path d="M9 12l2 2 4-4"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>L4 Attacks This Month</h3>
          <p class="stat-value">124</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon connections">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4v16h16"></path>
            <path d="M20 7l-4 4-3-3-5 5"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>L4 Attacks Previous Month</h3>
          <p class="stat-value">98</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon connections">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M8 12h8"></path>
            <path d="M12 8v8"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>L7 Threats This Month</h3>
          <p class="stat-value">312</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon connections">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <div class="stat-info">
          <h3>L7 Threats Previous Month</h3>
          <p class="stat-value">276</p>
        </div>
      </div>
    </div>
    <div class="analytics-card">
      <h2>Security Events Timeline</h2>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-marker threat"></div>
          <div class="timeline-content">
            <h4>DDoS Attack Detected</h4>
            <p>Multiple requests from 192.168.1.50 - Blocked</p>
            <span class="timeline-time">2 hours ago</span>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-marker warning"></div>
          <div class="timeline-content">
            <h4>Suspicious Activity</h4>
            <p>Unusual traffic pattern detected from 10.0.0.15</p>
            <span class="timeline-time">5 hours ago</span>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-marker success"></div>
          <div class="timeline-content">
            <h4>Security Scan Completed</h4>
            <p>All systems verified and secure</p>
            <span class="timeline-time">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Realtime Bandwidth by Server</h3>
          <p>Live throughput updated every second (Mbps)</p>
        </div>
        <span class="bandwidth-pill">Live</span>
      </div>
      <div class="bandwidth-chart">
        <div ref="bandwidthChart"></div>
      </div>
      <div class="bandwidth-legend">
        <button
          v-for="(server, index) in servers"
          :key="server.id"
          class="legend-item"
          type="button"
          :class="{ 'legend-item--hidden': hiddenServers.has(server.id) }"
          @click="toggleServerSeries(server)"
        >
          <span class="legend-swatch" :style="{ background: server.color }"></span>
          <span class="legend-label">{{ server.label }}</span>
          <span class="legend-value">{{ hiddenServers.has(server.id) ? 'Hidden' : `${latestValues[index]} Mbps` }}</span>
        </button>
      </div>
    </div>
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-header">
          <div>
            <h3>Request Count & Response</h3>
            <p>Requests and responses per second</p>
          </div>
          <div class="chart-controls">
            <div class="range-buttons">
              <button
                v-for="option in timeRangeOptions"
                :key="option.value"
                type="button"
                class="range-btn"
                :class="{ active: requestRange === option.value }"
                @click="requestRange = option.value"
              >
                {{ option.label }}
              </button>
            </div>
            <select v-model="requestServer" class="chart-select">
              <option v-for="option in serverOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="bandwidth-chart">
          <div ref="requestResponseChart"></div>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <div>
            <h3>Status Code</h3>
            <p>Response distribution per second</p>
          </div>
          <div class="chart-controls">
            <div class="range-buttons">
              <button
                v-for="option in timeRangeOptions"
                :key="option.value"
                type="button"
                class="range-btn"
                :class="{ active: statusRange === option.value }"
                @click="statusRange = option.value"
              >
                {{ option.label }}
              </button>
            </div>
            <select v-model="statusServer" class="chart-select">
              <option v-for="option in serverOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="bandwidth-chart">
          <div ref="statusCodeChart"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ApexCharts from 'apexcharts'
import { serverList } from '@/data/servers'

const bandwidthChart = ref(null)
const requestResponseChart = ref(null)
const statusCodeChart = ref(null)
const palette = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#0ea5e9', '#a855f7']
const servers = serverList.map((server, index) => ({
  id: server.id,
  label: server.name,
  color: palette[index % palette.length],
}))
const maxPoints = 30
const intervalMs = 1000
const range = maxPoints * intervalMs

let chartInstance = null
let bandwidthTimer = null
let requestResponseChartInstance = null
let statusCodeChartInstance = null

const timeRangeOptions = [
  { label: '5min', value: 5 * 60 * 1000 },
  { label: '10min', value: 10 * 60 * 1000 },
  { label: '30min', value: 30 * 60 * 1000 },
  { label: '1h', value: 60 * 60 * 1000 },
]
const serverOptions = [
  { label: 'All Servers', value: 'all' },
  ...serverList.map((server) => ({ label: server.name, value: server.id })),
]
const requestRange = ref(timeRangeOptions[0].value)
const statusRange = ref(timeRangeOptions[0].value)
const requestServer = ref('all')
const statusServer = ref('all')

const randomBandwidth = (base = 400) => {
  const jitter = (Math.random() - 0.5) * 30
  const next = Math.max(50, Math.min(980, base + jitter))
  return Math.round(next)
}

const randomRequests = (base = 1200) => {
  const jitter = (Math.random() - 0.5) * 180
  const next = Math.max(50, Math.min(4000, base + jitter))
  return Math.round(next)
}

const randomResponses = (base = 1000) => {
  const jitter = (Math.random() - 0.5) * 150
  const next = Math.max(50, Math.min(3800, base + jitter))
  return Math.round(next)
}

const randomStatusCounts = (base = 800) => {
  const jitter = (Math.random() - 0.5) * 120
  const success = Math.max(20, Math.round(base + jitter))
  const redirect = Math.max(8, Math.round(success * 0.12))
  const client = Math.max(6, Math.round(success * 0.08))
  const server = Math.max(3, Math.round(success * 0.03))
  return { success, redirect, client, server }
}

const createInitialSeries = () => {
  const now = Date.now()
  return servers.map((server, index) => {
    const base = 300 + (index % 5) * 80
    const data = Array.from({ length: maxPoints }, (_, pointIndex) => ({
      x: now - (maxPoints - pointIndex) * intervalMs,
      y: randomBandwidth(base),
    }))
    return {
      name: server.label,
      data,
    }
  })
}

const bandwidthSeries = ref(createInitialSeries())
const latestValues = ref(
  bandwidthSeries.value.map((series) => series.data[series.data.length - 1]?.y ?? 0),
)
const hiddenServers = ref(new Set())

const requestResponseSeries = ref(createRequestResponseSeries())
const statusCodeSeries = ref(createStatusCodeSeries())

const updateSeries = () => {
  const samplePayload = getSampleBandwidthPayload()
  const now = Date.now()
  const appendPayload = []

  bandwidthSeries.value = bandwidthSeries.value.map((series, index) => {
    const serverId = servers[index].id
    const nextValue = samplePayload[serverId] ?? series.data[series.data.length - 1]?.y ?? 0
    const nextPoint = { x: now, y: Math.round(nextValue) }
    appendPayload.push({ data: [nextPoint] })

    const next = [...series.data, nextPoint]
    const trimmed = next.length > maxPoints ? next.slice(next.length - maxPoints) : next
    return {
      ...series,
      data: trimmed,
    }
  })

  latestValues.value = bandwidthSeries.value.map((series) => series.data[series.data.length - 1]?.y ?? 0)

  if (chartInstance) {
    chartInstance.appendData(appendPayload)
    chartInstance.updateOptions(
      {
        xaxis: {
          range,
          max: now,
          tickAmount: 6,
        },
      },
      false,
      true,
    )
    hiddenServers.value.forEach((serverId) => {
      const server = servers.find((item) => item.id === serverId)
      if (server) {
        chartInstance.hideSeries(server.label)
      }
    })
  }

  updateRequestResponseSeries(now)
  updateStatusCodeSeries(now)
}

const toggleServerSeries = (server) => {
  if (!chartInstance) {
    return
  }
  chartInstance.toggleSeries(server.label)
  const next = new Set(hiddenServers.value)
  if (next.has(server.id)) {
    next.delete(server.id)
  } else {
    next.add(server.id)
  }
  hiddenServers.value = next
  chartInstance.updateOptions(
    {},
    false,
    true,
  )
}

const getSampleBandwidthPayload = () => {
  return servers.reduce((acc, server, index) => {
    const base = 300 + (index % 5) * 80
    acc[server.id] = randomBandwidth(base)
    return acc
  }, {})
}

function createRequestResponseSeries() {
  const now = Date.now()
  const requests = []
  const responses = []
  for (let pointIndex = 0; pointIndex < maxPoints; pointIndex += 1) {
    const timestamp = now - (maxPoints - pointIndex) * intervalMs
    const { requestValue, responseValue } = getRequestResponseValues(requestServer.value)
    requests.push({ x: timestamp, y: requestValue })
    responses.push({ x: timestamp, y: responseValue })
  }
  return [
    { name: 'Requests', data: requests },
    { name: 'Responses', data: responses },
  ]
}

function createStatusCodeSeries() {
  const now = Date.now()
  const success = []
  const redirect = []
  const client = []
  const server = []
  for (let pointIndex = 0; pointIndex < maxPoints; pointIndex += 1) {
    const timestamp = now - (maxPoints - pointIndex) * intervalMs
    const { successValue, redirectValue, clientValue, serverValue } = getStatusCodeValues(statusServer.value)
    success.push({ x: timestamp, y: successValue })
    redirect.push({ x: timestamp, y: redirectValue })
    client.push({ x: timestamp, y: clientValue })
    server.push({ x: timestamp, y: serverValue })
  }
  return [
    { name: '2xx', data: success },
    { name: '3xx', data: redirect },
    { name: '4xx', data: client },
    { name: '5xx', data: server },
  ]
}

function getRequestResponseValues(selectedServer) {
  if (selectedServer === 'all') {
    return servers.reduce(
      (acc, server, index) => {
        const base = 900 + (index % 5) * 140
        acc.requestValue += randomRequests(base)
        acc.responseValue += randomResponses(base * 0.9)
        return acc
      },
      { requestValue: 0, responseValue: 0 },
    )
  }
  const serverIndex = servers.findIndex((server) => server.id === selectedServer)
  const base = 900 + (serverIndex % 5) * 140
  return {
    requestValue: randomRequests(base),
    responseValue: randomResponses(base * 0.9),
  }
}

function getStatusCodeValues(selectedServer) {
  if (selectedServer === 'all') {
    return servers.reduce(
      (acc, server, index) => {
        const base = 800 + (index % 5) * 120
        const counts = randomStatusCounts(base)
        acc.successValue += counts.success
        acc.redirectValue += counts.redirect
        acc.clientValue += counts.client
        acc.serverValue += counts.server
        return acc
      },
      { successValue: 0, redirectValue: 0, clientValue: 0, serverValue: 0 },
    )
  }
  const serverIndex = servers.findIndex((server) => server.id === selectedServer)
  const base = 800 + (serverIndex % 5) * 120
  const counts = randomStatusCounts(base)
  return {
    successValue: counts.success,
    redirectValue: counts.redirect,
    clientValue: counts.client,
    serverValue: counts.server,
  }
}

const updateRequestResponseSeries = (now) => {
  const { requestValue, responseValue } = getRequestResponseValues(requestServer.value)
  const nextRequests = { x: now, y: requestValue }
  const nextResponses = { x: now, y: responseValue }

  requestResponseSeries.value = requestResponseSeries.value.map((series) => {
    const next = [...series.data, series.name === 'Requests' ? nextRequests : nextResponses]
    return {
      ...series,
      data: next.length > maxPoints ? next.slice(next.length - maxPoints) : next,
    }
  })

  if (requestResponseChartInstance) {
    requestResponseChartInstance.appendData([
      { data: [nextRequests] },
      { data: [nextResponses] },
    ])
    requestResponseChartInstance.updateOptions(
      {
        xaxis: {
          range: requestRange.value,
          max: now,
          tickAmount: 6,
        },
      },
      false,
      true,
    )
  }
}

const updateStatusCodeSeries = (now) => {
  const { successValue, redirectValue, clientValue, serverValue } = getStatusCodeValues(statusServer.value)
  const nextSuccess = { x: now, y: successValue }
  const nextRedirect = { x: now, y: redirectValue }
  const nextClient = { x: now, y: clientValue }
  const nextServer = { x: now, y: serverValue }

  statusCodeSeries.value = statusCodeSeries.value.map((series) => {
    const nextPoint =
      series.name === '2xx'
        ? nextSuccess
        : series.name === '3xx'
          ? nextRedirect
          : series.name === '4xx'
            ? nextClient
            : nextServer
    const next = [...series.data, nextPoint]
    return {
      ...series,
      data: next.length > maxPoints ? next.slice(next.length - maxPoints) : next,
    }
  })

  if (statusCodeChartInstance) {
    statusCodeChartInstance.appendData([
      { data: [nextSuccess] },
      { data: [nextRedirect] },
      { data: [nextClient] },
      { data: [nextServer] },
    ])
    statusCodeChartInstance.updateOptions(
      {
        xaxis: {
          range: statusRange.value,
          max: now,
          tickAmount: 6,
        },
      },
      false,
      true,
    )
  }
}

const createChart = () => {
  if (!bandwidthChart.value) {
    return
  }

  const now = Date.now()
  chartInstance = new ApexCharts(bandwidthChart.value, {
    chart: {
      type: 'line',
      height: 320,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 1500,
        dynamicAnimation: {
          speed: 1500,
        },
      },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    markers: {
      size: 0,
      hover: { size: 4 },
    },
    colors: servers.map((server) => server.color),
    series: bandwidthSeries.value,
    xaxis: {
      type: 'datetime',
      labels: {
        show: true,
        datetimeUTC: false,
        style: { colors: '#94a3b8' },
        formatter: (value) => {
          const date = new Date(value)
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      range,
      max: now,
      tickAmount: 6,
    },
    yaxis: {
      opposite: true,
      labels: {
        formatter: (value) => `${Math.round(value)} Mbps`,
        style: { colors: '#94a3b8' },
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.35)',
      strokeDashArray: 6,
    },
    tooltip: {
      x: { format: 'HH:mm:ss' },
      y: { formatter: (value) => `${Math.round(value)} Mbps` },
      theme: 'light',
    },
    legend: { show: false },
  })

  chartInstance.render()
}

const createRequestResponseChart = () => {
  if (!requestResponseChart.value) {
    return
  }

  const now = Date.now()
  requestResponseChartInstance = new ApexCharts(requestResponseChart.value, {
    chart: {
      type: 'line',
      height: 320,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 1500,
        dynamicAnimation: {
          speed: 1500,
        },
      },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    markers: {
      size: 0,
      hover: { size: 4 },
    },
    colors: ['#22c55e', '#0ea5e9'],
    series: requestResponseSeries.value,
    xaxis: {
      type: 'datetime',
      labels: {
        show: true,
        datetimeUTC: false,
        style: { colors: '#94a3b8' },
        formatter: (value) => {
          const date = new Date(value)
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      range: requestRange.value,
      max: now,
      tickAmount: 6,
    },
    yaxis: {
      opposite: true,
      labels: {
        formatter: (value) => `${Math.round(value)} rps`,
        style: { colors: '#94a3b8' },
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.35)',
      strokeDashArray: 6,
    },
    tooltip: {
      x: { format: 'HH:mm:ss' },
      y: { formatter: (value) => `${Math.round(value)} rps` },
      theme: 'light',
    },
    legend: { show: false },
  })

  requestResponseChartInstance.render()
}

const createStatusCodeChart = () => {
  if (!statusCodeChart.value) {
    return
  }

  const now = Date.now()
  statusCodeChartInstance = new ApexCharts(statusCodeChart.value, {
    chart: {
      type: 'line',
      height: 320,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 1500,
        dynamicAnimation: {
          speed: 1500,
        },
      },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    markers: {
      size: 0,
      hover: { size: 4 },
    },
    colors: ['#22c55e', '#38bdf8', '#f59e0b', '#ef4444'],
    series: statusCodeSeries.value,
    xaxis: {
      type: 'datetime',
      labels: {
        show: true,
        datetimeUTC: false,
        style: { colors: '#94a3b8' },
        formatter: (value) => {
          const date = new Date(value)
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      range: statusRange.value,
      max: now,
      tickAmount: 6,
    },
    yaxis: {
      opposite: true,
      labels: {
        formatter: (value) => `${Math.round(value)}`,
        style: { colors: '#94a3b8' },
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.35)',
      strokeDashArray: 6,
    },
    tooltip: {
      x: { format: 'HH:mm:ss' },
      y: { formatter: (value) => `${Math.round(value)}` },
      theme: 'light',
    },
    legend: { show: false },
  })

  statusCodeChartInstance.render()
}

onMounted(() => {
  if (!servers.length) {
    return
  }
  createChart()
  createRequestResponseChart()
  createStatusCodeChart()
  bandwidthTimer = window.setInterval(updateSeries, intervalMs)
})

onBeforeUnmount(() => {
  if (bandwidthTimer) {
    window.clearInterval(bandwidthTimer)
  }
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  if (requestResponseChartInstance) {
    requestResponseChartInstance.destroy()
    requestResponseChartInstance = null
  }
  if (statusCodeChartInstance) {
    statusCodeChartInstance.destroy()
    statusCodeChartInstance = null
  }
})

watch([requestRange, requestServer], () => {
  requestResponseSeries.value = createRequestResponseSeries()
  if (requestResponseChartInstance) {
    requestResponseChartInstance.updateSeries(requestResponseSeries.value, true)
    requestResponseChartInstance.updateOptions(
      {
        xaxis: {
          range: requestRange.value,
          max: Date.now(),
          tickAmount: 6,
        },
      },
      false,
      true,
    )
  }
})

watch([statusRange, statusServer], () => {
  statusCodeSeries.value = createStatusCodeSeries()
  if (statusCodeChartInstance) {
    statusCodeChartInstance.updateSeries(statusCodeSeries.value, true)
    statusCodeChartInstance.updateOptions(
      {
        xaxis: {
          range: statusRange.value,
          max: Date.now(),
          tickAmount: 6,
        },
      },
      false,
      true,
    )
  }
})
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 20px;
}

.analytics-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 24px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
}

.analytics-card h2 {
  margin: 0 0 18px;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 11px;
  top: 40px;
  width: 2px;
  height: calc(100% + 4px);
  background: #e5e7eb;
}

.timeline-marker {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.timeline-marker.threat {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.timeline-marker.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.timeline-marker.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.timeline-content {
  flex: 1;
  background: #f7fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.timeline-content h4 {
  margin: 0 0 6px;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.timeline-content p {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: #718096;
}

.timeline-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.bandwidth-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 24px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
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
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}

.bandwidth-header p {
  margin: 6px 0 0;
  color: #64748b;
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
  height: 320px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: #ffffff;
}

.bandwidth-chart div {
  width: 100%;
  height: 100%;
  display: block;
}

.bandwidth-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 20px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1f2937;
}

.chart-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.88rem;
}

.chart-controls {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.range-buttons {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}

.range-btn {
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: white;
  color: #334155;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.range-btn.active,
.range-btn:hover {
  border-color: rgba(99, 102, 241, 0.5);
  color: #4338ca;
  background: rgba(99, 102, 241, 0.1);
}

.chart-select {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.8rem;
  color: #1f2937;
  background: white;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  font-size: 0.85rem;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.2s ease;
}

.legend-item--hidden {
  opacity: 0.55;
  border-style: dashed;
}

.legend-item:hover {
  border-color: rgba(99, 102, 241, 0.35);
  background: rgba(224, 231, 255, 0.25);
}

.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.legend-label {
  font-weight: 600;
}

.legend-value {
  color: #64748b;
  font-size: 0.8rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.3);
}

.stat-icon {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-icon.connections {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.stat-icon.users {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  box-shadow: 0 4px 15px rgba(20, 184, 166, 0.3);
}

.stat-icon.servers {
  background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.stat-icon.active-servers {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
}

.stat-icon.blocked {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

</style>

