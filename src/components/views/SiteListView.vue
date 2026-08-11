<template>
  <div class="sites-view">
    <div class="content-card">
      <div class="filter-header">
        <h3>Filters</h3>
        <button class="primary-btn" type="button" @click="openNewSiteDialog">New Site</button>
      </div>
      <div class="filter-bar">
        <div class="filter-field">
          <label for="site-status-filter">Status</label>
          <select id="site-status-filter" v-model="filters.status">
            <option value="">All</option>
            <option value="ENABLE">Enabled</option>
            <option value="DISABLE">Disabled</option>
          </select>
        </div>
        <div class="filter-field">
          <label for="site-domain-filter">Domain</label>
          <input
            id="site-domain-filter"
            v-model="filters.domain"
            type="text"
            placeholder="Search by domain"
          />
        </div>
        <div class="filter-field">
          <label for="site-cert-filter">Certificate</label>
          <select id="site-cert-filter" v-model="filters.certificateStatus">
            <option value="">All</option>
            <option value="valid">Valid</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
            <option value="none">None</option>
          </select>
        </div>
        <div class="filter-field">
          <label for="site-ssl-filter">SSL Type</label>
          <select id="site-ssl-filter" v-model="filters.sslType">
            <option value="">All</option>
            <option value="none">Not Configured</option>
            <option value="letsencrypt">Let's Encrypt</option>
            <option value="zerossl">ZeroSSL</option>
            <option value="googletrust">Google Trust</option>
            <option value="custom">Manual</option>
            <option value="managed">Managed</option>
          </select>
        </div>
      </div>
    </div>

    <div class="content-card sites-table-card">
      <div class="card-title">
        <h3>Sites</h3>
      </div>
      <div class="table-wrap">
        <table class="sites-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Status</th>
              <th>WAF Rule</th>
              <th>Certificate</th>
              <th>Expiry</th>
              <th>Cache Ratio</th>
              <th>Bandwidth</th>
              <th>SSL Type</th>
              <th>Edges</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Settings</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="12" class="muted-text">Loading sites…</td>
            </tr>
            <tr v-else-if="!filteredSites.length">
              <td colspan="12" class="muted-text">No sites found.</td>
            </tr>
            <tr v-for="site in paginatedSites" :key="site.id">
              <td class="domain-cell">{{ site.domain }}</td>
              <td>
                <span class="status-pill server-status-pill" :class="siteStatusClass(site.status)">
                  {{ site.status === 'ENABLE' ? 'Enabled' : 'Disabled' }}
                </span>
              </td>
              <td>{{ site.wafName || '—' }}</td>
              <td>
                <span class="status-pill server-status-pill" :class="certificateStatusClass(site.certificateStatus)">
                  {{ formatCertStatus(site.certificateStatus) }}
                </span>
              </td>
              <td>{{ formatDate(site.certificateExpiry) }}</td>
              <td>{{ formatCacheRatio(site.cacheRatio) }}</td>
              <td>{{ formatBandwidth(site.bandwidth) }}</td>
              <td>{{ formatSslType(site.sslType) }}</td>
              <td>
                <div v-if="site.servers?.length" class="site-servers">
                  <span v-for="server in site.servers" :key="server" class="site-server-pill">
                    {{ server }}
                  </span>
                </div>
                <span v-else class="muted-text">—</span>
              </td>
              <td>{{ formatDate(site.createdAt) }}</td>
              <td>{{ formatDate(site.updatedAt) }}</td>
              <td>
                <div class="menu-wrap">
                  <button
                    class="icon-btn"
                    title="Settings"
                    type="button"
                    @click.stop="toggleRowMenu(site.id)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-4.242 0L5.636 18.364M18.364 5.636l-4.243 4.243m-4.242 0L5.636 5.636"></path>
                    </svg>
                  </button>
                  <div v-if="activeRowMenu === site.id" class="row-menu">
                    <button class="row-menu-item" type="button" @click="openEditSite(site)">
                      Edit
                    </button>
                    <button class="row-menu-item" type="button" @click="openSiteSettings(site)">
                      Site Settings
                    </button>
                    <button class="row-menu-item danger" type="button" @click="requestDeleteConfirm(site)">
                      Delete
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <span class="pagination-info">
          Showing {{ pageStart }}-{{ pageEnd }} of {{ filteredSites.length }}
        </span>
        <div class="pagination-controls">
          <button class="pagination-btn" type="button" :disabled="currentPage === 1" @click="prevPage">
            Prev
          </button>
          <span class="pagination-page">Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="pagination-btn" type="button" :disabled="currentPage === totalPages" @click="nextPage">
            Next
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="isNewSiteDialogOpen"
    class="dialog-backdrop"
    @click="!isSaving && closeNewSiteDialog()"
  >
    <div
      class="dialog-card dialog-card--site"
      :class="{ 'dialog-card--busy': isSaving }"
      @click.stop
    >
      <div class="dialog-header">
        <h3>New Site</h3>
        <button
          class="dialog-close"
          type="button"
          :disabled="isSaving"
          aria-label="Close dialog"
          @click="closeNewSiteDialog"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="dialog-body">
        <SiteFormSections
          :form="newSite"
          :waf-rule-options="wafRuleOptions"
          :selected-server-ids="selectedServers"
          :server-options="serverOptions"
          :server-search="serverSearch"
          :is-server-dropdown-open="isServerDropdownOpen"
          @toggle-server-dropdown="toggleServerDropdown"
          @open-server-dropdown="openServerDropdown"
          @update:server-search="serverSearch = $event"
          @add-server="addServer"
          @remove-server="removeServer"
        />
      </div>
      <div class="dialog-footer">
        <button class="secondary-btn" type="button" :disabled="isSaving" @click="closeNewSiteDialog">
          Cancel
        </button>
        <button class="primary-btn" type="button" :disabled="isSaving" @click="submitNewSite">
          <span v-if="isSaving" class="btn-spinner" aria-hidden="true"></span>
          {{ isSaving ? 'Creating…' : 'Create Site' }}
        </button>
      </div>
    </div>
  </div>

  <div
    v-if="isEditSiteDialogOpen"
    class="dialog-backdrop"
    @click="closeEditSiteDialog"
  >
    <div class="dialog-card dialog-card--site" @click.stop>
      <div class="dialog-header">
        <h3>Edit Site</h3>
        <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeEditSiteDialog">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="dialog-body">
        <SiteFormSections
          :form="editSite"
          :waf-rule-options="wafRuleOptions"
          :selected-server-ids="selectedServers"
          :server-options="serverOptions"
          :server-search="serverSearch"
          :is-server-dropdown-open="isServerDropdownOpen"
          @toggle-server-dropdown="toggleServerDropdown"
          @open-server-dropdown="openServerDropdown"
          @update:server-search="serverSearch = $event"
          @add-server="addServer"
          @remove-server="removeServer"
        />
      </div>
      <div class="dialog-footer">
        <button class="secondary-btn" type="button" @click="closeEditSiteDialog">Cancel</button>
        <button class="primary-btn" type="button" @click="requestEditConfirm">Confirm</button>
      </div>
    </div>
  </div>

  <ConfirmDialog
    v-model="isConfirmDialogOpen"
    :title="confirmTitle"
    :message="confirmMessage"
    :confirm-text="confirmConfirmText"
    cancel-text="Cancel"
    @confirm="handleConfirmDialog"
    @cancel="clearConfirmDialog"
  />

  <ConfirmDialog
    v-model="isCustomWafWarningOpen"
    title="Custom WAF Rule"
    :message="customWafWarningMessage"
    confirm-text="Continue"
    cancel-text="Cancel"
    @confirm="confirmCustomWafWarning"
    @cancel="cancelCustomWafWarning"
  />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '../ConfirmDialog.vue'
