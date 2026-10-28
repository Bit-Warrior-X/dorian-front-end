<template>
  <div class="sw-origin">
    <section class="sw-origin__card">
      <div class="sw-origin__head">
        <div class="sw-origin__title">
          <h5 class="info-hint-heading">
            <span>Origins</span>
            <InfoHint
              text="Backend inventory for this site. Add each origin as ip:port, then assign it to the listen ports you selected."
              aria-label="Origins help"
            />
          </h5>
          <span class="sw-origin__count">{{ originServers.length }}</span>
        </div>
        <button class="ghost-btn" type="button" @click="showAdd = !showAdd">
          {{ showAdd ? 'Cancel' : 'Add origin' }}
        </button>
      </div>

      <div v-if="showAdd" class="sw-origin__add">
        <label class="sw-origin__field">
          <span>Server address</span>
          <input v-model="draft.ip" type="text" placeholder="212.86.127.134" autocomplete="off" />
        </label>
        <label class="sw-origin__field">
          <span>Port</span>
          <input v-model="draft.port" type="text" placeholder="8080" inputmode="numeric" />
        </label>
        <div class="sw-origin__field">
          <span>Protocol</span>
          <div class="sw-origin__seg" role="group" aria-label="Origin protocol">
            <button type="button" :class="{ active: draft.protocol === 'HTTP' }" @click="draft.protocol = 'HTTP'">HTTP</button>
            <button type="button" :class="{ active: draft.protocol === 'HTTPS' }" @click="draft.protocol = 'HTTPS'">HTTPS</button>
          </div>
        </div>
        <label class="sw-origin__field">
          <span class="info-hint-heading">
            <span>Weight</span>
            <InfoHint text="Relative load-balancing weight. Higher values receive more traffic." aria-label="Weight help" />
          </span>
          <input v-model="draft.weight" type="number" min="1" placeholder="4" />
        </label>
        <label class="sw-origin__field">
          <span class="info-hint-heading">
            <span>Max fails</span>
            <InfoHint text="Consecutive failures before this origin is marked unhealthy." aria-label="Max fails help" />
          </span>
          <input v-model="draft.maxFails" type="number" min="1" placeholder="3" />
        </label>
        <label class="sw-origin__field">
          <span class="info-hint-heading">
            <span>Fail timeout (s)</span>
            <InfoHint text="Seconds to keep an unhealthy origin out of rotation." aria-label="Fail timeout help" />
          </span>
          <input v-model="draft.failTimeout" type="number" min="1" placeholder="30" />
        </label>
        <div class="sw-origin__add-actions">
          <button class="ghost-btn" type="button" @click="showAdd = false">Cancel</button>
          <button class="primary-btn" type="button" @click="commitDraft">Add origin</button>
        </div>
      </div>

      <div v-if="!filledOrigins.length" class="sw-origin__empty">
        No origins yet. Add a backend, then map it to listen ports below.
      </div>
      <div v-else class="sw-origin__table-wrap">
        <table class="sw-origin__table">
          <thead>
            <tr>
              <th>IP:Port</th>
              <th>Protocol</th>
              <th>Weight</th>
              <th>Max fails</th>
              <th>Fail timeout</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="origin in filledOrigins" :key="origin.key">
              <td><code class="mono">{{ originAddress(origin) }}</code></td>
              <td>{{ origin.protocol || 'HTTP' }}</td>
              <td class="num">{{ origin.weight }}</td>
              <td class="num">{{ origin.maxFails }}</td>
              <td class="num">{{ origin.failTimeout }}s</td>
              <td class="sw-origin__actions">
                <button class="sw-origin__remove" type="button" @click="removeOrigin(origin.key)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="sw-origin__card">
      <div class="sw-origin__head">
        <div class="sw-origin__title">
          <h5 class="info-hint-heading">
            <span>HTTP routing</span>
            <InfoHint
              text="Map each HTTP listen port you selected to one or more origins."
              aria-label="HTTP routing help"
            />
          </h5>
          <span v-if="httpPorts.length" class="sw-origin__count">{{ routedCount('http') }}/{{ httpPorts.length }}</span>
        </div>
      </div>
      <div v-if="!httpPorts.length" class="sw-origin__empty">
        No HTTP listen ports selected. Go back to Ports and choose at least one.
      </div>
      <div v-else class="sw-origin__rows">
        <div
          v-for="port in httpPorts"
          :key="`http-${port}`"
          class="sw-origin__row"
          :class="{ routed: assignedKeys('http', port).length }"
        >
          <div class="sw-origin__port">
            <span class="sw-origin__badge">HTTP</span>
            <strong class="mono">:{{ port }}</strong>
          </div>
          <span class="sw-origin__arrow" aria-hidden="true">→</span>
          <div class="sw-origin__targets">
            <button
              v-for="key in assignedKeys('http', port)"
              :key="`http-${port}-${key}`"
              type="button"
              class="chip"
              :title="`Remove ${originLabel(key)}`"
              @click="toggleAssignment('http', port, key)"
            >
              <span class="chip__text">{{ originLabel(key) }}</span>
              <span class="chip__x" aria-hidden="true">×</span>
            </button>
            <div class="sw-origin__picker" :data-picker="pickerKey('http', port)">
              <button
                type="button"
                class="sw-origin__pick-btn"
                :class="{ open: isPickerOpen('http', port) }"
                :disabled="!assignableOrigins('http', port).length"
                @click.stop="togglePicker('http', port)"
              >
                <span>{{ pickerPlaceholder('http', port) }}</span>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div v-if="isPickerOpen('http', port)" class="sw-origin__pick-menu" role="listbox">
                <button
                  v-for="origin in assignableOrigins('http', port)"
                  :key="`pick-http-${port}-${origin.key}`"
                  type="button"
                  class="sw-origin__pick-option"
                  @click.stop="pickOrigin('http', port, origin.key)"
                >
                  <span class="sw-origin__pick-copy">
                    <strong class="mono">{{ originAddress(origin) }}</strong>
                    <small>{{ origin.protocol || 'HTTP' }} · w{{ origin.weight }}</small>
                  </span>
                  <span class="sw-origin__pick-add" aria-hidden="true">+</span>
                </button>
              </div>
            </div>
            <span v-if="!assignedKeys('http', port).length" class="sw-origin__unassigned">Not routed</span>
          </div>
        </div>
      </div>
    </section>

    <section class="sw-origin__card">
      <div class="sw-origin__head">
        <div class="sw-origin__title">
          <h5 class="info-hint-heading">
            <span>HTTPS routing</span>
            <InfoHint
              text="Map each HTTPS listen port you selected to one or more origins."
              aria-label="HTTPS routing help"
            />
          </h5>
          <span v-if="httpsPorts.length" class="sw-origin__count">{{ routedCount('https') }}/{{ httpsPorts.length }}</span>
        </div>
      </div>
      <div v-if="!httpsPorts.length" class="sw-origin__empty">
        No HTTPS listen ports selected. Go back to Ports if you need TLS listeners.
      </div>
      <div v-else class="sw-origin__rows">
        <div
          v-for="port in httpsPorts"
          :key="`https-${port}`"
          class="sw-origin__row"
          :class="{ routed: assignedKeys('https', port).length }"
        >
          <div class="sw-origin__port">
            <span class="sw-origin__badge sw-origin__badge--https">HTTPS</span>
            <strong class="mono">:{{ port }}</strong>
          </div>
          <span class="sw-origin__arrow" aria-hidden="true">→</span>
          <div class="sw-origin__targets">
            <button
              v-for="key in assignedKeys('https', port)"
              :key="`https-${port}-${key}`"
              type="button"
              class="chip"
              :title="`Remove ${originLabel(key)}`"
              @click="toggleAssignment('https', port, key)"
            >
              <span class="chip__text">{{ originLabel(key) }}</span>
              <span class="chip__x" aria-hidden="true">×</span>
            </button>
            <div class="sw-origin__picker" :data-picker="pickerKey('https', port)">
              <button
                type="button"
                class="sw-origin__pick-btn"
                :class="{ open: isPickerOpen('https', port) }"
                :disabled="!assignableOrigins('https', port).length"
                @click.stop="togglePicker('https', port)"
              >
                <span>{{ pickerPlaceholder('https', port) }}</span>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div v-if="isPickerOpen('https', port)" class="sw-origin__pick-menu" role="listbox">
                <button
                  v-for="origin in assignableOrigins('https', port)"
                  :key="`pick-https-${port}-${origin.key}`"
                  type="button"
                  class="sw-origin__pick-option"
                  @click.stop="pickOrigin('https', port, origin.key)"
                >
                  <span class="sw-origin__pick-copy">
                    <strong class="mono">{{ originAddress(origin) }}</strong>
                    <small>{{ origin.protocol || 'HTTP' }} · w{{ origin.weight }}</small>
                  </span>
                  <span class="sw-origin__pick-add" aria-hidden="true">+</span>
                </button>
              </div>
            </div>
            <span v-if="!assignedKeys('https', port).length" class="sw-origin__unassigned">Not routed</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import InfoHint from '@/components/InfoHint.vue'
