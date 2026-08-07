<template>
  <div class="sites-view">
    <div class="content-card filter-card">
      <div class="filter-row">
        <label class="filter-label" for="site-settings-target">Target site</label>
        <select
          id="site-settings-target"
          class="filter-select"
          v-model="selectedSiteId"
          @change="onSiteSelected"
        >
          <option disabled value="">Select a site</option>
          <option v-for="site in siteOptions" :key="site.id" :value="String(site.id)">
            {{ site.domain }}
          </option>
        </select>
        <div v-if="loadedSite" class="filter-meta">
          <span class="meta-pill status" :class="siteStatusClass(loadedSite.status)">
            {{ siteStatusLabel(loadedSite.status) }}
          </span>
          <span v-if="loadedSite.wafName" class="meta-pill license">WAF Rule: {{ loadedSite.wafName }}</span>
          <span class="meta-pill license">Edges: {{ (loadedSite.serverIds || []).length }}</span>
        </div>
      </div>
    </div>

    <div v-if="selectedSiteId" class="content-card settings-card">
      <div class="settings-tabs">
        <div class="tabs-header">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            type="button"
            :disabled="tab.id === 'waf' && !selectedSiteId"
            @click="onTabClick(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>
        <div
          class="tabs-body"
          :class="{
            'no-outline':
              activeTab === 'general'
              || activeTab === 'origin'
              || activeTab === 'waf'
              || activeTab === 'traffic',
          }"
        >
          <div v-if="activeTab === 'general' && loadedSite" class="site-overview">
            <header class="overview-hero">
              <div class="overview-hero__main">
                <p class="overview-kicker">Site overview</p>
                <h2 class="overview-domain">{{ loadedSite.domain }}</h2>
                <p class="overview-summary">{{ overviewSummary }}</p>
                <div class="overview-badges">
                  <span class="overview-pill overview-pill--status" :class="siteStatusClass(loadedSite.status)">
                    {{ siteStatusLabel(loadedSite.status) }}
                  </span>
                  <span class="overview-pill overview-pill--cert" :class="certStatusClass(loadedSite.certificateStatus)">
                    SSL {{ formatCertStatus(loadedSite.certificateStatus) }}
                  </span>
                  <span
                    v-if="loadedSite.wafName"
                    class="overview-pill overview-pill--waf"
                    :class="wafRolePillClass(loadedSite.wafRole)"
                  >
                    {{ loadedSite.wafName }}
                  </span>
                </div>
              </div>
              <div class="overview-actions">
                <button class="overview-action-btn" type="button" @click="onTabClick('origin')">
                  Open Origin
                </button>
                <button class="overview-action-btn" type="button" @click="onTabClick('traffic')">
                  Open Traffic
                </button>
                <button class="overview-action-btn overview-action-btn--primary" type="button" @click="onTabClick('waf')">
                  Open WAF
                </button>
              </div>
            </header>

            <div class="overview-metrics">
              <article class="metric">
                <span class="metric__label">Cache hit ratio</span>
                <strong class="metric__value">{{ formatCacheRatio(loadedSite.cacheRatio) }}</strong>
                <span class="metric__hint">How often responses are served from CDN cache</span>
              </article>
              <article class="metric">
                <span class="metric__label">Bandwidth limit</span>
                <strong class="metric__value">{{ formatBandwidth(loadedSite.bandwidth) }}</strong>
                <span class="metric__hint">Configured traffic ceiling for this site</span>
              </article>
              <article class="metric">
                <span class="metric__label">Edges</span>
                <strong class="metric__value">{{ assignedServers.length }}</strong>
                <span class="metric__hint">{{ edgesMetricHint }}</span>
              </article>
              <article class="metric">
                <span class="metric__label">Last updated</span>
                <strong class="metric__value metric__value--sm">{{ formatOverviewDate(loadedSite.updatedAt) }}</strong>
                <span class="metric__hint">Created {{ formatOverviewDate(loadedSite.createdAt) }}</span>
              </article>
            </div>

            <div class="overview-sections">
              <section class="overview-section">
                <div class="overview-section__head">
                  <div>
                    <h3>SSL &amp; certificate</h3>
                    <p>{{ sslSectionHint }}</p>
                  </div>
                  <button class="panel-link-btn" type="button" @click="onTabClick('origin')">Manage</button>
                </div>
                <div class="detail-grid">
                  <div class="detail">
                    <span class="detail__label">Provider</span>
                    <span class="detail__value">{{ formatSslType(loadedSite.sslType) }}</span>
                  </div>
                  <div class="detail">
                    <span class="detail__label">Status</span>
                    <span class="detail__value">
                      <span class="overview-pill overview-pill--cert" :class="certStatusClass(loadedSite.certificateStatus)">
                        {{ formatCertStatus(loadedSite.certificateStatus) }}
                      </span>
                    </span>
                  </div>
                  <div class="detail">
                    <span class="detail__label">Expires</span>
                    <span class="detail__value">{{ formatOverviewDate(loadedSite.certificateExpiry) }}</span>
                  </div>
                  <div class="detail">
                    <span class="detail__label">Certificate source</span>
                    <span class="detail__value">{{ hasManualSsl(loadedSite) ? 'Manual upload' : 'Automatic / none' }}</span>
                  </div>
                </div>
              </section>

              <section class="overview-section">
                <div class="overview-section__head">
                  <div>
                    <h3>WAF protection</h3>
                    <p>{{ wafSectionHint }}</p>
                  </div>
                  <button class="panel-link-btn" type="button" @click="onTabClick('waf')">Manage</button>
                </div>
                <div class="detail-grid">
                  <div class="detail">
                    <span class="detail__label">Active rule</span>
                    <span class="detail__value">{{ loadedSite.wafName || 'Not assigned' }}</span>
                  </div>
                  <div class="detail">
                    <span class="detail__label">Type</span>
                    <span class="detail__value">
                      <span v-if="loadedSite.wafRole" class="role-pill" :class="wafRolePillClass(loadedSite.wafRole)">
                        {{ formatWafRole(loadedSite.wafRole) }}
                      </span>
                      <span v-else class="detail__muted">—</span>
                    </span>
                  </div>
                </div>
              </section>

              <section class="overview-section overview-section--wide">
                <div class="overview-section__head">
                  <div>
                    <h3>Assigned edges</h3>
                    <p>Edges that currently serve this domain.</p>
                  </div>
                  <button class="panel-link-btn" type="button" @click="onTabClick('traffic')">Manage traffic</button>
                </div>
                <div v-if="assignedServers.length" class="edge-chips">
                  <div v-for="server in assignedServers" :key="server.id" class="edge-chip">
                    <span class="edge-chip__dot" aria-hidden="true"></span>
                    <span class="edge-chip__name">{{ server.name }}</span>
                  </div>
                </div>
                <p v-else class="info-empty">
                  No edges assigned yet. Assign edges when editing the site, then configure Traffic.
                </p>
              </section>
            </div>
          </div>

          <div v-else-if="activeTab === 'general'" class="site-overview-empty">
            <p>Select a site to view its overview.</p>
          </div>

          <SiteOriginPanel
            v-else-if="activeTab === 'origin'"
            :site-id="selectedSiteId"
            @updated="onOriginUpdated"
          />

          <div v-else-if="activeTab === 'waf' && !canShowWafPanel" class="waf-fork-prompt">
            <h3>Predefined WAF Rule</h3>
            <p>
              This site uses the predefined WAF rule
              <strong>{{ loadedSite?.wafName || '—' }}</strong>.
              Modifying it will create a custom copy for this site only.
            </p>
            <button
              class="primary-btn"
              type="button"
              :disabled="isForkingWaf || !loadedSite"
              @click="openWafModifyConfirm"
            >
              Modify WAF Rule
            </button>
          </div>

          <WafPanel v-else-if="activeTab === 'waf' && canShowWafPanel" :key="wafPanelKey" :site-id="selectedSiteId" />
          <TrafficPanel v-else-if="activeTab === 'traffic'" :site-id="selectedSiteId" />
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model="isWafModifyConfirmOpen"
      title="Modify WAF Rule"
      :message="wafModifyConfirmMessage"
      confirm-text="Yes"
      cancel-text="No"
      @confirm="confirmWafModify"
      @cancel="cancelWafModify"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchSite, fetchSites, forkSiteWafRule } from '@/api/sites'
