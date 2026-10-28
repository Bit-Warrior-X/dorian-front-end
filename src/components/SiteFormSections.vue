<template>
  <div class="site-form" :class="{ 'site-form--wizard': isWizard }">
    <section v-show="isStepVisible('basic')" class="site-form__section">
      <div class="site-form__section-head">
        <div class="site-form__section-identity">
          <span class="site-form__section-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </span>
          <div class="site-form__section-copy">
            <h4 class="info-hint-heading">
              <span>Basic Setting</span>
              <InfoHint
                text="Domain name and the WAF rule that protects this site."
                aria-label="Basic Setting help"
              />
            </h4>
          </div>
        </div>
      </div>

      <div class="site-form__row">
        <div class="site-form__field">
          <label :for="`${fieldPrefix}-domain`">Domain</label>
          <input
            :id="`${fieldPrefix}-domain`"
            v-model="form.domain"
            type="text"
            placeholder="example.com"
          />
        </div>
        <div class="site-form__field">
          <label :for="`${fieldPrefix}-waf-rule`">WAF Rule</label>
          <div ref="wafComboboxRef" class="combobox waf-rule-combobox">
            <button
              :id="`${fieldPrefix}-waf-rule`"
              type="button"
              class="waf-rule-trigger"
              @click.stop="toggleWafDropdown"
            >
              <span class="waf-rule-trigger__content">
                <template v-if="selectedWafRule">
                  <span class="waf-rule-trigger__name">{{ selectedWafRule.name }}</span>
                  <span class="role-pill" :class="wafRolePillClass(selectedWafRule.role)">
                    {{ formatWafRole(selectedWafRule.role) }}
                  </span>
                </template>
                <span v-else class="waf-rule-trigger__placeholder">None</span>
              </span>
              <span class="combobox-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div v-show="isWafDropdownOpen" class="combobox-menu">
              <button
                type="button"
                class="combobox-option waf-rule-option"
                :class="{ active: !form.wafId }"
                @click="selectWafRule('')"
              >
                <span class="waf-rule-option__name">None</span>
              </button>
              <button
                v-for="rule in wafRuleOptions"
                :key="rule.id"
                type="button"
                class="combobox-option waf-rule-option"
                :class="{ active: String(form.wafId) === String(rule.id) }"
                @click="selectWafRule(rule.id)"
              >
                <span class="waf-rule-option__name">{{ rule.name }}</span>
                <span class="role-pill" :class="wafRolePillClass(rule.role)">
                  {{ formatWafRole(rule.role) }}
                </span>
              </button>
              <div v-if="!wafRuleOptions.length" class="combobox-empty">
                No WAF rules found
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-show="isStepVisible('ssl')" class="site-form__section">
      <div class="site-form__section-head">
        <div class="site-form__section-identity">
          <span class="site-form__section-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </span>
          <div class="site-form__section-copy">
            <h4 class="info-hint-heading">
              <span>SSL Setting</span>
              <InfoHint
                text="How HTTPS certificates are issued for this domain."
                aria-label="SSL Setting help"
              />
            </h4>
          </div>
        </div>
      </div>

      <div class="type-grid" role="radiogroup" aria-label="Certificate type">
        <button
          v-for="mode in certificateModes"
          :key="mode.value"
          type="button"
          class="type-card"
          :class="{ active: certificateMode === mode.value }"
          role="radio"
          :aria-checked="certificateMode === mode.value"
          @click="certificateMode = mode.value"
        >
          <span class="type-card__icon" aria-hidden="true">
            <svg v-if="mode.value === 'none'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
            <svg v-else-if="mode.value === 'automatic'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </span>
          <span class="type-card__label">{{ mode.label }}</span>
          <span class="type-card__desc">{{ mode.description }}</span>
        </button>
      </div>

      <div v-if="certificateMode === 'automatic'" class="site-form__subpanel">
        <div class="site-form__subpanel-label">Automatic Provider</div>
        <p class="site-form__hint">
          Let's Encrypt uses DNS-01. Create a DNS-only (not proxied) CNAME
          <code>_acme-challenge.&lt;domain&gt;</code> → <code>acme-validation.dorian.center</code> before saving.
        </p>
        <div class="segmented" role="radiogroup" aria-label="Certificate provider">
          <button
            v-for="provider in automaticProviders"
            :key="provider.value"
            type="button"
            class="segmented__btn"
            :class="{ active: form.sslType === provider.value }"
            role="radio"
            :aria-checked="form.sslType === provider.value"
            @click="form.sslType = provider.value"
          >
            {{ provider.label }}
          </button>
        </div>
      </div>

      <div v-if="certificateMode === 'manual'" class="site-form__subpanel site-form__subpanel--stack">
        <div class="site-form__field">
          <label :for="`${fieldPrefix}-ssl-cert`">Certificate</label>
          <textarea
            :id="`${fieldPrefix}-ssl-cert`"
            v-model="form.sslCert"
            rows="3"
            placeholder="-----BEGIN CERTIFICATE-----"
          ></textarea>
        </div>
        <div class="site-form__field">
          <label :for="`${fieldPrefix}-ssl-key`">Private Key</label>
          <textarea
            :id="`${fieldPrefix}-ssl-key`"
            v-model="form.sslCertKey"
            rows="3"
            :placeholder="form.hasSslCertKey ? 'Stored securely. Leave blank to keep the current private key.' : '-----BEGIN PRIVATE KEY-----'"
          ></textarea>
        </div>
      </div>
    </section>

    <section v-show="isStepVisible('ports') && !siteId" class="site-form__section">
      <div class="site-form__section-head">
        <div class="site-form__section-identity">
          <span class="site-form__section-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2"></rect>
              <path d="M7 8h10M7 12h6M7 16h8"></path>
            </svg>
          </span>
          <div class="site-form__section-copy">
            <h4 class="info-hint-heading">
              <span>Listen ports</span>
              <InfoHint
                text="Choose which HTTP and HTTPS edge listen ports this site will use. Ports come from the edges you selected. Next you will map each port to origin backends."
                aria-label="Listen ports help"
              />
            </h4>
          </div>
        </div>
        <span class="site-form__section-tag">
          {{ selectedHttpPortCount }} HTTP · {{ selectedHttpsPortCount }} HTTPS
        </span>
      </div>

      <p v-if="!selectedServerIds.length" class="origin-hint">
        Select at least one edge first so available listen ports can be loaded.
      </p>
      <p v-else-if="portsLoading" class="origin-hint">Loading listen ports from selected edges…</p>
      <p v-else-if="portsError" class="origin-hint origin-hint--error">{{ portsError }}</p>
      <template v-else>
        <div class="ports-block">
          <div class="ports-block__head">
            <h5 class="info-hint-heading">
              <span>HTTP</span>
              <InfoHint text="Client → edge plain HTTP listeners available on your selected edges." aria-label="HTTP ports help" />
            </h5>
            <span class="ports-block__meta">{{ availableHttpPorts.length }} available</span>
          </div>
          <div v-if="!availableHttpPorts.length" class="ports-empty">
            No HTTP listening ports on the selected edges. Add them under Edge settings → Listening ports.
          </div>
          <div v-else class="ports-chips" role="group" aria-label="HTTP listen ports">
            <button
              v-for="port in availableHttpPorts"
              :key="`http-port-${port}`"
              type="button"
              class="port-chip"
              :class="{ active: isPortSelected('http', port) }"
              @click="togglePort('http', port)"
            >
              <span class="port-chip__proto">HTTP</span>
              <strong class="mono">:{{ port }}</strong>
            </button>
          </div>
        </div>

        <div class="ports-block">
          <div class="ports-block__head">
            <h5 class="info-hint-heading">
              <span>HTTPS</span>
              <InfoHint text="Client → edge TLS listeners available on your selected edges." aria-label="HTTPS ports help" />
            </h5>
            <span class="ports-block__meta">{{ availableHttpsPorts.length }} available</span>
          </div>
          <div v-if="!availableHttpsPorts.length" class="ports-empty">
            No HTTPS listening ports on the selected edges. Add them under Edge settings → Listening ports.
          </div>
          <div v-else class="ports-chips" role="group" aria-label="HTTPS listen ports">
            <button
              v-for="port in availableHttpsPorts"
              :key="`https-port-${port}`"
              type="button"
              class="port-chip port-chip--https"
              :class="{ active: isPortSelected('https', port) }"
              @click="togglePort('https', port)"
            >
              <span class="port-chip__proto">HTTPS</span>
              <strong class="mono">:{{ port }}</strong>
            </button>
          </div>
        </div>
      </template>
    </section>

    <section v-show="isStepVisible('origins')" class="site-form__section" :class="{ 'site-form__section--routes': true }">
      <template v-if="siteId">
        <SiteOriginRoutesPanel
          ref="originRoutesRef"
          :site-id="siteId"
          defer-save
          @dirty-change="onOriginRoutesDirtyChange"
          @updated="$emit('origin-routes-updated')"
        />
      </template>
      <SiteWizardOriginPanel v-else :form="form" />
    </section>

    <section v-show="isStepVisible('edges')" class="site-form__section">
      <div class="site-form__section-head">
        <div class="site-form__section-identity">
          <span class="site-form__section-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </span>
          <div class="site-form__section-copy">
            <h4 class="info-hint-heading">
              <span>Choose Edges</span>
              <InfoHint
                text="Pick the edge nodes that will serve and protect this site."
                aria-label="Choose Edges help"
              />
            </h4>
          </div>
        </div>
        <span v-if="selectedServerIds.length" class="site-form__section-tag">
          {{ selectedServerIds.length }} selected
        </span>
      </div>

      <div v-if="selectedServerIds.length" class="selected-servers">
        <button
          v-for="serverId in selectedServerIds"
          :key="serverId"
          type="button"
          class="server-chip"
          :title="`Remove ${getServerLabelById(serverId)}`"
          @click="$emit('remove-server', serverId)"
        >
          <span class="server-chip__dot" aria-hidden="true"></span>
          {{ getServerLabelById(serverId) }}
          <span class="server-chip__remove" aria-hidden="true">×</span>
        </button>
      </div>
      <p v-else class="origin-empty">No edges assigned yet. Search below to attach one or more.</p>

      <div class="site-form__field">
        <label :for="`${fieldPrefix}-servers`">Add edges</label>
        <div class="combobox" @click="$emit('toggle-server-dropdown')">
          <input
            :id="`${fieldPrefix}-servers`"
            :value="serverSearch"
            type="text"
            placeholder="Search and select edges"
            @input="$emit('update:server-search', $event.target.value)"
            @focus="$emit('open-server-dropdown')"
          />
          <span class="combobox-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
          <div v-show="isServerDropdownOpen" class="combobox-menu">
            <button
              v-for="server in filteredAvailableServers"
              :key="server.id"
              type="button"
              class="combobox-option"
              @click="$emit('add-server', server)"
            >
              <span>{{ getServerLabel(server) }}</span>
            </button>
            <div v-if="!filteredAvailableServers.length" class="combobox-empty">
              No edges found
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-show="isStepVisible('edges')" class="site-form__section site-form__section--status">
      <div class="site-form__toggle-row">
        <div class="site-form__section-identity">
          <span class="site-form__section-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </span>
          <div class="site-form__toggle-meta">
            <span class="site-form__toggle-title">Status</span>
            <span class="site-form__toggle-hint">
              {{ statusEnabled ? 'Site is enabled and will receive traffic' : 'Site is disabled and will not serve traffic' }}
            </span>
          </div>
        </div>
        <button
          type="button"
          class="toggle-switch"
          role="switch"
          :aria-checked="statusEnabled"
          :aria-label="statusEnabled ? 'Enabled' : 'Disabled'"
          @click="toggleStatus"
        >
          <span class="toggle-track" :class="{ off: !statusEnabled }">
            <span class="toggle-label on">On</span>
            <span class="toggle-label off">Off</span>
            <span class="toggle-knob" :class="{ on: statusEnabled }"></span>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import InfoHint from './InfoHint.vue'