import {
  buildOriginAddress,
  createEmptyOriginServer,
  getFilledOriginServers,
} from '@/utils/originServers'
import { notifyError } from '@/utils/notify'

const props = defineProps({
  form: { type: Object, required: true },
})

const showAdd = ref(false)
const openPicker = ref('')
const draft = reactive(createEmptyOriginServer())

const ensureRouteBuckets = () => {
  if (!props.form.originRoutes || typeof props.form.originRoutes !== 'object') {
    props.form.originRoutes = { http: {}, https: {} }
  }
  if (!props.form.originRoutes.http) props.form.originRoutes.http = {}
  if (!props.form.originRoutes.https) props.form.originRoutes.https = {}
  if (!Array.isArray(props.form.originServers)) {
    props.form.originServers = [createEmptyOriginServer()]
  }
  if (!Array.isArray(props.form.httpPorts)) props.form.httpPorts = []
  if (!Array.isArray(props.form.httpsPorts)) props.form.httpsPorts = []
}

ensureRouteBuckets()

const originServers = computed(() => {
  ensureRouteBuckets()
  return props.form.originServers
})

const filledOrigins = computed(() => getFilledOriginServers(originServers.value))

const httpPorts = computed(() => [...(props.form.httpPorts || [])].map(Number).filter((p) => p > 0).sort((a, b) => a - b))
const httpsPorts = computed(() => [...(props.form.httpsPorts || [])].map(Number).filter((p) => p > 0).sort((a, b) => a - b))

