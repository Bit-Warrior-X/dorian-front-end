<template>
  <div class="oroutes">
    <header class="oroutes__bar">
      <h4 class="info-hint-heading oroutes__title">
        <span>Port → origin map</span>
        <InfoHint
          text="One hostname can listen on many edge ports. For each HTTP or HTTPS listen port, choose which origin backends (ip:port) should receive that traffic. Ports with no origin are left unassigned."
          aria-label="Origin routing help"
        />
      </h4>
      <div class="oroutes__bar-actions">
        <span v-if="deferSave && dirty" class="oroutes__dirty">Unsaved — apply with Confirm</span>
        <button class="ghost-btn" type="button" :disabled="loading || saving" @click="reload">Refresh</button>
        <button
          v-if="!deferSave"
          class="primary-btn"
          type="button"
          :disabled="loading || saving || !dirty"
          @click="save()"
        >
          {{ saving ? 'Saving…' : 'Save routing' }}
        </button>
      </div>
    </header>

    <p v-if="loading" class="helper-banner">Loading origin routing…</p>
    <p v-else-if="error" class="helper-banner helper-banner--error">{{ error }}</p>

    <template v-else>
      <section class="oroutes__card">
        <div class="oroutes__card-head">
          <div class="oroutes__card-title">
            <h5 class="info-hint-heading">
              <span>Origins</span>
              <InfoHint
                text="Shared backend inventory for this site. Add each origin as ip:port, then assign it to listen ports in the HTTP/HTTPS sections. An origin used by a port cannot be deleted until you unassign it."
                aria-label="Origins help"
              />
            </h5>
            <span class="oroutes__count">{{ upstreams.length }}</span>
          </div>
          <button class="ghost-btn" type="button" @click="showAddOrigin = !showAddOrigin">
            {{ showAddOrigin ? 'Cancel' : 'Add origin' }}
          </button>
        </div>

        <div v-if="showAddOrigin" class="oroutes__add">
          <label class="oroutes__field oroutes__field--wide">
            <span>Server address</span>
            <input v-model="newOrigin.ip" type="text" placeholder="212.86.127.134" autocomplete="off" />
          </label>
          <label class="oroutes__field">
            <span>Port</span>
            <input v-model="newOrigin.port" type="text" placeholder="8080" inputmode="numeric" />
          </label>
          <div class="oroutes__field">
            <span>Protocol</span>
            <div class="oroutes__seg" role="group" aria-label="Origin protocol">
              <button type="button" :class="{ active: newOrigin.protocol === 'HTTP' }" @click="newOrigin.protocol = 'HTTP'">HTTP</button>
              <button type="button" :class="{ active: newOrigin.protocol === 'HTTPS' }" @click="newOrigin.protocol = 'HTTPS'">HTTPS</button>
            </div>
          </div>
          <label class="oroutes__field">
            <span class="info-hint-heading">
              <span>Weight</span>
              <InfoHint text="Relative load-balancing weight. Higher values receive more traffic." aria-label="Weight help" />
            </span>
            <input v-model="newOrigin.weight" type="number" min="1" placeholder="4" />
          </label>
          <label class="oroutes__field">
            <span class="info-hint-heading">
              <span>Max fails</span>
              <InfoHint text="Consecutive failures before this origin is marked unhealthy." aria-label="Max fails help" />
            </span>
            <input v-model="newOrigin.maxFails" type="number" min="1" placeholder="3" />
          </label>
          <label class="oroutes__field">
            <span class="info-hint-heading">
              <span>Fail timeout (s)</span>
              <InfoHint text="Seconds to keep an unhealthy origin out of rotation." aria-label="Fail timeout help" />
            </span>
            <input v-model="newOrigin.failTimeout" type="number" min="1" placeholder="30" />
          </label>
          <div class="oroutes__add-actions">
            <button class="ghost-btn" type="button" @click="showAddOrigin = false">Cancel</button>
            <button class="primary-btn" type="button" :disabled="addingOrigin" @click="addOrigin">
              {{ addingOrigin ? 'Adding…' : 'Add origin' }}
            </button>
          </div>
        </div>

        <div v-if="!upstreams.length" class="oroutes__empty">
          No origins yet. Add a backend first, then map it to listen ports below.
        </div>
        <div v-else class="oroutes__table-wrap">
          <table class="oroutes__table" aria-label="Origin inventory">
            <thead>
              <tr>
                <th>Status</th>
                <th>IP:Port</th>
                <th>Protocol</th>
                <th>Weight</th>
                <th>Max fails</th>
                <th>Fail timeout</th>
                <th>Used by</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="upstream in upstreams" :key="upstream.id">
                <td>
                  <span class="status-dot" :class="upstreamStatusClass(upstream)" :title="upstream.status || 'ENABLE'"></span>
                </td>
                <td><code class="mono">{{ upstream.address }}</code></td>
                <td>{{ upstream.protocol || 'HTTP' }}</td>
                <td class="num">{{ originMeta(upstream).weight }}</td>
                <td class="num">{{ originMeta(upstream).maxFails }}</td>
                <td class="num">{{ originMeta(upstream).failTimeout }}s</td>
                <td>
                  <span class="oroutes__usage" :class="{ hot: originInUse(upstream.id) }">
                    {{ originUsageLabel(upstream.id) }}
                  </span>
                </td>
                <td class="oroutes__actions-cell">
                  <button
                    class="oroutes__remove"
                    type="button"
                    :disabled="originInUse(upstream.id)"
                    :title="originInUse(upstream.id) ? 'Unassign from ports first' : 'Remove origin'"
                    @click="askRemoveOrigin(upstream)"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="oroutes__card">
        <div class="oroutes__card-head">
          <div class="oroutes__card-title">
            <h5 class="info-hint-heading">
              <span>HTTP routing</span>
              <InfoHint
                text="Each row is a client→edge HTTP listen port from your assigned edges. Pick one or more origins for that port. The same origin can be reused on several ports."
                aria-label="HTTP routing help"
              />
            </h5>
            <span v-if="availableHttpPorts.length" class="oroutes__count">{{ routedCount('http') }}/{{ availableHttpPorts.length }}</span>
          </div>
        </div>

        <div v-if="!availableHttpPorts.length" class="oroutes__empty">
          No HTTP listen ports on assigned edges. Add them under Edge settings → Listening ports.
        </div>
        <div v-else class="oroutes__rows">
          <div
            v-for="port in availableHttpPorts"
            :key="`http-${port}`"
            class="oroutes__row"
            :class="{ routed: (assignment.http[port] || []).length }"
          >
            <div class="oroutes__port">
              <span class="oroutes__badge">HTTP</span>
              <strong class="mono">:{{ port }}</strong>
            </div>
            <span class="oroutes__arrow" aria-hidden="true">→</span>
            <div class="oroutes__targets">
              <button
                v-for="id in assignment.http[port] || []"
                :key="`http-${port}-${id}`"
                type="button"
                class="chip"
                :title="`Remove ${originLabel(id)}`"
                @click="toggleOrigin('http', port, id)"
              >
                <span class="chip__text">{{ originLabel(id) }}</span>
                <span class="chip__x" aria-hidden="true">×</span>
              </button>
              <div class="oroutes__picker" :data-picker="pickerKey('http', port)">
                <button
                  type="button"
                  class="oroutes__pick-btn"
                  :class="{ open: isPickerOpen('http', port) }"
                  :disabled="!upstreams.length || !assignableOrigins('http', port).length"
                  :aria-expanded="isPickerOpen('http', port)"
                  aria-haspopup="listbox"
                  @click.stop="togglePicker('http', port)"
                >
                  <span>{{ pickerPlaceholder('http', port) }}</span>
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div
                  v-if="isPickerOpen('http', port)"
                  class="oroutes__pick-menu"
                  role="listbox"
                  :aria-label="`Origins for HTTP :${port}`"
                >
                  <button
                    v-for="upstream in assignableOrigins('http', port)"
                    :key="`pick-http-${port}-${upstream.id}`"
                    type="button"
                    role="option"
                    class="oroutes__pick-option"
                    @click.stop="pickOrigin('http', port, upstream.id)"
                  >
                    <span class="status-dot" :class="upstreamStatusClass(upstream)" aria-hidden="true"></span>
                    <span class="oroutes__pick-copy">
                      <strong class="mono">{{ upstream.address }}</strong>
                      <small>
                        {{ upstream.protocol || 'HTTP' }}
                        · w{{ originMeta(upstream).weight }}
                        · fail {{ originMeta(upstream).maxFails }}/{{ originMeta(upstream).failTimeout }}s
                      </small>
                    </span>
                    <span class="oroutes__pick-add" aria-hidden="true">+</span>
                  </button>
                  <p v-if="!assignableOrigins('http', port).length" class="oroutes__pick-empty">
                    {{ upstreams.length ? 'All origins already assigned' : 'Add an origin first' }}
                  </p>
                </div>
              </div>
              <span v-if="!(assignment.http[port] || []).length" class="oroutes__unassigned">Not routed</span>
            </div>
          </div>
        </div>
      </section>

      <section class="oroutes__card">
        <div class="oroutes__card-head">
          <div class="oroutes__card-title">
            <h5 class="info-hint-heading">
              <span>HTTPS routing</span>
              <InfoHint
                text="Same as HTTP routing, but for TLS listen ports on the edge (for example 443 or 8443). Certificate settings stay on the site hostname; only the origin pool changes per port."
                aria-label="HTTPS routing help"
              />
            </h5>
            <span v-if="availableHttpsPorts.length" class="oroutes__count">{{ routedCount('https') }}/{{ availableHttpsPorts.length }}</span>
          </div>
        </div>

        <div v-if="!availableHttpsPorts.length" class="oroutes__empty">
          No HTTPS listen ports on assigned edges. Add them under Edge settings → Listening ports.
        </div>
        <div v-else class="oroutes__rows">
          <div
            v-for="port in availableHttpsPorts"
            :key="`https-${port}`"
            class="oroutes__row"
            :class="{ routed: (assignment.https[port] || []).length }"
          >
            <div class="oroutes__port">
              <span class="oroutes__badge oroutes__badge--https">HTTPS</span>
              <strong class="mono">:{{ port }}</strong>
            </div>
            <span class="oroutes__arrow" aria-hidden="true">→</span>
            <div class="oroutes__targets">
              <button
                v-for="id in assignment.https[port] || []"
                :key="`https-${port}-${id}`"
                type="button"
                class="chip"
                :title="`Remove ${originLabel(id)}`"
                @click="toggleOrigin('https', port, id)"
              >
                <span class="chip__text">{{ originLabel(id) }}</span>
                <span class="chip__x" aria-hidden="true">×</span>
              </button>
              <div class="oroutes__picker" :data-picker="pickerKey('https', port)">
                <button
                  type="button"
                  class="oroutes__pick-btn"
                  :class="{ open: isPickerOpen('https', port) }"
                  :disabled="!upstreams.length || !assignableOrigins('https', port).length"
                  :aria-expanded="isPickerOpen('https', port)"
                  aria-haspopup="listbox"
                  @click.stop="togglePicker('https', port)"
                >
                  <span>{{ pickerPlaceholder('https', port) }}</span>
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div
                  v-if="isPickerOpen('https', port)"
                  class="oroutes__pick-menu"
                  role="listbox"
                  :aria-label="`Origins for HTTPS :${port}`"
                >
                  <button
                    v-for="upstream in assignableOrigins('https', port)"
                    :key="`pick-https-${port}-${upstream.id}`"
                    type="button"
                    role="option"
                    class="oroutes__pick-option"
                    @click.stop="pickOrigin('https', port, upstream.id)"
                  >
                    <span class="status-dot" :class="upstreamStatusClass(upstream)" aria-hidden="true"></span>
                    <span class="oroutes__pick-copy">
                      <strong class="mono">{{ upstream.address }}</strong>
                      <small>
                        {{ upstream.protocol || 'HTTP' }}
                        · w{{ originMeta(upstream).weight }}
                        · fail {{ originMeta(upstream).maxFails }}/{{ originMeta(upstream).failTimeout }}s
                      </small>
                    </span>
                    <span class="oroutes__pick-add" aria-hidden="true">+</span>
                  </button>
                  <p v-if="!assignableOrigins('https', port).length" class="oroutes__pick-empty">
                    {{ upstreams.length ? 'All origins already assigned' : 'Add an origin first' }}
                  </p>
                </div>
              </div>
              <span v-if="!(assignment.https[port] || []).length" class="oroutes__unassigned">Not routed</span>
            </div>
          </div>
        </div>
      </section>
    </template>

    <ConfirmDialog
      v-model="isConfirmOpen"
      title="Remove origin"
      :message="confirmMessage"
      confirm-text="Remove"
      cancel-text="Cancel"
      danger
      @confirm="confirmRemoveOrigin"
      @cancel="pendingRemove = null"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import InfoHint from '@/components/InfoHint.vue'
