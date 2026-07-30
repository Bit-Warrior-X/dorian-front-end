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
          <span v-if="loadedSite.wafId" class="meta-pill license">WAF Rule: #{{ loadedSite.wafId }}</span>
          <span class="meta-pill license">Servers: {{ (loadedSite.serverIds || []).length }}</span>
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
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
        <div
          class="tabs-body"
          :class="{ 'no-outline': activeTab === 'waf' || activeTab === 'traffic' }"
        >
          <form v-if="activeTab === 'general'" class="settings-form" @submit.prevent="saveSettings">
            <div class="form-grid">
              <div class="form-field">
                <label for="settings-domain">Domain</label>
                <input id="settings-domain" v-model="form.domain" type="text" required />
              </div>
              <div class="form-field">
                <label for="settings-status">Status</label>
                <select id="settings-status" v-model="form.status">
                  <option value="ENABLE">Enabled</option>
                  <option value="DISABLE">Disabled</option>
                </select>
              </div>
              <div class="form-field">
                <label for="settings-cert-status">Certificate Status</label>
                <select id="settings-cert-status" v-model="form.certificateStatus">
                  <option value="none">None</option>
                  <option value="valid">Valid</option>
                  <option value="expiring">Expiring</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div class="form-field">
                <label for="settings-cert-expiry">Certificate Expiry</label>
                <input id="settings-cert-expiry" v-model="form.certificateExpiry" type="datetime-local" />
              </div>
              <div class="form-field">
                <label for="settings-cache-ratio">Cache Ratio (%)</label>
                <input id="settings-cache-ratio" v-model.number="form.cacheRatio" type="number" min="0" max="100" step="0.01" />
              </div>
              <div class="form-field">
                <label for="settings-bandwidth">Bandwidth (bytes)</label>
                <input id="settings-bandwidth" v-model.number="form.bandwidth" type="number" min="0" step="1" />
              </div>
              <div class="form-field">
                <label for="settings-ssl-type">SSL Type</label>
                <select id="settings-ssl-type" v-model="form.sslType">
                  <option value="none">None</option>
                  <option value="managed">Managed</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div class="form-field form-field--full">
                <label>Protocol Badges</label>
                <div class="protocol-options">
                  <label v-for="protocol in protocolOptions" :key="protocol" class="protocol-option">
                    <input v-model="form.protocols" type="checkbox" :value="protocol" />
                    <span>{{ protocol }}</span>
                  </label>
                </div>
              </div>
              <div v-if="form.sslType === 'custom'" class="form-field form-field--full">
                <label for="settings-ssl-cert">SSL Certificate</label>
                <textarea id="settings-ssl-cert" v-model="form.sslCert" rows="5"></textarea>
              </div>
              <div v-if="form.sslType === 'custom'" class="form-field form-field--full">
                <label for="settings-ssl-key">SSL Certificate Key</label>
                <textarea id="settings-ssl-key" v-model="form.sslCertKey" rows="5"></textarea>
              </div>
              <div class="form-field form-field--full">
                <label>Assigned Servers</label>
                <div class="server-options">
                  <label v-for="server in serverOptions" :key="server.id" class="server-option">
                    <input v-model="form.serverIds" type="checkbox" :value="server.id" />
                    <span>{{ server.name || server.ip || `Server #${server.id}` }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="meta-row" v-if="loadedSite">
              <span>Created: {{ formatDate(loadedSite.createdAt) }}</span>
              <span>Last modified: {{ formatDate(loadedSite.updatedAt) }}</span>
            </div>

            <div class="form-actions">
              <button class="primary-btn" type="submit" :disabled="isSaving">
                Save Settings
              </button>
            </div>
          </form>

          <WafPanel v-else-if="activeTab === 'waf'" :site-id="selectedSiteId" />
          <TrafficPanel v-else-if="activeTab === 'traffic'" :site-id="selectedSiteId" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchSite, fetchSites, updateSite } from '@/api/sites'
import { fetchServers } from '@/api/servers'
import { notifyError, notifySuccess } from '@/utils/notify'
import WafPanel from './WafPanel.vue'
import TrafficPanel from './TrafficPanel.vue'

const SETTINGS_TITLE = 'Site Settings'

const route = useRoute()
const router = useRouter()

const siteOptions = ref([])
const serverOptions = ref([])
const selectedSiteId = ref('')
const loadedSite = ref(null)
const isSaving = ref(false)
const activeTab = ref('general')

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'waf', label: 'WAF' },
  { id: 'traffic', label: 'Traffic' },
]

const protocolOptions = ['HTTP', 'HTTPS', 'HTTP/2', 'HTTP/3', 'WebSocket']

const form = reactive({
  domain: '',
  status: 'ENABLE',
  certificateStatus: 'none',
  certificateExpiry: '',
  cacheRatio: 0,
  bandwidth: 0,
  sslType: 'none',
  sslCert: '',
  sslCertKey: '',
  protocols: [],
  serverIds: [],
})