import SiteOriginRoutesPanel from './views/SiteOriginRoutesPanel.vue'
import SiteWizardOriginPanel from './SiteWizardOriginPanel.vue'

const automaticProviders = [
  { value: 'letsencrypt', label: "Let's Encrypt" },
  { value: 'zerossl', label: 'ZeroSSL' },
  { value: 'googletrust', label: 'Google Trust' },
]

const certificateModes = [
  {
    value: 'none',
    label: 'Not Configured',
    description: 'No certificate assigned',
  },
  {
    value: 'automatic',
    label: 'Automatic',
    description: "Let's Encrypt, ZeroSSL, Google Trust",
  },
  {
    value: 'manual',
    label: 'Manual',
    description: 'Upload your own cert and key',
  },
]

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  wafRuleOptions: {
    type: Array,
    default: () => [],
  },
  selectedServerIds: {
    type: Array,
    default: () => [],
  },
  serverOptions: {
    type: Array,
    default: () => [],
  },
  serverSearch: {
    type: String,
    default: '',
  },
  isServerDropdownOpen: {
    type: Boolean,
    default: false,
  },
  fieldPrefix: {
    type: String,
    default: 'site',
  },
  /** When set, only that wizard step is shown. Empty string shows all sections (edit mode). */
  activeStep: {
    type: String,
    default: '',
    validator: (value) => !value || ['basic', 'ssl', 'edges', 'ports', 'origins'].includes(value),
  },
  /** Existing site id — shows live origin inventory + port routing instead of the create-time form. */
  siteId: {
    type: [Number, String],
    default: '',
  },
  availableHttpPorts: {
    type: Array,
    default: () => [],
  },
  availableHttpsPorts: {
    type: Array,
    default: () => [],
  },
  portsLoading: {
    type: Boolean,
    default: false,
  },
  portsError: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'toggle-server-dropdown',
  'open-server-dropdown',
  'update:server-search',
  'add-server',
  'remove-server',
  'origin-routes-dirty',
  'origin-routes-updated',
])

