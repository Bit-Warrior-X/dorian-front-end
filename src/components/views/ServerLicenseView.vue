<template>
  <div class="dashboard-view license-view">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <p class="dash-kicker">Billing</p>
        <h2>License</h2>
        <p>Pick a tier for this edge. Apply regenerates the license and runs a license-only deploy.</p>
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
      <div v-if="selectedServerData" class="license-filter-summary">
        <span class="dash-live-dot" aria-hidden="true"></span>
        {{ selectedServerData.name || 'Edge' }} · {{ currentTierLabel }}
      </div>
    </div>

    <template v-if="selectedServerData">
      <section class="license-command" aria-label="Current license">
        <div class="license-command__identity">
          <span class="license-command__icon" :class="currentTierAccent" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
              <path d="M9.5 12.2l1.8 1.8 3.7-3.8" />
            </svg>
          </span>
          <div class="license-command__copy">
            <p class="license-command__kicker">Current plan</p>
            <h3>{{ currentTierLabel }}</h3>
            <p>{{ currentTierHint }}</p>
          </div>
        </div>

        <div class="license-kpi-strip" role="list">
          <div class="license-kpi tone-signal" role="listitem">
            <span class="license-kpi__label">Edge</span>
            <span class="license-kpi__value">{{ selectedServerData.name || '—' }}</span>
            <span class="license-kpi__hint">{{ selectedServerData.ip || 'host bound' }}</span>
          </div>
          <div class="license-kpi tone-l4" role="listitem">
            <span class="license-kpi__label">L4</span>
            <span class="license-kpi__value">{{ layerDotTitle(selectedServerData, 'l4') }}</span>
            <span class="license-kpi__hint">
              <LayerStatusDot
                layer="l4"
                :status="resolveLayerStatus(selectedServerData, 'l4')"
                :description="layerDotDescription(selectedServerData, 'l4')"
              />
              network protection
            </span>
          </div>
          <div class="license-kpi tone-l7" role="listitem">
            <span class="license-kpi__label">L7</span>
            <span class="license-kpi__value">{{ layerDotTitle(selectedServerData, 'l7') }}</span>
            <span class="license-kpi__hint">
              <LayerStatusDot
                layer="l7"
                :status="resolveLayerStatus(selectedServerData, 'l7')"
                :description="layerDotDescription(selectedServerData, 'l7')"
              />
              application security
            </span>
          </div>
          <div class="license-kpi tone-warn" role="listitem">
            <span class="license-kpi__label">Angelos</span>
            <span class="license-kpi__value">{{ angelosStatusLabel(selectedServerData) }}</span>
            <span class="license-kpi__hint">{{ expiryLabel }}</span>
          </div>
        </div>
      </section>

      <section class="dash-panel license-plans-panel">
        <div class="dash-panel-head">
          <h3>
            <span class="license-panel-icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 5h12M4 3v10M12 3v10M2 11h12" />
              </svg>
            </span>
            Choose a plan
            <span class="license-panel-hint">per edge · Monthly or Annual</span>
          </h3>
        </div>

        <LicenseTierUpgradePanel
          :server="selectedServerData"
          :show-cancel="false"
          ok-label="Apply license"
          @success="onLicenseTierSuccess"
        />
      </section>
    </template>

    <section v-else class="dash-panel license-empty">
      <span class="license-empty__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
        </svg>
      </span>
      <h3>Select an edge</h3>
      <p>Choose a target edge above to review pricing and change its license tier.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchServers } from '@/api/servers'
