<template>
  <div class="origin-panel">
    <header class="origin-intro">
      <div class="origin-intro__copy">
        <p class="origin-kicker">Site origin</p>
        <h4>Domain, SSL &amp; backends</h4>
        <p class="panel-desc">
          Point traffic at this site’s hostname, choose how HTTPS is terminated, then attach the origin servers that serve responses.
        </p>
      </div>
      <div v-if="siteId && !loading && !loadError" class="origin-summary">
        <div class="summary-chip">
          <span class="summary-chip__label">Hostname</span>
          <strong class="summary-chip__value">{{ displayDomain }}</strong>
        </div>
        <div class="summary-chip">
          <span class="summary-chip__label">SSL</span>
          <strong class="summary-chip__value">
            <span class="cert-pill" :class="certStatusClass(snapshot.certificateStatus)">
              {{ formatCertStatus(snapshot.certificateStatus) }}
            </span>
          </strong>
        </div>
        <div class="summary-chip">
          <span class="summary-chip__label">Provider</span>
          <strong class="summary-chip__value">{{ formatSslType(initial.sslType) }}</strong>
        </div>
      </div>
    </header>

    <p v-if="!siteId" class="helper-banner">Select a site to configure origin settings.</p>
    <p v-else-if="loading" class="helper-banner">Loading origin settings...</p>
    <p v-else-if="loadError" class="helper-banner helper-banner--error">{{ loadError }}</p>

    <template v-else>
      <section class="origin-card" :class="{ 'origin-card--dirty': isDomainDirty }">
        <div class="origin-card__head">
          <div class="origin-card__title-row">
            <span class="step-badge" aria-hidden="true">1</span>
            <div>
              <h5>Domain</h5>
              <p>Public hostname clients resolve to reach this site through the CDN.</p>
            </div>
          </div>
          <span v-if="isDomainDirty" class="dirty-tag">Unsaved changes</span>
        </div>

        <div class="origin-card__body">
          <div class="form-field">
            <label for="origin-domain">Domain name</label>
            <div class="domain-input-row">
              <span class="domain-prefix" aria-hidden="true">https://</span>
              <input
                id="origin-domain"
                v-model="form.domain"
                type="text"
                placeholder="www.example.com"
                autocomplete="off"
                spellcheck="false"
                :disabled="savingDomain || savingSsl"
              />
            </div>
            <p class="field-hint">
              Use a fully qualified hostname without a path or scheme. Changes apply after you confirm.
            </p>
          </div>
        </div>

        <div class="origin-card__footer">
          <button
            class="ghost-btn"
            type="button"
            :disabled="!isDomainDirty || savingDomain"
            @click="resetDomain"
          >
            Discard
          </button>
          <button
            class="primary-btn"
            type="button"
            :disabled="!isDomainDirty || savingDomain || savingSsl"
            @click="saveDomain"
          >
            {{ savingDomain ? 'Saving...' : 'Confirm domain' }}
          </button>
        </div>
      </section>

      <section class="origin-card" :class="{ 'origin-card--dirty': isSslDirty }">
        <div class="origin-card__head">
          <div class="origin-card__title-row">
            <span class="step-badge" aria-hidden="true">2</span>
            <div>
              <h5>SSL settings</h5>
              <p>Choose how the edge presents a certificate for this domain over HTTPS.</p>
            </div>
          </div>
          <span v-if="isSslDirty" class="dirty-tag">Unsaved changes</span>
        </div>

        <div class="origin-card__body origin-card__body--ssl">
          <div class="ssl-status-bar">
            <div class="ssl-status-bar__item">
              <span class="ssl-status-bar__label">Live status</span>
              <span class="cert-pill" :class="certStatusClass(snapshot.certificateStatus)">
                {{ formatCertStatus(snapshot.certificateStatus) }}
              </span>
            </div>
            <div class="ssl-status-bar__item">
              <span class="ssl-status-bar__label">Expires</span>
              <span class="ssl-status-bar__value">{{ formatCertExpiry(snapshot.certificateExpiry) }}</span>
            </div>
            <div class="ssl-status-bar__item">
              <span class="ssl-status-bar__label">Saved provider</span>
              <span class="ssl-status-bar__value">{{ formatSslType(initial.sslType) }}</span>
            </div>
          </div>

          <div class="mode-block">
            <p class="mode-block__label">Certificate mode</p>
            <div class="type-grid" role="radiogroup" aria-label="Certificate type">
              <button
                v-for="mode in certificateModes"
                :key="mode.value"
                type="button"
                class="type-card"
                :class="{ active: certificateMode === mode.value }"
                role="radio"
                :aria-checked="certificateMode === mode.value"
                :disabled="savingDomain || savingSsl"
                @click="certificateMode = mode.value"
              >
                <span class="type-card__label">{{ mode.label }}</span>
                <span class="type-card__desc">{{ mode.description }}</span>
              </button>
            </div>
          </div>

          <div v-if="certificateMode === 'automatic'" class="subpanel">
            <div class="subpanel-label">Automatic provider</div>
            <p class="subpanel-hint">The edge will request and renew certificates for the configured domain.</p>
            <div class="segmented" role="radiogroup" aria-label="Certificate provider">
              <button
                v-for="provider in automaticProviders"
                :key="provider.value"
                type="button"
                class="segmented__btn"
                :class="{ active: form.sslType === provider.value }"
                role="radio"
                :aria-checked="form.sslType === provider.value"
                :disabled="savingDomain || savingSsl"
                @click="form.sslType = provider.value"
              >
                {{ provider.label }}
              </button>
            </div>
          </div>

          <div v-if="certificateMode === 'manual'" class="subpanel subpanel--stack">
            <p class="subpanel-hint">Paste a PEM certificate and matching private key. Intermediate chain certificates can be included in the certificate field.</p>
            <div class="form-field">
              <label for="origin-ssl-cert">Certificate (PEM)</label>
              <textarea
                id="origin-ssl-cert"
                v-model="form.sslCert"
                rows="5"
                placeholder="-----BEGIN CERTIFICATE-----"
                :disabled="savingDomain || savingSsl"
              ></textarea>
            </div>
            <div class="form-field">
              <label for="origin-ssl-key">Private key (PEM)</label>
              <textarea
                id="origin-ssl-key"
                v-model="form.sslCertKey"
                rows="5"
                placeholder="-----BEGIN PRIVATE KEY-----"
                :disabled="savingDomain || savingSsl"
              ></textarea>
            </div>
          </div>

          <div v-if="certificateMode === 'none'" class="ssl-none-note">
            HTTPS will not present a managed certificate until you pick automatic issuance or upload a manual cert.
          </div>
        </div>

        <div class="origin-card__footer">
          <button
            class="ghost-btn"
            type="button"
            :disabled="!isSslDirty || savingSsl"
            @click="resetSsl"
          >
            Discard
          </button>
          <button
            class="primary-btn"
            type="button"
            :disabled="!isSslDirty || savingSsl || savingDomain"
            @click="saveSsl"
          >
            {{ savingSsl ? 'Saving...' : 'Confirm SSL' }}
          </button>
        </div>
      </section>

      <section class="origin-card origin-card--servers">
        <div class="origin-card__head">
          <div class="origin-card__title-row">
            <span class="step-badge" aria-hidden="true">3</span>
            <div>
              <h5>Origin servers</h5>
              <p>Backend hosts the CDN contacts for uncached or dynamic content.</p>
            </div>
          </div>
        </div>
        <div class="origin-card__body origin-card__body--flush">
          <UpstreamServersPanel :site-id="siteId" embedded />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { fetchSite, updateSite } from '@/api/sites'