const isWizard = computed(() => Boolean(props.activeStep))

const isStepVisible = (stepId) => !props.activeStep || props.activeStep === stepId

const isWafDropdownOpen = ref(false)
const wafComboboxRef = ref(null)
const originRoutesRef = ref(null)

const onOriginRoutesDirtyChange = (value) => {
  emit('origin-routes-dirty', Boolean(value))
}

const saveOriginRoutes = async (options) => {
  if (!originRoutesRef.value?.save) return null
  return originRoutesRef.value.save(options)
}

const isOriginRoutesDirty = () => Boolean(originRoutesRef.value?.dirty)

defineExpose({
  saveOriginRoutes,
  isOriginRoutesDirty,
  originRoutesRef,
})

const ensurePortArrays = () => {
  if (!Array.isArray(props.form.httpPorts)) props.form.httpPorts = []
  if (!Array.isArray(props.form.httpsPorts)) props.form.httpsPorts = []
}

const selectedHttpPortCount = computed(() => {
  ensurePortArrays()
  return props.form.httpPorts.length
})

const selectedHttpsPortCount = computed(() => {
  ensurePortArrays()
  return props.form.httpsPorts.length
})

const isPortSelected = (scheme, port) => {
  ensurePortArrays()
  const list = scheme === 'https' ? props.form.httpsPorts : props.form.httpPorts
  return list.map(Number).includes(Number(port))
}

