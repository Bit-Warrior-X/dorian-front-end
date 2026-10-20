<template>
  <div class="dashboard-view acct-view">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <p class="acct-kicker">Account</p>
        <h2>Audit log</h2>
        <p>Who did what, to which resource, and from where. Changes show old and new values; secrets are never recorded.</p>
      </div>
      <div class="dash-topbar__right">
        <button class="acct-btn" type="button" :disabled="!entries.length" @click="exportCsv">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5v8M4.5 7.5L8 11l3.5-3.5M3 13.5h10" /></svg>
          Export CSV
        </button>
        <AppTopbarActions />
      </div>
    </header>

    <div class="dash-filterbar audit-filters">
      <div class="dash-filter-field">
        <label>Range</label>
        <div class="dash-range-pills" role="radiogroup" aria-label="Time range">
          <button
            v-for="option in RANGE_OPTIONS"
            :key="option.id"
            type="button"
            class="dash-range-pill"
            :class="{ active: filters.range === option.id }"
            role="radio"
            :aria-checked="filters.range === option.id"
            @click="setRange(option.id)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <template v-if="filters.range === 'custom'">
        <div class="dash-filter-field">
          <label for="audit-from">From</label>
          <input id="audit-from" v-model="filters.from" class="dash-select audit-date" type="date" :max="filters.to || todayIso" @change="loadHistory" />
        </div>
        <div class="dash-filter-field">
          <label for="audit-to">To</label>
          <input id="audit-to" v-model="filters.to" class="dash-select audit-date" type="date" :min="filters.from" :max="todayIso" @change="loadHistory" />
        </div>
      </template>
      <div class="dash-filter-field audit-filters__search">
        <label for="audit-search">Search</label>
        <input id="audit-search" v-model="filters.search" class="dash-select" type="search" placeholder="User, resource, details, IP…" @keyup.enter="loadHistory" @search="loadHistory" />
      </div>
      <div class="dash-filter-field">
        <label for="audit-category">Category</label>
        <select id="audit-category" v-model="filters.category" class="dash-select" @change="loadHistory">
          <option value="">All</option>
          <option v-for="option in AUDIT_CATEGORIES" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label for="audit-action">Action</label>
        <select id="audit-action" v-model="filters.action" class="dash-select" @change="loadHistory">
          <option value="">All</option>
          <option v-for="option in AUDIT_ACTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label for="audit-result">Result</label>
        <select id="audit-result" v-model="filters.result" class="dash-select">
          <option value="">All</option>
          <option value="success">Success</option>
          <option value="failed">Failed or denied</option>
        </select>
      </div>
      <label class="audit-ip-toggle">
        <input v-model="showFullIps" type="checkbox" />
        Show full IPs
      </label>
      <button class="acct-btn audit-filters__refresh" type="button" :disabled="isLoading" @click="loadHistory">
        {{ isLoading ? 'Loading…' : 'Refresh' }}
      </button>
    </div>

    <section class="acct-kpis audit-kpis" aria-label="Summary">
      <div class="acct-kpi tone-signal">
        <span class="acct-kpi__label">Events</span>
        <span class="acct-kpi__value num">{{ entries.length.toLocaleString() }}</span>
        <span class="acct-kpi__hint">{{ rangeLabel }}{{ allEntries.length >= FETCH_LIMIT ? ' · newest 1,000' : '' }}</span>
      </div>
      <div class="acct-kpi tone-info">
        <span class="acct-kpi__label">People</span>
        <span class="acct-kpi__value num">{{ summary.actors }}</span>
        <span class="acct-kpi__hint">distinct actors</span>
      </div>
      <div class="acct-kpi" :class="summary.failedSignIns ? 'tone-warn' : 'tone-signal'">
        <span class="acct-kpi__label">Failed sign-ins</span>
        <span class="acct-kpi__value num">{{ summary.failedSignIns }}</span>
        <span class="acct-kpi__hint">wrong password or 2FA code</span>
      </div>
      <div class="acct-kpi" :class="summary.denied ? 'tone-danger' : 'tone-signal'">
        <span class="acct-kpi__label">Failed or denied</span>
        <span class="acct-kpi__value num">{{ summary.denied }}</span>
        <span class="acct-kpi__hint">requests that did not succeed</span>
      </div>
    </section>

    <section class="dash-panel" aria-label="Events">
      <p v-if="loadError" class="acct-error">{{ loadError }}</p>
      <p v-else-if="isLoading && !entries.length" class="acct-hint">Loading audit log…</p>
      <p v-else-if="!entries.length" class="acct-empty">No events match these filters.</p>
      <div v-else class="audit-table-wrap">
        <table class="acct-table audit-table">
          <colgroup>
            <col class="col-time" />
            <col class="col-actor" />
            <col />
            <col class="col-target" />
            <col class="col-source" />
            <col class="col-result" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Actor</th>
              <th scope="col">Activity</th>
              <th scope="col">Target</th>
              <th scope="col">Source</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="entry in paginatedEntries" :key="entry.id">
              <tr
                class="audit-row"
                :class="{ 'is-expanded': expandedId === entry.id }"
                tabindex="0"
                @click="toggleExpanded(entry.id)"
                @keydown.enter="toggleExpanded(entry.id)"
              >
                <td class="nowrap num">
                  {{ formatDateTime24(entry.createdAt, { seconds: true }) }}
                </td>
                <td>
                  <span class="acct-cell-main audit-ellipsis">{{ actorLabel(entry) }}</span>
                  <span class="acct-cell-sub audit-ellipsis">
                    <template v-if="entry.actorName && entry.actorEmail">{{ entry.actorEmail }}</template>
                    <template v-else>{{ entry.actorRole || '' }}</template>
                  </span>
                </td>
                <td>
                  <span class="audit-pill" :class="auditActionClass(entry.action)">{{ formatAuditAction(entry.action) }}</span>
                  <span class="audit-summary">{{ detailsOf(entry).summary || '—' }}</span>
                  <span v-if="detailsOf(entry).changes.length" class="audit-change-count">
                    {{ detailsOf(entry).changes.length }} {{ detailsOf(entry).changes.length === 1 ? 'change' : 'changes' }}
                  </span>
                </td>
                <td>
                  <span class="acct-cell-main audit-ellipsis">{{ entry.resourceName || '—' }}</span>
                  <span class="acct-cell-sub">{{ formatAuditCategory(entry.category) }}</span>
                </td>
                <td>
                  <span class="acct-cell-main num nowrap audit-ip">{{ entry.ipAddress ? (showFullIps ? entry.ipAddress : maskIp(entry.ipAddress)) : '—' }}</span>
                  <span v-if="entry.userAgent" class="acct-cell-sub audit-ellipsis">{{ describeUserAgent(entry.userAgent) }}</span>
                </td>
                <td>
                  <span class="acct-badge" :class="auditSucceeded(entry) ? 'tone-signal' : 'tone-danger'">{{ auditResultLabel(entry) }}</span>
                </td>
              </tr>
              <tr v-if="expandedId === entry.id" class="audit-detail-row">
                <td colspan="6">
                  <ul v-if="detailsOf(entry).changes.length" class="audit-changes">
                    <li v-for="(change, index) in detailsOf(entry).changes" :key="index">{{ change }}</li>
                  </ul>
                  <dl class="audit-detail">
                    <div>
                      <dt>Request</dt>
                      <dd><code>{{ entry.httpMethod || '—' }} {{ entry.path || '' }}</code></dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd class="num">{{ entry.statusCode || '—' }}</dd>
                    </div>
                    <div v-if="entry.resourceType || entry.resourceId">
                      <dt>Resource</dt>
                      <dd>{{ entry.resourceType || '—' }}<template v-if="entry.resourceId"> #{{ entry.resourceId }}</template></dd>
                    </div>
                    <div v-if="entry.actorUserId">
                      <dt>Actor ID</dt>
                      <dd class="num">#{{ entry.actorUserId }}</dd>
                    </div>
                    <div class="audit-detail__wide">
                      <dt>User agent</dt>
                      <dd>{{ entry.userAgent || '—' }}</dd>
                    </div>
                  </dl>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-if="entries.length" class="audit-footer">
        <span class="acct-hint">Showing {{ pageStart }}–{{ pageEnd }} of {{ entries.length.toLocaleString() }}</span>
        <div class="audit-footer__pager">
          <select v-model.number="pageSize" class="dash-select audit-page-size" aria-label="Rows per page">
            <option :value="25">25 rows</option>
            <option :value="50">50 rows</option>
            <option :value="100">100 rows</option>
          </select>
          <button class="acct-btn acct-btn--sm" type="button" :disabled="currentPage === 1" @click="currentPage -= 1">Prev</button>
          <span class="acct-hint num">{{ currentPage }} / {{ totalPages }}</span>
          <button class="acct-btn acct-btn--sm" type="button" :disabled="currentPage === totalPages" @click="currentPage += 1">Next</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { fetchAuditLogs } from '@/api/auditLogs'