import { notifyError, notifySuccess } from '@/utils/notify'
import UpstreamServersPanel from './UpstreamServersPanel.vue'

const DOMAIN_TITLE = 'Domain'
const SSL_TITLE = 'SSL settings'

const props = defineProps({
  siteId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['updated'])

const automaticProviders = [
  { value: 'letsencrypt', label: "Let's Encrypt" },
  { value: 'zerossl', label: 'ZeroSSL' },
  { value: 'googletrust', label: 'Google Trust' },
]

const certificateModes = [
  {
    value: 'none',
    label: 'Not configured',
    description: 'Disable HTTPS certificates for now',
  },
  {
    value: 'automatic',
    label: 'Automatic',
    description: 'Issue & renew via a trusted CA',
  },
  {
    value: 'manual',
    label: 'Manual',
    description: 'Upload your own cert and key',
  },
]

const loading = ref(false)
const savingDomain = ref(false)
const savingSsl = ref(false)
const loadError = ref('')

const snapshot = reactive({
  status: 'ENABLE',
  wafId: null,
  certificateStatus: 'none',
  certificateExpiry: null,
  cacheRatio: 0,
  bandwidth: 0,
  serverIds: [],
})

const form = reactive({
  domain: '',
  sslType: 'none',
  sslCert: '',
  sslCertKey: '',
})

const initial = reactive({
  domain: '',
  sslType: 'none',
  sslCert: '',
  sslCertKey: '',
})

const displayDomain = computed(() => initial.domain.trim() || 'Not set')

const certificateMode = computed({
  get() {
    const sslType = String(form.sslType || 'none').toLowerCase()
    if (sslType === 'custom') return 'manual'
    if (['letsencrypt', 'zerossl', 'googletrust', 'managed'].includes(sslType)) return 'automatic'
    return 'none'
  },
  set(mode) {
    if (mode === 'none') {
      form.sslType = 'none'
      form.sslCert = ''
      form.sslCertKey = ''
      return
    }
    if (mode === 'manual') {
      form.sslType = 'custom'
      return
    }
    if (mode === 'automatic') {
      const current = String(form.sslType || '').toLowerCase()
      if (!['letsencrypt', 'zerossl', 'googletrust'].includes(current)) {
        form.sslType = 'letsencrypt'
      }
      form.sslCert = ''
      form.sslCertKey = ''
    }
  },
})

const isDomainDirty = computed(
  () => form.domain.trim() !== initial.domain.trim(),
)

const isSslDirty = computed(
  () =>
    String(form.sslType || '') !== String(initial.sslType || '')
    || String(form.sslCert || '') !== String(initial.sslCert || '')
    || String(form.sslCertKey || '') !== String(initial.sslCertKey || ''),
)

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

const formatCertExpiry = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatSslType = (value) => {
  const map = {
    none: 'Not configured',
    letsencrypt: "Let's Encrypt",
    zerossl: 'ZeroSSL',
    googletrust: 'Google Trust',
    custom: 'Manual',
    managed: 'Managed',
  }
  return map[String(value || 'none').toLowerCase()] || String(value || '—')
}

const applySite = (site) => {
  snapshot.status = site.status || 'ENABLE'
  snapshot.wafId = site.wafId ?? null
  snapshot.certificateStatus = site.certificateStatus || 'none'
  snapshot.certificateExpiry = site.certificateExpiry || null
  snapshot.cacheRatio = site.cacheRatio ?? 0
  snapshot.bandwidth = site.bandwidth ?? 0
  snapshot.serverIds = Array.isArray(site.serverIds) ? [...site.serverIds] : []

  form.domain = site.domain || ''
  form.sslType = site.sslType || 'none'
  form.sslCert = site.sslCert || ''
  form.sslCertKey = site.sslCertKey || ''

  initial.domain = form.domain
  initial.sslType = form.sslType
  initial.sslCert = form.sslCert
  initial.sslCertKey = form.sslCertKey
}

const loadSite = async () => {
  if (!props.siteId) {
    loadError.value = ''
    applySite({})
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const site = await fetchSite(props.siteId)
    applySite(site || {})
  } catch (error) {
    applySite({})
    loadError.value = error?.message || 'Could not load origin settings.'
  } finally {
    loading.value = false
  }
}

const resetDomain = () => {
  form.domain = initial.domain
}

const resetSsl = () => {
  form.sslType = initial.sslType
  form.sslCert = initial.sslCert
  form.sslCertKey = initial.sslCertKey
}

const normalizeDomain = (value) => {
  let domain = String(value || '').trim().toLowerCase()
  domain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
  return domain
}

const validateDomain = (domain) => {
  if (!domain) return 'Domain name is required.'
  if (/\s/.test(domain)) return 'Domain name cannot contain spaces.'
  if (domain.includes('/')) return 'Enter a hostname only, without a path.'
  return ''
}

const validateSsl = () => {
  if (String(form.sslType || '').toLowerCase() === 'custom') {
    if (!form.sslCert.trim() || !form.sslCertKey.trim()) {
      return 'Manual SSL requires both certificate and private key.'
    }
  }
  return ''
}

const buildPayload = ({ domain, sslType, sslCert, sslCertKey }) => {
  const normalizedSslType = String(sslType || 'none').toLowerCase()
  return {
    domain,
    status: snapshot.status,
    wafId: snapshot.wafId,
    certificateStatus: snapshot.certificateStatus,
    certificateExpiry: snapshot.certificateExpiry
      ? new Date(snapshot.certificateExpiry).toISOString()
      : null,
    cacheRatio: Number(snapshot.cacheRatio) || 0,
    bandwidth: Number(snapshot.bandwidth) || 0,
    sslType: normalizedSslType,
    sslCert: normalizedSslType === 'custom' ? String(sslCert || '').trim() : '',
    sslCertKey: normalizedSslType === 'custom' ? String(sslCertKey || '').trim() : '',
    serverIds: [...snapshot.serverIds],
  }
}

const persistSite = async (payload, title, successMessage) => {
  const updated = await updateSite(props.siteId, payload)
  applySite(updated || payload)
  notifySuccess(title, successMessage)
  emit('updated', updated)
}

const saveDomain = async () => {
  if (!props.siteId || savingDomain.value || savingSsl.value || !isDomainDirty.value) return

  const domain = normalizeDomain(form.domain)
  form.domain = domain
  const validationError = validateDomain(domain)
  if (validationError) {
    notifyError(DOMAIN_TITLE, validationError)
    return
  }

  const payload = buildPayload({
    domain,
    sslType: initial.sslType,
    sslCert: initial.sslCert,
    sslCertKey: initial.sslCertKey,
  })

  savingDomain.value = true
  try {
    await persistSite(payload, DOMAIN_TITLE, 'Domain updated.')
  } catch (error) {
    notifyError(DOMAIN_TITLE, error?.message || 'Could not update domain.')
  } finally {
    savingDomain.value = false
  }
}

const saveSsl = async () => {
  if (!props.siteId || savingSsl.value || savingDomain.value || !isSslDirty.value) return

  const validationError = validateSsl()
  if (validationError) {
    notifyError(SSL_TITLE, validationError)
    return
  }

  if (!initial.domain.trim()) {
    notifyError(SSL_TITLE, 'Set and confirm a domain before updating SSL.')
    return
  }

  const payload = buildPayload({
    domain: initial.domain.trim(),
    sslType: form.sslType,
    sslCert: form.sslCert,
    sslCertKey: form.sslCertKey,
  })

  savingSsl.value = true
  try {
    await persistSite(payload, SSL_TITLE, 'SSL settings updated.')
  } catch (error) {
    notifyError(SSL_TITLE, error?.message || 'Could not update SSL settings.')
  } finally {
    savingSsl.value = false
  }
}

watch(
  () => props.siteId,
  () => {
    void loadSite()
  },
  { immediate: true },
)
</script>

<style scoped>
.origin-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.origin-intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 4px 2px 2px;
}

