<template>
  <div class="ipl" :class="`ipl--${mode}`">
    <header class="cfg-head">
      <div class="cfg-head__copy">
        <span class="cfg-head__icon" aria-hidden="true">
          <svg v-if="mode === 'block'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6L12 3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>
        </span>
        <div>
          <p class="cfg-head__kicker">L4 defense</p>
          <h4>{{ copy.title }}</h4>
          <p class="cfg-head__desc">{{ copy.description }}</p>
        </div>
      </div>
      <div class="cfg-head__actions">
        <button type="button" class="ipl__ghost" :disabled="!entries.length || busy" @click="openConfirm('flush')">
          {{ copy.flushLabel }}
        </button>
        <button type="button" class="primary-btn ipl__primary" :disabled="!canInteract" @click="openDialog">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
          {{ copy.addLabel }}
        </button>
      </div>
    </header>

    <section class="ipl__stats" aria-label="Summary">
      <div class="ipl__stat">
        <span>Total entries</span>
        <strong class="num">{{ entries.length }}</strong>
      </div>
      <div class="ipl__stat">
        <span>Added in 24h</span>
        <strong class="num">{{ recentCount }}</strong>
      </div>
      <div class="ipl__stat">
        <span>Latest entry</span>
        <strong>{{ latestLabel }}</strong>
      </div>
    </section>

    <section class="ipl__table-card">
      <div class="ipl__toolbar">
        <div class="ipl__search">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
          <input v-model.trim="query" type="search" placeholder="Search IP or reason…" :aria-label="`Search ${copy.title}`" />
        </div>
        <span class="ipl__count num">{{ filtered.length }} of {{ entries.length }}</span>
        <button type="button" class="ipl__icon-btn" :class="{ spinning: loading }" aria-label="Refresh" title="Refresh" @click="loadEntries">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3" /></svg>
        </button>
      </div>

      <div v-if="filtered.length" class="ipl__table-wrap">
        <table class="ipl__table">
          <thead>
            <tr>
              <th>IP address</th>
              <th>Reason</th>
              <th>Added</th>
              <th class="ipl__th-action"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in filtered" :key="entry.id">
              <td>
                <span class="ipl__ip num"><i aria-hidden="true" />{{ entry.ipAddress }}</span>
              </td>
              <td>
                <span v-if="entry.reason" class="ipl__reason">{{ entry.reason }}</span>
                <span v-else class="ipl__muted">—</span>
              </td>
              <td>
                <span class="ipl__when" :title="formatTimestamp(entry.createdAt)">{{ relativeTime(entry.createdAt) }}</span>
              </td>
              <td class="ipl__td-action">
                <button type="button" class="ipl__remove" :aria-label="`Remove ${entry.ipAddress}`" title="Remove" @click="openConfirm('remove', entry)">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" /></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="ipl__empty">
        <span class="ipl__empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="2.5" /><path d="M8 10h8M8 14h5" /></svg>
        </span>
        <strong>{{ query ? 'No matching entries' : copy.emptyTitle }}</strong>
        <p>{{ query ? 'Try a different IP or reason.' : copy.emptyText }}</p>
        <button v-if="!query" type="button" class="primary-btn ipl__primary" :disabled="!canInteract" @click="openDialog">
          {{ copy.addLabel }}
        </button>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="isDialogOpen" class="ipl-dialog" @click.self="closeDialog">
        <form class="ipl-dialog__card" role="dialog" aria-modal="true" :aria-label="copy.dialogTitle" @submit.prevent="createEntry">
          <header class="ipl-dialog__head">
            <span class="cfg-head__icon" :class="`cfg-head__icon--${mode}`" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v10M3 8h10" /></svg>
            </span>
            <div>
              <h4>{{ copy.dialogTitle }}</h4>
              <p>{{ copy.dialogText }}</p>
            </div>
            <button type="button" class="ipl__icon-btn" aria-label="Close dialog" @click="closeDialog">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          </header>
          <label class="ipl-dialog__field">
            <span>IP address <em>*</em></span>
            <input ref="ipInput" v-model.trim="formState.ipAddress" class="num" type="text" :placeholder="copy.ipPlaceholder" :class="{ invalid: validationError }" />
          </label>
          <label class="ipl-dialog__field">
            <span>Reason <small>optional</small></span>
            <input v-model="formState.reason" type="text" :placeholder="copy.reasonPlaceholder" />
          </label>
          <p v-if="validationError" class="ipl-dialog__error">{{ validationError }}</p>
          <footer class="ipl-dialog__foot">
            <button type="button" class="secondary-btn" @click="closeDialog">Cancel</button>
            <button type="submit" class="primary-btn" :disabled="!canInteract || busy">{{ busy ? 'Saving…' : copy.submitLabel }}</button>
          </footer>
        </form>
      </div>
    </Teleport>

    <ConfirmDialog
      v-model="isConfirmDialogOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmAction === 'flush' ? copy.flushConfirm : 'Remove'"
      cancel-text="Cancel"
      danger
      @confirm="handleConfirm"
      @cancel="clearConfirm"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import ConfirmDialog from '../ConfirmDialog.vue'