import {
  AUDIT_ACTIONS,
  AUDIT_CATEGORIES,
  auditActionClass,
  auditResultLabel,
  auditSucceeded,
  describeUserAgent,
  formatAuditAction,
  formatAuditCategory,
  formatDateTime24,
  splitAuditDetails,
} from '@/utils/auditFormat'
import { maskIp } from '@/utils/maskIp'
import { notifyError } from '@/utils/notify'

const FETCH_LIMIT = 1000
const DAY_MS = 24 * 60 * 60 * 1000

const RANGE_OPTIONS = [
  { id: '24h', label: '24h', days: 1 },
  { id: '7d', label: '7d', days: 7 },
  { id: '30d', label: '30d', days: 30 },
  { id: '90d', label: '90d', days: 90 },
  { id: 'all', label: 'All' },
  { id: 'custom', label: 'Custom' },
]

const pad2 = (value) => String(value).padStart(2, '0')
const toIsoDate = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
const todayIso = toIsoDate(new Date())

const allEntries = ref([])
const isLoading = ref(false)
const loadError = ref('')
const pageSize = ref(25)
const currentPage = ref(1)
const expandedId = ref(null)
const showFullIps = ref(false)

const filters = reactive({
  range: '7d',
  from: toIsoDate(new Date(Date.now() - 6 * DAY_MS)),
  to: todayIso,
  search: '',
  category: '',
  action: '',
  result: '',
})