const togglePort = (scheme, port) => {
  ensurePortArrays()
  const key = scheme === 'https' ? 'httpsPorts' : 'httpPorts'
  const value = Number(port)
  const current = props.form[key].map(Number)
  props.form[key] = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value].sort((a, b) => a - b)
}

const formatWafRole = (role) =>
  String(role || '').toLowerCase() === 'predefined' ? 'Predefined' : 'Custom'

const wafRolePillClass = (role) =>
  String(role || '').toLowerCase() === 'predefined' ? 'role-pill--predefined' : 'role-pill--custom'

const selectedWafRule = computed(() => {
  const id = String(props.form.wafId ?? '').trim()
  if (!id) return null
  return props.wafRuleOptions.find((rule) => String(rule.id) === id) || null
})

const toggleWafDropdown = () => {
  isWafDropdownOpen.value = !isWafDropdownOpen.value
}

const closeWafDropdown = () => {
  isWafDropdownOpen.value = false
}

const selectWafRule = (ruleId) => {
  props.form.wafId = ruleId === '' || ruleId == null ? '' : String(ruleId)
  closeWafDropdown()
}

const handleDocumentClick = (event) => {
  if (!wafComboboxRef.value?.contains(event.target)) {
    closeWafDropdown()
  }
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))

const statusEnabled = computed(() => String(props.form.status).toUpperCase() === 'ENABLE')

