<template>
  <div class="sites-view">
    <header class="sites-topbar">
      <div class="sites-topbar__left">
        <p class="sites-kicker">Delivery</p>
        <h2>Sites</h2>
        <p>{{ sitesSubtitle }}</p>
      </div>
      <div class="sites-topbar__right">
        <button class="sites-primary-btn" type="button" @click="openNewSiteDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Site
        </button>
      </div>
    </header>

    <section class="sites-metrics" aria-label="Site fleet metrics">
      <article
        v-for="metric in siteMetricCards"
        :key="metric.label"
        class="sites-metric"
        :class="`sites-metric--${metric.tone}`"
      >
        <span class="sites-metric__label">{{ metric.label }}</span>
        <strong class="sites-metric__value num">{{ metric.value }}</strong>
        <span class="sites-metric__hint">{{ metric.hint }}</span>
      </article>
    </section>

    <div class="sites-filterbar">
      <div class="sites-filter-field sites-filter-field--grow">
        <label for="site-domain-filter">Domain</label>
        <input
          id="site-domain-filter"
          v-model="filters.domain"
          type="search"
          placeholder="Search domains…"
        />
      </div>
      <div class="sites-filter-field">
        <label for="site-status-filter">Status</label>
        <select id="site-status-filter" v-model="filters.status">
          <option value="">All</option>
          <option value="ENABLE">Enabled</option>
          <option value="DISABLE">Disabled</option>
        </select>
      </div>
      <div class="sites-filter-field">
        <label for="site-activity-filter">Activity</label>
        <select id="site-activity-filter" v-model="filters.activity">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="idle">Idle</option>
          <option value="offline">Offline</option>
        </select>
      </div>
      <div class="sites-filter-field">
        <label for="site-cert-filter">Certificate</label>
        <select id="site-cert-filter" v-model="filters.certificateStatus">
          <option value="">All</option>
          <option value="valid">Valid</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
          <option value="issuing">Issuing</option>
          <option value="failed">Failed</option>
          <option value="none">Not configured</option>
        </select>
      </div>
      <div class="sites-filter-field">
        <label for="site-ssl-filter">SSL</label>
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
      <div class="sites-filter-summary">
        <span class="sites-live-dot" aria-hidden="true"></span>
        {{ filteredSites.length }} shown · live egress
      </div>
    </div>

    <section class="sites-panel">
      <div class="sites-panel__head">
        <h3>Protected hostnames</h3>
        <span class="sites-count-tag">{{ filteredSites.length }}</span>
      </div>

      <div class="sites-table-wrap">
        <table class="sites-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Live</th>
              <th>Protection</th>
              <th>Certificate</th>
              <th>Egress</th>
              <th>Edges</th>
              <th class="sites-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="7" class="sites-empty">Loading sites…</td>
            </tr>
            <tr v-else-if="!filteredSites.length">
              <td colspan="7" class="sites-empty">
                No sites match these filters.
                <button class="sites-empty-link" type="button" @click="openNewSiteDialog">Create a site</button>
              </td>
            </tr>
            <tr
              v-for="site in paginatedSites"
              :key="site.id"
              class="sites-row"
              :class="siteRowClass(site)"
              @click="openSiteSettings(site)"
            >
              <td>
                <div class="sites-domain">
                  <span class="sites-domain__name">{{ site.domain }}</span>
                  <span class="sites-domain__meta">{{ formatSslType(site.sslType) }}</span>
                </div>
              </td>
              <td>
                <div
                  class="sites-live-badge"
                  :class="`sites-live-badge--${siteActivityTone(site)}`"
                  :title="siteActivityTitle(site)"
                >
                  <span class="sites-live-badge__dot" aria-hidden="true"></span>
                  <div class="sites-live-badge__copy">
                    <strong>{{ siteActivityLabel(site) }}</strong>
                    <span>{{ site.status === 'ENABLE' ? 'Enabled' : 'Disabled' }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="sites-waf" :title="site.wafName || 'No WAF rule'">
                  {{ site.wafName || '—' }}
                </span>
              </td>
              <td>
                <div
                  class="sites-cert-badge"
                  :class="certificateStatusClass(site.certificateStatus)"
                  :title="site.certificateError || certStatusDetail(site.certificateStatus)"
                >
                  <span class="sites-cert-badge__status">{{ formatCertStatus(site.certificateStatus) }}</span>
                  <span class="sites-cert-badge__expiry">{{ formatCertExpiryLine(site) }}</span>
                </div>
              </td>
              <td>
                <span class="sites-egress num" :class="{ 'is-hot': Number(site.currentBandwidth) > 0 }">
                  {{ formatLiveBandwidth(site.currentBandwidth) }}
                </span>
              </td>
              <td>
                <div v-if="site.servers?.length" class="sites-edges">
                  <span
                    v-for="server in site.servers.slice(0, 2)"
                    :key="server"
                    class="sites-edge-chip"
                  >
                    {{ server }}
                  </span>
                  <span
                    v-if="site.servers.length > 2"
                    class="sites-edge-more"
                    :title="site.servers.slice(2).join(', ')"
                  >
                    +{{ site.servers.length - 2 }}
                  </span>
                </div>
                <span v-else class="sites-muted">Unassigned</span>
              </td>
              <td class="sites-col-actions" @click.stop>
                <div class="menu-wrap">
                  <button
                    class="sites-icon-btn"
                    title="Site actions"
                    type="button"
                    @click.stop="toggleRowMenu(site.id)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                  <div v-if="activeRowMenu === site.id" class="row-menu">
                    <button class="row-menu-item" type="button" @click="openEditSite(site)">
                      Edit
                    </button>
                    <button class="row-menu-item" type="button" @click="openSiteSettings(site)">
                      Configure
                    </button>
                    <button
                      class="row-menu-item"
                      type="button"
                      :disabled="!canRenewCert(site) || isRenewingCert(site)"
                      :title="renewCertHint(site)"
                      @click.stop="renewCert(site)"
                    >
                      {{ renewCertLabel(site) }}
                    </button>
                    <button class="row-menu-item danger" type="button" @click.stop="requestDeleteConfirm(site)">
                      Delete
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="sites-footer">
        <span class="sites-footer__info num">
          {{ pageStart }}–{{ pageEnd }} of {{ filteredSites.length }}
        </span>
        <div class="sites-footer__pager">
          <button class="sites-pager-btn" type="button" :disabled="currentPage === 1" @click="prevPage">
            Prev
          </button>
          <span class="sites-footer__page num">{{ currentPage }} / {{ totalPages }}</span>
          <button class="sites-pager-btn" type="button" :disabled="currentPage === totalPages" @click="nextPage">
            Next
          </button>
        </div>
      </div>
    </section>
  </div>

  <div
    v-if="isNewSiteDialogOpen"
    class="dialog-backdrop"
  >
    <div
      class="dialog-card dialog-card--site dialog-card--wizard"
      :class="{ 'dialog-card--busy': isSaving }"
      @click.stop
    >
      <div class="dialog-header">
        <div class="dialog-header__copy">
          <h3>New Site</h3>
          <p>Step {{ newSiteStepIndex + 1 }} of {{ newSiteSteps.length }} — {{ currentNewSiteStep.label }}</p>
        </div>
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

      <nav class="site-wizard-steps" aria-label="New site steps">
        <button
          v-for="(step, index) in newSiteSteps"
          :key="step.id"
          type="button"
          class="site-wizard-step"
          :class="{
            'is-active': index === newSiteStepIndex,
            'is-complete': index < newSiteStepIndex,
            'is-reachable': index <= newSiteStepIndex,
          }"
          :disabled="isSaving || index > newSiteStepIndex"
          :aria-current="index === newSiteStepIndex ? 'step' : undefined"
          @click="goToNewSiteStep(index)"
        >
          <span class="site-wizard-step__index">{{ index + 1 }}</span>
          <span class="site-wizard-step__label">{{ step.label }}</span>
        </button>
      </nav>

      <aside class="site-wizard-guide" :aria-label="`${currentNewSiteStep.label} guidance`">
        <div class="site-wizard-guide__title">{{ currentNewSiteStep.title }}</div>
        <p class="site-wizard-guide__lead">{{ currentNewSiteStep.description }}</p>
        <ul class="site-wizard-guide__list">
          <li v-for="tip in currentNewSiteStep.tips" :key="tip">{{ tip }}</li>
        </ul>
      </aside>

      <div class="dialog-body">
        <SiteFormSections
          :form="newSite"
          :active-step="currentNewSiteStep.id"
          field-prefix="new-site"
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
      <div class="dialog-footer dialog-footer--wizard">
        <button
          class="secondary-btn"
          type="button"
          :disabled="isSaving"
          @click="newSiteStepIndex === 0 ? closeNewSiteDialog() : goToPreviousNewSiteStep()"
        >
          {{ newSiteStepIndex === 0 ? 'Cancel' : 'Back' }}
        </button>
        <div class="dialog-footer__actions">
          <span class="site-wizard-progress">
            Step {{ newSiteStepIndex + 1 }} of {{ newSiteSteps.length }}
          </span>
          <button
            v-if="!isLastNewSiteStep"
            class="primary-btn"
            type="button"
            :disabled="isSaving"
            @click="goToNextNewSiteStep"
          >
            Next
          </button>
          <button
            v-else
            class="primary-btn"
            type="button"
            :disabled="isSaving"
            @click="submitNewSite"
          >
            <span v-if="isSaving" class="btn-spinner" aria-hidden="true"></span>
            {{ isSaving ? 'Creating…' : 'Create Site' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="isEditSiteDialogOpen"
    class="dialog-backdrop"
  >
    <div class="dialog-card dialog-card--site" @click.stop>
      <div class="dialog-header">
        <div class="dialog-header__copy">
          <h3>Edit Site</h3>
          <p>Update domain, SSL, origins, and edge assignment for this site.</p>
        </div>
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
    v-model="isDeleteConfirmOpen"
    title="Delete this site?"
    :message="deleteConfirmMessage"
    confirm-text="Delete"
    cancel-text="Cancel"
    danger
    @confirm="handleDeleteSite"
    @cancel="clearDeleteConfirm"
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
import { createSite, deleteSite, fetchSites, renewSiteCertificate, updateSite } from '@/api/sites'
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
import { certStatusDetail, formatCertStatus, isCertIssuing } from '@/utils/certificate'
import { notifySiteEdgeSync } from '@/utils/siteEdgeSync'

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
const isDeleteConfirmOpen = ref(false)
const isCustomWafWarningOpen = ref(false)
const confirmAction = ref(null)
const confirmTarget = ref(null)
const deleteTarget = ref(null)
const pendingSaveAction = ref(null)

const newSiteSteps = [
  {
    id: 'basic',
    label: 'Basics',
    title: 'Identify your website',
    description:
      'Tell Dorian which domain to protect. This is the public hostname visitors use, such as example.com or www.example.com.',
    tips: [
      'Enter the domain exactly as it appears in DNS (no https:// or path).',
      'Choose a WAF rule if you already have one; you can leave it as None and assign one later.',
      'You can edit these settings any time after the site is created.',
    ],
  },
  {
    id: 'ssl',
    label: 'SSL',
    title: 'Secure traffic with HTTPS',
    description:
      'SSL certificates encrypt visitor traffic. Pick how certificates should be issued for this domain.',
    tips: [
      'Not Configured — skip HTTPS for now (you can add it later).',
      'Automatic — Dorian requests a free certificate (Let’s Encrypt and others). DNS must point correctly first.',
      'Manual — paste your own certificate and private key if you already manage SSL elsewhere.',
    ],
  },
  {
    id: 'origins',
    label: 'Origins',
    title: 'Connect your backend servers',
    description:
      'Origin servers are the real hosts that store your website. Dorian receives visitor requests on the edge, then forwards them here.',
    tips: [
      'Add at least one origin with a reachable IP (or hostname) and port.',
      'Use HTTP or HTTPS for the origin connection, and set weight if you have more than one server.',
      'Max fails and fail timeout control how quickly an unhealthy origin is taken out of rotation.',
    ],
  },
  {
    id: 'edges',
    label: 'Edges',
    title: 'Choose where the site is served',
    description:
      'Edges are Dorian nodes closest to your users. Assign one or more edges so traffic can be accepted and protected.',
    tips: [
      'Search and select the edge nodes that should handle this site.',
      'You can assign multiple edges for redundancy across regions.',
      'Leave Status On to start serving traffic after create; turn it Off to keep the site ready but inactive.',
    ],
  },
]
const newSiteStepIndex = ref(0)

const currentNewSiteStep = computed(() => newSiteSteps[newSiteStepIndex.value] || newSiteSteps[0])
const isLastNewSiteStep = computed(() => newSiteStepIndex.value >= newSiteSteps.length - 1)

const customWafWarningMessage =
  'When you select a custom waf rule, if you change the rule in another site setting, the changed waf rule is applied to all sites. To avoid this, you can duplicate waf rule, rename it and apply the rule to the site.'

const selectedServers = ref([])
const isServerDropdownOpen = ref(false)
const serverSearch = ref('')

const pageSize = ref(8)
const currentPage = ref(1)

const filters = reactive({
  status: '',
  activity: '',
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

const filteredSites = computed(() => {
  const domainQuery = filters.domain.trim().toLowerCase()
  return sites.value.filter((site) => {
    if (filters.status && site.status !== filters.status) return false
    if (filters.activity && siteActivityKey(site) !== filters.activity) return false
    if (filters.certificateStatus === 'issuing') {
      if (!isCertIssuing(site.certificateStatus)) return false
    } else if (filters.certificateStatus && String(site.certificateStatus || 'none').toLowerCase() !== filters.certificateStatus) {
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

const enabledSitesCount = computed(() =>
  sites.value.filter((site) => String(site.status || '').toUpperCase() === 'ENABLE').length,
)

const activeSitesCount = computed(() =>
  sites.value.filter((site) => siteActivityKey(site) === 'active').length,
)

const validTlsCount = computed(() =>
  sites.value.filter((site) => String(site.certificateStatus || '').toLowerCase() === 'valid').length,
)

const totalEgressKbps = computed(() =>
  sites.value.reduce((sum, site) => sum + (Number(site.currentBandwidth) || 0), 0),
)

const sitesSubtitle = computed(() => {
  const total = sites.value.length
  const enabled = enabledSitesCount.value
  const active = activeSitesCount.value
  return `${total} hostnames · ${enabled} enabled · ${active} active`
})

const siteMetricCards = computed(() => [
  {
    label: 'Sites',
    value: String(sites.value.length),
    hint: 'Hostnames on the fabric',
    tone: 'viper',
  },
  {
    label: 'Active',
    value: String(activeSitesCount.value),
    hint: 'Serving live egress now',
    tone: 'signal',
  },
  {
    label: 'Enabled',
    value: String(enabledSitesCount.value),
    hint: `${Math.max(0, sites.value.length - enabledSitesCount.value)} disabled`,
    tone: 'ok',
  },
  {
    label: 'TLS valid',
    value: String(validTlsCount.value),
    hint: 'Certificates ready to serve',
    tone: 'l4',
  },
  {
    label: 'Live egress',
    value: formatLiveBandwidth(totalEgressKbps.value),
    hint: 'Sum of site L7 TX',
    tone: 'viper',
  },
])

const confirmTitle = computed(() => {
  if (confirmAction.value === 'edit') return 'Site is modified'
  return 'Confirm action'
})

const confirmMessage = computed(() => {
  if (confirmAction.value === 'edit') {
    return 'Are you sure you want to apply these changes to the site?'
  }
  return 'Are you sure you want to continue?'
})

const confirmConfirmText = computed(() => {
  if (confirmAction.value === 'edit') return 'Apply'
  return 'Confirm'
})

const deleteConfirmMessage = computed(() => {
  const domain = String(deleteTarget.value?.domain || '').trim()
  if (domain) {
    return `Do you want to delete "${domain}"? This cannot be undone.`
  }
  return 'Do you want to delete this site? This cannot be undone.'
})

watch(
  () => [filters.status, filters.activity, filters.domain, filters.certificateStatus, filters.sslType],
  () => {
    currentPage.value = 1
  },
)

const certificateStatusClass = (value) => {
  const status = String(value || '').toLowerCase()
  if (status === 'valid') return 'sites-cert-badge--valid'
  if (status === 'expiring') return 'sites-cert-badge--expiring'
  if (isCertIssuing(value)) return 'sites-cert-badge--issuing'
  if (status === 'expired') return 'sites-cert-badge--expired'
  if (status === 'failed') return 'sites-cert-badge--failed'
  return 'sites-cert-badge--none'
}

const siteRowClass = (site) => {
  const classes = []
  const activity = siteActivityKey(site)
  if (activity === 'active') classes.push('sites-row--live')
  if (activity === 'offline') classes.push('sites-row--offline')

  const cert = String(site?.certificateStatus || '').toLowerCase()
  if (cert === 'expired' || cert === 'failed') classes.push('sites-row--cert-danger')
  else if (cert === 'expiring') classes.push('sites-row--cert-warn')
  else if (cert === 'valid') classes.push('sites-row--cert-ok')

  return classes
}

const formatCertExpiryLine = (site) => {
  const status = String(site?.certificateStatus || '').toLowerCase()
  if (!site?.certificateExpiry) {
    if (status === 'none' || !status) return 'No certificate'
    if (isCertIssuing(status)) return 'Issuing…'
    if (status === 'failed') return 'Needs attention'
    return '—'
  }
  const date = new Date(site.certificateExpiry)
  if (Number.isNaN(date.getTime())) return '—'
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000)
  if (days < 0) return `Expired ${Math.abs(days)}d ago`
  if (days === 0) return 'Expires today'
  if (days <= 30) return `${days}d left · ${formatted}`
  return `Expires ${formatted}`
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

const formatLiveBandwidth = (kbps) => {
  const value = Number(kbps || 0)
  if (!Number.isFinite(value) || value <= 0) return '0 Kbps'
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} Gbps`
  if (value >= 1024) return `${(value / 1024).toFixed(1)} Mbps`
  return `${Math.round(value)} Kbps`
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
  const isNone = sslType === 'none'
  return {
    domain: form.domain.trim(),
    status: form.status,
    wafId: Number.isFinite(wafId) ? wafId : null,
    certificateStatus: isNone ? 'none' : form.certificateStatus,
    certificateExpiry: isNone
      ? null
      : (form.certificateExpiry ? new Date(form.certificateExpiry).toISOString() : null),
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
  newSiteStepIndex.value = 0
}

const validateNewSiteStep = (stepId) => {
  if (stepId === 'basic') {
    if (!String(newSite.domain || '').trim()) {
      return 'Domain is required.'
    }
    return ''
  }

  if (stepId === 'ssl') {
    if (String(newSite.sslType || '').toLowerCase() === 'custom') {
      if (!String(newSite.sslCert || '').trim() || !String(newSite.sslCertKey || '').trim()) {
        return 'Manual SSL configuration requires both certificate and private key.'
      }
    }
    return ''
  }

  if (stepId === 'origins') {
    return validateOriginServers(newSite.originServers) || ''
  }

  return ''
}

const goToNewSiteStep = (index) => {
  if (index < 0 || index > newSiteStepIndex.value) return
  newSiteStepIndex.value = index
}

const goToPreviousNewSiteStep = () => {
  if (newSiteStepIndex.value <= 0) return
  newSiteStepIndex.value -= 1
}

const goToNextNewSiteStep = () => {
  const stepError = validateNewSiteStep(currentNewSiteStep.value.id)
  if (stepError) {
    notifyError(SITES_TITLE, stepError)
    return
  }
  if (newSiteStepIndex.value >= newSiteSteps.length - 1) return
  newSiteStepIndex.value += 1
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

const loadSites = async ({ silent = false } = {}) => {
  if (!silent) isLoading.value = true
  try {
    const data = await fetchSites()
    sites.value = Array.isArray(data) ? data : []
  } catch (error) {
    sites.value = []
    if (!silent) {
      notifyError(SITES_TITLE, error?.message || 'Sites could not be loaded.')
    }
  } finally {
    if (!silent) isLoading.value = false
  }
}

const hasPendingCertificate = computed(() =>
  sites.value.some((site) => isCertIssuing(site?.certificateStatus)),
)

let certPollTimer = null
let sitesLiveTimer = null
let sitesLiveInFlight = false
const SITES_LIVE_REFRESH_MS = 15_000
const SITES_CERT_REFRESH_MS = 1_000

const stopCertPoll = () => {
  if (certPollTimer) {
    clearInterval(certPollTimer)
    certPollTimer = null
  }
}

const stopSitesLivePoll = () => {
  if (sitesLiveTimer) {
    clearInterval(sitesLiveTimer)
    sitesLiveTimer = null
  }
}

const refreshSitesLive = async () => {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  if (sitesLiveInFlight) return
  sitesLiveInFlight = true
  try {
    await loadSites({ silent: true })
  } finally {
    sitesLiveInFlight = false
  }
}

const startSitesLivePoll = () => {
  stopSitesLivePoll()
  sitesLiveTimer = window.setInterval(() => {
    void refreshSitesLive()
  }, SITES_LIVE_REFRESH_MS)
}

watch(
  hasPendingCertificate,
  (pending) => {
    if (!pending) {
      stopCertPoll()
      return
    }
    if (certPollTimer) return
    certPollTimer = setInterval(() => {
      void refreshSitesLive()
    }, SITES_CERT_REFRESH_MS)
  },
  { immediate: true },
)

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

const renewingSiteId = ref(null)

const canRenewCert = (site) =>
  String(site?.sslType || '').toLowerCase() === 'letsencrypt'

const isRenewingCert = (site) =>
  String(renewingSiteId.value) === String(site?.id) || isCertIssuing(site?.certificateStatus)

const renewCertLabel = (site) => (isRenewingCert(site) ? 'Renewing...' : 'Renew Cert')

const renewCertHint = (site) => {
  const sslType = String(site?.sslType || '').toLowerCase()
  if (sslType === 'letsencrypt') {
    return "Issue a new Let's Encrypt certificate using the current DNS-01 settings."
  }
  if (sslType === 'custom') {
    return 'Manual certificates cannot be renewed automatically. Upload a new certificate in Origin.'
  }
  if (sslType === 'zerossl' || sslType === 'googletrust') {
    return "Automatic renewal is only available for Let's Encrypt."
  }
  return "Select Let's Encrypt to renew automatically."
}

const renewCert = async (site) => {
  if (!site?.id || !canRenewCert(site) || isRenewingCert(site)) return
  renewingSiteId.value = site.id
  activeRowMenu.value = null
  try {
    const updated = await renewSiteCertificate(site.id)
    notifySuccess(SITES_TITLE, "Let's Encrypt renewal started.")
    const index = sites.value.findIndex((item) => String(item.id) === String(site.id))
    if (index !== -1 && updated) {
      sites.value[index] = { ...sites.value[index], ...updated }
    } else {
      await loadSites({ silent: true })
    }
    notifySitesChanged()
  } catch (error) {
    notifyError(SITES_TITLE, error?.message || 'Certificate could not be renewed.')
  } finally {
    renewingSiteId.value = null
  }
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
    notifySiteEdgeSync(SITES_TITLE, created?.edgeSync, {
      fallbackSuccess: String(newSite.sslType || '').toLowerCase() === 'letsencrypt'
        ? "Site created. Let's Encrypt certificate is being issued in the background."
        : 'The site is successfully created.',
    })
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
  for (let index = 0; index < newSiteSteps.length; index += 1) {
    const stepError = validateNewSiteStep(newSiteSteps[index].id)
    if (stepError) {
      newSiteStepIndex.value = index
      notifyError(SITES_TITLE, stepError)
      return
    }
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
  deleteTarget.value = site
  isDeleteConfirmOpen.value = true
  activeRowMenu.value = null
}

const clearDeleteConfirm = () => {
  isDeleteConfirmOpen.value = false
  deleteTarget.value = null
}

const applyEditSite = async () => {
  if (!editSiteId.value) return
  try {
    const updated = await updateSite(editSiteId.value, buildPayload(editSite))
    await syncOriginServers(editSiteId.value, editSite.originServers, editOriginInitialIds.value)
    notifySiteEdgeSync(SITES_TITLE, updated?.edgeSync, {
      fallbackSuccess: 'The site is successfully updated.',
    })
    closeEditSiteDialog()
    await loadSites()
    notifySitesChanged()
  } catch (error) {
    notifyError(SITES_TITLE, error?.message || 'The site could not be updated.')
  }
}

const handleDeleteSite = async () => {
  const site = deleteTarget.value
  if (!site?.id) return
  try {
    const result = await deleteSite(site.id)
    await loadSites()
    notifySitesChanged()
    notifySuccess(SITES_TITLE, 'The site is successfully deleted.')
    notifySiteEdgeSync(SITES_TITLE, result?.edgeSync)
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (error) {
    notifyError(SITES_TITLE, error?.message || 'The site could not be deleted.')
  } finally {
    clearDeleteConfirm()
  }
}

const handleConfirmDialog = async () => {
  if (confirmAction.value === 'edit') {
    await applyEditSite()
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

const onVisibilityChange = () => {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    void refreshSitesLive()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutsideMenu)
  document.addEventListener('visibilitychange', onVisibilityChange)
  void loadSites()
  void loadServers()
  void loadWafRules()
  startSitesLivePoll()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsideMenu)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  stopCertPoll()
  stopSitesLivePoll()
})
</script>

<style scoped>
.sites-view {
  --sites-radius: 8px;
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

.sites-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.sites-kicker {
  margin: 0 0 3px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.sites-topbar__left h2 {
  margin: 0 0 3px;
  font-size: 1.4rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--app-heading);
  line-height: 1.2;
}

.sites-topbar__left p:last-child {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
}

.sites-topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sites-primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: none;
  border-radius: var(--sites-radius);
  padding: 9px 14px;
  background: var(--dorian-viper-500, var(--app-accent));
  color: #08120e;
  font-weight: 650;
  font-size: 13px;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.sites-primary-btn svg {
  width: 14px;
  height: 14px;
}

.sites-primary-btn:hover {
  filter: brightness(1.06);
}

.sites-metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.sites-metric {
  position: relative;
  overflow: hidden;
  padding: 12px 14px 12px 16px;
  border-radius: var(--sites-radius);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
}

.sites-metric::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--metric-accent, var(--dorian-viper-500, var(--app-accent)));
}

.sites-metric--viper { --metric-accent: var(--dorian-viper-500, #2e9e6c); }
.sites-metric--ok { --metric-accent: #4fbd7a; }
.sites-metric--l4 { --metric-accent: #5b9df0; }
.sites-metric--signal { --metric-accent: var(--dorian-viper-400, #3fbd85); }

.sites-metric__label {
  display: block;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  font-weight: 600;
}

.sites-metric__value {
  display: block;
  margin-top: 6px;
  font-size: 1.3rem;
  font-weight: 650;
  color: var(--app-heading);
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.sites-metric__hint {
  display: block;
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.sites-filterbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--sites-radius);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
}

.sites-filter-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 128px;
}

.sites-filter-field--grow {
  flex: 1 1 200px;
  min-width: 180px;
}

.sites-filter-field label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.sites-filter-field input,
.sites-filter-field select {
  border: 1px solid var(--app-input-border);
  border-radius: 6px;
  padding: 8px 11px;
  font-size: 13px;
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
}

.sites-filter-field input:focus,
.sites-filter-field select:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft);
}

.sites-filter-summary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-left: auto;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid rgba(46, 158, 108, 0.28);
  background: rgba(46, 158, 108, 0.08);
  color: var(--dorian-viper-400, var(--app-accent));
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.sites-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dorian-viper-400, var(--app-accent));
  box-shadow: 0 0 0 3px rgba(63, 189, 133, 0.16);
  animation: sites-live-pulse 1.8s ease-in-out infinite;
}

@keyframes sites-live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.sites-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: var(--sites-radius);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  overflow: hidden;
}

.sites-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface-elevated) 70%, transparent);
}

.sites-panel__head h3 {
  margin: 0;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
}

.sites-count-tag {
  flex: none;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid var(--app-border);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  color: var(--app-text-muted);
}

.sites-table-wrap {
  overflow-x: auto;
  flex: 1;
}

.sites-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 920px;
}

.sites-table th,
.sites-table td {
  text-align: left;
  padding: 11px 14px;
  border-bottom: 1px solid var(--app-border);
  vertical-align: middle;
}

.sites-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--app-surface-elevated);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--app-text-muted);
  font-weight: 650;
}

.sites-row {
  cursor: pointer;
  transition: background 0.12s ease;
  box-shadow: inset 3px 0 0 transparent;
}

.sites-row:hover {
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 6%, transparent);
}

.sites-row--live {
  box-shadow: inset 3px 0 0 var(--dorian-viper-500, #2e9e6c);
}

.sites-row--cert-danger {
  background: rgba(225, 82, 65, 0.05);
}

.sites-row--cert-danger:hover {
  background: rgba(225, 82, 65, 0.09);
}

.sites-row--cert-warn {
  background: rgba(224, 168, 63, 0.05);
}

.sites-row--cert-warn:hover {
  background: rgba(224, 168, 63, 0.09);
}

.sites-row--offline:not(.sites-row--cert-danger):not(.sites-row--cert-warn) {
  opacity: 0.88;
}

.sites-domain {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sites-domain__name {
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
  word-break: break-word;
  line-height: 1.3;
}

.sites-domain__meta {
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.sites-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
}

.sites-live-badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
}

.sites-live-badge__copy {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.sites-live-badge__copy strong {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.sites-live-badge__copy span {
  font-size: 10px;
  font-weight: 550;
  opacity: 0.78;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
}

.sites-live-badge--active {
  color: var(--dorian-viper-400, #3fbd85);
  background: rgba(46, 158, 108, 0.14);
  border-color: rgba(46, 158, 108, 0.32);
}

.sites-live-badge--active .sites-live-badge__dot {
  box-shadow: 0 0 0 3px rgba(63, 189, 133, 0.2);
  animation: sites-live-pulse 1.8s ease-in-out infinite;
}

.sites-live-badge--idle {
  color: #d4921f;
  background: rgba(224, 168, 63, 0.14);
  border-color: rgba(224, 168, 63, 0.32);
}

.sites-live-badge--offline {
  color: var(--app-text-muted);
  background: rgba(139, 151, 143, 0.12);
  border-color: rgba(139, 151, 143, 0.24);
}

.sites-cert-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  min-width: 0;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
}

.sites-cert-badge__status {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.sites-cert-badge__expiry {
  font-size: 10px;
  font-weight: 550;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  opacity: 0.82;
  line-height: 1.25;
}

.sites-cert-badge--valid {
  color: var(--dorian-viper-400, #3fbd85);
  background: rgba(46, 158, 108, 0.14);
  border-color: rgba(46, 158, 108, 0.32);
}

.sites-cert-badge--expiring,
.sites-cert-badge--issuing {
  color: #d4921f;
  background: rgba(224, 168, 63, 0.14);
  border-color: rgba(224, 168, 63, 0.32);
}

.sites-cert-badge--expired,
.sites-cert-badge--failed {
  color: #e15241;
  background: rgba(225, 82, 65, 0.14);
  border-color: rgba(225, 82, 65, 0.34);
}

.sites-cert-badge--none {
  color: var(--app-text-muted);
  background: rgba(139, 151, 143, 0.12);
  border-color: rgba(139, 151, 143, 0.24);
}

.sites-waf {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--app-text);
  font-size: 12.5px;
}

.sites-egress {

  font-size: 13px;
  font-weight: 650;
  color: var(--app-text-muted);
}

.sites-egress.is-hot {
  color: var(--dorian-viper-400, var(--app-accent));
}

.sites-edges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.sites-edge-chip {
  padding: 3px 7px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--dorian-viper-400, #3fbd85);
  background: rgba(46, 158, 108, 0.1);
  border: 1px solid rgba(46, 158, 108, 0.22);
}

.sites-edge-more {
  padding: 3px 7px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 650;
  color: var(--app-text-muted);
  background: var(--app-surface-elevated);
  border: 1px solid var(--app-border);
}

.sites-muted,
.sites-empty {
  color: var(--app-text-muted);
  font-size: 12.5px;
}

.sites-empty {
  padding: 24px 12px !important;
  text-align: center;
}

.sites-empty-link {
  display: inline;
  margin-left: 6px;
  border: none;
  background: none;
  color: var(--dorian-viper-400, var(--app-accent));
  font-weight: 650;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.sites-col-actions {
  width: 48px;
  text-align: right;
}

.sites-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  color: var(--app-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s ease;
}

.sites-icon-btn svg {
  width: 14px;
  height: 14px;
}

.sites-icon-btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.sites-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid var(--app-border);
}

.sites-footer__info,
.sites-footer__page {
  color: var(--app-text-muted);
  font-size: 12px;
}

.sites-footer__pager {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sites-pager-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  color: var(--app-text);
  border-radius: 6px;
  padding: 6px 11px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.sites-pager-btn:hover:not(:disabled) {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.sites-pager-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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
  top: calc(100% + 4px);
  right: 0;
  min-width: 148px;
  background: var(--app-surface-solid);
  border: 1px solid var(--app-border);
  border-radius: 6px;
  box-shadow: 0 10px 24px var(--app-shadow);
  padding: 4px;
  z-index: 50;
}

.row-menu-item {
  width: 100%;
  text-align: left;
  padding: 7px 10px;
  border-radius: 4px;
  border: none;
  background: transparent;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--app-text);
  cursor: pointer;
}

.row-menu-item:hover {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.row-menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.row-menu-item:disabled:hover {
  background: transparent;
  color: var(--app-text);
}

.row-menu-item.danger {
  color: #f87171;
}

.row-menu-item.danger:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

@media (max-width: 1200px) {
  .sites-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .sites-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sites-filter-summary {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .sites-metrics {
    grid-template-columns: 1fr;
  }
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
  border-radius: 12px;
  box-shadow: 0 24px 48px var(--app-shadow);
  border: 1px solid var(--app-border);
  padding: 20px;
}

.dialog-card--site {
  max-width: 760px;
  max-height: min(88vh, 860px);
  display: flex;
  flex-direction: column;
  padding: 18px;
}

.dialog-card--wizard {
  max-width: 720px;
}

.dialog-card--busy {
  pointer-events: none;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.dialog-header__copy {
  min-width: 0;
}

.dialog-header h3 {
  margin: 0;
  font-size: var(--type-metric-value);
  font-weight: 600;
  color: var(--app-heading);
}

.dialog-header__copy p {
  margin: 4px 0 0;
  font-size: var(--type-caption);
  line-height: 1.4;
  color: var(--app-text-muted);
}

.site-wizard-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.site-wizard-step {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.site-wizard-step:disabled {
  cursor: default;
  opacity: 0.55;
}

.site-wizard-step.is-reachable:not(:disabled):hover {
  border-color: var(--dorian-viper-700, #1f6e4a);
  color: var(--dorian-viper-400, #3fbd85);
}

.site-wizard-step.is-complete {
  border-color: rgba(46, 158, 108, 0.28);
  color: var(--dorian-viper-400, #3fbd85);
  background: var(--app-accent-soft);
}

.site-wizard-step.is-active {
  border-color: var(--dorian-viper-500, #2e9e6c);
  background: var(--app-accent-soft);
  color: var(--app-heading);
  opacity: 1;
}

.site-wizard-step__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid currentColor;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  font-weight: 600;
}

.site-wizard-step.is-active .site-wizard-step__index,
.site-wizard-step.is-complete .site-wizard-step__index {
  background: var(--dorian-viper-500, #2e9e6c);
  border-color: var(--dorian-viper-500, #2e9e6c);
  color: #08120e;
}

.site-wizard-step__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--type-caption);
  font-weight: 650;
}

.site-wizard-guide {
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: var(--app-accent-soft);
  flex-shrink: 0;
}

.site-wizard-guide__title {
  margin: 0;
  font-size: var(--type-base);
  font-weight: 650;
  color: var(--app-heading);
}

.site-wizard-guide__lead {
  margin: 6px 0 0;
  font-size: var(--type-caption);
  line-height: 1.5;
  color: var(--app-text-secondary);
}

.site-wizard-guide__list {
  margin: 10px 0 0;
  padding: 0 0 0 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.site-wizard-guide__list li {
  font-size: var(--type-caption);
  line-height: 1.45;
  color: var(--app-text-muted);
}

.dialog-close {
  border: none;
  background: var(--app-surface-elevated);
  color: var(--app-text-muted);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: 1px solid var(--app-border);
  flex-shrink: 0;
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

.dialog-footer--wizard {
  justify-content: space-between;
  align-items: center;
}

.dialog-footer__actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.site-wizard-progress {
  font-size: var(--type-caption);
  color: var(--app-text-muted);
  font-variant-numeric: tabular-nums;
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
  border: 2px solid rgba(8, 18, 14, 0.25);
  border-top-color: #08120e;
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

  .site-wizard-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dialog-footer--wizard {
    flex-direction: column;
    align-items: stretch;
  }

  .dialog-footer__actions {
    justify-content: space-between;
  }
}
</style>
