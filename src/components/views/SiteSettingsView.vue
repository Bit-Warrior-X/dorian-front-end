<template>
  <div class="cfg-view">
    <header class="cfg-topbar">
      <div class="cfg-topbar__left">
        <p class="cfg-kicker">Delivery</p>
        <h2>Configure site</h2>
        <p>{{ configureSubtitle }}</p>
      </div>
      <div class="cfg-topbar__right">
        <div class="cfg-site-picker">
          <label for="site-settings-target">Site</label>
          <select
            id="site-settings-target"
            v-model="selectedSiteId"
            @change="onSiteSelected"
          >
            <option disabled value="">Select a site</option>
            <option v-for="site in siteOptions" :key="site.id" :value="String(site.id)">
              {{ site.domain }}
            </option>
          </select>
        </div>
      </div>
    </header>

    <div v-if="!selectedSiteId" class="cfg-empty">
      <h3>Choose a site to configure</h3>
      <p>Pick a hostname above to manage SSL, origins, WAF protection, and edge traffic.</p>
    </div>

    <template v-else>
      <section v-if="loadedSite" class="cfg-statusbar" aria-label="Site status">
        <div class="cfg-status-domain">
          <strong>{{ loadedSite.domain }}</strong>
          <span>{{ overviewSummary }}</span>
        </div>
        <div class="cfg-status-pills">
          <span class="cfg-pill" :class="siteStatusClass(loadedSite.status)">
            {{ siteStatusLabel(loadedSite.status) }}
          </span>
          <span
            class="cfg-activity"
            :class="`cfg-activity--${siteActivityTone(loadedSite)}`"
            :title="siteActivityTitle(loadedSite)"
          >
            <span class="cfg-activity__dot" aria-hidden="true"></span>
            {{ siteActivityLabel(loadedSite) }}
          </span>
          <span class="cfg-pill cfg-pill--muted" :class="certStatusClass(loadedSite.certificateStatus)">
            SSL {{ formatCertStatus(loadedSite.certificateStatus) }}
          </span>
          <span v-if="loadedSite.wafName" class="cfg-pill cfg-pill--muted">
            {{ loadedSite.wafName }}
          </span>
          <span class="cfg-pill cfg-pill--muted">
            {{ assignedServers.length }} {{ assignedServers.length === 1 ? 'edge' : 'edges' }}
          </span>
        </div>
      </section>

      <nav class="cfg-tabs" aria-label="Configuration sections">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="cfg-tab"
          :class="{ active: activeTab === tab.id }"
          :disabled="tab.id === 'waf' && !selectedSiteId"
          @click="onTabClick(tab.id)"
        >
          <span class="cfg-tab__label">{{ tab.label }}</span>
          <span class="cfg-tab__hint">{{ tab.hint }}</span>
        </button>
      </nav>

      <section class="cfg-panel">
        <div v-if="activeTab === 'general' && loadedSite" class="cfg-overview">
          <p class="cfg-section-kicker">Live metrics</p>
          <div class="cfg-metrics">
            <article class="cfg-metric cfg-metric--signal">
              <span class="cfg-metric__label">Egress</span>
              <strong class="cfg-metric__value num">{{ formatLiveBandwidth(loadedSite.currentBandwidth) }}</strong>
              <span class="cfg-metric__hint">Latest L7 TX sample</span>
            </article>
            <article class="cfg-metric cfg-metric--ok">
              <span class="cfg-metric__label">Cache hit</span>
              <strong class="cfg-metric__value num">{{ formatCacheRatio(loadedSite.cacheRatio) }}</strong>
              <span class="cfg-metric__hint">CDN cache efficiency</span>
            </article>
            <article class="cfg-metric cfg-metric--l4">
              <span class="cfg-metric__label">Edges</span>
              <strong class="cfg-metric__value num">{{ assignedServers.length }}</strong>
              <span class="cfg-metric__hint">{{ edgesMetricHint }}</span>
            </article>
            <article class="cfg-metric cfg-metric--viper">
              <span class="cfg-metric__label">Updated</span>
              <strong class="cfg-metric__value cfg-metric__value--sm">{{ formatOverviewDate(loadedSite.updatedAt) }}</strong>
              <span class="cfg-metric__hint">Created {{ formatOverviewDate(loadedSite.createdAt) }}</span>
            </article>
          </div>

          <div class="cfg-sections">
            <section class="cfg-section">
              <div class="cfg-section__head">
                <div>
                  <h3>SSL &amp; certificate</h3>
                  <p>{{ sslSectionHint }}</p>
                </div>
                <div class="cfg-section__actions">
                  <button
                    class="cfg-btn cfg-btn--primary"
                    type="button"
                    :disabled="!canRenewCert || isRenewingCert || isCertIssuing(loadedSite.certificateStatus)"
                    :title="renewCertHint"
                    @click="renewCert"
                  >
                    {{ renewCertLabel }}
                  </button>
                  <button class="cfg-btn" type="button" @click="onTabClick('origin')">
                    Manage in Origin
                  </button>
                </div>
              </div>
              <div class="cfg-detail-grid">
                <div class="cfg-detail">
                  <span class="cfg-detail__label">Provider</span>
                  <span class="cfg-detail__value">{{ formatSslType(loadedSite.sslType) }}</span>
                </div>
                <div class="cfg-detail">
                  <span class="cfg-detail__label">Status</span>
                  <span class="cfg-detail__value">
                    <span class="cfg-pill" :class="certStatusClass(loadedSite.certificateStatus)">
                      {{ formatCertStatus(loadedSite.certificateStatus) }}
                    </span>
                  </span>
                </div>
                <div class="cfg-detail">
                  <span class="cfg-detail__label">Expires</span>
                  <span class="cfg-detail__value">{{ formatCertExpiry(loadedSite.certificateExpiry) }}</span>
                </div>
                <div class="cfg-detail">
                  <span class="cfg-detail__label">Source</span>
                  <span class="cfg-detail__value">{{ hasManualSsl(loadedSite) ? 'Manual upload' : 'Automatic / none' }}</span>
                </div>
                <div v-if="loadedSite.certificateError" class="cfg-detail cfg-detail--wide">
                  <span class="cfg-detail__label">Last error</span>
                  <span class="cfg-detail__value cfg-detail__value--error">{{ loadedSite.certificateError }}</span>
                </div>
              </div>
            </section>

            <section class="cfg-section">
              <div class="cfg-section__head">
                <div>
                  <h3>WAF protection</h3>
                  <p>{{ wafSectionHint }}</p>
                </div>
                <button class="cfg-btn" type="button" @click="onTabClick('waf')">
                  Open WAF
                </button>
              </div>
              <div class="cfg-detail-grid">
                <div class="cfg-detail">
                  <span class="cfg-detail__label">Active rule</span>
                  <span class="cfg-detail__value">{{ loadedSite.wafName || 'Not assigned' }}</span>
                </div>
                <div class="cfg-detail">
                  <span class="cfg-detail__label">Type</span>
                  <span class="cfg-detail__value">
                    <span v-if="loadedSite.wafRole" class="role-pill" :class="wafRolePillClass(loadedSite.wafRole)">
                      {{ formatWafRole(loadedSite.wafRole) }}
                    </span>
                    <span v-else class="cfg-muted">—</span>
                  </span>
                </div>
              </div>
            </section>

            <section class="cfg-section cfg-section--wide">
              <div class="cfg-section__head">
                <div>
                  <h3>Assigned edges</h3>
                  <p>Edge nodes that currently accept traffic for this domain.</p>
                </div>
                <button class="cfg-btn" type="button" @click="onTabClick('traffic')">
                  Manage traffic
                </button>
              </div>
              <div v-if="assignedServers.length" class="cfg-edges">
                <div v-for="server in assignedServers" :key="server.id" class="cfg-edge">
                  <span class="cfg-edge__dot" aria-hidden="true"></span>
                  <span>{{ server.name }}</span>
                </div>
              </div>
              <p v-else class="cfg-info-empty">
                No edges assigned yet. Open Traffic to attach edge nodes, or edit the site from All sites.
              </p>
            </section>
          </div>
        </div>

        <div v-else-if="activeTab === 'general'" class="cfg-panel-empty">
          <p>Loading site overview…</p>
        </div>

        <SiteOriginPanel
          v-else-if="activeTab === 'origin'"
          :site-id="selectedSiteId"
          @updated="onOriginUpdated"
        />

        <div v-else-if="activeTab === 'waf' && !canShowWafPanel" class="cfg-waf-prompt">
          <p class="cfg-section-kicker">Security</p>
          <h3>Predefined WAF rule</h3>
          <p>
            This site uses the shared rule
            <strong>{{ loadedSite?.wafName || '—' }}</strong>.
            Editing it creates a custom copy for this site only, so other sites stay unchanged.
          </p>
          <button
            class="cfg-btn cfg-btn--primary"
            type="button"
            :disabled="isForkingWaf || !loadedSite"
            @click="openWafModifyConfirm"
          >
            Customize WAF for this site
          </button>
        </div>

        <WafPanel v-else-if="activeTab === 'waf' && canShowWafPanel" :key="wafPanelKey" :site-id="selectedSiteId" />
        <TrafficPanel v-else-if="activeTab === 'traffic'" :site-id="selectedSiteId" />
      </section>
    </template>

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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchSite, fetchSites, forkSiteWafRule, renewSiteCertificate } from '@/api/sites'
import { notifyError, notifySuccess } from '@/utils/notify'
import { certStatusClass, certStatusDetail, formatCertExpiry, formatCertStatus, isCertIssuing } from '@/utils/certificate'
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
const isRenewingCert = ref(false)

