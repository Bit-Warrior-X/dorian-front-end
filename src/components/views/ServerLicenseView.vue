<template>
  <div class="dashboard-view license-view">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>License</h2>
        <p>Choose Trial for evaluation, or a paid Monthly / Annual plan for production edges.</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <div class="dash-filterbar">
      <div class="dash-filter-field">
        <label for="server-license-target">Target edge</label>
        <select
          id="server-license-target"
          class="dash-select"
          v-model.number="selectedServer"
        >
          <option disabled value="">Select an edge</option>
          <option v-for="server in serverOptions" :key="server.id" :value="server.id">
            {{ server.name || server.ip || `Edge #${server.id}` }}
          </option>
        </select>
      </div>
      <div v-if="selectedServerData" class="license-meta">
        <span class="layer-status-dots layer-status-dots--meta">
          <LayerStatusDot
            layer="l4"
            :status="resolveLayerStatus(selectedServerData, 'l4')"
            :description="layerDotDescription(selectedServerData, 'l4')"
            :aria-label="layerDotTitle(selectedServerData, 'l4')"
          />
          <LayerStatusDot
            layer="l7"
            :status="resolveLayerStatus(selectedServerData, 'l7')"
            :description="layerDotDescription(selectedServerData, 'l7')"
            :aria-label="layerDotTitle(selectedServerData, 'l7')"
          />
        </span>
        <span class="meta-pill status server-status-pill" :class="angelosStatusClass(selectedServerData)">
          Angelos: {{ angelosStatusLabel(selectedServerData) }}
        </span>
        <span class="meta-pill license">License: {{ selectedServerData.license }}</span>
      </div>
    </div>

    <section v-if="selectedServerData" class="dash-panel dash-chart-panel">
      <div class="dash-panel-head">
        <div>
          <h3>Upgrade plan</h3>
          <p class="dash-panel-desc">
            Current tier: <strong>{{ selectedServerData.license || '—' }}</strong>
            · applying generates a new license and runs a license-only deploy
          </p>
        </div>
      </div>
      <LicenseTierUpgradePanel
        :server="selectedServerData"
        :show-cancel="false"
        ok-label="Apply license"
        @success="onLicenseTierSuccess"
      />
    </section>

    <section v-else class="dash-panel">
      <p class="dash-panel-desc">Select an edge to review pricing and change its license tier.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchServers } from '@/api/servers'
import { notifySuccess } from '@/utils/notify'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import LicenseTierUpgradePanel from '../LicenseTierUpgradePanel.vue'
import LayerStatusDot from '../LayerStatusDot.vue'
import {
  angelosStatusClass,
  angelosStatusLabel,
  layerDotDescription,
  layerDotTitle,
  resolveLayerStatus,
} from '@/utils/serverLayerStatus'

const route = useRoute()
const serverOptions = ref([])
const selectedServer = ref('')

const selectedServerData = computed(() =>
  serverOptions.value.find((server) => server.id === selectedServer.value),
)

const loadServers = async () => {
  try {
    const data = await fetchServers()
    serverOptions.value = Array.isArray(data) ? data : []
  } catch {
    serverOptions.value = []
  }

  if (!selectedServer.value && serverOptions.value.length) {
    selectedServer.value = serverOptions.value[0].id
  }
}

const applyRouteQuery = () => {
  const raw = route.query.server
  if (raw != null && String(raw).trim() !== '') {
    const id = Number(raw)
    if (!Number.isNaN(id)) {
      selectedServer.value = id
    }
  }
}

const onLicenseTierSuccess = async (updated) => {
  await loadServers()
  notifySuccess(
    'License Management',
    `The license is successfully updated to ${updated?.license || 'new tier'}.`,
  )
}

watch(
  () => route.fullPath,
  () => {
    applyRouteQuery()
  },
)

onMounted(() => {
  void loadServers().then(() => {
    applyRouteQuery()
  })
})
</script>

<style scoped>
.license-view {
  max-width: 1680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.license-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.meta-pill {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 0.5px solid var(--app-border);
  color: var(--app-text-muted);
  background: var(--app-surface-muted, var(--app-surface));
}

.meta-pill.license {
  color: var(--dorian-viper-400, var(--app-accent));
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 35%, var(--app-border));
}

@media (max-width: 900px) {
  .license-meta {
    margin-left: 0;
    width: 100%;
  }
}
</style>