const certificateMode = computed({
  get() {
    const sslType = String(props.form.sslType || 'none').toLowerCase()
    if (sslType === 'custom') return 'manual'
    if (['letsencrypt', 'zerossl', 'googletrust', 'managed'].includes(sslType)) return 'automatic'
    return 'none'
  },
  set(mode) {
    if (mode === 'none') {
      props.form.sslType = 'none'
      props.form.sslCert = ''
      props.form.sslCertKey = ''
      return
    }
    if (mode === 'manual') {
      props.form.sslType = 'custom'
      return
    }
    if (mode === 'automatic') {
      const current = String(props.form.sslType || '').toLowerCase()
      if (!['letsencrypt', 'zerossl', 'googletrust'].includes(current)) {
        props.form.sslType = 'letsencrypt'
      }
      props.form.sslCert = ''
      props.form.sslCertKey = ''
    }
  },
})

const toggleStatus = () => {
  props.form.status = statusEnabled.value ? 'DISABLE' : 'ENABLE'
}

const serversById = computed(() => {
  const map = new Map()
  props.serverOptions.forEach((server) => map.set(server.id, server))
  return map
})

const availableServers = computed(() =>
  props.serverOptions.filter((server) => !props.selectedServerIds.includes(server.id)),
)

const filteredAvailableServers = computed(() => {
  const query = props.serverSearch.trim().toLowerCase()
  const list = availableServers.value
  if (!query) return list
  return list.filter((server) => getServerLabel(server).toLowerCase().includes(query))
})

const getServerLabel = (server) =>
  server?.name || server?.ip || `Edge #${server?.id ?? ''}`

const getServerLabelById = (serverId) => {
  const server = serversById.value.get(serverId)
  return getServerLabel(server)
}
</script>

<style scoped>
.site-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.site-form--wizard {
  gap: 14px;
  min-height: 280px;
}

.site-form--wizard .site-form__section {
  padding: 16px;
}

.site-form--wizard .site-form__section--routes {
  padding: 0;
  border: 0;
  background: transparent;
}

.site-form__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-muted);
}

.site-form__section--routes {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.origin-hint--error {
  color: var(--dorian-danger, #e35d5d);
}

.ports-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-solid);
}

.ports-block__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ports-block__head h5 {
  margin: 0;
  color: var(--app-heading);
  font-size: 13px;
  font-weight: 650;
}

.ports-block__meta {
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 600;
}