import {
  clearL4WhitelistEntries,
  createL4BlacklistEntry,
  createL4WhitelistEntry,
  deleteL4BlacklistEntry,
  deleteL4WhitelistEntry,
  fetchL4BlacklistEntries,
  fetchL4WhitelistEntries,
  flushL4BlacklistEntries,
} from '@/api/l4'
import { notifyError, notifySuccess } from '@/utils/notify'

const props = defineProps({
  serverId: { type: [Number, String], default: null },
  mode: { type: String, default: 'block', validator: (v) => v === 'block' || v === 'allow' },
})

const COPY = {
  block: {
    title: 'Block IP',
    description: 'Source IPs dropped on this edge’s XDP path before they reach any service.',
    addLabel: 'Block IP',
    flushLabel: 'Flush all',
    flushConfirm: 'Flush',
    emptyTitle: 'No blocked IPs',
    emptyText: 'Addresses you block, or that Sparta blocks automatically, will appear here.',
    dialogTitle: 'Block an IP address',
    dialogText: 'Traffic from this address is dropped at the NIC.',
    submitLabel: 'Block IP',
    ipPlaceholder: '192.168.1.10',
    reasonPlaceholder: 'Manual block',
    noun: 'blacklist',
  },
  allow: {
    title: 'Allow IP',
    description: 'Trusted source IPs that bypass L4 flood detection and blocking on this edge.',
    addLabel: 'Add IP',
    flushLabel: 'Clear all',
    flushConfirm: 'Clear',
    emptyTitle: 'No trusted IPs',
    emptyText: 'Add partners, monitoring probes or office ranges that should never be blocked.',
    dialogTitle: 'Allow an IP address',
    dialogText: 'This address skips L4 rate limits and blocking.',
    submitLabel: 'Add IP',
    ipPlaceholder: '203.0.113.10',
    reasonPlaceholder: 'Trusted partner',
    noun: 'whitelist',
  },
}

const api = computed(() => (props.mode === 'block'
  ? { list: fetchL4BlacklistEntries, create: createL4BlacklistEntry, remove: deleteL4BlacklistEntry, flush: flushL4BlacklistEntries }
  : { list: fetchL4WhitelistEntries, create: createL4WhitelistEntry, remove: deleteL4WhitelistEntry, flush: clearL4WhitelistEntries }))

const copy = computed(() => COPY[props.mode])

const entries = ref([])
const loading = ref(false)
const busy = ref(false)
const query = ref('')
const isDialogOpen = ref(false)
const validationError = ref('')
const ipInput = ref(null)
const isConfirmDialogOpen = ref(false)
const confirmAction = ref(null)
const confirmTarget = ref(null)
const formState = ref({ ipAddress: '', reason: '' })

const canInteract = computed(() => Boolean(props.serverId))

const timeOf = (value) => {
  const t = new Date(value).getTime()
  return Number.isNaN(t) ? null : t
}

const filtered = computed(() => {
  const q = query.value.toLowerCase()
  const list = [...entries.value].sort((a, b) => (timeOf(b.createdAt) ?? 0) - (timeOf(a.createdAt) ?? 0))
  if (!q) return list
  return list.filter((e) => `${e.ipAddress || ''} ${e.reason || ''}`.toLowerCase().includes(q))
})

const recentCount = computed(() => {
  const cutoff = Date.now() - 86400000
  return entries.value.filter((e) => (timeOf(e.createdAt) ?? 0) >= cutoff).length
})

const latestLabel = computed(() => {
  const latest = filtered.value[0] && !query.value ? filtered.value[0] : [...entries.value].sort((a, b) => (timeOf(b.createdAt) ?? 0) - (timeOf(a.createdAt) ?? 0))[0]
  return latest ? relativeTime(latest.createdAt) : '—'
})

