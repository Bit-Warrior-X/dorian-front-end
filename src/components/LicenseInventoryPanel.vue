<template>
  <div class="lic">
    <div v-if="licenses.length" class="lic-summary">
      <div class="lic-stat">
        <span class="lic-stat__label">Active licenses</span>
        <strong class="lic-stat__value">{{ counts.active + counts.past_due }}</strong>
        <span class="lic-stat__hint">{{ scopeCounts.server }} edge{{ scopeCounts.server === 1 ? '' : 's' }} · {{ scopeCounts.site }} site{{ scopeCounts.site === 1 ? '' : 's' }}</span>
      </div>
      <div class="lic-stat">
        <span class="lic-stat__label">Next renewal</span>
        <strong class="lic-stat__value">{{ nextRenewal ? formatDate(nextRenewal.date) : '—' }}</strong>
        <span class="lic-stat__hint" :title="nextRenewal ? `${nextRenewal.count} license(s) · ${money(nextRenewal.amount)} · ${relDays(nextRenewal.date)}` : ''">
          <template v-if="nextRenewal">
            {{ nextRenewal.count }} license{{ nextRenewal.count === 1 ? '' : 's' }}
            <template v-if="nextRenewal.amount"> · {{ money(nextRenewal.amount) }}</template>
            · {{ relDays(nextRenewal.date) }}
          </template>
          <template v-else>nothing renews</template>
        </span>
      </div>
      <div class="lic-stat">
        <span class="lic-stat__label">Recurring cost</span>
        <strong class="lic-stat__value">{{ money(yearlyCost) }}<small> / year</small></strong>
        <span class="lic-stat__hint">at current catalog prices</span>
      </div>
      <button
        type="button"
        :class="['lic-stat lic-stat--attention', { 'is-bad': attentionCount > 0, active: statusFilter === 'attention' }]"
        @click="statusFilter = statusFilter === 'attention' ? '' : 'attention'"
      >
        <span class="lic-stat__label">Needs attention</span>
        <strong class="lic-stat__value">{{ attentionCount }}</strong>
        <span class="lic-stat__hint">{{ attentionCount ? 'ending soon, past due or expired' : 'all licenses are in good standing' }}</span>
      </button>
    </div>

    <section class="dash-panel lic-panel" aria-label="Licenses">
      <div v-if="licenses.length" class="lic-toolbar">
        <div class="lic-chips" role="tablist" aria-label="Status">
          <button
            v-for="chip in statusChips"
            :key="chip.id"
            type="button"
            role="tab"
            :aria-selected="statusFilter === chip.id"
            :class="['lic-chip', `tone-${chip.tone}`, { active: statusFilter === chip.id }]"
            @click="statusFilter = chip.id"
          >
            {{ chip.label }}
            <span>{{ chip.count }}</span>
          </button>
        </div>
        <div class="lic-toolbar__right">
          <div class="ord-segment">
            <button type="button" :class="{ active: scopeFilter === '' }" @click="scopeFilter = ''">All</button>
            <button type="button" :class="{ active: scopeFilter === 'server' }" @click="scopeFilter = 'server'">Edges</button>
            <button type="button" :class="{ active: scopeFilter === 'site' }" @click="scopeFilter = 'site'">Sites</button>
          </div>
          <select v-if="isAdmin && customerOptions.length > 1" v-model.number="customerFilter" class="ord-select ord-input--sm lic-customer" aria-label="Customer">
            <option :value="0">All customers</option>
            <option v-for="c in customerOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <input v-model.trim="search" class="ord-input ord-input--sm lic-search" type="search" :placeholder="isAdmin ? 'Search name or customer' : 'Search edge or site'" />
        </div>
      </div>

      <div v-if="loading" class="ord-empty"><span class="dash-spinner" /></div>
      <div v-else-if="loadError" class="ord-error">{{ loadError }}</div>
      <div v-else-if="!licenses.length" class="lic-empty">
        <span class="lic-empty__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" /></svg>
        </span>
        <h3>No licenses yet</h3>
        <p>Licenses are issued when an order is paid and set up.</p>
        <router-link class="primary-btn" :to="{ name: 'order-new' }">Order protection</router-link>
      </div>
      <div v-else-if="!visible.length" class="lic-empty lic-empty--small">
        <p>No licenses match these filters.</p>
        <button type="button" class="ghost-btn" @click="resetFilters">Clear filters</button>
      </div>
      <div v-else class="ord-table-wrap">
        <table class="ord-table lic-table">
          <thead>
            <tr>
              <th class="lic-check-col">
                <input
                  type="checkbox"
                  :checked="allVisibleSelected"
                  :indeterminate.prop="someVisibleSelected"
                  :disabled="!selectableVisible.length"
                  aria-label="Select all renewable licenses"
                  @change="toggleAll"
                />
              </th>
              <th><button type="button" class="lic-sort" @click="sortBy('name')">Protected <span>{{ sortMark('name') }}</span></button></th>
              <th v-if="isAdmin">Customer</th>
              <th>Status</th>
              <th><button type="button" class="lic-sort" @click="sortBy('end')">Current period <span>{{ sortMark('end') }}</span></button></th>
              <th class="num"><button type="button" class="lic-sort" @click="sortBy('price')">Renews at <span>{{ sortMark('price') }}</span></button></th>
              <th class="lic-actions-col"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="license in visible" :key="license.id" :class="{ 'is-selected': selected.includes(license.id) }">
              <td class="lic-check-col">
                <input
                  v-model="selected"
                  type="checkbox"
                  :value="license.id"
                  :disabled="!canSelect(license)"
                  :title="selectTitle(license)"
                  :aria-label="`Select ${license.targetName}`"
                />
              </td>
              <td>
                <div class="lic-target">
                  <span :class="['lic-target__icon', license.scope === 'site' ? 'is-site' : 'is-edge']" aria-hidden="true">
                    <svg v-if="license.scope === 'site'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6" /><path d="M2 8h12M8 2a9 9 0 0 1 0 12M8 2a9 9 0 0 0 0 12" /></svg>
                    <svg v-else viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="2.5" width="12" height="4.5" rx="1.2" /><rect x="2" y="9" width="12" height="4.5" rx="1.2" /><path d="M4.5 4.75h.01M4.5 11.25h.01" /></svg>
                  </span>
                  <span class="lic-target__text">
                    <router-link :to="targetRoute(license)" class="lic-target__name">{{ targetLabel(license) }}</router-link>
                    <span class="ord-sub">{{ LICENSE_KIND_LABEL[license.kind] || license.kind }} · {{ periodLabel(license.period) }}</span>
                  </span>
                </div>
              </td>
              <td v-if="isAdmin" class="lic-customer-cell">{{ license.userName || `User #${license.userId}` }}</td>
              <td>
                <span class="ord-chip" :class="`tone-${statusMeta(license).tone}`">{{ statusMeta(license).label }}</span>
                <router-link
                  v-if="license.renewalOrderId"
                  class="ord-sub lic-renewal-link"
                  :to="{ name: 'order-detail', params: { id: license.renewalOrderId } }"
                >Renewal #{{ license.renewalOrderId }} awaiting payment</router-link>
                <span v-else-if="license.cancelAtPeriodEnd && license.status !== 'cancelled'" class="ord-sub lic-tone-warn">Won't renew</span>
              </td>
              <td>
                <div class="lic-period">
                  <span class="lic-period__dates">
                    {{ formatDate(license.currentPeriodEnd) }}
                    <span :class="['lic-period__rel', endsTone(license)]">{{ relDays(license.currentPeriodEnd) }}</span>
                  </span>
                  <span class="lic-period__bar" aria-hidden="true">
                    <span :class="endsTone(license)" :style="{ width: `${periodProgress(license)}%` }" />
                  </span>
                </div>
              </td>
              <td class="num">
                <template v-if="renewalPrice(license)">
                  <span class="lic-price">{{ money(renewalPrice(license)) }}</span>
                  <span class="ord-sub">{{ license.period === 'month' ? 'per month' : 'per year' }}</span>
                </template>
                <span v-else class="ord-muted">—</span>
              </td>
              <td class="lic-actions-col">
                <div class="lic-actions">
                  <button
                    v-if="canRenew(license)"
                    type="button"
                    class="secondary-btn lic-renew"
                    :disabled="renewing"
                    @click="renew([license.id], license.period)"
                  >Renew</button>
                  <router-link
                    v-else-if="license.renewalOrderId"
                    class="primary-btn lic-renew"
                    :to="{ name: 'order-detail', params: { id: license.renewalOrderId } }"
                  >Pay</router-link>
                  <div class="lic-menu" :class="{ open: menuFor === license.id }">
                    <button
                      type="button"
                      class="icon-btn lic-menu__btn"
                      :aria-expanded="menuFor === license.id"
                      aria-haspopup="menu"
                      :aria-label="`More actions for ${targetLabel(license)}`"
                      @click.stop="toggleMenu(license.id, $event)"
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="3.5" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="12.5" cy="8" r="1.3" /></svg>
                    </button>
                    <div v-if="menuFor === license.id" class="lic-menu__pop" role="menu" :style="menuStyle" @click.stop>
                      <router-link role="menuitem" :to="targetRoute(license)">Open {{ license.scope === 'site' ? 'site' : 'edge' }} settings</router-link>
                      <router-link
                        v-if="license.kind === 'L7' && license.scope === 'server' && license.status === 'active'"
                        role="menuitem"
                        :to="addL4Route(license)"
                      >Add L4 protection</router-link>
                      <router-link v-if="license.orderId" role="menuitem" :to="{ name: 'order-detail', params: { id: license.orderId } }">
                        View original order #{{ license.orderId }}
                      </router-link>
                      <span v-else class="lic-menu__note">Migrated from the tier model</span>
                      <hr v-if="license.status !== 'cancelled'" />
                      <button v-if="license.cancelAtPeriodEnd && license.status !== 'cancelled'" type="button" role="menuitem" :disabled="busyId === license.id" @click="resume(license)">
                        Keep renewing
                      </button>
                      <button v-else-if="license.status !== 'cancelled'" type="button" role="menuitem" class="is-danger" @click="openCancel(license)">
                        Cancel license…
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <transition name="lic-bulk">
        <div v-if="selected.length" class="lic-bulk" role="region" aria-label="Bulk renewal">
          <span class="lic-bulk__count">
            <strong>{{ selected.length }}</strong> selected
            <template v-if="isAdmin && selectedOwnerName"> · {{ selectedOwnerName }}</template>
          </span>
          <div class="ord-segment">
            <button type="button" :class="{ active: renewPeriod === 'month' }" @click="renewPeriod = 'month'">Monthly</button>
            <button type="button" :class="{ active: renewPeriod === 'year' }" @click="renewPeriod = 'year'">Annual</button>
          </div>
          <span class="lic-bulk__total">{{ money(selectedTotal) }}</span>
          <span class="lic-bulk__spacer" />
          <button type="button" class="ghost-btn" @click="selected = []">Clear</button>
          <button type="button" class="primary-btn" :disabled="renewing" @click="renew(selected)">
            <span v-if="renewing" class="dash-spinner dash-spinner--btn" />
            Create renewal order
          </button>
        </div>
      </transition>
    </section>

    <div v-if="cancelOpen" class="ord-dialog-backdrop" @click.self="cancelOpen = null">
      <div class="ord-dialog" role="dialog" aria-modal="true">
        <h3>Cancel license for {{ targetLabel(cancelOpen) }}?</h3>
        <p>
          It stays active until <strong>{{ formatDate(cancelOpen.currentPeriodEnd) }}</strong> and will not renew.
          After that, protection keeps its last configuration but changes are locked. There are no refunds;
          you can undo this any time before the end date.
        </p>
        <p v-if="cancelOpen.renewalOrderId" class="ord-note ord-note--warn">
          Unpaid renewal order #{{ cancelOpen.renewalOrderId }} will be re-issued without this license.
        </p>
        <label v-if="isAdmin" class="ord-check">
          <input v-model="cancelImmediate" type="checkbox" />
          End it now instead (operator)
        </label>
        <div class="ord-actions ord-actions--end">
          <button type="button" class="ghost-btn" @click="cancelOpen = null">Back</button>
          <button type="button" class="danger-btn" :disabled="busyId === cancelOpen.id" @click="confirmCancel">
            {{ cancelImmediate ? 'End license now' : 'Cancel at period end' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { cancelLicense, fetchLicenses, fetchOrderCatalog, renewLicenses, resumeLicense } from '@/api/orders'
import { notifyError, notifySuccess } from '@/utils/notify'
import { LICENSE_KIND_LABEL, LICENSE_STATUS, daysUntil, formatDate, formatMoney, periodLabel } from '@/utils/orders'

const SOON_DAYS = 14
const KIND_CODES = {
  L4: ['EDGE_L4'],
  L7: ['EDGE_L7'],
  Unified: ['EDGE_L7', 'L4_ADDON'],
  SITE_PLATFORM: ['SITE_PLATFORM'],
  SITE_OWN: ['SITE_OWN'],
}

const router = useRouter()
const auth = useAuth()
const isAdmin = computed(() => String(auth.state.user?.role || '').toLowerCase() === 'admin')

const licenses = ref([])
const catalog = ref([])
const loading = ref(true)
const loadError = ref('')
const statusFilter = ref('')
const scopeFilter = ref('')
const customerFilter = ref(0)
const search = ref('')
const sortKey = ref('end')
const sortDir = ref(1)
const selected = ref([])
const renewPeriod = ref('year')
const renewing = ref(false)
const busyId = ref(0)
const menuFor = ref(0)
const cancelOpen = ref(null)
const cancelImmediate = ref(false)

const money = (value) => formatMoney(value)

const relDays = (value) => {
  const days = daysUntil(value)
  if (days == null) return ''
  if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`
  if (days === 0) return 'today'
  return `${-days} day${days === -1 ? '' : 's'} ago`
}

const isSoon = (license) => {
  const days = daysUntil(license.currentPeriodEnd)
  return license.status === 'active' && !license.cancelAtPeriodEnd && days != null && days <= SOON_DAYS
}
const needsAttention = (license) => isSoon(license) || license.status === 'past_due' || license.status === 'expired'

const unitPrice = (code, period) => {
  const item = catalog.value.find((c) => c.code === code)
  if (!item) return 0
  return Number(period === 'month' ? item.monthlyPrice : item.annualPrice) || 0
}
const priceFor = (license, period) => (KIND_CODES[license.kind] || []).reduce((sum, code) => sum + unitPrice(code, period), 0)
const renewalPrice = (license) => priceFor(license, license.period)

const inScope = (license) => {
  if (scopeFilter.value && license.scope !== scopeFilter.value) return false
  if (customerFilter.value && license.userId !== customerFilter.value) return false
  return true
}
const scoped = computed(() => licenses.value.filter(inScope))

const counts = computed(() => {
  const out = { active: 0, soon: 0, past_due: 0, expired: 0, cancelled: 0, ending: 0, attention: 0 }
  for (const l of scoped.value) {
    if (l.status in out) out[l.status] += 1
    if (isSoon(l)) out.soon += 1
    if (l.cancelAtPeriodEnd && l.status !== 'cancelled') out.ending += 1
    if (needsAttention(l)) out.attention += 1
  }
  return out
})
const attentionCount = computed(() => counts.value.attention)

const scopeCounts = computed(() => {
  const out = { server: 0, site: 0 }
  for (const l of scoped.value) {
    if (l.status !== 'cancelled' && l.status !== 'expired') out[l.scope] = (out[l.scope] || 0) + 1
  }
  return out
})

const statusChips = computed(() => [
  { id: '', label: 'All', count: scoped.value.length, tone: 'neutral' },
  { id: 'active', label: 'Active', count: counts.value.active, tone: 'ok' },
  { id: 'soon', label: 'Ending soon', count: counts.value.soon, tone: 'warn' },
  { id: 'past_due', label: 'Past due', count: counts.value.past_due, tone: 'warn' },
  { id: 'expired', label: 'Expired', count: counts.value.expired, tone: 'danger' },
  { id: 'ending', label: "Won't renew", count: counts.value.ending, tone: 'muted' },
  { id: 'cancelled', label: 'Cancelled', count: counts.value.cancelled, tone: 'muted' },
].filter((chip) => chip.id === '' || chip.id === 'active' || chip.count > 0 || statusFilter.value === chip.id))

const renewing_ = (l) => l.status !== 'cancelled' && !l.cancelAtPeriodEnd

const nextRenewal = computed(() => {
  const upcoming = scoped.value.filter((l) => renewing_(l) && l.status !== 'expired')
  if (!upcoming.length) return null
  const first = upcoming.reduce((a, b) => (Date.parse(a.currentPeriodEnd) <= Date.parse(b.currentPeriodEnd) ? a : b))
  const day = new Date(first.currentPeriodEnd).toDateString()
  const same = upcoming.filter((l) => new Date(l.currentPeriodEnd).toDateString() === day)
  return { date: first.currentPeriodEnd, count: same.length, amount: same.reduce((sum, l) => sum + renewalPrice(l), 0) }
})

const yearlyCost = computed(() =>
  scoped.value
    .filter((l) => renewing_(l) && l.status !== 'expired')
    .reduce((sum, l) => sum + (l.period === 'month' ? renewalPrice(l) * 12 : renewalPrice(l)), 0),
)

const customerOptions = computed(() => {
  const map = new Map()
  for (const l of licenses.value) {
    if (!map.has(l.userId)) map.set(l.userId, { id: l.userId, name: l.userName || `User #${l.userId}` })
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
})

const targetLabel = (license) => license.targetName || `${license.scope === 'site' ? 'Site' : 'Edge'} #${license.targetId}`

const matchesStatus = (l) => {
  switch (statusFilter.value) {
    case '':
      return true
    case 'soon':
      return isSoon(l)
    case 'attention':
      return needsAttention(l)
    case 'ending':
      return l.cancelAtPeriodEnd && l.status !== 'cancelled'
    default:
      return l.status === statusFilter.value
  }
}

const visible = computed(() => {
  const needle = search.value.toLowerCase()
  const rows = scoped.value.filter((l) => {
    if (!matchesStatus(l)) return false
    if (!needle) return true
    return [l.targetName, l.userName, `#${l.targetId}`].filter(Boolean).join(' ').toLowerCase().includes(needle)
  })
  const dir = sortDir.value
  const key = sortKey.value
  return rows.sort((a, b) => {
    if (key === 'name') return dir * targetLabel(a).localeCompare(targetLabel(b))
    if (key === 'price') return dir * (renewalPrice(a) - renewalPrice(b))
    return dir * (Date.parse(a.currentPeriodEnd) - Date.parse(b.currentPeriodEnd))
  })
})

const sortBy = (key) => {
  if (sortKey.value === key) sortDir.value = -sortDir.value
  else {
    sortKey.value = key
    sortDir.value = 1
  }
}
const sortMark = (key) => (sortKey.value === key ? (sortDir.value > 0 ? '↑' : '↓') : '')

const resetFilters = () => {
  statusFilter.value = ''
  scopeFilter.value = ''
  customerFilter.value = 0
  search.value = ''
}

const statusMeta = (license) => LICENSE_STATUS[license.status] || { label: license.status, tone: 'muted' }

const endsTone = (license) => {
  const days = daysUntil(license.currentPeriodEnd)
  if (days == null || license.status === 'cancelled') return ''
  if (days < 0) return 'lic-tone-danger'
  if (days <= SOON_DAYS) return 'lic-tone-warn'
  return ''
}

const periodProgress = (license) => {
  const end = Date.parse(license.currentPeriodEnd)
  if (!Number.isFinite(end)) return 0
  const length = (license.period === 'month' ? 30 : 365) * 86_400_000
  const pct = ((Date.now() - (end - length)) / length) * 100
  return Math.min(100, Math.max(2, Math.round(pct)))
}

const targetRoute = (license) =>
  license.scope === 'site'
    ? { name: 'site-settings', query: { siteId: String(license.targetId) } }
    : { name: 'server-settings', query: { server: String(license.targetId) } }

const canRenew = (license) => !license.renewalOrderId && license.status !== 'cancelled'

const selectedOwner = computed(() => {
  const first = licenses.value.find((l) => l.id === selected.value[0])
  return first ? first.userId : null
})
const selectedOwnerName = computed(() => customerOptions.value.find((c) => c.id === selectedOwner.value)?.name || '')

const canSelect = (license) => canRenew(license) && (selectedOwner.value == null || selectedOwner.value === license.userId)

const selectTitle = (license) => {
  if (license.renewalOrderId) return `Renewal order #${license.renewalOrderId} already exists`
  if (license.status === 'cancelled') return 'Cancelled licenses cannot be renewed'
  if (selectedOwner.value != null && selectedOwner.value !== license.userId) return 'A renewal order covers one customer'
  return ''
}

const selectableVisible = computed(() => {
  const owner = selectedOwner.value ?? visible.value.find(canRenew)?.userId
  return visible.value.filter((l) => canRenew(l) && l.userId === owner)
})
const allVisibleSelected = computed(
  () => selectableVisible.value.length > 0 && selectableVisible.value.every((l) => selected.value.includes(l.id)),
)
const someVisibleSelected = computed(() => selected.value.length > 0 && !allVisibleSelected.value)
const toggleAll = () => {
  selected.value = allVisibleSelected.value ? [] : selectableVisible.value.map((l) => l.id)
}

const selectedTotal = computed(() =>
  licenses.value.filter((l) => selected.value.includes(l.id)).reduce((sum, l) => sum + priceFor(l, renewPeriod.value), 0),
)

watch([scopeFilter, customerFilter], () => {
  selected.value = selected.value.filter((id) => visible.value.some((l) => l.id === id))
})

const addL4Route = (license) => {
  const query = { addon: '1', upgrade: String(license.targetId), period: license.period }
  if (license.orderId) query.parent = String(license.orderId)
  if (isAdmin.value && license.userId !== auth.state.user?.id) query.customer = String(license.userId)
  return { name: 'order-new', query }
}

const replaceLicense = (updated) => {
  licenses.value = licenses.value.map((l) => (l.id === updated.id ? { ...l, ...updated } : l))
}

const openCancel = (license) => {
  menuFor.value = 0
  cancelImmediate.value = false
  cancelOpen.value = license
}

const confirmCancel = async () => {
  const license = cancelOpen.value
  busyId.value = license.id
  try {
    replaceLicense(await cancelLicense(license.id, cancelImmediate.value))
    notifySuccess(
      cancelImmediate.value ? 'License ended' : 'Cancellation scheduled',
      cancelImmediate.value ? targetLabel(license) : `Active until ${formatDate(license.currentPeriodEnd)}.`,
    )
    if (license.renewalOrderId) await load()
    selected.value = selected.value.filter((id) => id !== license.id)
    cancelOpen.value = null
  } catch (e) {
    notifyError('Could not cancel', e?.message || '')
  } finally {
    busyId.value = 0
  }
}

const resume = async (license) => {
  menuFor.value = 0
  busyId.value = license.id
  try {
    replaceLicense(await resumeLicense(license.id))
    notifySuccess('License will renew', targetLabel(license))
  } catch (e) {
    notifyError('Could not undo cancellation', e?.message || '')
  } finally {
    busyId.value = 0
  }
}

const renew = async (ids, period = renewPeriod.value) => {
  renewing.value = true
  try {
    const order = await renewLicenses(ids, period)
    notifySuccess('Renewal order created', `Invoice ${order.invoiceNo || `#${order.id}`} for ${ids.length} license${ids.length === 1 ? '' : 's'}.`)
    selected.value = []
    router.push({ name: 'order-detail', params: { id: order.id } })
  } catch (e) {
    notifyError('Could not create renewal', e?.message || '')
  } finally {
    renewing.value = false
  }
}

const load = async () => {
  loadError.value = ''
  try {
    const [data, cat] = await Promise.all([fetchLicenses(), catalog.value.length ? catalog.value : fetchOrderCatalog().catch(() => [])])
    licenses.value = Array.isArray(data) ? data : []
    catalog.value = Array.isArray(cat) ? cat : []
  } catch (e) {
    loadError.value = e?.message || 'Could not load licenses.'
  } finally {
    loading.value = false
  }
}

const menuStyle = ref({})
const toggleMenu = (id, event) => {
  if (menuFor.value === id) {
    menuFor.value = 0
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  const openUp = window.innerHeight - rect.bottom < 230
  menuStyle.value = {
    right: `${Math.max(8, window.innerWidth - rect.right)}px`,
    ...(openUp ? { bottom: `${window.innerHeight - rect.top + 4}px` } : { top: `${rect.bottom + 4}px` }),
  }
  menuFor.value = id
}

const closeMenu = () => {
  menuFor.value = 0
}
const onKey = (event) => {
  if (event.key === 'Escape') closeMenu()
}

onMounted(() => {
  load()
  document.addEventListener('click', closeMenu)
  document.addEventListener('keydown', onKey)
  window.addEventListener('scroll', closeMenu, true)
  window.addEventListener('resize', closeMenu)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenu)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('scroll', closeMenu, true)
  window.removeEventListener('resize', closeMenu)
})
</script>

<style scoped>
.lic {
  --lic-accent: var(--dorian-viper-400, var(--app-accent, #3fbd85));
  --lic-warn: var(--dorian-warn, #e0a83f);
  --lic-danger: var(--dorian-danger, #e15241);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* summary */
.lic-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.lic-stat {
  --stat-tone: var(--app-border-strong);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
  font: inherit;
  text-align: left;
  color: inherit;
  min-width: 0;
}

.lic-stat__label {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.lic-stat__value {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--app-heading);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lic-stat__value small {
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-muted);
}

.lic-stat__hint {
  font-size: 11.5px;
  color: var(--app-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lic-stat--attention {
  --stat-tone: var(--lic-accent);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.lic-stat--attention::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 2px;
  border-radius: 2px;
  background: var(--stat-tone);
}

.lic-stat--attention.is-bad {
  --stat-tone: var(--lic-warn);
}

.lic-stat--attention.is-bad .lic-stat__value {
  color: var(--lic-warn);
}

.lic-stat--attention:hover,
.lic-stat--attention.active {
  border-color: color-mix(in srgb, var(--stat-tone) 50%, var(--app-border));
  background: color-mix(in srgb, var(--stat-tone) 6%, var(--app-surface));
}

/* toolbar */
.lic-panel {
  gap: 14px;
}

.lic-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.lic-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.lic-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.lic-chip {
  --chip-tone: var(--app-text-muted);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 0.5px solid var(--app-border-strong);
  background: transparent;
  font: inherit;
  font-size: 12.5px;
  font-weight: 550;
  color: var(--app-text-muted);
  cursor: pointer;
  transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
}

.lic-chip span {
  min-width: 18px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  text-align: center;
  color: var(--chip-tone);
  background: color-mix(in srgb, var(--chip-tone) 14%, transparent);
}

.lic-chip.tone-ok { --chip-tone: var(--lic-accent); }
.lic-chip.tone-warn { --chip-tone: var(--lic-warn); }
.lic-chip.tone-danger { --chip-tone: var(--lic-danger); }
.lic-chip.tone-neutral { --chip-tone: var(--app-text); }

.lic-chip:hover {
  color: var(--app-text);
}

.lic-chip.active {
  color: var(--app-heading);
  border-color: color-mix(in srgb, var(--chip-tone) 55%, transparent);
  background: color-mix(in srgb, var(--chip-tone) 10%, transparent);
}

.lic-search {
  width: 220px;
}

.lic-customer {
  width: 180px;
}

/* table */
.lic-table th {
  white-space: nowrap;
}

.lic-sort {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
}

.lic-sort span {
  display: inline-block;
  width: 10px;
  color: var(--lic-accent);
}

.lic-check-col {
  width: 34px;
}

.lic-check-col input {
  accent-color: var(--lic-accent);
}

.lic-table tbody tr.is-selected {
  background: color-mix(in srgb, var(--lic-accent) 6%, transparent);
}

.lic-target {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.lic-target__icon {
  --icon-tone: var(--dorian-l7, #8fa3b8);
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: var(--icon-tone);
  background: color-mix(in srgb, var(--icon-tone) 13%, transparent);
}

.lic-target__icon.is-edge {
  --icon-tone: var(--dorian-l4, #6b9fd4);
}

.lic-target__icon svg {
  width: 15px;
  height: 15px;
}

.lic-target__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.lic-target__name {
  font-weight: 600;
  color: var(--app-heading);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 280px;
}

.lic-target__name:hover {
  color: var(--lic-accent);
  text-decoration: underline;
}

.lic-customer-cell {
  color: var(--app-text-muted);
  white-space: nowrap;
}

.lic-renewal-link {
  color: var(--lic-warn);
  text-decoration: none;
}

.lic-renewal-link:hover {
  text-decoration: underline;
}

.lic-period {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
}

.lic-period__dates {
  white-space: nowrap;
}

.lic-period__rel {
  margin-left: 6px;
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.lic-period__bar {
  display: block;
  height: 3px;
  border-radius: 3px;
  background: var(--app-border);
  overflow: hidden;
}

.lic-period__bar span {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--lic-accent);
}

.lic-period__bar span.lic-tone-warn { background: var(--lic-warn); }
.lic-period__bar span.lic-tone-danger { background: var(--lic-danger); }

.lic-price {
  font-weight: 600;
  color: var(--app-heading);
  font-variant-numeric: tabular-nums;
}

.lic-tone-warn { color: var(--lic-warn); }
.lic-tone-danger { color: var(--lic-danger); }

.lic-actions-col {
  width: 1%;
  white-space: nowrap;
}

.lic-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.lic-renew {
  min-width: 68px;
  justify-content: center;
  text-decoration: none;
}

.lic-menu {
  position: relative;
}

.lic-menu__btn {
  width: 30px;
  height: 30px;
}

.lic-menu__btn svg {
  width: 15px;
  height: 15px;
}

.lic-menu.open .lic-menu__btn {
  color: var(--app-heading);
  background: var(--app-surface-muted);
}

.lic-menu__pop {
  position: fixed;
  z-index: 60;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  padding: 5px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface);
  box-shadow: 0 14px 34px -12px rgb(0 0 0 / 55%);
  text-align: left;
}

.lic-menu__pop a,
.lic-menu__pop button {
  display: block;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: 6px;
  background: none;
  font: inherit;
  font-size: 12.5px;
  text-align: left;
  color: var(--app-text);
  text-decoration: none;
  cursor: pointer;
}

.lic-menu__pop a:hover,
.lic-menu__pop button:hover:not(:disabled) {
  background: var(--app-surface-muted);
  color: var(--app-heading);
}

.lic-menu__pop button.is-danger {
  color: var(--lic-danger);
}

.lic-menu__pop hr {
  margin: 4px 2px;
  border: none;
  border-top: 0.5px solid var(--app-border);
}

.lic-menu__note {
  padding: 7px 10px;
  font-size: 11.5px;
  color: var(--app-text-muted);
}

/* bulk bar */
.lic-bulk {
  position: sticky;
  bottom: 12px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 12px 10px 16px;
  border-radius: 10px;
  border: 0.5px solid color-mix(in srgb, var(--lic-accent) 45%, var(--app-border));
  background: color-mix(in srgb, var(--lic-accent) 8%, var(--app-surface));
  box-shadow: 0 12px 30px -16px rgb(0 0 0 / 60%);
}

.lic-bulk__count {
  font-size: 13px;
  color: var(--app-text);
}

.lic-bulk__count strong {
  color: var(--app-heading);
}

.lic-bulk__total {
  font-size: 15px;
  font-weight: 700;
  color: var(--app-heading);
  font-variant-numeric: tabular-nums;
}

.lic-bulk__spacer {
  flex: 1;
}

.lic-bulk-enter-active,
.lic-bulk-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.lic-bulk-enter-from,
.lic-bulk-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* empty */
.lic-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
}

.lic-empty h3 {
  margin: 0;
  font-size: 15px;
  color: var(--app-heading);
}

.lic-empty p {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-muted);
}

.lic-empty a {
  margin-top: 6px;
  text-decoration: none;
}

.lic-empty--small {
  padding: 24px 20px;
}

.lic-empty__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--lic-accent);
  background: color-mix(in srgb, var(--lic-accent) 12%, transparent);
}

.lic-empty__icon svg {
  width: 22px;
  height: 22px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .lic-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .lic-summary {
    grid-template-columns: 1fr;
  }

  .lic-search,
  .lic-customer {
    width: 100%;
  }
}
</style>