import { notifyError, notifySuccess } from '@/utils/notify'
import ConfirmDialog from '../ConfirmDialog.vue'
import SiteOriginPanel from './SiteOriginPanel.vue'
import WafPanel from './WafPanel.vue'
import TrafficPanel from './TrafficPanel.vue'

const SETTINGS_TITLE = 'Site Settings'

const route = useRoute()
const router = useRouter()

const siteOptions = ref([])
const selectedSiteId = ref('')
const loadedSite = ref(null)
const activeTab = ref('general')
const isWafModifyConfirmOpen = ref(false)
const isForkingWaf = ref(false)
const pendingWafTab = ref(false)
const wafEditUnlocked = ref(false)
const wafPanelKey = ref(0)

const isPredefinedWaf = computed(() =>
  String(loadedSite.value?.wafRole || '').toLowerCase() === 'predefined',
)

const canShowWafPanel = computed(() => wafEditUnlocked.value)

const wafModifyConfirmMessage = computed(() => {
  const ruleName = loadedSite.value?.wafName || 'this WAF rule'
  return `This site uses the predefined WAF rule "${ruleName}". Modifying it will create a custom copy for this site only. Do you want to modify the current WAF rule?`
})

const tabs = [
  { id: 'general', label: 'Overview' },
  { id: 'origin', label: 'Origin' },
  { id: 'waf', label: 'WAF' },
  { id: 'traffic', label: 'Traffic' },
]