.ports-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.port-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--app-border-strong);
  border-radius: 12px;
  background: var(--app-surface-muted);
  color: var(--app-heading);
  font: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.port-chip__proto {
  color: var(--app-text-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.port-chip strong {
  font-size: 15px;
  letter-spacing: -0.02em;
}

.port-chip.active {
  border-color: color-mix(in srgb, var(--dorian-viper-500, #2e9e6c) 55%, var(--app-border));
  background: var(--app-accent-soft);
}

.port-chip.active .port-chip__proto {
  color: var(--dorian-viper-400, #3fbd85);
}

.port-chip--https.active {
  border-color: color-mix(in srgb, var(--dorian-viper-400, #6ee7b7) 50%, var(--app-border));
}

.ports-empty {
  padding: 12px;
  border: 1px dashed var(--app-border);
  border-radius: 10px;
  color: var(--app-text-muted);
  font-size: 13px;
  text-align: center;
}

.mono {
  font-family: var(--font-mono, ui-monospace, monospace);
}

.site-form__section--status {
  padding: 0;
  border: none;
  background: transparent;
}

.site-form__section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.site-form__section-identity {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.site-form__section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.site-form__section-icon svg {
  width: 16px;
  height: 16px;
}

.site-form__section-copy {
  min-width: 0;
}

.site-form__section-copy h4,
.site-form__section-head h4 {
  margin: 0;
  font-size: var(--type-base);
  font-weight: 650;
  color: var(--app-heading);
}

.site-form__section-copy p {
  margin: 3px 0 0;
  font-size: var(--type-caption);
  line-height: 1.4;
  color: var(--app-text-muted);
}

.site-form__section-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.site-form__section-tag {
  font-size: var(--type-caption);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.site-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.site-form__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.site-form__field label {
  font-size: var(--type-caption);
  font-weight: 600;
  color: var(--app-text-muted);
}

.site-form__field input,
.site-form__field select,
.site-form__field textarea {
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: var(--type-base);
  color: var(--app-text);
  background: var(--app-input-bg);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.site-form__field textarea {
  resize: vertical;
  min-height: 72px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-caption);
  line-height: 1.4;
}

.site-form__field input:focus,
.site-form__field select:focus,
.site-form__field textarea:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-height: 108px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-solid);
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.type-card:hover {
  border-color: var(--dorian-viper-700, #1f6e4a);
}

.type-card.active {
  border-color: var(--dorian-viper-500, #2e9e6c);
  background: var(--app-accent-soft);
  box-shadow: none;
}

.type-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
}

.type-card.active .type-card__icon {
  background: var(--dorian-viper-dim, #17352a);
  color: var(--dorian-viper-400, #3fbd85);
}

.type-card__icon svg {
  width: 15px;
  height: 15px;
}

.type-card__label {
  font-size: var(--type-caption);
  font-weight: 650;
  color: var(--app-heading);
}

.type-card__desc {
  font-size: var(--type-caption);
  line-height: 1.35;
  color: var(--app-text-muted);
}

.site-form__subpanel {
  padding: 10px;
  border-radius: 8px;
  border: 1px dashed var(--app-border);
  background: var(--app-surface-solid);
}

.site-form__subpanel--stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.site-form__subpanel-label {
  margin-bottom: 8px;
  font-size: var(--type-caption);
  font-weight: 650;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.site-form__hint {
  margin: 0 0 10px;
  font-size: var(--type-caption);
  color: var(--app-text-muted);
  line-height: 1.45;
}

.segmented {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
}

.segmented--wrap {
  flex-wrap: wrap;
}

.segmented__btn {
  flex: 1 1 auto;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-solid);
  color: var(--app-text);
  font-size: var(--type-caption);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.segmented__btn:hover {
  border-color: var(--dorian-viper-700, #1f6e4a);
  color: var(--app-heading);
}

.segmented__btn.active {
  background: var(--app-accent-soft);
  border-color: var(--dorian-viper-500, #2e9e6c);
  color: var(--dorian-viper-400, #3fbd85);
}

.site-form__toggle-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.site-form__toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
}

.site-form__toggle-row.is-locked {
  opacity: 0.78;
}

.site-form__toggle-row .toggle-switch:disabled {
  cursor: not-allowed;
  opacity: 0.9;
}

.site-form__toggle-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.site-form__toggle-title {
  font-size: var(--type-base);
  font-weight: 650;
  color: var(--app-heading);
}

.site-form__toggle-hint {
  font-size: var(--type-caption);
  color: var(--app-text-muted);
  line-height: 1.35;
}

.ghost-add-btn,
.primary-add-btn,
.secondary-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: var(--type-caption);
  font-weight: 650;
  cursor: pointer;
}

.ghost-add-btn {
  border: 1px solid var(--app-border);
  background: var(--app-surface-solid);
  color: var(--dorian-viper-400, #3fbd85);
}

.ghost-add-btn:hover {
  border-color: var(--dorian-viper-700, #1f6e4a);
  background: var(--app-accent-soft);
}

.primary-add-btn {
  border: 1px solid var(--dorian-viper-500, #2e9e6c);
  background: var(--dorian-viper-500, #2e9e6c);
  color: #08120e;
}

.primary-add-btn:hover {
  background: var(--dorian-viper-700, #1f6e4a);
  border-color: var(--dorian-viper-700, #1f6e4a);
  color: #08120e;
}

.primary-add-btn svg,
.secondary-add-btn svg,
.origin-remove-btn svg {
  width: 14px;
  height: 14px;
}

.secondary-add-btn {
  width: 100%;
  justify-content: center;
  min-height: 40px;
  border: 1px dashed var(--dorian-viper-700, #1f6e4a);
  background: var(--app-accent-soft);
  color: var(--dorian-viper-400, #3fbd85);
}

.secondary-add-btn:hover {
  border-style: solid;
  border-color: var(--dorian-viper-500, #2e9e6c);
  background: var(--dorian-viper-dim, #17352a);
}

.origin-hint {
  margin: 0;
  font-size: var(--type-caption);
  line-height: 1.45;
  color: var(--app-text-muted);
}

.origin-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.origin-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-solid);
}

.origin-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.origin-card__title {
  font-size: var(--type-caption);
  font-weight: 650;
  color: var(--app-heading);
}

.origin-remove-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
  font-size: var(--type-caption);
  font-weight: 600;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 8px;
}

.origin-remove-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.16);
}

.origin-remove-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.origin-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.origin-footer {
  display: flex;
}

.origin-empty {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  border: 1px dashed var(--app-border);
  background: var(--app-surface-solid);
  color: var(--app-text-muted);
  font-size: var(--type-base);
}

.selected-servers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.server-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--app-accent-soft);
  color: var(--dorian-viper-400, #3fbd85);
  font-size: var(--type-caption);
  font-weight: 600;
  border: 1px solid var(--app-border);
  cursor: pointer;
}

.server-chip__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dorian-viper-500, #2e9e6c);
  flex-shrink: 0;
}

.server-chip__remove {
  opacity: 0.7;
  font-size: 14px;
  line-height: 1;
}

.server-chip:hover {
  border-color: var(--dorian-viper-700, #1f6e4a);
  color: var(--dorian-viper-400, #3fbd85);
}

.combobox {
  position: relative;
}

.combobox input {
  width: 100%;
  padding-right: 36px;
}

.combobox-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--app-text-muted);
}

.combobox-arrow svg {
  width: 15px;
  height: 15px;
}

.combobox-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--app-surface-solid);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 12px 28px var(--app-shadow);
  padding: 4px;
  max-height: 160px;
  overflow-y: auto;
  z-index: 50;
}

.combobox-option {
  display: flex;
  width: 100%;
  align-items: center;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text);
  font-size: var(--type-caption);
  text-align: left;
  cursor: pointer;
}

.combobox-option:hover {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.combobox-empty {
  padding: 8px 10px;
  color: var(--app-text-muted);
  font-size: var(--type-caption);
}

.waf-rule-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  background: var(--app-input-bg);
  color: var(--app-text);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.waf-rule-trigger:hover,
.waf-rule-trigger:focus-visible {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
  outline: none;
}

.waf-rule-trigger__content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.waf-rule-trigger__name,
.waf-rule-option__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.waf-rule-trigger__placeholder {
  color: var(--app-text-muted);
  font-size: var(--type-base);
}

.waf-rule-combobox .combobox-arrow {
  position: static;
  transform: none;
  flex-shrink: 0;
}

.waf-rule-option {
  justify-content: space-between;
  gap: 10px;
}

.waf-rule-option.active {
  background: var(--app-accent-soft);
}

.role-pill {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  border-radius: 4px;
  padding: 3px 7px;
  font-size: var(--type-small);
  font-weight: 600;
  line-height: 1.2;
}

.role-pill--predefined {
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.16);
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.role-pill--custom {
  color: var(--dorian-viper-700, #1f6e4a);
  background: var(--app-accent-soft);
  border: 1px solid rgba(46, 158, 108, 0.28);
}

:global([data-theme='dark']) .role-pill.role-pill--predefined {
  color: #93c5fd !important;
  background: rgba(59, 130, 246, 0.22) !important;
  border-color: rgba(59, 130, 246, 0.45) !important;
}

:global([data-theme='dark']) .role-pill.role-pill--custom {
  color: var(--dorian-viper-400, #3fbd85) !important;
  background: var(--dorian-viper-dim, #17352a) !important;
  border-color: rgba(46, 158, 108, 0.35) !important;
}

@media (max-width: 640px) {
  .site-form__row,
  .type-grid,
  .origin-grid {
    grid-template-columns: 1fr;
  }

  .site-form__section-head {
    flex-direction: column;
  }

  .site-form__section-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