const isPredefinedWaf = computed(() =>
  String(loadedSite.value?.wafRole || '').toLowerCase() === 'predefined',
)

const canShowWafPanel = computed(() => wafEditUnlocked.value)

const wafModifyConfirmMessage = computed(() => {
  const ruleName = loadedSite.value?.wafName || 'this WAF rule'
  return `This site uses the predefined WAF rule "${ruleName}". Modifying it will create a custom copy for this site only. Do you want to modify the current WAF rule?`
})

const tabs = [
  { id: 'general', label: 'Overview', hint: 'Status & shortcuts' },
  { id: 'origin', label: 'Origin', hint: 'Backend & SSL' },
  { id: 'waf', label: 'WAF', hint: 'Security rules' },
  { id: 'traffic', label: 'Traffic', hint: 'Edges & routing' },
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

const configureSubtitle = computed(() => {
  if (!loadedSite.value) {
    return 'Select a hostname to manage origins, SSL, WAF, and edge traffic.'
  }
  return `Configuring ${loadedSite.value.domain}`
})

const isSiteEnabled = (site) => String(site?.status || '').toUpperCase() === 'ENABLE'

const siteActivityKey = (site) => {
  if (!isSiteEnabled(site)) return 'offline'
  if (Number(site?.currentBandwidth) > 0) return 'active'
  return 'idle'
}

const siteActivityLabel = (site) => {
  const key = siteActivityKey(site)
  if (key === 'active') return 'Active'
  if (key === 'idle') return 'Idle'
  return 'Offline'
}

const siteActivityTone = (site) => siteActivityKey(site)

const siteActivityTitle = (site) => {
  const key = siteActivityKey(site)
  if (key === 'active') return 'Enabled and currently serving live L7 egress'
  if (key === 'idle') return 'Enabled, but no live egress in the latest sample'
  return 'Site is disabled'
}

const overviewSummary = computed(() => {
  const site = loadedSite.value
  if (!site) return ''
  const enabled = isSiteEnabled(site)
  const edges = assignedServers.value.length
  const waf = site.wafName ? `protected by ${site.wafName}` : 'without an assigned WAF rule'
  const edgeText =
    edges === 0
      ? 'not assigned to any edges yet'
      : edges === 1
        ? 'served by 1 edge'
        : `served by ${edges} edges`
  return `${enabled ? 'Enabled' : 'Disabled'} · ${edgeText} · ${waf}`
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
  if (site.certificateError) return site.certificateError
  return certStatusDetail(site.certificateStatus)
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

const formatLiveBandwidth = (kbps) => {
  const value = Number(kbps || 0)
  if (!Number.isFinite(value) || value <= 0) return '0 Kbps'
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} Gbps`
  if (value >= 1024) return `${(value / 1024).toFixed(1)} Mbps`
  return `${Math.round(value)} Kbps`
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

const formatWafRole = (role) =>
  String(role || '').toLowerCase() === 'predefined' ? 'Predefined' : 'Custom'

const wafRolePillClass = (role) =>
  String(role || '').toLowerCase() === 'predefined' ? 'role-pill--predefined' : 'role-pill--custom'

const hasManualSsl = (site) =>
  String(site?.sslType || '').toLowerCase() === 'custom'
    && Boolean(String(site?.sslCert || '').trim())

const canRenewCert = computed(() =>
  String(loadedSite.value?.sslType || '').toLowerCase() === 'letsencrypt',
)

const renewCertLabel = computed(() => {
  if (isRenewingCert.value || isCertIssuing(loadedSite.value?.certificateStatus)) {
    return 'Renewing...'
  }
  return 'Renew Cert'
})

const renewCertHint = computed(() => {
  const sslType = String(loadedSite.value?.sslType || '').toLowerCase()
  if (sslType === 'letsencrypt') {
    return 'Issue a new Let\'s Encrypt certificate using the current DNS-01 settings.'
  }
  if (sslType === 'custom') {
    return 'Manual certificates cannot be renewed automatically. Upload a new certificate in Origin.'
  }
  if (sslType === 'zerossl' || sslType === 'googletrust') {
    return 'Automatic renewal is only available for Let\'s Encrypt.'
  }
  return 'Select Let\'s Encrypt in Origin settings to renew automatically.'
})

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

const renewCert = async () => {
  if (!loadedSite.value?.id || !canRenewCert.value || isRenewingCert.value) return
  isRenewingCert.value = true
  try {
    const updated = await renewSiteCertificate(loadedSite.value.id)
    onOriginUpdated(updated || loadedSite.value)
    notifySuccess(SETTINGS_TITLE, "Let's Encrypt renewal started.")
  } catch (error) {
    notifyError(SETTINGS_TITLE, error?.message || 'Certificate could not be renewed.')
  } finally {
    isRenewingCert.value = false
  }
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

let certPollTimer = null
let siteLiveTimer = null
let siteLiveInFlight = false
const SITE_LIVE_REFRESH_MS = 15_000

const stopCertPoll = () => {
  if (certPollTimer) {
    clearInterval(certPollTimer)
    certPollTimer = null
  }
}

const stopSiteLivePoll = () => {
  if (siteLiveTimer) {
    clearInterval(siteLiveTimer)
    siteLiveTimer = null
  }
}

const refreshSiteLive = async () => {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  if (siteLiveInFlight) return
  siteLiveInFlight = true
  try {
    const data = await fetchSites()
    siteOptions.value = Array.isArray(data) ? data : []
    if (!selectedSiteId.value) return
    const site = await fetchSite(selectedSiteId.value)
    // Refresh overview metrics without broadcasting a global sites-changed event.
    if (loadedSite.value && String(loadedSite.value.id) === String(site.id)) {
      loadedSite.value = site
      const index = siteOptions.value.findIndex((item) => String(item.id) === String(site.id))
      if (index !== -1) {
        siteOptions.value[index] = { ...siteOptions.value[index], ...site }
      }
    } else {
      applyLoadedSite(site)
    }
  } catch {
    // Silent refresh — keep current view on transient errors.
  } finally {
    siteLiveInFlight = false
  }
}

const startSiteLivePoll = () => {
  stopSiteLivePoll()
  siteLiveTimer = window.setInterval(() => {
    void refreshSiteLive()
  }, SITE_LIVE_REFRESH_MS)
}

const onVisibilityChange = () => {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    void refreshSiteLive()
  }
}

watch(
  () => loadedSite.value?.certificateStatus,
  (status) => {
    if (!isCertIssuing(status) || !selectedSiteId.value) {
      stopCertPoll()
      return
    }
    if (certPollTimer) return
    certPollTimer = setInterval(async () => {
      try {
        const site = await fetchSite(selectedSiteId.value)
        onOriginUpdated(site)
      } catch {
        // Keep polling while renewal is in progress.
      }
    }, 1000)
  },
  { immediate: true },
)

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  await loadSites()
  applyRouteQuery()
  if (!selectedSiteId.value && siteOptions.value.length) {
    selectedSiteId.value = String(siteOptions.value[0].id)
    await onSiteSelected()
  } else if (selectedSiteId.value) {
    await loadSelectedSite()
  }
  startSiteLivePoll()
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  stopCertPoll()
  stopSiteLivePoll()
})
</script>

<style scoped>
.cfg-view {
  --cfg-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 1680px;
  margin: 0 auto;
  min-height: 100%;
  font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
}

.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

.cfg-topbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.cfg-kicker {
  margin: 0 0 3px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.cfg-topbar__left h2 {
  margin: 0 0 3px;
  font-size: 1.4rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--app-heading);
  line-height: 1.2;
}

.cfg-topbar__left p:last-child {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
}

.cfg-site-picker {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 240px;
}

.cfg-site-picker label {
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.cfg-site-picker select {
  border: 1px solid var(--app-input-border);
  border-radius: 6px;
  padding: 9px 12px;
  font-size: 13.5px;
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
  min-width: 260px;
}

.cfg-site-picker select:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft);
}

.cfg-empty,
.cfg-panel-empty {
  padding: 36px 20px;
  border: 1px solid var(--app-border);
  border-radius: var(--cfg-radius);
  background: var(--app-surface);
  text-align: center;
  color: var(--app-text-muted);
}

.cfg-empty h3 {
  margin: 0 0 6px;
  color: var(--app-heading);
  font-size: 1.05rem;
}

.cfg-empty p {
  margin: 0;
  font-size: 13.5px;
}

.cfg-statusbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: var(--cfg-radius);
  background: var(--app-surface);
}

.cfg-status-domain {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cfg-status-domain strong {
  font-size: 15px;
  color: var(--app-heading);
}

.cfg-status-domain span {
  font-size: 12.5px;
  color: var(--app-text-muted);
}

.cfg-status-pills {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.cfg-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 650;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  border: 1px solid transparent;
}

.cfg-pill--muted,
.cfg-pill.is-none {
  color: var(--app-text-muted);
  background: rgba(139, 151, 143, 0.1);
  border-color: rgba(139, 151, 143, 0.2);
}

.cfg-pill.on,
.cfg-pill.is-valid {
  color: var(--dorian-viper-400, #3fbd85);
  background: rgba(46, 158, 108, 0.12);
  border-color: rgba(46, 158, 108, 0.26);
}

.cfg-pill.off,
.cfg-pill.is-failed,
.cfg-pill.is-expired {
  color: #e15241;
  background: rgba(225, 82, 65, 0.12);
  border-color: rgba(225, 82, 65, 0.26);
}

.cfg-pill.is-expiring,
.cfg-pill.is-issuing,
.cfg-pill.is-pending {
  color: #e0a83f;
  background: rgba(224, 168, 63, 0.12);
  border-color: rgba(224, 168, 63, 0.26);
}

.cfg-activity {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 650;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
}

.cfg-activity__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.cfg-activity--active {
  color: var(--dorian-viper-400, #3fbd85);
}

.cfg-activity--active .cfg-activity__dot {
  box-shadow: 0 0 0 3px rgba(63, 189, 133, 0.2);
  animation: cfg-pulse 1.8s ease-in-out infinite;
}

.cfg-activity--idle { color: #e0a83f; }
.cfg-activity--offline { color: var(--app-text-muted); }

@keyframes cfg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.cfg-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.cfg-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 14px;
  border-radius: var(--cfg-radius);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.cfg-tab:hover:not(.active):not(:disabled) {
  border-color: color-mix(in srgb, var(--app-accent) 45%, var(--app-border));
  background: color-mix(in srgb, var(--app-accent) 5%, var(--app-surface));
}

.cfg-tab.active {
  border-color: rgba(46, 158, 108, 0.45);
  background: rgba(46, 158, 108, 0.1);
  box-shadow: inset 0 -2px 0 var(--dorian-viper-500, var(--app-accent));
}

.cfg-tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cfg-tab__label {
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
}

.cfg-tab.active .cfg-tab__label {
  color: var(--dorian-viper-400, var(--app-accent));
}

.cfg-tab__hint {
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.cfg-panel {
  border: 1px solid var(--app-border);
  border-radius: var(--cfg-radius);
  background: var(--app-surface);
  padding: 16px;
  min-height: 320px;
}

.cfg-overview {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cfg-section-kicker {
  margin: 0;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.cfg-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.cfg-metric {
  position: relative;
  padding: 12px 14px 12px 16px;
  border-radius: var(--cfg-radius);
  border: 1px solid var(--app-border);
  background: var(--app-surface-elevated, var(--app-surface));
  overflow: hidden;
}

.cfg-metric::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--metric-accent, var(--app-accent));
}

.cfg-metric--viper { --metric-accent: var(--dorian-viper-500, #2e9e6c); }
.cfg-metric--ok { --metric-accent: #4fbd7a; }
.cfg-metric--l4 { --metric-accent: #5b9df0; }
.cfg-metric--signal { --metric-accent: var(--dorian-viper-400, #3fbd85); }

.cfg-metric__label {
  display: block;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  font-weight: 650;
}

.cfg-metric__value {
  display: block;
  margin-top: 6px;
  font-size: 1.25rem;
  font-weight: 650;
  color: var(--app-heading);
  letter-spacing: -0.02em;
}

.cfg-metric__value--sm {
  font-size: 1rem;
}

.cfg-metric__hint {
  display: block;
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.cfg-sections {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.cfg-section {
  padding: 14px;
  border-radius: var(--cfg-radius);
  border: 1px solid var(--app-border);
  background: var(--app-surface-elevated, var(--app-surface));
}

.cfg-section--wide {
  grid-column: 1 / -1;
}

.cfg-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.cfg-section__head h3 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 650;
  color: var(--app-heading);
}

.cfg-section__head p {
  margin: 0;
  font-size: 12.5px;
  color: var(--app-text-muted);
  line-height: 1.4;
}

.cfg-section__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: none;
}

.cfg-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface);
  color: var(--app-text);
  border-radius: 6px;
  padding: 7px 11px;
  font-size: 12.5px;
  font-weight: 650;
  cursor: pointer;
  white-space: nowrap;
}

.cfg-btn:hover:not(:disabled) {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.cfg-btn--primary {
  border: none;
  background: var(--dorian-viper-500, var(--app-accent));
  color: #08120e;
}

.cfg-btn--primary:hover:not(:disabled) {
  filter: brightness(1.06);
  color: #08120e;
  background: var(--dorian-viper-500, var(--app-accent));
}

.cfg-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cfg-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
}

.cfg-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.cfg-detail--wide {
  grid-column: 1 / -1;
}

.cfg-detail__label {
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.cfg-detail__value {
  font-size: 13px;
  color: var(--app-heading);
  word-break: break-word;
}

.cfg-detail__value--error {
  color: #e15241;
}

.cfg-muted {
  color: var(--app-text-muted);
}

.cfg-edges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cfg-edge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(46, 158, 108, 0.24);
  background: rgba(46, 158, 108, 0.1);
  color: var(--dorian-viper-400, #3fbd85);
  font-size: 12.5px;
  font-weight: 600;
}

.cfg-edge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.cfg-info-empty {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-muted);
}

.cfg-waf-prompt {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cfg-waf-prompt h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--app-heading);
}

.cfg-waf-prompt p {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13.5px;
  line-height: 1.5;
}

.cfg-waf-prompt .cfg-btn {
  align-self: flex-start;
  margin-top: 4px;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.2;
}

.role-pill--predefined {
  color: #5b9df0;
  background: rgba(91, 157, 240, 0.14);
  border: 1px solid rgba(91, 157, 240, 0.3);
}

.role-pill--custom {
  color: var(--dorian-viper-400, #3fbd85);
  background: rgba(46, 158, 108, 0.14);
  border: 1px solid rgba(46, 158, 108, 0.28);
}

@media (max-width: 1100px) {
  .cfg-tabs,
  .cfg-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .cfg-tabs,
  .cfg-metrics,
  .cfg-sections,
  .cfg-detail-grid {
    grid-template-columns: 1fr;
  }

  .cfg-section--wide {
    grid-column: auto;
  }

  .cfg-section__head {
    flex-direction: column;
  }
}
</style>
