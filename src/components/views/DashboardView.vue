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
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ApexCharts from 'apexcharts'
import { serverList } from '@/data/servers'

const bandwidthChart = ref(null)
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

const randomBandwidth = (base = 400) => {
  const jitter = (Math.random() - 0.5) * 30
  const next = Math.max(50, Math.min(980, base + jitter))
  return Math.round(next)
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

onMounted(() => {
  if (!servers.length) {
    return
  }
  createChart()
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
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
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

</style>

