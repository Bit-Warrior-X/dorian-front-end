<template>
  <div class="site-form-sections">
    <div class="dialog-section">
      <h4>Basic Setting</h4>
      <div class="dialog-grid">
        <div class="dialog-field">
          <label :for="`${fieldPrefix}-domain`">Domain</label>
          <input
            :id="`${fieldPrefix}-domain`"
            v-model="form.domain"
            type="text"
            placeholder="example.com"
          />
        </div>
        <div class="dialog-field">
          <label :for="`${fieldPrefix}-status`">Status</label>
          <select :id="`${fieldPrefix}-status`" v-model="form.status">
            <option value="ENABLE">Enabled</option>
            <option value="DISABLE">Disabled</option>
          </select>
        </div>
        <div class="dialog-field">
          <label :for="`${fieldPrefix}-waf-id`">WAF ID</label>
          <input
            :id="`${fieldPrefix}-waf-id`"
            v-model="form.wafId"
            type="number"
            min="0"
            placeholder="Optional"
          />
        </div>
        <div class="dialog-field">
          <label :for="`${fieldPrefix}-cache-ratio`">Cache Ratio (%)</label>
          <input
            :id="`${fieldPrefix}-cache-ratio`"
            v-model.number="form.cacheRatio"
            type="number"
            min="0"
            max="100"
            step="0.01"
          />
        </div>
        <div class="dialog-field">
          <label :for="`${fieldPrefix}-bandwidth`">Bandwidth (bytes)</label>
          <input
            :id="`${fieldPrefix}-bandwidth`"
            v-model.number="form.bandwidth"
            type="number"
            min="0"
            step="1"
          />
        </div>
      </div>
    </div>

    <div class="dialog-section">
      <h4>Certificate &amp; SSL</h4>
      <div class="dialog-grid">
        <div class="dialog-field">
          <label :for="`${fieldPrefix}-cert-status`">Certificate Status</label>
          <select :id="`${fieldPrefix}-cert-status`" v-model="form.certificateStatus">
            <option value="none">None</option>
            <option value="valid">Valid</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div class="dialog-field">
          <label :for="`${fieldPrefix}-cert-expiry`">Certificate Expiry</label>
          <input
            :id="`${fieldPrefix}-cert-expiry`"
            v-model="form.certificateExpiry"
            type="datetime-local"
          />
        </div>
        <div class="dialog-field">
          <label :for="`${fieldPrefix}-ssl-type`">SSL Type</label>
          <select :id="`${fieldPrefix}-ssl-type`" v-model="form.sslType">
            <option value="none">None</option>
            <option value="managed">Managed</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      <div v-if="form.sslType === 'custom'" class="dialog-grid dialog-grid--full">
        <div class="dialog-field dialog-field--full">
          <label :for="`${fieldPrefix}-ssl-cert`">SSL Certificate</label>
          <textarea
            :id="`${fieldPrefix}-ssl-cert`"
            v-model="form.sslCert"
            rows="4"
            placeholder="-----BEGIN CERTIFICATE-----"
          ></textarea>
        </div>
        <div class="dialog-field dialog-field--full">
          <label :for="`${fieldPrefix}-ssl-key`">SSL Certificate Key</label>
          <textarea
            :id="`${fieldPrefix}-ssl-key`"
            v-model="form.sslCertKey"
            rows="4"
            placeholder="-----BEGIN PRIVATE KEY-----"
          ></textarea>
        </div>
      </div>
    </div>

    <div class="dialog-section">
      <h4>Protocol Badges</h4>
      <div class="protocol-options">
        <label v-for="protocol in protocolOptions" :key="protocol" class="protocol-option">
          <input v-model="form.protocols" type="checkbox" :value="protocol" />
          <span>{{ protocol }}</span>
        </label>
      </div>
    </div>

    <div class="dialog-section">
      <h4>Assigned Servers</h4>
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
      <div class="dialog-grid">
        <div class="dialog-field dialog-field--full">
          <label :for="`${fieldPrefix}-servers`">Choose servers</label>
          <div class="combobox" @click="$emit('toggle-server-dropdown')">
            <input
              :id="`${fieldPrefix}-servers`"
              :value="serverSearch"
              type="text"
              placeholder="Search and select servers"
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
                No servers found
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  protocolOptions: {
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
  server?.name || server?.ip || `Server #${server?.id ?? ''}`

const getServerLabelById = (serverId) => {
  const server = serversById.value.get(serverId)
  return getServerLabel(server)
}
</script>

<style scoped>
.dialog-section h4 {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-heading);
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.dialog-grid--full {
  margin-top: 16px;
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-field--full {
  grid-column: 1 / -1;
}

.dialog-field label {
  font-size: 0.85rem;
  color: var(--app-text-muted);
  font-weight: 500;
}

.dialog-field input,
.dialog-field select,
.dialog-field textarea {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: var(--app-text);
  background: var(--app-input-bg);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dialog-field input:focus,
.dialog-field select:focus,
.dialog-field textarea:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.protocol-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.protocol-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  font-size: 0.85rem;
  color: var(--app-text);
  cursor: pointer;
}

.selected-servers {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.server-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid rgba(168, 85, 247, 0.2);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
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
  padding-right: 40px;
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
  width: 16px;
  height: 16px;
}

.combobox-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--app-surface-solid);
  border: 1px solid var(--app-border);
  border-radius: 12px;
  box-shadow: 0 12px 32px var(--app-shadow);
  padding: 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
}

.combobox-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--app-text);
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
}

.combobox-option:hover {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.combobox-empty {
  padding: 10px 12px;
  color: var(--app-text-muted);
  font-size: 0.9rem;
}
</style>