const siteStatusClass = (status) => {
  const normalized = String(status || '').toUpperCase()
  return normalized === 'ENABLE' ? 'on' : 'off'
}

const siteStatusLabel = (status) => {
  const normalized = String(status || '').toUpperCase()
  return normalized === 'ENABLE' ? 'Enabled' : 'Disabled'
}

const protocolList = (value) => {
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const toDateTimeLocal = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const applySiteToForm = (site) => {
  loadedSite.value = site
  form.domain = site.domain || ''
  form.status = site.status || 'ENABLE'
  form.certificateStatus = site.certificateStatus || 'none'
  form.certificateExpiry = toDateTimeLocal(site.certificateExpiry)
  form.cacheRatio = site.cacheRatio ?? 0
  form.bandwidth = site.bandwidth ?? 0
  form.sslType = site.sslType || 'none'
  form.sslCert = site.sslCert || ''
  form.sslCertKey = site.sslCertKey || ''
  form.protocols = protocolList(site.protocolBadges)
  form.serverIds = site.serverIds ? [...site.serverIds] : []
}

const buildPayload = () => ({
  domain: form.domain.trim(),
  status: form.status,
  wafId: loadedSite.value?.wafId ?? null,
  certificateStatus: form.certificateStatus,
  certificateExpiry: form.certificateExpiry ? new Date(form.certificateExpiry).toISOString() : null,
  cacheRatio: Number(form.cacheRatio) || 0,
  bandwidth: Number(form.bandwidth) || 0,
  sslType: form.sslType,
  sslCert: form.sslType === 'custom' ? form.sslCert.trim() : '',
  sslCertKey: form.sslType === 'custom' ? form.sslCertKey.trim() : '',
  protocolBadges: form.protocols.join(','),
  serverIds: [...form.serverIds],
})

const loadSites = async () => {
  try {
    const data = await fetchSites()
    siteOptions.value = Array.isArray(data) ? data : []
  } catch (error) {
    siteOptions.value = []
    notifyError(SETTINGS_TITLE, error?.message || 'Sites could not be loaded.')
  }
}

const loadServers = async () => {
  try {
    const data = await fetchServers()
    serverOptions.value = Array.isArray(data) ? data : []
  } catch {
    serverOptions.value = []
  }
}

const loadSelectedSite = async () => {
  if (!selectedSiteId.value) {
    loadedSite.value = null
    return
  }

  try {
    const site = await fetchSite(selectedSiteId.value)
    applySiteToForm(site)
  } catch (error) {
    notifyError(SETTINGS_TITLE, error?.message || 'Site could not be loaded.')
  }
}

const onSiteSelected = async () => {
  const query = { ...route.query }
  if (selectedSiteId.value) {
    query.siteId = selectedSiteId.value
  } else {
    delete query.siteId
  }
  await router.replace({ query })
  await loadSelectedSite()
}

const saveSettings = async () => {
  if (!selectedSiteId.value) return
  if (!form.domain.trim()) {
    notifyError(SETTINGS_TITLE, 'Domain is required.')
    return
  }

  isSaving.value = true
  try {
    const updated = await updateSite(selectedSiteId.value, buildPayload())
    applySiteToForm(updated)
    const index = siteOptions.value.findIndex((site) => site.id === updated.id)
    if (index !== -1) {
      siteOptions.value[index] = updated
    }
    notifySuccess(SETTINGS_TITLE, 'Site settings saved successfully.')
  } catch (error) {
    notifyError(SETTINGS_TITLE, error?.message || 'Site settings could not be saved.')
  } finally {
    isSaving.value = false
  }
}

const applyRouteQuery = () => {
  const tab = String(route.query.tab || '').toLowerCase()
  if (tab === 'waf') {
    activeTab.value = 'waf'
  } else if (tab === 'traffic') {
    activeTab.value = 'traffic'
  } else if (tab) {
    activeTab.value = 'general'
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
  await loadServers()
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
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tabs-header {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--app-border-strong);
  padding-bottom: 0;
  margin-bottom: 0;
}

.tab-btn {
  border: none;
  background: transparent;
  color: var(--app-text-muted);
  font-size: 0.95rem;
  font-weight: 600;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab-btn.active {
  color: var(--app-accent);
  border-bottom-color: var(--app-accent);
}

.tabs-body {
  padding-top: 20px;
}

.tabs-body.no-outline {
  padding-top: 0;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field label {
  font-size: 0.85rem;
  color: var(--app-text-muted);
  font-weight: 500;
}

.form-field input,
.form-field select,
.form-field textarea {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--app-input-bg);
  color: var(--app-text);
}

.protocol-options,
.server-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.protocol-option,
.server-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  font-size: 0.85rem;
  cursor: pointer;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: var(--app-text-muted);
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