import { fetchOriginRoutes, updateOriginRoutes } from '@/api/originRoutes'
import { fetchSitePorts } from '@/api/sitePorts'
import {
  createUpstreamServer,
  deleteUpstreamServer,
  fetchUpstreamServers,
} from '@/api/upstreamServers'
import { notifyError, notifySuccess } from '@/utils/notify'
import { buildOriginDescription, parseOriginDescription } from '@/utils/originServers'

const props = defineProps({
  siteId: { type: [Number, String], required: true },
  /** When true, hide Save routing and let the parent apply changes (e.g. Edit Site Confirm). */
  deferSave: { type: Boolean, default: false },
})

const emit = defineEmits(['updated', 'dirty-change'])

const loading = ref(false)
const saving = ref(false)
const addingOrigin = ref(false)
const showAddOrigin = ref(false)
const openPicker = ref('')
const isConfirmOpen = ref(false)
const pendingRemove = ref(null)
const error = ref('')
const upstreams = ref([])
const portsConfig = ref({ servers: [] })
const savedSignature = ref('')
const assignment = reactive({ http: {}, https: {} })
const newOrigin = reactive({
  ip: '',
  port: '80',
  protocol: 'HTTP',
  weight: '4',
  maxFails: '3',
  failTimeout: '30',
})