const originAddress = (origin) => buildOriginAddress(origin) || '—'

const originByKey = computed(() => {
  const map = new Map()
  for (const origin of originServers.value) map.set(origin.key, origin)
  return map
})

const originLabel = (key) => {
  const origin = originByKey.value.get(key)
  return origin ? originAddress(origin) : key
}

const assignedKeys = (scheme, port) => {
  ensureRouteBuckets()
  const list = props.form.originRoutes[scheme]?.[port] || []
  return list.filter((key) => originByKey.value.has(key))
}

const routedCount = (scheme) => {
  const ports = scheme === 'https' ? httpsPorts.value : httpPorts.value
  return ports.filter((port) => assignedKeys(scheme, port).length > 0).length
}

const assignableOrigins = (scheme, port) => {
  const selected = new Set(assignedKeys(scheme, port))
  return filledOrigins.value.filter((origin) => !selected.has(origin.key))
}

const pickerPlaceholder = (scheme, port) => {
  if (!filledOrigins.value.length) return 'Add an origin first…'
  if (!assignableOrigins(scheme, port).length) return 'All origins assigned'
  return assignedKeys(scheme, port).length ? 'Add origin…' : 'Choose origin…'
}

const pickerKey = (scheme, port) => `${scheme}:${port}`
const isPickerOpen = (scheme, port) => openPicker.value === pickerKey(scheme, port)
const closePicker = () => { openPicker.value = '' }
const togglePicker = (scheme, port) => {
  const key = pickerKey(scheme, port)
  openPicker.value = openPicker.value === key ? '' : key
}

const toggleAssignment = (scheme, port, originKey) => {
  ensureRouteBuckets()
  const current = [...(props.form.originRoutes[scheme][port] || [])]
  const next = current.includes(originKey)
    ? current.filter((key) => key !== originKey)
    : [...current, originKey]
  props.form.originRoutes[scheme][port] = next
}

const pickOrigin = (scheme, port, originKey) => {
  toggleAssignment(scheme, port, originKey)
  closePicker()
}

const resetDraft = () => {
  Object.assign(draft, createEmptyOriginServer())
}