const rangeBounds = () => {
  if (filters.range === 'all') return {}
  if (filters.range === 'custom') {
    const out = {}
    if (filters.from) out.from = new Date(`${filters.from}T00:00:00`).toISOString()
    if (filters.to) out.to = new Date(new Date(`${filters.to}T00:00:00`).getTime() + DAY_MS).toISOString()
    return out
  }
  const days = RANGE_OPTIONS.find((option) => option.id === filters.range)?.days || 7
  return { from: new Date(Date.now() - days * DAY_MS).toISOString() }
}

const rangeLabel = computed(() => {
  if (filters.range === 'all') return 'all time'
  if (filters.range === 'custom') return `${filters.from || '…'} to ${filters.to || 'today'}`
  return `last ${RANGE_OPTIONS.find((option) => option.id === filters.range)?.label || '7d'}`
})

const setRange = (id) => {
  filters.range = id
  if (id !== 'custom') void loadHistory()
}

const entries = computed(() => {
  if (filters.result === 'success') return allEntries.value.filter(auditSucceeded)
  if (filters.result === 'failed') return allEntries.value.filter((entry) => !auditSucceeded(entry))
  return allEntries.value
})

const summary = computed(() => {
  const actors = new Set()
  let failedSignIns = 0
  let denied = 0
  for (const entry of entries.value) {
    if (entry.actorUserId || entry.actorEmail) actors.add(entry.actorUserId || entry.actorEmail)
    if (String(entry.action).toLowerCase() === 'login_failed') failedSignIns += 1
    if (!auditSucceeded(entry)) denied += 1
  }
  return { actors: actors.size, failedSignIns, denied }
})

const detailsCache = new WeakMap()
const detailsOf = (entry) => {
  if (!detailsCache.has(entry)) detailsCache.set(entry, splitAuditDetails(entry.details))
  return detailsCache.get(entry)
}

const actorLabel = (entry) => {
  if (entry.actorName) return entry.actorName
  if (entry.actorEmail) return entry.actorEmail
  return entry.action === 'login_failed' ? 'Unknown user' : 'System'
}

const toggleExpanded = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

const totalPages = computed(() => Math.max(1, Math.ceil(entries.value.length / pageSize.value)))
const pageStart = computed(() => (entries.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0))
const pageEnd = computed(() => Math.min(currentPage.value * pageSize.value, entries.value.length))
const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return entries.value.slice(start, start + pageSize.value)
})

watch([() => filters.result, pageSize], () => {
  currentPage.value = 1
})

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages
})

const loadHistory = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const data = await fetchAuditLogs({
      limit: FETCH_LIMIT,
      category: filters.category,
      action: filters.action,
      search: filters.search.trim(),
      ...rangeBounds(),
    })
    allEntries.value = Array.isArray(data) ? data : []
    currentPage.value = 1
    expandedId.value = null
  } catch (error) {
    allEntries.value = []
    loadError.value = error?.message || 'Could not load the audit log.'
  } finally {
    isLoading.value = false
  }
}