const confirmMessage = computed(() => {
  const address = pendingRemove.value?.address
  return address
    ? `Remove ${address} from this site’s origin inventory?`
    : 'Remove this origin from the inventory?'
})

const originMeta = (upstream) => parseOriginDescription(upstream?.description)

const collectPorts = (scheme) => {
  const want = String(scheme || '').toUpperCase()
  const set = new Set()
  for (const server of portsConfig.value?.servers || []) {
    const list = want === 'HTTPS' ? server.httpsPorts : server.httpPorts
    for (const item of list || []) {
      const port = Number(item.port)
      if (port > 0) set.add(port)
    }
  }
  return [...set].sort((a, b) => a - b)
}

const availableHttpPorts = computed(() => collectPorts('HTTP'))
const availableHttpsPorts = computed(() => collectPorts('HTTPS'))

const originById = computed(() => {
  const map = new Map()
  for (const upstream of upstreams.value) map.set(Number(upstream.id), upstream)
  return map
})

const originLabel = (id) => originById.value.get(Number(id))?.address || `#${id}`

const upstreamStatusClass = (upstream) => {
  const status = String(upstream?.status || '').toUpperCase()
  if (status === 'DISABLE' || status === 'DISABLED' || status === 'OFFLINE') return 'bad'
  return 'ok'
}