const commitDraft = () => {
  const next = createEmptyOriginServer({
    ip: String(draft.ip || '').trim(),
    port: String(draft.port || '').trim() || '80',
    protocol: draft.protocol === 'HTTPS' ? 'HTTPS' : 'HTTP',
    weight: String(draft.weight || '4'),
    maxFails: String(draft.maxFails || '3'),
    failTimeout: String(draft.failTimeout || '30'),
  })
  if (!next.ip) {
    notifyError('Origins', 'Server address is required.')
    return
  }
  const address = buildOriginAddress(next).toLowerCase()
  const duplicate = filledOrigins.value.some((item) => buildOriginAddress(item).toLowerCase() === address)
  if (duplicate) {
    notifyError('Origins', `Origin ${buildOriginAddress(next)} is already listed.`)
    return
  }
  // Replace blank placeholder rows when adding the first real origin.
  const blanks = originServers.value.filter((item) => !String(item.ip || '').trim())
  if (blanks.length === originServers.value.length) {
    props.form.originServers = [next]
  } else {
    props.form.originServers.push(next)
  }
  resetDraft()
  showAdd.value = false
}

const removeOrigin = (key) => {
  ensureRouteBuckets()
  props.form.originServers = originServers.value.filter((item) => item.key !== key)
  if (!props.form.originServers.length) {
    props.form.originServers = [createEmptyOriginServer()]
  }
  for (const scheme of ['http', 'https']) {
    const bucket = props.form.originRoutes[scheme] || {}
    for (const port of Object.keys(bucket)) {
      bucket[port] = (bucket[port] || []).filter((item) => item !== key)
    }
  }
  closePicker()
}

const pruneRoutesToSelectedPorts = () => {
  ensureRouteBuckets()
  const keepHttp = new Set(httpPorts.value)
  const keepHttps = new Set(httpsPorts.value)
  const nextHttp = {}
  const nextHttps = {}
  for (const port of keepHttp) nextHttp[port] = assignedKeys('http', port)
  for (const port of keepHttps) nextHttps[port] = assignedKeys('https', port)
  props.form.originRoutes.http = nextHttp
  props.form.originRoutes.https = nextHttps
}

watch([httpPorts, httpsPorts], () => {
  pruneRoutesToSelectedPorts()
})

const onDocumentPointerDown = (event) => {
  if (!openPicker.value) return
  const target = event.target
  if (target instanceof Element && target.closest(`[data-picker="${openPicker.value}"]`)) return
  closePicker()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  pruneRoutesToSelectedPorts()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
</script>

<style scoped>
.sw-origin {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sw-origin__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-solid);
}

.sw-origin__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sw-origin__title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.sw-origin__title h5 {
  margin: 0;
  color: var(--app-heading);
  font-size: 14px;
  font-weight: 650;
}

.sw-origin__count {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--app-surface-elevated);
  border: 1px solid var(--app-border);
  color: var(--app-text-secondary);
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.sw-origin__add {
  display: grid;
  grid-template-columns: minmax(140px, 1.4fr) 88px 132px repeat(3, minmax(88px, 110px));
  gap: 10px;
  align-items: end;
  padding: 12px;
  border: 1px dashed var(--app-border-strong);
  border-radius: 12px;
  background: var(--app-surface-muted);
}

.sw-origin__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.sw-origin__field > span,
.sw-origin__field > .info-hint-heading {
  color: var(--app-text-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sw-origin__field input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-solid);
  color: var(--app-heading);
}

.sw-origin__seg {
  display: inline-flex;
  width: 100%;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--app-surface-solid);
}

.sw-origin__seg button {
  flex: 1;
  height: 38px;
  border: 0;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
}

.sw-origin__seg button.active {
  background: var(--app-accent-soft);
  color: var(--dorian-viper-400, #3fbd85);
}

.sw-origin__add-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.sw-origin__empty {
  margin: 0;
  padding: 16px;
  border: 1px dashed var(--app-border);
  border-radius: 10px;
  color: var(--app-text-muted);
  font-size: 13px;
  text-align: center;
}

.sw-origin__table-wrap {
  border: 1px solid var(--app-border);
  border-radius: 10px;
  overflow: auto;
}

.sw-origin__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 560px;
}

.sw-origin__table th,
.sw-origin__table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--app-border);
  font-size: 13px;
}