import SiteFormSections from '../SiteFormSections.vue'
import { createSite, deleteSite, fetchSites, updateSite } from '@/api/sites'
import { fetchServers } from '@/api/servers'
import { fetchWafRules } from '@/api/wafRules'
import {
  createUpstreamServer,
  deleteUpstreamServers,
  fetchUpstreamServers,
  updateUpstreamServer,
} from '@/api/upstreamServers'
import {
  createEmptyOriginServer,
  mapUpstreamToOriginServer,
  normalizeOriginId,
  planOriginServerSync,
  validateOriginServers,
} from '@/utils/originServers'
import { notifyError, notifySuccess } from '@/utils/notify'

const SITES_TITLE = 'Site Management'

const notifySitesChanged = () => {
  window.dispatchEvent(new CustomEvent('cdnproxy-sites-changed'))
}

const router = useRouter()

const sites = ref([])
const serverOptions = ref([])
const wafRuleOptions = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const activeRowMenu = ref(null)
const isNewSiteDialogOpen = ref(false)
const isEditSiteDialogOpen = ref(false)
const editSiteId = ref(null)
const isConfirmDialogOpen = ref(false)
const isCustomWafWarningOpen = ref(false)
const confirmAction = ref(null)
const confirmTarget = ref(null)
const pendingSaveAction = ref(null)