const normalizeIds = (ids) => [...new Set((ids || []).map(Number).filter((id) => id > 0))].sort((a, b) => a - b)

const routedCount = (scheme) => {
  const ports = scheme === 'https' ? availableHttpsPorts.value : availableHttpPorts.value
  return ports.filter((port) => (assignment[scheme][port] || []).length > 0).length
}

const pickerKey = (scheme, port) => `${scheme}:${port}`

const isPickerOpen = (scheme, port) => openPicker.value === pickerKey(scheme, port)

const closePicker = () => {
  openPicker.value = ''
}

const togglePicker = (scheme, port) => {
  const key = pickerKey(scheme, port)
  openPicker.value = openPicker.value === key ? '' : key
}

const pickerPlaceholder = (scheme, port) => {
  if (!upstreams.value.length) return 'Add an origin first…'
  if (!assignableOrigins(scheme, port).length) return 'All origins assigned'
  return (assignment[scheme][port] || []).length ? 'Add origin…' : 'Choose origin…'
}

const onDocumentPointerDown = (event) => {
  if (!openPicker.value) return
  const target = event.target
  if (target instanceof Element && target.closest(`[data-picker="${openPicker.value}"]`)) return
  closePicker()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})

const routesFromAssignment = () => {
  const build = (scheme, ports) => {
    const groups = new Map()
    for (const port of ports) {
      const ids = normalizeIds(assignment[scheme][port] || [])
      if (!ids.length) continue
      const key = ids.join(',')
      if (!groups.has(key)) groups.set(key, { ports: [], upstreamIds: ids })
      groups.get(key).ports.push(port)
    }
    return [...groups.values()].map((group) => ({
      ports: [...group.ports].sort((a, b) => a - b),
      upstreamIds: group.upstreamIds,
    }))
  }
  return {
    http: build('http', availableHttpPorts.value),
    https: build('https', availableHttpsPorts.value),
  }
}