.origin-kicker {
  margin: 0 0 4px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.origin-intro h4 {
  margin: 0 0 6px;
  font-size: 1.15rem;
  font-weight: 650;
  color: var(--app-heading);
}

.panel-desc {
  margin: 0;
  max-width: 42rem;
  color: var(--app-text-muted);
  font-size: 0.92rem;
  line-height: 1.5;
}

.origin-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.summary-chip {
  min-width: 120px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-chip__label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.summary-chip__value {
  font-size: 0.88rem;
  font-weight: 650;
  color: var(--app-heading);
  word-break: break-all;
}

.helper-banner {
  margin: 0;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px dashed var(--app-border);
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
  font-size: 0.92rem;
}

.helper-banner--error {
  border-color: rgba(185, 28, 28, 0.35);
  color: #b91c1c;
  background: rgba(185, 28, 28, 0.06);
}

.origin-card {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-solid);
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.origin-card--dirty {
  border-color: color-mix(in srgb, var(--app-accent) 45%, var(--app-border));
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.origin-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 0;
}

.origin-card__title-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 0.82rem;
  font-weight: 700;
  flex-shrink: 0;
}

.origin-card__head h5 {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 650;
  color: var(--app-heading);
}

.origin-card__head p {
  margin: 0;
  font-size: 0.86rem;
  color: var(--app-text-muted);
  line-height: 1.4;
}

.dirty-tag {
  flex-shrink: 0;
  margin-top: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.origin-card__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 18px;
}

.origin-card__body--ssl {
  gap: 18px;
}

.origin-card__body--flush {
  padding: 8px 10px 12px;
}

.origin-card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--app-border);
  background: var(--app-surface-muted);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--app-text-muted);
}