const csvCell = (value) => {
  let text = value == null ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const exportCsv = () => {
  const header = [
    'time_utc',
    'actor',
    'actor_email',
    'actor_role',
    'action',
    'category',
    'summary',
    'changes',
    'resource',
    'resource_type',
    'resource_id',
    'ip_address',
    'user_agent',
    'method',
    'path',
    'status',
    'result',
  ]
  const rows = entries.value.map((entry) => {
    const details = detailsOf(entry)
    return [
      entry.createdAt ? new Date(entry.createdAt).toISOString() : '',
      actorLabel(entry),
      entry.actorEmail,
      entry.actorRole,
      entry.action,
      entry.category,
      details.summary,
      details.changes.join(' | '),
      entry.resourceName,
      entry.resourceType,
      entry.resourceId,
      entry.ipAddress,
      entry.userAgent,
      entry.httpMethod,
      entry.path,
      entry.statusCode,
      auditResultLabel(entry),
    ]
  })
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `dorian-audit-log-${todayIso}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

onMounted(() => {
  void loadHistory().catch((error) => notifyError('Audit log', error?.message || 'Could not load the audit log.'))
})
</script>

<style scoped>
.audit-filters__search {
  flex: 1 1 220px;
}

.audit-filters__search .dash-select {
  width: 100%;
}

.audit-filters__refresh {
  margin-left: auto;
}

.audit-ip-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-end;
  height: 34px;
  font-size: 12px;
  color: var(--app-text-muted);
  cursor: pointer;
}

.audit-ip-toggle input {
  accent-color: var(--dorian-viper-400, var(--app-accent));
}

.audit-date {
  min-width: 140px;
  color-scheme: dark;
}

.audit-kpis {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.audit-table-wrap {
  overflow-x: auto;
}

.audit-table {
  table-layout: fixed;
  min-width: 860px;
}

.audit-table .col-time { width: 136px; }
.audit-table .col-actor { width: 170px; }
.audit-table .col-target { width: 140px; }
.audit-table .col-source { width: 150px; }
.audit-table .col-result { width: 92px; }

.audit-table td {
  vertical-align: top;
}

.audit-row {
  cursor: pointer;
}

.audit-row.is-expanded {
  background: color-mix(in srgb, var(--dorian-viper-400, var(--app-accent)) 6%, transparent);
}

.audit-row:focus-visible {
  outline: 1px solid var(--dorian-viper-400, var(--app-accent));
  outline-offset: -1px;
}

.audit-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-ip {
  overflow: hidden;
  text-overflow: ellipsis;
}

.audit-summary {
  display: block;
  margin-top: 4px;
  line-height: 1.4;
  color: var(--app-text);
  overflow-wrap: anywhere;
}

.audit-change-count {
  display: inline-block;
  margin-top: 3px;
  font-size: 11px;
  color: var(--app-text-muted);
}

.audit-pill {
  --pill-tone: var(--dorian-l4, #6b9fd4);
  display: inline-flex;
  padding: 2px 8px;
  border-radius: var(--badge-radius, 999px);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--pill-tone);
  background: color-mix(in srgb, var(--pill-tone) 12%, transparent);
}

.audit-pill.is-login,
.audit-pill.is-create { --pill-tone: var(--dorian-viper-400, var(--app-accent)); }
.audit-pill.is-logout { --pill-tone: var(--app-text-muted); }
.audit-pill.is-delete { --pill-tone: var(--dorian-danger, #e15241); }
.audit-pill.is-security,
.audit-pill.is-operate { --pill-tone: var(--dorian-warn, #e0a83f); }

.audit-detail-row td {
  background: var(--app-surface-muted);
  padding: 12px 14px;
}

.audit-changes {
  margin: 0 0 10px;
  padding-left: 18px;
  font-size: 12px;
  color: var(--app-text);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.audit-detail {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 16px;
}

.audit-detail dt {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  margin-bottom: 2px;
}

.audit-detail dd {
  margin: 0;
  font-size: 12px;
  color: var(--app-text);
  overflow-wrap: anywhere;
}

.audit-detail__wide {
  grid-column: 1 / -1;
}

.audit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.audit-footer__pager {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.audit-page-size {
  min-width: 0;
}

@media (max-width: 760px) {
  .audit-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .audit-detail {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