import { notifySuccess } from '@/utils/notify'
import { normalizeLicenseTier } from '@/data/licensePlans'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import LicenseTierUpgradePanel from '../LicenseTierUpgradePanel.vue'
import LayerStatusDot from '../LayerStatusDot.vue'
import {
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

const currentTier = computed(() => normalizeLicenseTier(selectedServerData.value?.license))

const currentTierLabel = computed(() => {
  const tier = currentTier.value
  if (tier === 'Trial') return 'Trial'
  if (tier === 'Unified') return 'Unified'
  return tier
})

const currentTierAccent = computed(() => {
  const tier = currentTier.value
  if (tier === 'L4') return 'l4'
  if (tier === 'L7') return 'l7'
  if (tier === 'Unified') return 'unified'
  return 'trial'
})

const currentTierHint = computed(() => {
  switch (currentTier.value) {
    case 'L4':
      return 'Network protection is licensed for this host.'
    case 'L7':
      return 'Application security is licensed for this host.'
    case 'Unified':
      return 'Full L4 + L7 stack on one license.'
    default:
      return 'Evaluation license · upgrade before it expires for production use.'
  }
})

const expiryLabel = computed(() => {
  const raw =
    selectedServerData.value?.expired ||
    selectedServerData.value?.expireDate ||
    selectedServerData.value?.expiresAt ||
    ''
  if (!raw) return 'license bound to this host'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return String(raw)
  return `expires ${date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}`
})

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

.dash-kicker {
  margin: 0 0 4px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.license-filter-summary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  font-size: 12px;
  color: var(--app-text-muted);
  padding-bottom: 2px;
}

.license-command {
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(0, 2.2fr);
  gap: 14px;
  align-items: stretch;
  padding: 14px 16px;
  border-radius: 12px;
  border: 0.5px solid var(--app-border);
  background:
    radial-gradient(ellipse at 0% 0%, color-mix(in srgb, var(--dorian-viper-400, var(--app-accent)) 12%, transparent) 0%, transparent 55%),
    var(--app-surface);
}

.license-command__identity {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.license-command__icon {
  --icon-tone: var(--dorian-l4, #6b9fd4);
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: inline-grid;
  place-items: center;
  color: var(--icon-tone);
  background: color-mix(in srgb, var(--icon-tone) 14%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--icon-tone) 28%, var(--app-border));
  flex-shrink: 0;
}

.license-command__icon.l4 { --icon-tone: var(--dorian-l4, #6b9fd4); }
.license-command__icon.l7 { --icon-tone: var(--dorian-l7, #8fa3b8); }
.license-command__icon.unified { --icon-tone: var(--dorian-viper-400, var(--app-accent)); }
.license-command__icon.trial { --icon-tone: var(--dorian-warn, #e0a83f); }

.license-command__icon svg {
  width: 22px;
  height: 22px;
}

.license-command__kicker {
  margin: 0 0 2px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.license-command__copy h3 {
  margin: 0 0 4px;
  font-size: var(--type-section-title);
  font-weight: 650;
  color: var(--app-heading);
}

.license-command__copy p {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--app-text-muted);
}

.license-kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.license-kpi {
  --kpi-tone: var(--app-border);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 11px 12px 11px 14px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
  min-width: 0;
  overflow: hidden;
}

.license-kpi::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 2px;
  border-radius: 2px;
  background: var(--kpi-tone);
}

.license-kpi.tone-signal { --kpi-tone: var(--dorian-viper-400, var(--app-accent)); }
.license-kpi.tone-l4 { --kpi-tone: var(--dorian-l4, #6b9fd4); }
.license-kpi.tone-l7 { --kpi-tone: var(--dorian-l7, #8fa3b8); }
.license-kpi.tone-warn { --kpi-tone: var(--dorian-warn, #e0a83f); }

.license-kpi__label {
  display: block;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  margin-bottom: 4px;
}

.license-kpi__value {
  display: block;
  font-size: 15px;
  font-weight: 650;
  color: var(--app-heading);
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.license-kpi__hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  font-size: 11px;
  color: var(--app-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.license-plans-panel {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--dorian-viper-400, var(--app-accent)) 6%, transparent) 0%, transparent 34%),
    var(--app-surface);
}

.license-plans-panel .dash-panel-head {
  margin-bottom: 14px;
}

.license-plans-panel .dash-panel-head h3 {
  color: var(--app-heading);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.license-panel-icon {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: inline-grid;
  place-items: center;
  color: var(--dorian-viper-400, var(--app-accent));
  background: color-mix(in srgb, var(--dorian-viper-400, var(--app-accent)) 14%, transparent);
}

.license-panel-icon svg {
  width: 12px;
  height: 12px;
}

.license-panel-hint {
  font-size: var(--type-small, 11px);
  font-weight: 400;
  color: var(--app-text-muted);
}

.license-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 48px 24px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--dorian-viper-400, var(--app-accent)) 5%, transparent) 0%, transparent 50%),
    var(--app-surface);
}

.license-empty__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--dorian-viper-400, var(--app-accent));
  background: color-mix(in srgb, var(--dorian-viper-400, var(--app-accent)) 12%, transparent);
  margin-bottom: 4px;
}

.license-empty__icon svg {
  width: 22px;
  height: 22px;
}

.license-empty h3 {
  margin: 0;
  font-size: var(--type-section-title);
  color: var(--app-heading);
}

.license-empty p {
  margin: 0;
  max-width: 360px;
  font-size: 13px;
  color: var(--app-text-muted);
  line-height: 1.45;
}

@media (max-width: 1300px) {
  .license-command {
    grid-template-columns: 1fr;
  }

  .license-kpi-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .license-filter-summary {
    margin-left: 0;
    width: 100%;
  }

  .license-kpi-strip {
    grid-template-columns: 1fr;
  }
}
</style>