const assignedServers = computed(() => {
  const site = loadedSite.value
  if (!site) return []
  const ids = site.serverIds || []
  const names = site.servers || []
  return ids.map((id, index) => ({
    id,
    name: names[index] || `Edge ${index + 1}`,
  }))
})

const overviewSummary = computed(() => {
  const site = loadedSite.value
  if (!site) return ''
  const enabled = String(site.status || '').toUpperCase() === 'ENABLE'
  const edges = assignedServers.value.length
  const waf = site.wafName ? `protected by ${site.wafName}` : 'without an assigned WAF rule'
  const edgeText =
    edges === 0
      ? 'not assigned to any edges yet'
      : edges === 1
        ? 'served by 1 edge'
        : `served by ${edges} edges`
  return `${enabled ? 'Enabled' : 'Disabled'} site, ${edgeText}, ${waf}.`
})

const edgesMetricHint = computed(() => {
  const names = assignedServers.value.map((server) => server.name).filter(Boolean)
  if (!names.length) return 'No edges assigned'
  if (names.length <= 2) return names.join(' · ')
  return `${names.slice(0, 2).join(' · ')} +${names.length - 2} more`
})

const sslSectionHint = computed(() => {
  const site = loadedSite.value
  if (!site) return ''
  const status = String(site.certificateStatus || 'none').toLowerCase()
  if (status === 'valid') return 'Certificate looks healthy for HTTPS traffic.'
  if (status === 'expiring') return 'Certificate is approaching expiry — renew soon.'
  if (status === 'expired') return 'Certificate has expired and may break HTTPS.'
  return 'No active certificate configured for this site.'
})

const wafSectionHint = computed(() => {
  const site = loadedSite.value
  if (!site?.wafName) return 'Assign a WAF rule to filter malicious requests.'
  if (String(site.wafRole || '').toLowerCase() === 'predefined') {
    return 'Using a shared predefined rule. Editing creates a custom copy for this site.'
  }
  return 'Using a custom rule set dedicated to this site.'
})

const siteStatusClass = (status) => {
  const normalized = String(status || '').toUpperCase()
  return normalized === 'ENABLE' ? 'on' : 'off'
}

const siteStatusLabel = (status) => {
  const normalized = String(status || '').toUpperCase()
  return normalized === 'ENABLE' ? 'Enabled' : 'Disabled'
}

const formatOverviewDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatCacheRatio = (value) => {
  const ratio = Number(value)
  if (!Number.isFinite(ratio)) return '0%'
  return `${ratio.toFixed(ratio % 1 === 0 ? 0 : 2)}%`
}

