<template>
  <div class="site-form">
    <section class="site-form__section">
      <div class="site-form__section-head">
        <h4>Basic Setting</h4>
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

    <section class="site-form__section">
      <div class="site-form__section-head">
        <h4>SSL Setting</h4>
        <span class="site-form__section-tag">Certificate Type</span>
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
          <span class="type-card__label">{{ mode.label }}</span>
          <span class="type-card__desc">{{ mode.description }}</span>
        </button>
      </div>

      <div v-if="certificateMode === 'automatic'" class="site-form__subpanel">
        <div class="site-form__subpanel-label">Automatic Provider</div>
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
            placeholder="-----BEGIN PRIVATE KEY-----"
          ></textarea>
        </div>
      </div>
    </section>

    <section class="site-form__section">
      <div class="site-form__section-head">
        <div class="site-form__section-title-wrap">
          <h4>Origin Servers</h4>
          <span class="site-form__section-tag">{{ originServers.length }} configured</span>
        </div>
        <button class="primary-add-btn" type="button" @click="addOriginServer">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Origin
        </button>
      </div>

      <p class="origin-hint">
        Configure one or more origin servers. Each origin can use HTTP or HTTPS with its own weight and fail settings.
      </p>

      <div v-if="originServers.length" class="origin-list">
        <article
          v-for="(origin, index) in originServers"
          :key="origin.key"
          class="origin-card"
        >
          <div class="origin-card__head">
            <span class="origin-card__title">Origin #{{ index + 1 }}</span>
            <button
              class="origin-remove-btn"
              type="button"
              :disabled="originServers.length <= 1"
              :title="originServers.length <= 1 ? 'At least one origin server is required' : 'Remove this origin'"
              aria-label="Remove origin server"
              @click="removeOriginServer(index)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
              </svg>
              Remove
            </button>
          </div>

          <div class="origin-grid">
            <div class="site-form__field">
              <label :for="`${fieldPrefix}-origin-ip-${index}`">IP</label>
              <input
                :id="`${fieldPrefix}-origin-ip-${index}`"
                v-model="origin.ip"
                type="text"
                placeholder="192.168.1.10"
              />
            </div>
            <div class="site-form__field">
              <label :for="`${fieldPrefix}-origin-port-${index}`">Port</label>
              <input
                :id="`${fieldPrefix}-origin-port-${index}`"
                v-model="origin.port"
                type="number"
                min="1"
                max="65535"
                placeholder="80"
              />
            </div>
            <div class="site-form__field">
              <label :for="`${fieldPrefix}-origin-weight-${index}`">Weight</label>
              <input
                :id="`${fieldPrefix}-origin-weight-${index}`"
                v-model="origin.weight"
                type="number"
                min="1"
                placeholder="4"
              />
            </div>
            <div class="site-form__field">
              <label>Protocol</label>
              <div class="segmented" role="radiogroup" :aria-label="`Origin ${index + 1} protocol`">
                <button
                  v-for="protocol in originProtocolOptions"
                  :key="protocol"
                  type="button"
                  class="segmented__btn"
                  :class="{ active: origin.protocol === protocol }"
                  role="radio"
                  :aria-checked="origin.protocol === protocol"
                  @click="origin.protocol = protocol"
                >
                  {{ protocol }}
                </button>
              </div>
            </div>
            <div class="site-form__field">
              <label :for="`${fieldPrefix}-origin-max-fails-${index}`">Max Fails</label>
              <input
                :id="`${fieldPrefix}-origin-max-fails-${index}`"
                v-model="origin.maxFails"
                type="number"
                min="1"
                placeholder="3"
              />
            </div>
            <div class="site-form__field">
              <label :for="`${fieldPrefix}-origin-fail-timeout-${index}`">Fail Timeout (s)</label>
              <input
                :id="`${fieldPrefix}-origin-fail-timeout-${index}`"
                v-model="origin.failTimeout"
                type="number"
                min="1"
                placeholder="30"
              />
            </div>
          </div>
        </article>
      </div>

      <div class="origin-footer">
        <button class="secondary-add-btn" type="button" @click="addOriginServer">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add another origin server
        </button>
      </div>
    </section>

    <section class="site-form__section">
      <div class="site-form__section-head">
        <h4>Choose Edges</h4>
      </div>

      <div v-if="selectedServerIds.length" class="selected-servers">
        <button
          v-for="serverId in selectedServerIds"
          :key="serverId"
          type="button"
          class="server-chip"
          @click="$emit('remove-server', serverId)"
        >
          {{ getServerLabelById(serverId) }}
        </button>
      </div>

      <div class="site-form__field">
        <label :for="`${fieldPrefix}-servers`">Edges</label>
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

    <section class="site-form__section">
      <div class="site-form__toggle-row">
        <div class="site-form__toggle-meta">
          <span class="site-form__toggle-title">Status</span>
          <span class="site-form__toggle-hint">{{ statusEnabled ? 'Enabled' : 'Disabled' }}</span>
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
import { createEmptyOriginServer } from '@/utils/originServers'

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
})

