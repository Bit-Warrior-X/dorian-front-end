<template>
  <div class="dashboard-view ord-view orders-view">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <p class="ord-kicker">Billing</p>
        <h2>Orders</h2>
        <p>{{ isAdmin ? 'Customer orders, payments, setup, and pricing.' : 'Order protection, track payment and setup, and add to what you have.' }}</p>
      </div>
      <div class="dash-topbar__right">
        <router-link class="ord-cta-btn" :to="{ name: 'order-new' }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New order
        </router-link>
        <AppTopbarActions />
      </div>
    </header>

    <div class="dash-kpi-strip">
      <div class="dash-kpi">
        <span class="dash-kpi__label">Drafts</span>
        <span class="dash-kpi__value">{{ counts.draft }}</span>
      </div>
      <div class="dash-kpi dash-kpi--warn">
        <span class="dash-kpi__label">Awaiting payment</span>
        <span class="dash-kpi__value">{{ counts.awaiting_payment }}</span>
      </div>
      <div class="dash-kpi dash-kpi--info">
        <span class="dash-kpi__label">Awaiting setup</span>
        <span class="dash-kpi__value">{{ counts.awaiting_setup + counts.provisioning }}</span>
      </div>
      <div class="dash-kpi dash-kpi--ok">
        <span class="dash-kpi__label">Active</span>
        <span class="dash-kpi__value">{{ counts.active }}</span>
      </div>
    </div>

    <nav v-if="isAdmin" class="dash-tabbar" role="tablist">
      <button v-for="t in tabs" :key="t.id" type="button" role="tab" :class="['dash-tab', { active: tab === t.id }]" @click="setTab(t.id)">
        {{ t.label }}
        <span v-if="t.id === 'queue' && queue.length" class="dash-count-tag">{{ queue.length }}</span>
      </button>
    </nav>

    <!-- Orders list / queue -->
    <template v-if="tab === 'orders' || tab === 'queue'">
      <div class="dash-filterbar">
        <div class="dash-filter-field">
          <label for="ord-status">Status</label>
          <select id="ord-status" v-model="statusFilter" class="dash-select">
            <option value="">{{ tab === 'queue' ? 'Needs action' : 'All statuses' }}</option>
            <option v-for="(meta, key) in statusOptions" :key="key" :value="key">{{ meta.label }}</option>
          </select>
        </div>
        <div class="dash-filter-field ov-search">
          <label for="ord-search">Search</label>
          <input id="ord-search" v-model.trim="search" class="ord-input ord-input--sm" placeholder="Order #, invoice, domain, edge, customer" />
        </div>
        <button type="button" class="secondary-btn ov-refresh" :disabled="loading" @click="load">Refresh</button>
      </div>

      <section class="dash-panel">
        <div v-if="loading && !orders.length" class="ord-empty"><span class="dash-spinner" /></div>
        <div v-else-if="loadError" class="ord-error">{{ loadError }}</div>
        <div v-else-if="!visibleOrders.length" class="ord-empty">
          <h3>{{ tab === 'queue' ? 'Queue is clear' : 'No orders yet' }}</h3>
          <p v-if="tab === 'queue'">Orders waiting for payment confirmation or setup show up here.</p>
          <template v-else>
            <p>Start with what you want to protect: your server, your sites, or both.</p>
            <router-link class="ord-cta-btn" :to="{ name: 'order-new' }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create your first order
            </router-link>
          </template>
        </div>
        <div v-else class="ord-table-wrap">
          <table class="ord-table">
            <thead>
              <tr>
                <th>Order</th>
                <th v-if="isAdmin">Customer</th>
                <th>Purpose</th>
                <th>Contents</th>
                <th class="num">Total</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in visibleOrders" :key="order.id" class="is-link" @click="openOrder(order)">
                <td>
                  <span class="ord-strong">#{{ order.id }}</span>
                  <span v-if="order.invoiceNo" class="ord-sub">{{ order.invoiceNo }}</span>
                </td>
                <td v-if="isAdmin">
                  {{ order.userName || `User #${order.userId}` }}
                  <span v-if="order.userEmail" class="ord-sub">{{ order.userEmail }}</span>
                </td>
                <td>
                  {{ purposeTitle(order.purpose) }}
                  <span class="ord-sub">{{ periodLabel(order.period) }}</span>
                </td>
                <td class="muted">{{ orderSummary(order) }}</td>
                <td class="num">{{ formatMoney(order.total, order.currency) }}</td>
                <td><span class="ord-chip" :class="`tone-${orderStatusMeta(order).tone}`">{{ orderStatusMeta(order).label }}</span></td>
                <td class="muted">{{ formatDateTime(order.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <!-- Prices -->
    <section v-else-if="tab === 'prices'" class="dash-panel">
      <div class="dash-panel-head"><h3>Price list</h3></div>
      <p class="ord-muted ov-hint">Prices apply to new quotes. Submitted orders keep the price they were invoiced at.</p>
      <div class="ord-table-wrap">
        <table class="ord-table">
          <thead><tr><th>Item</th><th>Code</th><th class="num">Monthly</th><th class="num">Annual</th><th /></tr></thead>
          <tbody>
            <tr v-for="item in catalog" :key="item.code">
              <td>
                <span class="ord-strong">{{ item.title }}</span>
                <span class="ord-sub">{{ item.tagline }}{{ item.oneTime ? ' · one-time' : '' }}</span>
              </td>
              <td class="muted">{{ item.code }}</td>
              <td class="num"><input v-model.number="item.draftMonthly" type="number" min="0" step="0.01" class="ord-input ord-input--sm ov-price" /></td>
              <td class="num">
                <input v-if="!item.oneTime" v-model.number="item.draftAnnual" type="number" min="0" step="0.01" class="ord-input ord-input--sm ov-price" />
                <span v-else class="ord-muted">—</span>
              </td>
              <td class="num">
                <button type="button" class="secondary-btn" :disabled="!priceDirty(item) || item.saving" @click="savePrice(item)">Save</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Platform edges -->
    <section v-else-if="tab === 'platform'" class="dash-panel">
      <div class="dash-panel-head"><h3>Platform edges</h3></div>
      <p class="ord-muted ov-hint">
        Platform edges are Dorian-owned and serve “platform edge” sites for customers. Customers never see them in their edge list.
      </p>
      <div class="ord-table-wrap">
        <table class="ord-table">
          <thead><tr><th>Edge</th><th>IP</th><th>Ownership</th></tr></thead>
          <tbody>
            <tr v-for="server in serverKinds" :key="server.id">
              <td class="ord-strong">{{ server.name }}</td>
              <td class="muted">{{ server.ip }}</td>
              <td>
                <div class="ord-segment">
                  <button type="button" :class="{ active: server.kind !== 'platform' }" :disabled="server.saving" @click="setKind(server, 'customer')">Customer</button>
                  <button type="button" :class="{ active: server.kind === 'platform' }" :disabled="server.saving" @click="setKind(server, 'platform')">Platform</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { useAuth } from '@/stores/auth'
import { fetchOrderCatalog, fetchOrders, fetchServerKinds, setServerKind, updateCatalogPrice } from '@/api/orders'
import { notifyError, notifySuccess } from '@/utils/notify'
import {
  ORDER_STATUS,
  formatDateTime,
  formatMoney,
  orderStatusMeta,
  orderSummary,
  periodLabel,
  purposeTitle,
} from '@/utils/orders'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const isAdmin = computed(() => String(auth.state.user?.role || '').toLowerCase() === 'admin')

const tabs = [
  { id: 'queue', label: 'Operator queue' },
  { id: 'orders', label: 'All orders' },
  { id: 'prices', label: 'Prices' },
  { id: 'platform', label: 'Platform edges' },
]
const QUEUE_STATUSES = ['awaiting_payment', 'awaiting_setup', 'provisioning']

const tab = ref('orders')
const orders = ref([])
const loading = ref(false)
const loadError = ref('')
const statusFilter = ref('')
const search = ref('')
const catalog = ref([])
const serverKinds = ref([])

const setTab = (id) => {
  tab.value = id
  statusFilter.value = ''
  router.replace({ query: { ...route.query, tab: id } })
}

const statusOptions = computed(() => {
  if (tab.value !== 'queue') return ORDER_STATUS
  return Object.fromEntries(QUEUE_STATUSES.map((s) => [s, ORDER_STATUS[s]]))
})

const counts = computed(() => {
  const out = { draft: 0, awaiting_payment: 0, awaiting_setup: 0, provisioning: 0, active: 0, cancelled: 0 }
  for (const o of orders.value) out[o.status] = (out[o.status] || 0) + 1
  return out
})

const queue = computed(() => orders.value.filter((o) => QUEUE_STATUSES.includes(o.status)))

const matchesSearch = (order, needle) => {
  if (!needle) return true
  const haystack = [
    `#${order.id}`,
    order.invoiceNo,
    order.userName,
    order.userEmail,
    ...(order.details?.edges || []).flatMap((e) => [e.name, e.ip]),
    ...(order.details?.sites || []).map((s) => s.domain),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(needle)
}

const visibleOrders = computed(() => {
  const base = tab.value === 'queue' ? queue.value : orders.value
  const needle = search.value.toLowerCase()
  return base.filter((o) => (!statusFilter.value || o.status === statusFilter.value) && matchesSearch(o, needle))
})

const load = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchOrders()
    orders.value = Array.isArray(data) ? data : []
  } catch (e) {
    loadError.value = e?.message || 'Could not load orders.'
  } finally {
    loading.value = false
  }
}

const loadCatalog = async () => {
  try {
    const data = await fetchOrderCatalog()
    catalog.value = (Array.isArray(data) ? data : []).map((item) => ({
      ...item,
      draftMonthly: item.monthlyPrice,
      draftAnnual: item.annualPrice,
      saving: false,
    }))
  } catch (e) {
    notifyError('Could not load prices', e?.message || '')
  }
}

const priceDirty = (item) =>
  Number(item.draftMonthly) !== item.monthlyPrice || (!item.oneTime && Number(item.draftAnnual) !== item.annualPrice)

const savePrice = async (item) => {
  item.saving = true
  try {
    const annual = item.oneTime ? Number(item.draftMonthly) : Number(item.draftAnnual)
    await updateCatalogPrice(item.code, Number(item.draftMonthly), annual)
    item.monthlyPrice = Number(item.draftMonthly)
    item.annualPrice = annual
    notifySuccess('Price updated', item.title)
  } catch (e) {
    notifyError('Could not update price', e?.message || '')
  } finally {
    item.saving = false
  }
}

const loadServerKinds = async () => {
  try {
    const data = await fetchServerKinds()
    serverKinds.value = (Array.isArray(data) ? data : []).map((s) => ({ ...s, saving: false }))
  } catch (e) {
    notifyError('Could not load edges', e?.message || '')
  }
}

const setKind = async (server, kind) => {
  if (server.kind === kind) return
  server.saving = true
  try {
    await setServerKind(server.id, kind)
    server.kind = kind
    notifySuccess('Edge updated', `${server.name} is now a ${kind} edge.`)
  } catch (e) {
    notifyError('Could not update edge', e?.message || '')
  } finally {
    server.saving = false
  }
}

const openOrder = (order) => {
  if (order.status === 'draft') router.push({ name: 'order-edit', params: { id: order.id } })
  else router.push({ name: 'order-detail', params: { id: order.id } })
}

watch(tab, (value) => {
  if (value === 'prices' && !catalog.value.length) loadCatalog()
  if (value === 'platform' && !serverKinds.value.length) loadServerKinds()
})

onMounted(async () => {
  const requested = String(route.query.tab || '')
  if (isAdmin.value) {
    tab.value = tabs.some((t) => t.id === requested) ? requested : 'queue'
  }
  await load()
})
</script>

<style scoped>
.dash-topbar__right a.primary-btn {
  text-decoration: none;
}

.ov-search {
  flex: 1 1 260px;
}

.ov-refresh {
  margin-left: auto;
}

.ov-hint {
  margin: -4px 0 0;
  font-size: 12.5px;
}

.ov-price {
  width: 110px;
  text-align: right;
}

.ord-empty a.primary-btn {
  text-decoration: none;
  margin-top: 6px;
}
</style>