const signatureOf = (routes) => JSON.stringify({
  http: (routes.http || []).map((rule) => ({
    ports: [...(rule.ports || [])].map(Number).sort((a, b) => a - b),
    upstreamIds: normalizeIds(rule.upstreamIds),
  })),
  https: (routes.https || []).map((rule) => ({
    ports: [...(rule.ports || [])].map(Number).sort((a, b) => a - b),
    upstreamIds: normalizeIds(rule.upstreamIds),
  })),
})

const dirty = computed(() => signatureOf(routesFromAssignment()) !== savedSignature.value)

watch(dirty, (value) => emit('dirty-change', value), { immediate: true })

const applyRoutesToAssignment = (routes) => {
  assignment.http = {}
  assignment.https = {}
  for (const port of availableHttpPorts.value) assignment.http[port] = []
  for (const port of availableHttpsPorts.value) assignment.https[port] = []

  const fill = (scheme, rules) => {
    for (const rule of rules || []) {
      const ids = normalizeIds(rule.upstreamIds)
      for (const port of rule.ports || []) {
        const key = Number(port)
        if (!key) continue
        if (!(key in assignment[scheme])) assignment[scheme][key] = []
        assignment[scheme][key] = normalizeIds([...(assignment[scheme][key] || []), ...ids])
      }
    }
  }
  fill('http', routes?.http)
  fill('https', routes?.https)
}

const assignableOrigins = (scheme, port) => {
  const selected = new Set(assignment[scheme][port] || [])
  return upstreams.value.filter((upstream) => !selected.has(Number(upstream.id)))
}

const toggleOrigin = (scheme, port, upstreamId) => {
  const id = Number(upstreamId)
  const current = normalizeIds(assignment[scheme][port] || [])
  assignment[scheme][port] = current.includes(id)
    ? current.filter((item) => item !== id)
    : normalizeIds([...current, id])
}

const pickOrigin = (scheme, port, upstreamId) => {
  toggleOrigin(scheme, port, upstreamId)
  closePicker()
}

const originUseCount = (upstreamId) => {
  const id = Number(upstreamId)
  let count = 0
  for (const scheme of ['http', 'https']) {
    for (const ids of Object.values(assignment[scheme])) {
      if ((ids || []).includes(id)) count += 1
    }
  }
  return count
}

