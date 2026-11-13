<template>
  <div class="dashboard-view ord-view order-detail">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <p class="ord-kicker">
          <router-link :to="{ name: 'orders' }" class="od-back">← Orders</router-link>
        </p>
        <h2 class="od-title">
          Order #{{ orderId }}
          <span v-if="order" class="ord-chip" :class="`tone-${statusMeta.tone}`">{{ statusMeta.label }}</span>
        </h2>
        <p v-if="order">
          {{ purposeTitle(order.purpose) }} · {{ periodLabel(order.period) }}
          <template v-if="order.invoiceNo"> · Invoice <strong>{{ order.invoiceNo }}</strong></template>
        </p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <div v-if="loading && !order" class="dash-panel ord-empty"><span class="dash-spinner" /></div>
    <div v-else-if="loadError" class="ord-error">{{ loadError }}</div>

    <template v-else-if="order">
      <div class="od-actionbar dash-panel">
        <div class="od-actionbar__msg">
          <strong>{{ nextStepTitle }}</strong>
          <span>{{ nextStepHint }}</span>
        </div>
        <div class="ord-actions ord-actions--end">
          <template v-if="order.status === 'draft'">
            <router-link class="secondary-btn" :to="{ name: 'order-edit', params: { id: order.id } }">Edit</router-link>
            <button type="button" class="primary-btn" :disabled="busy" @click="doSubmit">Submit order</button>
          </template>
          <button v-if="canCancel" type="button" class="ghost-btn" :disabled="busy" @click="doCancel">Cancel order</button>
          <template v-if="isAdmin">
            <button v-if="order.status === 'awaiting_payment'" type="button" class="primary-btn" @click="openPayment">Record payment</button>
            <button v-if="canApprove" type="button" class="primary-btn" @click="openApprove">
              {{ order.error ? 'Retry setup' : 'Approve & set up' }}
            </button>
            <button v-if="canReject" type="button" class="danger-btn" @click="rejectOpen = true">Reject</button>
          </template>
          <router-link
            v-if="order.status === 'active' && order.kind !== 'renewal'"
            class="secondary-btn"
            :to="{ name: 'order-new', query: addonQuery }"
          >Add-on order</router-link>
        </div>
      </div>

      <div v-if="order.error" class="ord-error" role="alert">
        <strong>{{ order.status === 'cancelled' ? 'Reason' : 'Setup stopped' }}:</strong> {{ order.error }}
      </div>

      <div class="od-layout">
        <div class="od-main">
          <section class="dash-panel">
            <div class="dash-panel-head"><h3>Charges</h3></div>
            <div class="ord-receipt">
              <div v-for="item in order.items" :key="item.code" class="ord-receipt__row">
                <span>
                  {{ item.label }} × {{ item.quantity }}
                  <span class="ord-sub">
                    {{ formatMoney(item.unitPrice, order.currency) }} each<template v-if="item.note"> · {{ item.note }}</template>
                  </span>
                </span>
                <span>{{ formatMoney(item.lineTotal, order.currency) }}</span>
              </div>
              <p v-if="!order.items?.length" class="ord-muted">Nothing priced yet.</p>
              <div class="ord-receipt__total">
                <span>Total</span>
                <strong>{{ formatMoney(order.total, order.currency) }}</strong>
              </div>
              <p v-if="order.details?.coTermEnd" class="ord-muted od-foot">
                Prorated to end on {{ formatDate(order.details.coTermEnd) }} with your existing licenses.
              </p>
            </div>
          </section>

          <section v-if="order.details?.edges?.length" class="dash-panel">
            <div class="dash-panel-head"><h3>Edges <span class="dash-count-tag">{{ order.details.edges.length }}</span></h3></div>
            <div class="ord-table-wrap">
              <table class="ord-table">
                <thead><tr><th>Name</th><th>IP</th><th>SSH</th><th>Layers</th><th>Setup</th></tr></thead>
                <tbody>
                  <tr v-for="(edge, index) in order.details.edges" :key="index">
                    <td class="ord-strong">{{ edge.name }}</td>
                    <td class="mono">{{ edge.ip }}</td>
                    <td class="muted">{{ edge.sshUser || 'root' }}@:{{ edge.sshPort || 22 }} · {{ edge.sshAuthType === 'key' ? 'key' : 'password' }}</td>
                    <td>{{ [edge.l4 && 'L4', edge.l7 && 'L7'].filter(Boolean).join(' + ') }}</td>
                    <td>
                      <router-link v-if="edge.serverId" :to="{ name: 'server-settings', query: { server: String(edge.serverId) } }" class="ord-chip tone-ok">Edge #{{ edge.serverId }}</router-link>
                      <span v-else-if="edge.error" class="ord-chip tone-danger" :title="edge.error">Failed</span>
                      <span v-else class="ord-chip tone-muted">Pending</span>
                      <span v-if="edge.error && !edge.serverId" class="ord-sub od-err">{{ edge.error }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-if="order.details?.upgradeServerIds?.length" class="dash-panel">
            <div class="dash-panel-head"><h3>L4 upgrades</h3></div>
            <div class="od-upgrades">
              <span v-for="id in order.details.upgradeServerIds" :key="id" class="ord-chip" :class="upgradeDone(id) ? 'tone-ok' : 'tone-muted'">
                Edge #{{ id }} · {{ upgradeDone(id) ? 'L4 added' : 'pending' }}
              </span>
            </div>
          </section>

          <section v-if="order.details?.sites?.length" class="dash-panel">
            <div class="dash-panel-head"><h3>Sites <span class="dash-count-tag">{{ order.details.sites.length }}</span></h3></div>
            <div class="ord-table-wrap">
              <table class="ord-table">
                <thead><tr><th>Domain</th><th>Origins</th><th>Served by</th><th>Setup</th></tr></thead>
                <tbody>
                  <tr v-for="(site, index) in order.details.sites" :key="index">
                    <td class="ord-strong">{{ site.domain }}</td>
                    <td class="mono">
                      <div v-for="origin in siteOrigins(site)" :key="`${origin.protocol}${origin.address}`">{{ origin.protocol }}://{{ origin.address }}</div>
                    </td>
                    <td class="muted">{{ site.placement === 'platform' ? 'Dorian platform edge' : site.serverIds?.length ? `Edge #${site.serverIds.join(', #')}` : 'Edge(s) in this order' }}</td>
                    <td>
                      <router-link v-if="site.siteId" :to="{ name: 'site-settings', query: { siteId: String(site.siteId) } }" class="ord-chip tone-ok">Site #{{ site.siteId }}</router-link>
                      <span v-else-if="site.error" class="ord-chip tone-danger">Failed</span>
                      <span v-else class="ord-chip tone-muted">Pending</span>
                      <span v-if="site.error" class="ord-sub" :class="{ 'od-err': !site.siteId }">{{ site.error }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-if="order.details?.renewLicenseIds?.length" class="dash-panel">
            <div class="dash-panel-head"><h3>Licenses renewed</h3></div>
            <div class="od-upgrades">
              <span v-for="id in order.details.renewLicenseIds" :key="id" class="ord-chip tone-info">License #{{ id }}</span>
            </div>
          </section>
        </div>

        <aside class="od-side">
          <section v-if="order.status === 'awaiting_payment'" class="dash-panel od-pay">
            <div class="dash-panel-head"><h3>How to pay</h3></div>
            <p>Transfer <strong>{{ formatMoney(order.total - (order.paidTotal || 0), order.currency) }}</strong> by bank transfer and put the invoice number in the payment reference:</p>
            <div class="od-invoice">{{ order.invoiceNo }}</div>
            <p class="ord-muted">We confirm payments manually, usually within one business day. Setup starts after confirmation.</p>
          </section>

          <section class="dash-panel">
            <div class="dash-panel-head"><h3>Details</h3></div>
            <dl class="ord-dl">
              <template v-if="isAdmin">
                <dt>Customer</dt><dd>{{ order.userName || `User #${order.userId}` }}<span v-if="order.userEmail" class="ord-sub">{{ order.userEmail }}</span></dd>
              </template>
              <dt>Kind</dt><dd class="od-cap">{{ order.kind }}</dd>
              <template v-if="order.parentOrderId">
                <dt>Adds to</dt>
                <dd><router-link :to="{ name: 'order-detail', params: { id: order.parentOrderId } }">Order #{{ order.parentOrderId }}</router-link></dd>
              </template>
              <dt>Paid</dt><dd>{{ formatMoney(order.paidTotal, order.currency) }} of {{ formatMoney(order.total, order.currency) }}</dd>
              <template v-if="order.note">
                <dt>Note</dt><dd class="od-note">{{ order.note }}</dd>
              </template>
            </dl>
          </section>

          <section class="dash-panel">
            <div class="dash-panel-head"><h3>Timeline</h3></div>
            <ol class="od-timeline">
              <li v-for="event in timeline" :key="event.label" :class="{ done: event.at, current: event.current }">
                <span class="od-timeline__dot" />
                <div>
                  <strong>{{ event.label }}</strong>
                  <span class="ord-sub">{{ event.at ? formatDateTime(event.at) : event.current ? 'In progress' : '—' }}</span>
                </div>
              </li>
            </ol>
          </section>

          <section v-if="order.payments?.length" class="dash-panel">
            <div class="dash-panel-head"><h3>Payments</h3></div>
            <div class="od-payments">
              <div v-for="payment in order.payments" :key="payment.id" class="od-payment">
                <div>
                  <strong>{{ formatMoney(payment.amount, order.currency) }}</strong>
                  <span class="ord-sub">{{ formatDate(payment.paidOn) }}<template v-if="payment.reference"> · {{ payment.reference }}</template></span>
                </div>
                <span v-if="payment.recordedByName" class="ord-muted od-payment__by">by {{ payment.recordedByName }}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </template>

    <!-- Record payment -->
    <div v-if="paymentOpen" class="ord-dialog-backdrop" @click.self="paymentOpen = false">
      <form class="ord-dialog" @submit.prevent="doRecordPayment">
        <h3>Record payment</h3>
        <p>Once payments cover {{ formatMoney(order.total, order.currency) }}, the order moves to setup{{ order.kind === 'renewal' ? ' and the licenses are extended' : '' }}.</p>
        <div class="ord-grid">
          <label class="ord-field"><span>Amount ({{ order.currency }})</span><input v-model.number="payment.amount" type="number" min="0.01" step="0.01" class="ord-input" required /></label>
          <label class="ord-field"><span>Paid on</span><input v-model="payment.paidOn" type="date" class="ord-input" /></label>
        </div>
        <label class="ord-field"><span>Bank reference</span><input v-model.trim="payment.reference" class="ord-input" :placeholder="order.invoiceNo" /></label>
        <div class="ord-actions ord-actions--end">
          <button type="button" class="ghost-btn" @click="paymentOpen = false">Cancel</button>
          <button type="submit" class="primary-btn" :disabled="busy">Record</button>
        </div>
      </form>
    </div>

    <!-- Approve -->
    <div v-if="approveOpen" class="ord-dialog-backdrop" @click.self="approveOpen = false">
      <form class="ord-dialog" @submit.prevent="doApprove">
        <h3>{{ order.error ? 'Retry setup' : 'Approve & set up' }}</h3>
        <p>Edges are installed over SSH with the version you choose, then sites are created and licenses issued. Steps that already finished are skipped.</p>
        <div v-for="row in approveEdges" :key="row.index" class="ord-field">
          <span>{{ row.name }} · {{ row.ip }}</span>
          <select v-model="row.versionUuid" class="ord-select" required>
            <option value="" disabled>Choose Dorian version</option>
            <option v-for="v in versions" :key="v.uuid" :value="v.uuid">{{ v.version }}{{ v.os ? ` · ${v.os}` : '' }}</option>
          </select>
        </div>
        <div v-if="needsPlatform" class="ord-field">
          <span>Platform edges for the sites</span>
          <p v-if="!platformEdges.length" class="ord-note ord-note--warn">
            No edges are marked as platform yet. Mark them under Orders → Platform edges first.
          </p>
          <label v-for="edge in platformEdges" :key="edge.id" class="ord-check">
            <input v-model="approvePlatformIds" type="checkbox" :value="edge.id" />
            {{ edge.name }} <span class="ord-muted">{{ edge.ip }}</span>
          </label>
        </div>
        <div class="ord-actions ord-actions--end">
          <button type="button" class="ghost-btn" @click="approveOpen = false">Cancel</button>
          <button type="submit" class="primary-btn" :disabled="busy || (needsPlatform && !approvePlatformIds.length)">Start setup</button>
        </div>
      </form>
    </div>

    <!-- Reject -->
    <div v-if="rejectOpen" class="ord-dialog-backdrop" @click.self="rejectOpen = false">
      <form class="ord-dialog" @submit.prevent="doReject">
        <h3>Reject order #{{ order.id }}</h3>
        <p>The order is cancelled and the customer is notified with your reason.</p>
        <label class="ord-field"><span>Reason</span><textarea v-model.trim="rejectNote" class="ord-textarea od-reason" required /></label>
        <div class="ord-actions ord-actions--end">
          <button type="button" class="ghost-btn" @click="rejectOpen = false">Back</button>
          <button type="submit" class="danger-btn" :disabled="busy || !rejectNote">Reject order</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { useAuth } from '@/stores/auth'
import { fetchDeployVersions } from '@/api/servers'
import {
  approveOrder,
  cancelOrder,
  fetchOrder,
  fetchServerKinds,
  recordOrderPayment,
  rejectOrder,
  submitOrder,
} from '@/api/orders'
import { notifyError, notifySuccess } from '@/utils/notify'
import {
  formatDate,
  formatDateTime,
  formatMoney,
  orderStatusMeta,
  periodLabel,
  purposeTitle,
} from '@/utils/orders'

const route = useRoute()
const auth = useAuth()
const isAdmin = computed(() => String(auth.state.user?.role || '').toLowerCase() === 'admin')

const orderId = computed(() => Number(route.params.id))
const order = ref(null)
const loading = ref(true)
const loadError = ref('')
const busy = ref(false)

const statusMeta = computed(() => orderStatusMeta(order.value))
const isRunning = computed(() => order.value?.status === 'provisioning' && !order.value?.error)
const canCancel = computed(() => {
  const o = order.value
  if (!o || !['draft', 'awaiting_payment'].includes(o.status)) return false
  return isAdmin.value || !(o.paidTotal > 0)
})
const canApprove = computed(() => {
  const o = order.value
  return Boolean(o) && (o.status === 'awaiting_setup' || (o.status === 'provisioning' && o.error))
})
const canReject = computed(() => {
  const o = order.value
  return Boolean(o) && (['awaiting_payment', 'awaiting_setup'].includes(o.status) || (o.status === 'provisioning' && o.error))
})
const addonQuery = computed(() => {
  const q = { addon: '1', parent: String(order.value.id), period: order.value.period }
  if (isAdmin.value && order.value.userId !== auth.state.user?.id) q.customer = String(order.value.userId)
  return q
})

const siteOrigins = (site) =>
  site.origins?.length ? site.origins : site.origin ? [{ address: site.origin, protocol: site.originProtocol || 'http' }] : []

const upgradeDone = (id) => (order.value?.details?.upgradesDone || []).includes(id)

const nextStepTitle = computed(() => {
  const o = order.value
  switch (o?.status) {
    case 'draft':
      return 'Draft — not submitted'
    case 'awaiting_payment':
      return isAdmin.value ? 'Waiting for the customer’s payment' : 'Waiting for your payment'
    case 'awaiting_setup':
      return isAdmin.value ? 'Paid — ready for setup' : 'Payment received'
    case 'provisioning':
      return o.error ? 'Setup needs attention' : 'Setting up'
    case 'active':
      return 'Active'
    case 'cancelled':
      return 'Cancelled'
    default:
      return ''
  }
})

const nextStepHint = computed(() => {
  const o = order.value
  switch (o?.status) {
    case 'draft':
      return 'Edit it any time. Submit to lock the price and get an invoice.'
    case 'awaiting_payment':
      return isAdmin.value ? 'Record the bank transfer when it arrives.' : `Pay invoice ${o.invoiceNo}; we confirm transfers manually.`
    case 'awaiting_setup':
      return isAdmin.value ? 'Choose versions and start setup.' : 'An operator will set up your protection shortly.'
    case 'provisioning':
      return o.error ? (isAdmin.value ? 'Fix the cause and retry; finished steps are kept.' : 'Our team is looking into it.') : 'Installing edges and creating sites. This page refreshes on its own.'
    case 'active':
      return 'Licenses are running. Use an add-on order to extend this setup.'
    case 'cancelled':
      return 'No further action.'
    default:
      return ''
  }
})

const timeline = computed(() => {
  const o = order.value
  if (!o) return []
  const events = [
    { label: 'Created', at: o.createdAt },
    { label: 'Submitted', at: o.submittedAt },
    { label: 'Paid', at: o.paidAt },
  ]
  if (o.kind !== 'renewal') {
    events.push({ label: 'Approved', at: o.approvedAt })
    events.push({ label: 'Active', at: o.activatedAt, current: isRunning.value })
  } else {
    events.push({ label: 'Licenses extended', at: o.activatedAt })
  }
  if (o.cancelledAt) events.push({ label: 'Cancelled', at: o.cancelledAt })
  return events
})

let pollTimer = null
const load = async ({ quiet = false } = {}) => {
  if (!quiet) loading.value = true
  try {
    order.value = await fetchOrder(orderId.value)
    loadError.value = ''
  } catch (e) {
    if (!quiet) loadError.value = e?.message || 'Could not load the order.'
  } finally {
    loading.value = false
  }
}

watch(isRunning, (running) => {
  clearInterval(pollTimer)
  pollTimer = running ? setInterval(() => load({ quiet: true }), 4000) : null
})

watch(orderId, () => load())

const run = async (fn, successTitle, successBody) => {
  busy.value = true
  try {
    order.value = await fn()
    if (successTitle) notifySuccess(successTitle, successBody)
    return true
  } catch (e) {
    notifyError('Action failed', e?.message || 'Request failed')
    return false
  } finally {
    busy.value = false
  }
}

const doSubmit = () => run(() => submitOrder(orderId.value), 'Order submitted', 'An invoice was issued.')
const doCancel = async () => {
  if (!window.confirm(`Cancel order #${orderId.value}?`)) return
  await run(() => cancelOrder(orderId.value), 'Order cancelled')
}

const paymentOpen = ref(false)
const payment = reactive({ amount: 0, reference: '', paidOn: '' })
const openPayment = () => {
  payment.amount = Math.max(0, Math.round(((order.value.total || 0) - (order.value.paidTotal || 0)) * 100) / 100)
  payment.reference = ''
  payment.paidOn = new Date().toISOString().slice(0, 10)
  paymentOpen.value = true
}
const doRecordPayment = async () => {
  const ok = await run(
    () => recordOrderPayment(orderId.value, { amount: Number(payment.amount), reference: payment.reference, paidOn: payment.paidOn }),
    'Payment recorded',
  )
  if (ok) paymentOpen.value = false
}

const approveOpen = ref(false)
const versions = ref([])
const platformEdges = ref([])
const approveEdges = ref([])
const approvePlatformIds = ref([])
const needsPlatform = computed(() =>
  (order.value?.details?.sites || []).some((s) => s.placement === 'platform' && !s.siteId),
)
const openApprove = async () => {
  approveEdges.value = (order.value.details?.edges || [])
    .map((edge, index) => ({ index, name: edge.name, ip: edge.ip, versionUuid: edge.versionUuid || '', serverId: edge.serverId }))
    .filter((row) => !row.serverId)
  approvePlatformIds.value = [...(order.value.details?.platformServerIds || [])]
  approveOpen.value = true
  try {
    const [deploy, kinds] = await Promise.all([
      approveEdges.value.length ? fetchDeployVersions() : Promise.resolve({ versions: [] }),
      needsPlatform.value ? fetchServerKinds() : Promise.resolve([]),
    ])
    versions.value = deploy?.versions || []
    platformEdges.value = (Array.isArray(kinds) ? kinds : []).filter((s) => s.kind === 'platform')
    if (versions.value.length) {
      for (const row of approveEdges.value) if (!row.versionUuid) row.versionUuid = versions.value[0].uuid
    }
    if (!approvePlatformIds.value.length) approvePlatformIds.value = platformEdges.value.map((s) => s.id)
  } catch (e) {
    notifyError('Could not load setup options', e?.message || '')
  }
}
const doApprove = async () => {
  const ok = await run(
    () =>
      approveOrder(orderId.value, {
        edges: approveEdges.value.map((row) => ({ index: row.index, versionUuid: row.versionUuid })),
        platformServerIds: approvePlatformIds.value,
      }),
    'Setup started',
    'Progress shows on this page.',
  )
  if (ok) approveOpen.value = false
}

const rejectOpen = ref(false)
const rejectNote = ref('')
const doReject = async () => {
  const ok = await run(() => rejectOrder(orderId.value, rejectNote.value), 'Order rejected')
  if (ok) {
    rejectOpen.value = false
    rejectNote.value = ''
  }
}

onMounted(() => load())
onBeforeUnmount(() => clearInterval(pollTimer))
</script>

<style scoped>
.od-back {
  color: inherit;
  text-decoration: none;
}

.od-back:hover {
  color: var(--app-heading);
}

.od-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.od-actionbar {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.od-actionbar__msg {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.od-actionbar__msg strong {
  color: var(--app-heading);
  font-size: 14px;
}

.od-actionbar__msg span {
  font-size: 12.5px;
  color: var(--app-text-muted);
}

.od-actionbar a {
  text-decoration: none;
}

.od-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 14px;
  align-items: start;
}

.od-main,
.od-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.od-foot {
  margin: 8px 0 0;
  font-size: 11.5px;
}

.mono {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 12px;
}

.od-err {
  color: var(--dorian-danger, #e15241);
  max-width: 380px;
  white-space: normal;
}

.ord-table a.ord-chip {
  text-decoration: none;
}

.od-upgrades {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.od-pay p {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
}

.od-invoice {
  padding: 10px 12px;
  border-radius: 8px;
  text-align: center;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--dorian-viper-400, var(--app-accent));
  background: var(--app-accent-soft);
  user-select: all;
}

.od-cap {
  text-transform: capitalize;
}

.od-note {
  white-space: pre-wrap;
}

.od-timeline {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
}

.od-timeline li {
  position: relative;
  display: flex;
  gap: 12px;
  padding-bottom: 14px;
  font-size: 12.5px;
  color: var(--app-text-muted);
}

.od-timeline li:last-child {
  padding-bottom: 0;
}

.od-timeline li:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 14px;
  bottom: 0;
  width: 1px;
  background: var(--app-border-strong);
}

.od-timeline__dot {
  flex: none;
  width: 11px;
  height: 11px;
  margin-top: 3px;
  border-radius: 50%;
  border: 1.5px solid var(--app-border-strong);
  background: var(--app-surface);
}

.od-timeline li.done {
  color: var(--app-text);
}

.od-timeline li.done .od-timeline__dot {
  background: var(--dorian-viper-400, var(--app-accent));
  border-color: transparent;
}

.od-timeline li.current .od-timeline__dot {
  border-color: var(--dorian-viper-400, var(--app-accent));
  animation: od-pulse 1.4s ease-in-out infinite;
}

@keyframes od-pulse {
  50% {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 25%, transparent);
  }
}

.od-payments {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.od-payment {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
}

.od-payment__by {
  font-size: 11px;
}

.od-reason {
  font-family: inherit;
  font-size: 13px;
}

@media (max-width: 1280px) {
  .od-layout {
    grid-template-columns: 1fr;
  }
}
</style>