const formatTimestamp = (value) => {
  const t = timeOf(value)
  if (t == null) return value || '—'
  return new Date(t).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const relativeTime = (value) => {
  const t = timeOf(value)
  if (t == null) return '—'
  const diff = Math.max(0, Date.now() - t)
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return formatTimestamp(value)
}

const IP_PATTERN = /^(\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?|[0-9a-fA-F:]+(\/\d{1,3})?)$/

const loadEntries = async () => {
  if (!props.serverId) {
    entries.value = []
    return
  }
  loading.value = true
  try {
    const list = await api.value.list(props.serverId)
    entries.value = Array.isArray(list) ? list : []
  } catch (error) {
    notifyError(copy.value.title, error?.message || `The ${copy.value.noun} entries could not be loaded.`)
  } finally {
    loading.value = false
  }
}

const openDialog = async () => {
  formState.value = { ipAddress: '', reason: '' }
  validationError.value = ''
  isDialogOpen.value = true
  await nextTick()
  ipInput.value?.focus()
}

const closeDialog = () => {
  isDialogOpen.value = false
  validationError.value = ''
}

const createEntry = async () => {
  if (!props.serverId || busy.value) return
  const ipAddress = formState.value.ipAddress
  if (!ipAddress) {
    validationError.value = 'IP address is required.'
    return
  }
  if (!IP_PATTERN.test(ipAddress)) {
    validationError.value = 'Enter a valid IPv4 or IPv6 address.'
    return
  }
  busy.value = true
  try {
    await api.value.create(Number(props.serverId), { ipAddress, reason: formState.value.reason.trim() })
    await loadEntries()
    notifySuccess(copy.value.title, `The ${copy.value.noun} entry is successfully created.`)
    closeDialog()
  } catch (error) {
    notifyError(copy.value.title, error?.message || `The ${copy.value.noun} entry could not be created.`)
  } finally {
    busy.value = false
  }
}

const openConfirm = (action, entry = null) => {
  confirmAction.value = action
  confirmTarget.value = entry
  isConfirmDialogOpen.value = true
}

const confirmTitle = computed(() => (confirmAction.value === 'flush'
  ? `${copy.value.flushLabel.replace(/^./, (c) => c.toUpperCase())} ${copy.value.noun} entries`
  : `Remove ${confirmTarget.value?.ipAddress || 'entry'}`))

const confirmMessage = computed(() => (confirmAction.value === 'flush'
  ? `This removes all ${entries.value.length} L4 ${copy.value.noun} entries from this edge.`
  : `Are you sure you want to remove this ${copy.value.noun} entry?`))

const handleConfirm = async () => {
  busy.value = true
  try {
    if (confirmAction.value === 'flush') {
      await api.value.flush(props.serverId)
      notifySuccess(copy.value.title, `All ${copy.value.noun} entries are successfully removed.`)
    } else if (confirmAction.value === 'remove' && confirmTarget.value?.id) {
      await api.value.remove(props.serverId, confirmTarget.value.id)
      notifySuccess(copy.value.title, `The ${copy.value.noun} entry is successfully deleted.`)
    }
    await loadEntries()
  } catch (error) {
    notifyError(copy.value.title, error?.message || `The ${copy.value.noun} could not be updated.`)
  } finally {
    busy.value = false
  }
  clearConfirm()
}

const clearConfirm = () => {
  isConfirmDialogOpen.value = false
  confirmAction.value = null
  confirmTarget.value = null
}

onMounted(loadEntries)
watch(() => props.serverId, loadEntries)
</script>

<style scoped>
.ipl {
  --ipl-tone: var(--dorian-danger, #e15241);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ipl--allow { --ipl-tone: var(--dorian-viper-400, #3fbd85); }

.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

/* Header */
.cfg-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.cfg-head__copy { display: flex; gap: 12px; min-width: 0; }

.cfg-head__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--ipl-tone);
  background: color-mix(in srgb, var(--ipl-tone) 13%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--ipl-tone) 30%, transparent);
}

.cfg-head__icon svg { width: 18px; height: 18px; }

.cfg-head__kicker {
  margin: 0 0 2px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.cfg-head h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--app-heading);
}

.cfg-head__desc {
  margin: 3px 0 0;
  max-width: 44rem;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--app-text-muted);
}

.cfg-head__actions { display: flex; align-items: center; gap: 8px; }

.ipl__primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ipl__primary svg { width: 12px; height: 12px; }