const originInUse = (upstreamId) => originUseCount(upstreamId) > 0

const originUsageLabel = (upstreamId) => {
  const count = originUseCount(upstreamId)
  if (!count) return 'Unused'
  return `Used on ${count} port${count === 1 ? '' : 's'}`
}

const reload = async () => {
  if (!props.siteId) return
  closePicker()
  loading.value = true
  error.value = ''
  try {
    const [routes, upstreamList, ports] = await Promise.all([
      fetchOriginRoutes(props.siteId),
      fetchUpstreamServers(props.siteId),
      fetchSitePorts(props.siteId),
    ])
    upstreams.value = Array.isArray(upstreamList) ? upstreamList : []
    portsConfig.value = ports || { servers: [] }
    applyRoutesToAssignment(routes || { http: [], https: [] })
    savedSignature.value = signatureOf(routesFromAssignment())
  } catch (err) {
    error.value = err?.message || 'Origin routing could not be loaded.'
  } finally {
    loading.value = false
  }
}

const resetNewOrigin = () => {
  newOrigin.ip = ''
  newOrigin.port = '80'
  newOrigin.protocol = 'HTTP'
  newOrigin.weight = '4'
  newOrigin.maxFails = '3'
  newOrigin.failTimeout = '30'
}

const addOrigin = async () => {
  const ip = String(newOrigin.ip || '').trim()
  const port = String(newOrigin.port || '').trim()
  if (!ip || !port) {
    notifyError('Origins', 'Server address and port are required.')
    return
  }
  addingOrigin.value = true
  try {
    const address = ip.includes(':') && !ip.startsWith('[') ? `[${ip}]:${port}` : `${ip}:${port}`
    const created = await createUpstreamServer(props.siteId, {
      address,
      protocol: newOrigin.protocol,
      description: buildOriginDescription({
        weight: newOrigin.weight,
        maxFails: newOrigin.maxFails,
        failTimeout: newOrigin.failTimeout,
      }),
      status: 'ENABLE',
    })
    upstreams.value = [created, ...upstreams.value.filter((item) => item.id !== created.id)]
    resetNewOrigin()
    showAddOrigin.value = false
    notifySuccess('Origins', `${created.address} added.`)
    emit('updated')
  } catch (err) {
    notifyError('Origins', err?.message || 'The origin could not be added.')
  } finally {
    addingOrigin.value = false
  }
}

const askRemoveOrigin = (upstream) => {
  if (originInUse(upstream.id)) {
    notifyError('Origins', 'Unassign this origin from listen ports first.')
    return
  }
  pendingRemove.value = upstream
  isConfirmOpen.value = true
}

const confirmRemoveOrigin = async () => {
  const upstream = pendingRemove.value
  pendingRemove.value = null
  if (!upstream) return
  try {
    await deleteUpstreamServer(props.siteId, upstream.id)
    upstreams.value = upstreams.value.filter((item) => item.id !== upstream.id)
    notifySuccess('Origins', `${upstream.address} removed.`)
    emit('updated')
  } catch (err) {
    notifyError('Origins', err?.message || 'The origin could not be removed.')
  }
}

const save = async ({ notify = true } = {}) => {
  const payload = routesFromAssignment()
  if (!payload.http.length && !payload.https.length) {
    const message = 'Assign at least one origin to a listen port before saving.'
    if (notify) notifyError('Origin routing', message)
    throw new Error(message)
  }
  saving.value = true
  try {
    const savedRoutes = await updateOriginRoutes(props.siteId, payload)
    applyRoutesToAssignment(savedRoutes || payload)
    savedSignature.value = signatureOf(routesFromAssignment())
    const unassigned = [
      ...availableHttpPorts.value.filter((port) => !(assignment.http[port] || []).length).map((port) => `HTTP :${port}`),
      ...availableHttpsPorts.value.filter((port) => !(assignment.https[port] || []).length).map((port) => `HTTPS :${port}`),
    ]
    if (notify) {
      notifySuccess(
        'Origin routing',
        unassigned.length
          ? `Saved. Left unassigned: ${unassigned.join(', ')}.`
          : 'Port → origin mapping saved.',
      )
    }
    emit('updated')
    emit('dirty-change', false)
    const ports = await fetchSitePorts(props.siteId)
    portsConfig.value = ports || { servers: [] }
    return { unassigned }
  } catch (err) {
    if (notify) {
      notifyError('Origin routing', err?.message || 'The routing rules could not be saved.')
    }
    throw err
  } finally {
    saving.value = false
  }
}