.domain-input-row {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--app-input-border);
  border-radius: 12px;
  background: var(--app-input-bg);
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.domain-input-row:focus-within {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.domain-prefix {
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border-right: 1px solid var(--app-input-border);
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
  font-size: 0.86rem;
  font-weight: 600;
  white-space: nowrap;
}

.domain-input-row input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  padding: 12px 14px;
  font-size: 0.95rem;
  color: var(--app-text);
  background: transparent;
}

.form-field textarea {
  border: 1px solid var(--app-input-border);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 0.85rem;
  color: var(--app-text);
  background: var(--app-input-bg);
  outline: none;
  resize: vertical;
  min-height: 110px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  line-height: 1.45;
}

.form-field textarea:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.field-hint,
.subpanel-hint,
.ssl-none-note {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--app-text-muted);
}

.ssl-none-note {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--app-surface-muted);
  border: 1px dashed var(--app-border);
}

.ssl-status-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
}

.ssl-status-bar__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.ssl-status-bar__label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.ssl-status-bar__value {
  font-size: 0.9rem;
  font-weight: 650;
  color: var(--app-heading);
}

.cert-pill {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.cert-pill.is-valid {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.cert-pill.is-expiring {
  background: rgba(217, 119, 6, 0.14);
  color: #b45309;
}

.cert-pill.is-expired {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.cert-pill.is-none {
  background: var(--app-surface-hover, rgba(0, 0, 0, 0.04));
  color: var(--app-text-muted);
}

.mode-block__label,
.subpanel-label {
  margin: 0 0 8px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-height: 92px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.type-card:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--app-accent) 50%, var(--app-border));
}

.type-card.active {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
  box-shadow: inset 0 0 0 1px var(--app-accent);
}

.type-card:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.type-card__label {
  font-size: 0.9rem;
  font-weight: 650;
  color: var(--app-heading);
}

.type-card__desc {
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--app-text-muted);
}

.subpanel {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
}

.subpanel--stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.segmented {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.segmented__btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  color: var(--app-text-secondary);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}

.segmented__btn.active {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.segmented__btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .origin-intro {
    flex-direction: column;
  }

  .origin-summary {
    justify-content: flex-start;
    width: 100%;
  }

  .ssl-status-bar,
  .type-grid {
    grid-template-columns: 1fr;
  }
}
</style>