const formatBandwidth = (value) => {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const formatSslType = (value) => {
  const map = {
    none: 'Not Configured',
    letsencrypt: "Let's Encrypt",
    zerossl: 'ZeroSSL',
    googletrust: 'Google Trust',
    custom: 'Manual Configuration',
    managed: 'Managed',
  }
  return map[String(value || 'none').toLowerCase()] || String(value || '—')
}

const formatCertStatus = (value) => {
  const normalized = String(value || 'none').toLowerCase()
  const map = {
    none: 'None',
    valid: 'Valid',
    expiring: 'Expiring',
    expired: 'Expired',
  }
  return map[normalized] || normalized
}

const certStatusClass = (value) => {
  const normalized = String(value || 'none').toLowerCase()
  if (normalized === 'valid') return 'is-valid'
  if (normalized === 'expiring') return 'is-expiring'
  if (normalized === 'expired') return 'is-expired'
  return 'is-none'
}

const formatWafRole = (role) =>
  String(role || '').toLowerCase() === 'predefined' ? 'Predefined' : 'Custom'

const wafRolePillClass = (role) =>
  String(role || '').toLowerCase() === 'predefined' ? 'role-pill--predefined' : 'role-pill--custom'

const hasManualSsl = (site) =>
  String(site?.sslType || '').toLowerCase() === 'custom'
    && Boolean(String(site?.sslCert || '').trim())

const applyLoadedSite = (site) => {
  loadedSite.value = site
  wafEditUnlocked.value = String(site.wafRole || '').toLowerCase() !== 'predefined'
}

const onOriginUpdated = (site) => {
  if (!site) return
  applyLoadedSite(site)
  const index = siteOptions.value.findIndex((item) => String(item.id) === String(site.id))
  if (index !== -1) {
    siteOptions.value[index] = { ...siteOptions.value[index], ...site }
  }
  window.dispatchEvent(new CustomEvent('cdnproxy-sites-changed'))
}

const syncRouteTab = async (tabId) => {
  const query = { ...route.query }
  if (tabId === 'general') {
    delete query.tab
  } else {
    query.tab = tabId
  }
  await router.replace({ query })
}

const openWafModifyConfirm = () => {
  pendingWafTab.value = true
  isWafModifyConfirmOpen.value = true
}

const onTabClick = async (tabId) => {
  if (tabId === 'waf') {
    if (!loadedSite.value) {
      notifyError(SETTINGS_TITLE, 'Site details are still loading. Please try again.')
      return
    }
    activeTab.value = 'waf'
    await syncRouteTab('waf')
    if (isPredefinedWaf.value && !wafEditUnlocked.value) {
      openWafModifyConfirm()
    }
    return
  }
  activeTab.value = tabId
  await syncRouteTab(tabId)
}

const confirmWafModify = async () => {
  if (!selectedSiteId.value || !loadedSite.value?.wafId || isForkingWaf.value) return

  isForkingWaf.value = true
  try {
    const updated = await forkSiteWafRule(selectedSiteId.value)
    applyLoadedSite(updated)
    const index = siteOptions.value.findIndex((site) => site.id === updated.id)
    if (index !== -1) {
      siteOptions.value[index] = updated
    }

    wafEditUnlocked.value = true
    wafPanelKey.value += 1
    window.dispatchEvent(new CustomEvent('cdnproxy-sites-changed'))
    activeTab.value = 'waf'
    pendingWafTab.value = false
    await syncRouteTab('waf')
    notifySuccess(SETTINGS_TITLE, 'A custom WAF rule copy was created for this site.')
  } catch (error) {
    notifyError(SETTINGS_TITLE, error?.message || 'WAF rule could not be duplicated for this site.')
  } finally {
    isForkingWaf.value = false
  }
}

const cancelWafModify = () => {
  pendingWafTab.value = false
}

const tryOpenPendingWafTab = async () => {
  if (!pendingWafTab.value || !loadedSite.value) return
  pendingWafTab.value = false
  activeTab.value = 'waf'
  await syncRouteTab('waf')
  if (isPredefinedWaf.value && !wafEditUnlocked.value) {
    openWafModifyConfirm()
  }
}

const loadSites = async () => {
  try {
    const data = await fetchSites()
    siteOptions.value = Array.isArray(data) ? data : []
  } catch (error) {
    siteOptions.value = []
    notifyError(SETTINGS_TITLE, error?.message || 'Sites could not be loaded.')
  }
}

const loadSelectedSite = async () => {
  if (!selectedSiteId.value) {
    loadedSite.value = null
    pendingWafTab.value = false
    wafEditUnlocked.value = false
    return
  }

  try {
    const site = await fetchSite(selectedSiteId.value)
    applyLoadedSite(site)
    await tryOpenPendingWafTab()
  } catch (error) {
    notifyError(SETTINGS_TITLE, error?.message || 'Site could not be loaded.')
  }
}

const onSiteSelected = async () => {
  const keepPendingWafTab = String(route.query.tab || '').toLowerCase() === 'waf'
  pendingWafTab.value = keepPendingWafTab
  wafEditUnlocked.value = false
  if (activeTab.value === 'waf' && !keepPendingWafTab) {
    activeTab.value = 'general'
  }
  const query = { ...route.query }
  if (selectedSiteId.value) {
    query.siteId = selectedSiteId.value
  } else {
    delete query.siteId
  }
  await router.replace({ query })
  await loadSelectedSite()
}

const applyRouteQuery = () => {
  const tab = String(route.query.tab || '').toLowerCase()
  if (tab === 'waf') {
    pendingWafTab.value = true
    if (loadedSite.value && wafEditUnlocked.value) {
      activeTab.value = 'waf'
      pendingWafTab.value = false
    } else if (loadedSite.value) {
      activeTab.value = 'waf'
    } else {
      activeTab.value = 'general'
    }
  } else if (tab === 'traffic') {
    pendingWafTab.value = false
    activeTab.value = 'traffic'
  } else if (tab === 'origin') {
    pendingWafTab.value = false
    activeTab.value = 'origin'
  } else if (tab) {
    pendingWafTab.value = false
    activeTab.value = 'general'
  } else if (activeTab.value === 'waf' && !wafEditUnlocked.value && isPredefinedWaf.value) {
    pendingWafTab.value = false
  }

  const siteId = route.query.siteId
  if (siteId != null && String(siteId).trim() !== '') {
    selectedSiteId.value = String(siteId)
  }
}

watch(
  () => route.fullPath,
  () => {
    applyRouteQuery()
    if (selectedSiteId.value) {
      void loadSelectedSite()
    }
  },
)

onMounted(async () => {
  await loadSites()
  applyRouteQuery()
  if (!selectedSiteId.value && siteOptions.value.length) {
    selectedSiteId.value = String(siteOptions.value[0].id)
    await onSiteSelected()
  } else if (selectedSiteId.value) {
    await loadSelectedSite()
  }
})
</script>

<style scoped>
.sites-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-card {
  background: var(--app-surface);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
}

.filter-card {
  padding-bottom: 20px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.filter-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-text-secondary);
}