defineExpose({
  dirty,
  saving,
  save,
  reload,
})

watch(() => props.siteId, reload, { immediate: true })
watch([availableHttpPorts, availableHttpsPorts], () => {
  for (const port of availableHttpPorts.value) {
    if (!Array.isArray(assignment.http[port])) assignment.http[port] = []
  }
  for (const port of availableHttpsPorts.value) {
    if (!Array.isArray(assignment.https[port])) assignment.https[port] = []
  }
})
</script>

<style scoped>
.oroutes {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.oroutes__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.oroutes__title {
  margin: 0;
  color: var(--app-heading);
  font-size: 15px;
  font-weight: 600;
}

.oroutes__dirty {
  color: var(--dorian-warn, #e0a83f);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.oroutes__bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.oroutes__card {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background:
    linear-gradient(180deg, color-mix(in srgb, #ffffff 3%, transparent), transparent 42%),
    var(--app-surface-muted);
  padding: 14px;
}

.oroutes__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.oroutes__card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.oroutes__card-title h5 {
  margin: 0;
  color: var(--app-heading);
  font-size: 13px;
  font-weight: 600;
}

.oroutes__count {
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

.oroutes__add {
  display: grid;
  grid-template-columns: minmax(140px, 1.4fr) 88px 132px repeat(3, minmax(88px, 110px));
  gap: 10px;
  align-items: end;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px dashed var(--app-border-strong);
  border-radius: 12px;
  background: var(--app-surface-solid);
}

.oroutes__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.oroutes__field--wide {
  grid-column: span 1;
}

.oroutes__field > span,
.oroutes__field > .info-hint-heading {
  color: var(--app-text-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.oroutes__field input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-muted);
  color: var(--app-heading);
}

.oroutes__field input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--dorian-warn) 55%, var(--app-border));
}

.oroutes__seg {
  display: inline-flex;
  width: 100%;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--app-surface-muted);
}

.oroutes__seg button {
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

.oroutes__seg button.active {
  background: color-mix(in srgb, var(--dorian-warn) 18%, transparent);
  color: var(--dorian-warn);
}

.oroutes__add-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
}

.oroutes__empty {
  margin: 0;
  padding: 16px;
  border: 1px dashed var(--app-border);
  border-radius: 10px;
  color: var(--app-text-muted);
  font-size: 13px;
  text-align: center;
}

.oroutes__table-wrap {
  border: 1px solid var(--app-border);
  border-radius: 10px;
  overflow: auto;
  background: var(--app-surface-solid);
}

.oroutes__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
}

.oroutes__table th,
.oroutes__table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--app-border);
  font-size: 13px;
  color: var(--app-text);
  vertical-align: middle;
}