.ipl__ghost {
  padding: 8px 12px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border-strong);
  background: transparent;
  color: var(--app-text-muted);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.ipl__ghost:hover:not(:disabled) {
  color: var(--dorian-danger, #e15241);
  border-color: color-mix(in srgb, var(--dorian-danger, #e15241) 45%, transparent);
  background: color-mix(in srgb, var(--dorian-danger, #e15241) 8%, transparent);
}

.ipl__ghost:disabled,
.ipl__primary:disabled { opacity: 0.45; cursor: not-allowed; }

/* Stats */
.ipl__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.ipl__stat {
  padding: 11px 14px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
}

.ipl__stat span {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.ipl__stat strong {
  display: block;
  margin-top: 4px;
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--app-heading);
}

/* Table card */
.ipl__table-card {
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
  overflow: hidden;
}

.ipl__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 0.5px solid var(--app-border);
}

.ipl__search {
  position: relative;
  flex: 1;
  max-width: 340px;
}

.ipl__search svg {
  position: absolute;
  left: 10px;
  top: 50%;
  width: 14px;
  height: 14px;
  transform: translateY(-50%);
  color: var(--app-text-muted);
}

.ipl__search input {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 10px 7px 31px;
  border-radius: 7px;
  border: 1px solid var(--app-input-border);
  background: var(--app-input-bg);
  color: var(--app-text);
  font: inherit;
  font-size: 12.5px;
  outline: none;
}

.ipl__search input:focus,
.ipl-dialog__field input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft);
}

.ipl__count {
  margin-left: auto;
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.ipl__icon-btn {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 7px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text-muted);
  cursor: pointer;
}

.ipl__icon-btn:hover { color: var(--app-heading); border-color: var(--app-border-strong); }
.ipl__icon-btn svg { width: 14px; height: 14px; }
.ipl__icon-btn.spinning svg { animation: ipl-spin 0.9s linear infinite; }

.ipl__table-wrap { max-height: 520px; overflow: auto; }

.ipl__table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: 13px;
}

.ipl__table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 9px 14px;
  text-align: left;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  background: var(--app-surface);
  border-bottom: 0.5px solid var(--app-border);
}

.ipl__table td {
  padding: 10px 14px;
  color: var(--app-text);
  border-bottom: 0.5px solid var(--app-border);
}

.ipl__table tbody tr { transition: background 0.12s ease; }
.ipl__table tbody tr:hover { background: color-mix(in srgb, var(--app-surface) 70%, transparent); }
.ipl__table tbody tr:last-child td { border-bottom: 0; }

.ipl__th-action,
.ipl__td-action { width: 48px; text-align: right !important; }

.ipl__ip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--app-heading);
}

.ipl__ip i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ipl-tone);
}

.ipl__reason {
  display: inline-block;
  max-width: 320px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--app-text);
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.ipl__muted,
.ipl__when { color: var(--app-text-muted); font-size: 12.5px; }

.ipl__remove {
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  opacity: 0.7;
}

.ipl__table tbody tr:hover .ipl__remove { opacity: 1; }

.ipl__remove:hover {
  color: var(--dorian-danger, #e15241);
  background: color-mix(in srgb, var(--dorian-danger, #e15241) 12%, transparent);
}

.ipl__remove svg { width: 14px; height: 14px; }

/* Empty */
.ipl__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 20px 36px;
  text-align: center;
}

.ipl__empty-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  margin-bottom: 4px;
  border-radius: 12px;
  color: var(--app-text-muted);
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
}

.ipl__empty-icon svg { width: 22px; height: 22px; }
.ipl__empty strong { font-size: 14px; color: var(--app-heading); }
.ipl__empty p { margin: 0 0 8px; max-width: 360px; font-size: 12.5px; color: var(--app-text-muted); }

/* Dialog */
.ipl-dialog {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--app-overlay, rgba(0, 0, 0, 0.6));
  backdrop-filter: blur(3px);
}

.ipl-dialog__card {
  width: min(460px, 100%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface-solid, var(--app-surface));
  box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.7);
}

.ipl-dialog__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
}

.ipl-dialog__head h4 { margin: 0; font-size: 15px; font-weight: 650; color: var(--app-heading); }
.ipl-dialog__head p { margin: 2px 0 0; font-size: 12px; color: var(--app-text-muted); }

.ipl-dialog__field { display: flex; flex-direction: column; gap: 6px; }

.ipl-dialog__field span {
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.ipl-dialog__field em { font-style: normal; color: var(--dorian-danger, #e15241); }
.ipl-dialog__field small { text-transform: none; letter-spacing: 0; font-weight: 500; opacity: 0.8; }

.ipl-dialog__field input {
  padding: 9px 11px;
  border-radius: 7px;
  border: 1px solid var(--app-input-border);
  background: var(--app-input-bg);
  color: var(--app-text);
  font: inherit;
  font-size: 13px;
  outline: none;
}

.ipl-dialog__field input.invalid { border-color: var(--dorian-danger, #e15241); }

.ipl-dialog__error { margin: -4px 0 0; font-size: 12px; color: var(--dorian-danger, #e15241); }

.ipl-dialog__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

@keyframes ipl-spin { to { transform: rotate(360deg); } }

@media (max-width: 720px) {
  .ipl__stats { grid-template-columns: 1fr; }
  .ipl__search { max-width: none; }
}
</style>