.filter-select {
  min-width: 220px;
  border-radius: 12px;
  border: 1px solid var(--app-input-border);
  padding: 8px 12px;
  font-size: 0.95rem;
  color: var(--app-text);
  background: var(--app-input-bg);
  box-shadow: 0 1px 6px var(--app-shadow);
}

.filter-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.meta-pill.status.on {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.meta-pill.status.off {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.meta-pill.license {
  background: var(--app-surface-muted);
  color: var(--app-text-secondary);
}

.settings-tabs {
  border-top: none;
  padding-top: 0;
}

.tabs-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.tab-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  color: var(--app-text-muted);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: var(--app-accent-soft);
  border-color: var(--app-accent);
  color: var(--app-accent);
  box-shadow: 0 6px 14px rgba(124, 58, 237, 0.15);
}

.tab-btn:hover:not(.active):not(:disabled) {
  border-color: var(--app-border-strong);
  color: var(--app-text);
  background: var(--app-surface-hover);
}

.tab-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.tabs-body {
  border: 1px solid var(--app-border-strong);
  border-radius: 14px;
  overflow: visible;
  background: var(--app-surface);
}

.tabs-body.no-outline {
  border: none;
  border-radius: 0;
  background: transparent;
  overflow: visible;
}

.site-overview {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.site-overview-empty {
  padding: 48px 24px;
  text-align: center;
  color: var(--app-text-muted);
  font-size: 0.95rem;
}

.overview-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background:
    radial-gradient(120% 140% at 0% 0%, rgba(14, 165, 233, 0.1), transparent 55%),
    linear-gradient(180deg, var(--app-surface-muted), var(--app-surface-solid));
}

.overview-kicker {
  margin: 0 0 6px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.overview-domain {
  margin: 0 0 8px;
  font-size: clamp(1.45rem, 2.6vw, 1.95rem);
  font-weight: 700;
  line-height: 1.15;
  color: var(--app-heading);
  word-break: break-word;
}

.overview-summary {
  margin: 0 0 14px;
  max-width: 52rem;
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--app-text-secondary);
}

.overview-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.overview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.overview-action-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  color: var(--app-text-secondary);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.overview-action-btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.overview-action-btn--primary {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.overview-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  min-height: 118px;
}

.metric__label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.metric__value {
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1.15;
  color: var(--app-heading);
}

.metric__value--sm {
  font-size: 1.05rem;
}

.metric__hint {
  margin-top: auto;
  font-size: 0.8rem;
  line-height: 1.35;
  color: var(--app-text-muted);
}

.overview-sections {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.overview-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
}

.overview-section--wide {
  grid-column: 1 / -1;
}

.overview-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.overview-section__head h3 {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 650;
  color: var(--app-heading);
}

.overview-section__head p {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.4;
  color: var(--app-text-muted);
}

.panel-link-btn {
  border: none;
  background: transparent;
  color: var(--app-accent);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  white-space: nowrap;
}

.panel-link-btn:hover {
  text-decoration: underline;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail__label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.detail__value {
  font-size: 0.94rem;
  font-weight: 600;
  color: var(--app-text);
}

.detail__muted {
  color: var(--app-text-muted);
  font-weight: 500;
}

.info-empty {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--app-text-muted);
}

.edge-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.edge-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
}