.oroutes__table th {
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.oroutes__table tbody tr:last-child td {
  border-bottom: 0;
}

.oroutes__table .num {
  font-variant-numeric: tabular-nums;
  color: var(--app-text-secondary);
}

.oroutes__table .mono {
  color: var(--app-heading);
  font-size: 13px;
}

.oroutes__usage {
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 600;
}

.oroutes__usage.hot {
  color: var(--dorian-warn);
}

.oroutes__actions-cell {
  text-align: right;
  white-space: nowrap;
}

.oroutes__remove {
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
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.oroutes__remove:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--dorian-danger, #e35d5d) 45%, var(--app-border));
  color: var(--dorian-danger, #e35d5d);
  background: color-mix(in srgb, var(--dorian-danger, #e35d5d) 8%, transparent);
}

.oroutes__remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dorian-success, #3dba7a);
}

.status-dot.bad {
  background: var(--dorian-danger, #e35d5d);
}

.oroutes__rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.oroutes__row {
  display: grid;
  grid-template-columns: 104px 28px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-solid);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.oroutes__row.routed {
  border-color: color-mix(in srgb, var(--dorian-warn) 28%, var(--app-border));
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--dorian-warn) 7%, transparent), transparent 42%),
    var(--app-surface-solid);
}

.oroutes__port {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.oroutes__badge {
  width: fit-content;
  padding: 2px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dorian-warn) 16%, transparent);
  color: var(--dorian-warn);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.oroutes__badge--https {
  background: color-mix(in srgb, var(--dorian-viper-400, #6ee7b7) 16%, transparent);
  color: var(--dorian-viper-400, #6ee7b7);
}

.oroutes__port strong {
  color: var(--app-heading);
  font-size: 18px;
  letter-spacing: -0.02em;
}

.oroutes__arrow {
  color: var(--app-text-muted);
  text-align: center;
  font-size: 16px;
}

.oroutes__targets {
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
  background: var(--app-surface-muted);
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

.chip__x {
  color: var(--app-text-muted);
  font-size: 14px;
  line-height: 1;
}

.chip:hover {
  border-color: color-mix(in srgb, var(--dorian-danger, #e35d5d) 55%, var(--app-border));
}

.chip:hover .chip__x {
  color: var(--dorian-danger, #e35d5d);
}

.oroutes__picker {
  position: relative;
  min-width: 168px;
}

.oroutes__pick-btn {
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
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.oroutes__pick-btn svg {
  width: 14px;
  height: 14px;
  flex: none;
  opacity: 0.7;
  transition: transform 0.15s ease;
}

.oroutes__pick-btn.open {
  border-style: solid;
  border-color: color-mix(in srgb, var(--dorian-warn) 55%, var(--app-border));
  color: var(--app-heading);
  background: var(--app-surface-solid);
}

.oroutes__pick-btn.open svg {
  transform: rotate(180deg);
  opacity: 1;
}

.oroutes__pick-btn:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--dorian-warn) 40%, var(--app-border));
  color: var(--app-heading);
  background: var(--app-surface-solid);
}

.oroutes__pick-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.oroutes__pick-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 30;
  width: min(340px, 78vw);
  max-height: 280px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--app-border-strong);
  border-radius: 14px;
  background: var(--app-surface-elevated, var(--app-surface-solid));
  box-shadow: 0 18px 40px -14px rgba(0, 0, 0, 0.55);
}

.oroutes__pick-option {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
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

.oroutes__pick-option:hover {
  background: color-mix(in srgb, var(--dorian-warn) 10%, var(--app-surface-muted));
}

.oroutes__pick-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.oroutes__pick-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--app-heading);
  font-size: 12.5px;
  font-weight: 650;
}

.oroutes__pick-copy small {
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 500;
}

.oroutes__pick-add {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dorian-warn) 16%, transparent);
  color: var(--dorian-warn);
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.oroutes__pick-empty {
  margin: 0;
  padding: 14px 10px;
  text-align: center;
  color: var(--app-text-muted);
  font-size: 12px;
}

.oroutes__unassigned {
  color: var(--app-text-muted);
  font-size: 12px;
  font-style: italic;
}

.mono {
  font-family: var(--font-mono, ui-monospace, monospace);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 980px) {
  .oroutes__add {
    grid-template-columns: minmax(0, 1fr) 88px 132px;
  }
}

@media (max-width: 860px) {
  .oroutes__add {
    grid-template-columns: 1fr 1fr;
  }
  .oroutes__row {
    grid-template-columns: 1fr;
  }
  .oroutes__arrow {
    display: none;
  }
}
</style>