.sw-origin__table th {
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.sw-origin__table tbody tr:last-child td { border-bottom: 0; }
.sw-origin__table .num { font-variant-numeric: tabular-nums; color: var(--app-text-secondary); }
.sw-origin__actions { text-align: right; }

.sw-origin__remove {
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: transparent;
  color: var(--app-text-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.sw-origin__remove:hover {
  border-color: color-mix(in srgb, var(--dorian-danger, #e35d5d) 45%, var(--app-border));
  color: var(--dorian-danger, #e35d5d);
}

.sw-origin__rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sw-origin__row {
  display: grid;
  grid-template-columns: 104px 28px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-muted);
}

.sw-origin__row.routed {
  border-color: color-mix(in srgb, var(--dorian-viper-500, #2e9e6c) 28%, var(--app-border));
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--dorian-viper-500, #2e9e6c) 8%, transparent), transparent 42%),
    var(--app-surface-solid);
}

.sw-origin__port {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sw-origin__badge {
  width: fit-content;
  padding: 2px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dorian-viper-500, #2e9e6c) 16%, transparent);
  color: var(--dorian-viper-400, #3fbd85);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.sw-origin__badge--https {
  background: color-mix(in srgb, var(--dorian-viper-400, #6ee7b7) 16%, transparent);
  color: var(--dorian-viper-400, #6ee7b7);
}

.sw-origin__port strong {
  color: var(--app-heading);
  font-size: 18px;
  letter-spacing: -0.02em;
}

.sw-origin__arrow {
  color: var(--app-text-muted);
  text-align: center;
  font-size: 16px;
}

.sw-origin__targets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--app-border-strong);
  border-radius: 999px;
  background: var(--app-surface-solid);
  color: var(--app-heading);
  cursor: pointer;
}

.chip__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
}

.chip__x { color: var(--app-text-muted); font-size: 14px; line-height: 1; }
.chip:hover { border-color: color-mix(in srgb, var(--dorian-danger, #e35d5d) 55%, var(--app-border)); }
.chip:hover .chip__x { color: var(--dorian-danger, #e35d5d); }

.sw-origin__picker { position: relative; min-width: 168px; }

.sw-origin__pick-btn {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 168px;
  height: 32px;
  padding: 0 12px;
  border: 1px dashed var(--app-border-strong);
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-surface-muted) 70%, transparent);
  color: var(--app-text-secondary);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.sw-origin__pick-btn svg { width: 14px; height: 14px; flex: none; opacity: 0.7; }
.sw-origin__pick-btn.open,
.sw-origin__pick-btn:hover:not(:disabled) {
  border-style: solid;
  border-color: color-mix(in srgb, var(--dorian-viper-500, #2e9e6c) 45%, var(--app-border));
  color: var(--app-heading);
  background: var(--app-surface-solid);
}
.sw-origin__pick-btn.open svg { transform: rotate(180deg); opacity: 1; }
.sw-origin__pick-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.sw-origin__pick-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 30;
  width: min(320px, 78vw);
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--app-border-strong);
  border-radius: 14px;
  background: var(--app-surface-elevated, var(--app-surface-solid));
  box-shadow: 0 18px 40px -14px rgba(0, 0, 0, 0.55);
}

.sw-origin__pick-option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--app-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.sw-origin__pick-option:hover {
  background: var(--app-accent-soft);
}

.sw-origin__pick-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sw-origin__pick-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--app-heading);
  font-size: 12.5px;
  font-weight: 650;
}

.sw-origin__pick-copy small {
  color: var(--app-text-muted);
  font-size: 11px;
}

.sw-origin__pick-add {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dorian-viper-500, #2e9e6c) 16%, transparent);
  color: var(--dorian-viper-400, #3fbd85);
  font-size: 14px;
  font-weight: 700;
}

.sw-origin__unassigned {
  color: var(--app-text-muted);
  font-size: 12px;
  font-style: italic;
}

.mono { font-family: var(--font-mono, ui-monospace, monospace); }

@media (max-width: 980px) {
  .sw-origin__add { grid-template-columns: minmax(0, 1fr) 88px 132px; }
}

@media (max-width: 860px) {
  .sw-origin__add { grid-template-columns: 1fr 1fr; }
  .sw-origin__row { grid-template-columns: 1fr; }
  .sw-origin__arrow { display: none; }
}
</style>