.edge-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22c55e;
}

.edge-chip__name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--app-text);
}

.overview-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 11px;
  font-size: 0.78rem;
  font-weight: 600;
}

.overview-pill--status.on {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}

.overview-pill--status.off {
  background: rgba(239, 68, 68, 0.14);
  color: #b91c1c;
}

.overview-pill--cert.is-valid {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}

.overview-pill--cert.is-expiring {
  background: rgba(245, 158, 11, 0.16);
  color: #b45309;
}

.overview-pill--cert.is-expired {
  background: rgba(239, 68, 68, 0.14);
  color: #b91c1c;
}

.overview-pill--cert.is-none {
  background: var(--app-surface-solid);
  color: var(--app-text-muted);
  border: 1px solid var(--app-border);
}

.overview-pill--waf.role-pill--predefined,
.overview-pill.role-pill--predefined {
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.14);
  border: 1px solid rgba(59, 130, 246, 0.28);
}

.overview-pill--waf.role-pill--custom,
.overview-pill.role-pill--custom {
  color: #0f766e;
  background: rgba(20, 184, 166, 0.14);
  border: 1px solid rgba(20, 184, 166, 0.28);
}

.role-pill {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
}

.role-pill--predefined {
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.16);
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.role-pill--custom {
  color: #0f766e;
  background: rgba(20, 184, 166, 0.16);
  border: 1px solid rgba(20, 184, 166, 0.35);
}

:global([data-theme='dark']) .role-pill.role-pill--predefined,
:global([data-theme='dark']) .overview-pill.role-pill--predefined {
  color: #93c5fd !important;
  background: rgba(59, 130, 246, 0.22) !important;
  border-color: rgba(59, 130, 246, 0.45) !important;
}

:global([data-theme='dark']) .role-pill.role-pill--custom,
:global([data-theme='dark']) .overview-pill.role-pill--custom {
  color: #5eead4 !important;
  background: rgba(20, 184, 166, 0.18) !important;
  border-color: rgba(45, 212, 191, 0.42) !important;
}

@media (max-width: 1100px) {
  .overview-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .overview-metrics,
  .overview-sections,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .overview-section--wide {
    grid-column: auto;
  }
}

.waf-fork-prompt {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
}

.waf-fork-prompt h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--app-heading);
}

.waf-fork-prompt p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.5;
}
</style>