const customWafWarningMessage =
  'When you select a custom waf rule, if you change the rule in another site setting, the changed waf rule is applied to all sites. To avoid this, you can duplicate waf rule, rename it and apply the rule to the site.'

const selectedServers = ref([])
const isServerDropdownOpen = ref(false)
const serverSearch = ref('')

const pageSize = ref(6)
const currentPage = ref(1)

const filters = reactive({
  status: '',
  domain: '',
  certificateStatus: '',
  sslType: '',
})

const emptySiteForm = () => ({
  domain: '',
  status: 'ENABLE',
  wafId: '',
  certificateStatus: 'none',
  certificateExpiry: '',
  cacheRatio: 0,
  bandwidth: 0,
  sslType: 'none',
  sslCert: '',
  sslCertKey: '',
  originServers: [createEmptyOriginServer()],
})

const newSite = reactive(emptySiteForm())
const editSite = reactive(emptySiteForm())
const editOriginInitialIds = ref([])
const editSiteInitialWafId = ref('')
let originLoadToken = 0

const filteredSites = computed(() => {
  const domainQuery = filters.domain.trim().toLowerCase()
  return sites.value.filter((site) => {
    if (filters.status && site.status !== filters.status) return false
    if (filters.certificateStatus && String(site.certificateStatus || 'none').toLowerCase() !== filters.certificateStatus) {
      return false
    }
    if (filters.sslType && String(site.sslType || 'none').toLowerCase() !== filters.sslType) {
      return false
    }
    if (domainQuery && !String(site.domain || '').toLowerCase().includes(domainQuery)) return false
    return true
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredSites.value.length / pageSize.value)),
)

const paginatedSites = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredSites.value.slice(start, start + pageSize.value)
})

const pageStart = computed(() =>
  filteredSites.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0,
)

const pageEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, filteredSites.value.length),
)

const confirmTitle = computed(() => {
  if (confirmAction.value === 'delete') return 'Delete site'
  if (confirmAction.value === 'edit') return 'Site is modified'
  return 'Confirm action'
})

const confirmMessage = computed(() => {
  if (confirmAction.value === 'delete') {
    return 'Are you sure you want to delete this site? This action cannot be undone.'
  }
  if (confirmAction.value === 'edit') {
    return 'Are you sure you want to apply these changes to the site?'
  }
  return 'Are you sure you want to continue?'
})

const confirmConfirmText = computed(() => {
  if (confirmAction.value === 'delete') return 'Delete'
  if (confirmAction.value === 'edit') return 'Apply'
  return 'Confirm'
})

watch(
  () => [filters.status, filters.domain, filters.certificateStatus, filters.sslType],
  () => {
    currentPage.value = 1
  },
)