defineEmits([
  'toggle-server-dropdown',
  'open-server-dropdown',
  'update:server-search',
  'add-server',
  'remove-server',
])

const originProtocolOptions = ['HTTP', 'HTTPS']

const isWafDropdownOpen = ref(false)
const wafComboboxRef = ref(null)

const ensureOriginServersArray = () => {
  if (!Array.isArray(props.form.originServers)) {
    props.form.originServers = []
  }
  return props.form.originServers
}

const originServers = computed(() => ensureOriginServersArray())

const addOriginServer = () => {
  ensureOriginServersArray().push(createEmptyOriginServer())
}

const removeOriginServer = (index) => {
  const list = ensureOriginServersArray()
  if (list.length <= 1) return
  list.splice(index, 1)
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
  gap: 14px;
}

.site-form__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface-muted);
}

.site-form__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.site-form__section-head h4 {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 650;
  color: var(--app-heading);
}

.site-form__section-tag {
  font-size: 0.72rem;
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
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--app-text-muted);
}

.site-form__field input,
.site-form__field select,
.site-form__field textarea {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 0.9rem;
  color: var(--app-text);
  background: var(--app-input-bg);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.site-form__field textarea {
  resize: vertical;
  min-height: 72px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8rem;
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
  gap: 4px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-solid);
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.type-card:hover {
  border-color: var(--app-accent);
}

.type-card.active {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
  box-shadow: inset 0 0 0 1px var(--app-accent);
}

.type-card__label {
  font-size: 0.82rem;
  font-weight: 650;
  color: var(--app-heading);
}

.type-card__desc {
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--app-text-muted);
}

.site-form__subpanel {
  padding: 10px;
  border-radius: 12px;
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
  font-size: 0.75rem;
  font-weight: 650;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
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
  border-radius: 999px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-solid);
  color: var(--app-text);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.segmented__btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
}

.segmented__btn.active {
  background: var(--app-accent);
  border-color: var(--app-accent);
  color: #fff;
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
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-solid);
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
  font-size: 0.84rem;
  font-weight: 650;
  color: var(--app-heading);
}

.site-form__toggle-hint {
  font-size: 0.72rem;
  color: var(--app-text-muted);
}

.site-form__section-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ghost-add-btn,
.primary-add-btn,
.secondary-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 650;
  cursor: pointer;
}

.ghost-add-btn {
  border: 1px solid var(--app-border);
  background: var(--app-surface-solid);
  color: var(--app-accent);
}

.ghost-add-btn:hover {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
}

.primary-add-btn {
  border: 1px solid var(--app-accent);
  background: var(--app-accent);
  color: #fff;
}

.primary-add-btn:hover {
  background: var(--app-accent-hover, #7c3aed);
  border-color: var(--app-accent-hover, #7c3aed);
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
  border: 1px dashed var(--app-accent);
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.secondary-add-btn:hover {
  border-style: solid;
  background: rgba(168, 85, 247, 0.18);
}

.origin-hint {
  margin: 0;
  font-size: 0.8rem;
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
  border-radius: 12px;
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
  font-size: 0.82rem;
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
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 999px;
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
  border-radius: 12px;
  border: 1px dashed var(--app-border);
  background: var(--app-surface-solid);
  color: var(--app-text-muted);
  font-size: 0.84rem;
}

.selected-servers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.server-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid rgba(168, 85, 247, 0.2);
  cursor: pointer;
}

.server-chip:hover {
  background: rgba(168, 85, 247, 0.25);
  color: var(--app-accent-hover);
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
  border-radius: 12px;
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
  border-radius: 8px;
  background: transparent;
  color: var(--app-text);
  font-size: 0.85rem;
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
  font-size: 0.82rem;
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
  border-radius: 10px;
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
  font-size: 0.9rem;
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
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.2;
}

.role-pill--predefined {
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.16);
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.role-pill--custom {
  color: #6d28d9;
  background: rgba(124, 58, 237, 0.14);
  border: 1px solid rgba(124, 58, 237, 0.35);
}

:global([data-theme='dark']) .role-pill.role-pill--predefined {
  color: #93c5fd !important;
  background: rgba(59, 130, 246, 0.22) !important;
  border-color: rgba(59, 130, 246, 0.45) !important;
}

:global([data-theme='dark']) .role-pill.role-pill--custom {
  color: #e879f9 !important;
  background: rgba(217, 70, 239, 0.18) !important;
  border-color: rgba(217, 70, 239, 0.42) !important;
}

@media (max-width: 640px) {
  .site-form__row,
  .type-grid,
  .origin-grid {
    grid-template-columns: 1fr;
  }
}
</style>