const formatCertStatus = (value) => {
  const normalized = String(value || 'none').toLowerCase()
  if (normalized === 'valid') return 'Valid'
  if (normalized === 'expiring') return 'Expiring'
  if (normalized === 'expired') return 'Expired'
  return 'None'
}

const siteStatusClass = (status) => (status === 'ENABLE' ? 'active' : 'inactive')

const certificateStatusClass = (value) => {
  const normalized = String(value || 'none').toLowerCase()
  if (normalized === 'valid') return 'active'
  if (normalized === 'expiring') return 'maintenance'
  if (normalized === 'expired') return 'stopped'
  return 'unknown'
}

const formatSslType = (value) => {
  const normalized = String(value || 'none').toLowerCase()
  if (normalized === 'letsencrypt') return "Let's Encrypt"
  if (normalized === 'zerossl') return 'ZeroSSL'
  if (normalized === 'googletrust') return 'Google Trust'
  if (normalized === 'custom') return 'Manual'
  if (normalized === 'managed') return 'Managed'
  return 'Not Configured'
}

const formatCacheRatio = (value) => `${Number(value || 0).toFixed(2)}%`

const formatBandwidth = (bytes) => {
  const value = Number(bytes || 0)
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} GB`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} MB`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)} KB`
  return `${value} B`
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

const toDateTimeLocal = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const buildPayload = (form) => {
  const wafIdRaw = String(form.wafId ?? '').trim()
  const wafId = wafIdRaw === '' ? null : Number(wafIdRaw)
  const sslType = String(form.sslType || 'none').toLowerCase()
  return {
    domain: form.domain.trim(),
    status: form.status,
    wafId: Number.isFinite(wafId) ? wafId : null,
    certificateStatus: form.certificateStatus,
    certificateExpiry: form.certificateExpiry ? new Date(form.certificateExpiry).toISOString() : null,
    cacheRatio: Number(form.cacheRatio) || 0,
    bandwidth: Number(form.bandwidth) || 0,
    sslType,
    sslCert: sslType === 'custom' ? form.sslCert.trim() : '',
    sslCertKey: sslType === 'custom' ? form.sslCertKey.trim() : '',
    serverIds: [...selectedServers.value],
  }
}

const getSelectedWafRule = (form) => {
  const id = String(form.wafId ?? '').trim()
  if (!id) return null
  return wafRuleOptions.value.find((rule) => String(rule.id) === id) || null
}

const isCustomWafSelected = (form) =>
  String(getSelectedWafRule(form)?.role || '').toLowerCase() === 'custom'

const shouldWarnCustomWaf = (form, previousWafId) => {
  if (!isCustomWafSelected(form)) return false
  if (previousWafId === undefined) return true
  return String(form.wafId ?? '').trim() !== String(previousWafId ?? '').trim()
}

const openCustomWafWarning = (action) => {
  pendingSaveAction.value = action
  isCustomWafWarningOpen.value = true
}

const cancelCustomWafWarning = () => {
  isCustomWafWarningOpen.value = false
  pendingSaveAction.value = null
}

const confirmCustomWafWarning = async () => {
  const action = pendingSaveAction.value
  isCustomWafWarningOpen.value = false
  pendingSaveAction.value = null

  if (action === 'create') {
    await performCreateSite()
    return
  }
  if (action === 'edit') {
    confirmAction.value = 'edit'
    isConfirmDialogOpen.value = true
  }
}

const applyFormValues = (target, site) => {
  Object.assign(target, emptySiteForm())
  target.domain = site.domain || ''
  target.status = site.status || 'ENABLE'
  target.wafId = site.wafId != null ? String(site.wafId) : ''
  target.certificateStatus = site.certificateStatus || 'none'
  target.certificateExpiry = toDateTimeLocal(site.certificateExpiry)
  target.cacheRatio = site.cacheRatio ?? 0
  target.bandwidth = site.bandwidth ?? 0
  target.sslType = site.sslType || 'none'
  target.sslCert = site.sslCert || ''
  target.sslCertKey = site.sslCertKey || ''
  target.originServers = [createEmptyOriginServer()]
  selectedServers.value = site.serverIds ? [...site.serverIds] : []
}

const resetNewSiteForm = () => {
  Object.assign(newSite, emptySiteForm())
  selectedServers.value = []
  serverSearch.value = ''
  isServerDropdownOpen.value = false
}

const loadOriginServersForEdit = async (siteId) => {
  const token = ++originLoadToken
  editOriginInitialIds.value = []
  editSite.originServers = [createEmptyOriginServer()]
  if (!siteId) return
  try {
    const data = await fetchUpstreamServers(siteId)
    if (token !== originLoadToken || editSiteId.value !== siteId) return
    const origins = Array.isArray(data) ? data.map(mapUpstreamToOriginServer) : []
    editSite.originServers = origins.length ? origins : [createEmptyOriginServer()]
    editOriginInitialIds.value = origins
      .map((origin) => normalizeOriginId(origin.id))
      .filter((id) => id != null)
  } catch (error) {
    if (token !== originLoadToken || editSiteId.value !== siteId) return
    editSite.originServers = [createEmptyOriginServer()]
    editOriginInitialIds.value = []
    notifyError(SITES_TITLE, error?.message || 'Origin servers could not be loaded.')
  }
}

const syncOriginServers = async (siteId, origins, initialIds = []) => {
  const { removedIds, upserts } = planOriginServerSync(origins, initialIds)

  if (removedIds.length) {
    await deleteUpstreamServers(siteId, removedIds)
  }

  for (const item of upserts) {
    if (item.create) {
      const created = await createUpstreamServer(siteId, item.payload)
      const createdId = normalizeOriginId(created?.id)
      if (createdId != null) {
        item.origin.id = createdId
      }
    } else {
      await updateUpstreamServer(siteId, item.id, item.payload)
    }
  }
}

const loadSites = async () => {
  isLoading.value = true
  try {
    const data = await fetchSites()
    sites.value = Array.isArray(data) ? data : []
  } catch (error) {
    sites.value = []
    notifyError(SITES_TITLE, error?.message || 'Sites could not be loaded.')
  } finally {
    isLoading.value = false
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

const loadWafRules = async () => {
  try {
    const data = await fetchWafRules('')
    wafRuleOptions.value = Array.isArray(data) ? data : []
  } catch {
    wafRuleOptions.value = []
  }
}

const toggleRowMenu = (rowId) => {
  activeRowMenu.value = activeRowMenu.value === rowId ? null : rowId
}

const handleClickOutsideMenu = (event) => {
  if (!event.target.closest('.menu-wrap')) {
    activeRowMenu.value = null
  }
}

const openServerDropdown = () => {
  isServerDropdownOpen.value = true
}

const toggleServerDropdown = () => {
  isServerDropdownOpen.value = !isServerDropdownOpen.value
}

const addServer = (server) => {
  if (selectedServers.value.includes(server.id)) return
  selectedServers.value = [...selectedServers.value, server.id]
  serverSearch.value = ''
  isServerDropdownOpen.value = false
}

const removeServer = (serverId) => {
  selectedServers.value = selectedServers.value.filter((item) => item !== serverId)
}

const openNewSiteDialog = () => {
  resetNewSiteForm()
  isNewSiteDialogOpen.value = true
}

const closeNewSiteDialog = () => {
  if (isSaving.value) return
  isNewSiteDialogOpen.value = false
}

const openEditSite = async (site) => {
  editSiteId.value = site.id
  applyFormValues(editSite, site)
  editSiteInitialWafId.value = site.wafId != null ? String(site.wafId) : ''
  serverSearch.value = ''
  isServerDropdownOpen.value = false
  activeRowMenu.value = null
  await loadOriginServersForEdit(site.id)
  isEditSiteDialogOpen.value = true
}

const closeEditSiteDialog = () => {
  isEditSiteDialogOpen.value = false
  editOriginInitialIds.value = []
  editSiteInitialWafId.value = ''
}

const openSiteSettings = (site) => {
  activeRowMenu.value = null
  void router.push({ name: 'site-settings', query: { siteId: String(site.id) } })
}

const validateSiteForm = (form) => {
  if (!form.domain.trim()) {
    return 'Domain is required.'
  }
  if (String(form.sslType || '').toLowerCase() === 'custom') {
    if (!String(form.sslCert || '').trim() || !String(form.sslCertKey || '').trim()) {
      return 'Manual SSL configuration requires both certificate and private key.'
    }
  }
  const originError = validateOriginServers(form.originServers)
  if (originError) return originError
  return ''
}

const performCreateSite = async () => {
  isSaving.value = true
  try {
    const created = await createSite(buildPayload(newSite))
    if (created?.id) {
      await syncOriginServers(created.id, newSite.originServers, [])
    }
    notifySuccess(SITES_TITLE, 'The site is successfully created.')
    currentPage.value = 1
    isNewSiteDialogOpen.value = false
    resetNewSiteForm()
    await loadSites()
    notifySitesChanged()
  } catch (error) {
    notifyError(SITES_TITLE, error?.message || 'The site could not be created.')
  } finally {
    isSaving.value = false
  }
}

const submitNewSite = async () => {
  const validationError = validateSiteForm(newSite)
  if (validationError) {
    notifyError(SITES_TITLE, validationError)
    return
  }

  if (shouldWarnCustomWaf(newSite)) {
    openCustomWafWarning('create')
    return
  }

  await performCreateSite()
}

const requestEditConfirm = () => {
  const validationError = validateSiteForm(editSite)
  if (validationError) {
    notifyError(SITES_TITLE, validationError)
    return
  }

  if (shouldWarnCustomWaf(editSite, editSiteInitialWafId.value)) {
    openCustomWafWarning('edit')
    return
  }

  confirmAction.value = 'edit'
  confirmTarget.value = null
  isConfirmDialogOpen.value = true
}

const requestDeleteConfirm = (site) => {
  confirmAction.value = 'delete'
  confirmTarget.value = site
  isConfirmDialogOpen.value = true
  activeRowMenu.value = null
}

const applyEditSite = async () => {
  if (!editSiteId.value) return
  try {
    await updateSite(editSiteId.value, buildPayload(editSite))
    await syncOriginServers(editSiteId.value, editSite.originServers, editOriginInitialIds.value)
    notifySuccess(SITES_TITLE, 'The site is successfully updated.')
    closeEditSiteDialog()
    await loadSites()
    notifySitesChanged()
  } catch (error) {
    notifyError(SITES_TITLE, error?.message || 'The site could not be updated.')
  }
}

const handleDeleteSite = async () => {
  if (!confirmTarget.value) return
  try {
    await deleteSite(confirmTarget.value.id)
    await loadSites()
    notifySitesChanged()
    notifySuccess(SITES_TITLE, 'The site is successfully deleted.')
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (error) {
    notifyError(SITES_TITLE, error?.message || 'The site could not be deleted.')
  }
}

const handleConfirmDialog = async () => {
  if (confirmAction.value === 'edit') {
    await applyEditSite()
  } else if (confirmAction.value === 'delete') {
    await handleDeleteSite()
  }
  clearConfirmDialog()
}

const clearConfirmDialog = () => {
  isConfirmDialogOpen.value = false
  confirmAction.value = null
  confirmTarget.value = null
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

onMounted(() => {
  document.addEventListener('click', handleClickOutsideMenu)
  void loadSites()
  void loadServers()
  void loadWafRules()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsideMenu)
})
</script>

<style scoped>
.sites-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100%;
}

.sites-table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-card {
  background: var(--app-surface);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-title h3 {
  margin: 0;
  font-size: var(--type-section-title);
  font-weight: 600;
  color: var(--app-heading);
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.filter-header h3 {
  margin: 0;
  font-size: var(--type-section-title);
  font-weight: 600;
  color: var(--app-heading);
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
  margin: 0;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 200px;
  min-width: 160px;
}

.filter-field label {
  font-size: var(--type-caption);
  color: var(--app-text-muted);
  font-weight: 500;
}

.filter-field input,
.filter-field select {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: var(--type-base);
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-field input::placeholder {
  color: var(--app-text-muted);
}

.filter-field input:focus,
.filter-field select:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.table-wrap {
  overflow-x: auto;
  overflow-y: visible;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  flex: 1;
}

.sites-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

.sites-table thead {
  background: var(--app-surface-elevated);
}

.sites-table th,
.sites-table td {
  text-align: left;
  padding: 14px 16px;
  font-size: var(--type-base);
  color: var(--app-text);
  border-bottom: 1px solid var(--app-border);
}

.sites-table th {
  font-size: var(--type-caption);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-muted);
  font-weight: 600;
}

.sites-table tbody tr:hover {
  background: var(--app-surface-hover);
}

.domain-cell {
  font-weight: 600;
}

.muted-text {
  color: var(--app-text-muted);
  font-size: var(--type-base);
}

.site-servers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.site-server-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--type-caption);
  font-weight: 600;
  color: var(--app-accent);
  background: var(--app-accent-soft);
  border: 1px solid rgba(168, 85, 247, 0.25);
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.pagination-info {
  color: var(--app-text-muted);
  font-size: var(--type-base);
}

.pagination-controls {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.pagination-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  color: var(--app-text);
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-page {
  color: var(--app-text-muted);
  font-size: var(--type-caption);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  color: var(--app-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}

.icon-btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
  box-shadow: 0 4px 12px var(--app-shadow);
  transform: translateY(-1px);
}

.menu-wrap {
  position: relative;
  display: inline-flex;
  z-index: 1;
}

.menu-wrap:has(.row-menu) {
  z-index: 60;
}

.row-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 168px;
  background: var(--app-surface-solid);
  border: 1px solid var(--app-border);
  border-radius: 12px;
  box-shadow: 0 12px 32px var(--app-shadow);
  padding: 6px;
  z-index: 50;
}

.row-menu-item {
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: var(--type-base);
  font-weight: 500;
  color: var(--app-text);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.row-menu-item:hover {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.row-menu-item.danger {
  color: #f87171;
}

.row-menu-item.danger:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: var(--app-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.dialog-card {
  width: 100%;
  max-width: 520px;
  background: var(--app-surface-solid);
  border-radius: 18px;
  box-shadow: 0 24px 48px var(--app-shadow);
  border: 1px solid var(--app-border);
  padding: 20px;
}

.dialog-card--site {
  max-width: 720px;
  max-height: min(88vh, 820px);
  display: flex;
  flex-direction: column;
  padding: 18px;
}

.dialog-card--busy {
  pointer-events: none;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.dialog-header h3 {
  margin: 0;
  font-size: var(--type-metric-value);
  font-weight: 600;
  color: var(--app-heading);
}

.dialog-close {
  border: none;
  background: var(--app-surface-elevated);
  color: var(--app-text-muted);
  width: 32px;
  height: 32px;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: 1px solid var(--app-border);
}

.dialog-close:hover:not(:disabled) {
  background: var(--app-surface-hover);
  color: var(--app-text);
}

.dialog-close:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  min-height: 0;
  padding-right: 2px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
  flex-shrink: 0;
}

.secondary-btn {
  background: var(--app-surface-elevated);
  border: 1px solid var(--app-border-strong);
  color: var(--app-text);
  transition: all 0.2s ease;
}

.secondary-btn:hover:not(:disabled) {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.secondary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.primary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.btn-spinner {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: btn-spin 0.7s linear infinite;
  display: inline-block;
  vertical-align: middle;
  margin-right: 6px;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .filter-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .primary-btn {
    width: 100%;
    text-align: center;
  }

  .dialog-card {
    padding: 20px;
  }
}
</style>
