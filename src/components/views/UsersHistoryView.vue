<template>
  <div class="history-view">
    <div class="history-card">
      <div class="card-header">
        <div>
          <h2>Audit History</h2>
          <p class="card-subtitle">
            Who did what, to which resource, and from where — sign-ins, users, 2FA and API tokens, edges,
            sites, WAF rules, and blocked lists. Changes show the old and new values; secrets are never recorded.
          </p>
        </div>
        <button class="ghost-btn" type="button" :disabled="isLoading" @click="loadHistory">
          {{ isLoading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <div class="filters">
        <div class="filter-field">
          <label for="history-search">Search</label>
          <input
            id="history-search"
            v-model="filters.search"
            type="search"
            placeholder="User, email, resource, details..."
            @keyup.enter="loadHistory"
          />
        </div>
        <div class="filter-field">
          <label for="history-ip">IP</label>
          <input
            id="history-ip"
            v-model="filters.ip"
            type="search"
            placeholder="e.g. 192.168.1.10"
            @keyup.enter="loadHistory"
          />
        </div>
        <div class="filter-field">
          <label for="history-category">Category</label>
          <select id="history-category" v-model="filters.category" @change="loadHistory">
            <option value="">All categories</option>
            <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="filter-field">
          <label for="history-action">Action</label>
          <select id="history-action" v-model="filters.action" @change="loadHistory">
            <option value="">All actions</option>
            <option v-for="option in actionOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="filter-field">
          <label for="history-result">Result</label>
          <select id="history-result" v-model="filters.result">
            <option value="">All results</option>
            <option value="success">Success</option>
            <option value="failed">Failed / denied</option>
          </select>
        </div>
        <button class="primary-btn filter-btn" type="button" :disabled="isLoading" @click="loadHistory">
          Apply
        </button>
      </div>

      <div class="history-table">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Activity</th>
              <th>Target</th>
              <th>Source</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="entry in paginatedEntries" :key="entry.id">
              <tr
                class="entry-row"
                :class="{ 'is-expanded': expandedId === entry.id, 'is-failed': !auditSucceeded(entry) }"
                @click="toggleExpanded(entry.id)"
              >
                <td class="time-cell">{{ formatTime(entry.createdAt) }}</td>
                <td>
                  <div class="actor-cell">
                    <strong>{{ actorLabel(entry) }}</strong>
                    <span v-if="entry.actorName && entry.actorEmail" class="actor-email">{{ entry.actorEmail }}</span>
                    <span v-if="entry.actorRole" class="actor-role">{{ entry.actorRole }}</span>
                  </div>
                </td>
                <td class="activity-cell">
                  <span class="badge action" :class="auditActionClass(entry.action)">
                    {{ formatAuditAction(entry.action) }}
                  </span>
                  <p class="activity-summary">{{ detailsOf(entry).summary || '—' }}</p>
                  <ul v-if="detailsOf(entry).changes.length" class="activity-changes">
                    <li v-for="(change, index) in detailsOf(entry).changes" :key="index">{{ change }}</li>
                  </ul>
                </td>
                <td>
                  <div class="resource-cell">
                    <strong>{{ entry.resourceName || '—' }}</strong>
                    <span class="badge category">{{ formatAuditCategory(entry.category) }}</span>
                  </div>
                </td>
                <td>
                  <div class="source-cell">
                    <strong>{{ entry.ipAddress || '—' }}</strong>
                    <span v-if="entry.userAgent" class="source-agent">{{ describeUserAgent(entry.userAgent) }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge result" :class="auditSucceeded(entry) ? 'is-success' : 'is-failure'">
                    {{ auditResultLabel(entry) }}
                  </span>
                </td>
              </tr>
              <tr v-if="expandedId === entry.id" class="entry-detail-row">
                <td colspan="6">
                  <dl class="entry-detail">
                    <div>
                      <dt>Request</dt>
                      <dd><code>{{ entry.httpMethod || '—' }} {{ entry.path || '' }}</code></dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{{ entry.statusCode || '—' }}</dd>
                    </div>
                    <div v-if="entry.resourceType || entry.resourceId">
                      <dt>Resource</dt>
                      <dd>{{ entry.resourceType || '—' }}<template v-if="entry.resourceId"> #{{ entry.resourceId }}</template></dd>
                    </div>
                    <div v-if="entry.actorUserId">
                      <dt>Actor ID</dt>
                      <dd>#{{ entry.actorUserId }}</dd>
                    </div>
                    <div class="entry-detail__wide">
                      <dt>User agent</dt>
                      <dd>{{ entry.userAgent || '—' }}</dd>
                    </div>
                  </dl>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-if="!isLoading && !entries.length" class="empty-state">
          No audit history matches the current filters.
        </div>
        <div v-else-if="isLoading && !entries.length" class="empty-state">
          Loading audit history...
        </div>
      </div>

      <div v-if="entries.length" class="table-footer">
        <span class="pagination-info">
          Showing {{ pageStart }}-{{ pageEnd }} of {{ entries.length }}
        </span>
        <div class="pagination-controls">
          <button class="pagination-btn" type="button" :disabled="currentPage === 1" @click="prevPage">
            Prev
          </button>
          <span class="pagination-page">Page {{ currentPage }} of {{ totalPages }}</span>
          <button
            class="pagination-btn"
            type="button"
            :disabled="currentPage === totalPages"
            @click="nextPage"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { fetchAuditLogs } from '@/api/auditLogs'
import { notifyError } from '@/utils/notify'
import {
  AUDIT_ACTIONS,
  AUDIT_CATEGORIES,
  auditActionClass,
  auditResultLabel,
  auditSucceeded,
  describeUserAgent,
  formatAuditAction,
  formatAuditCategory,
  splitAuditDetails,
} from '@/utils/auditFormat'

const HISTORY_TITLE = 'Audit History'

const allEntries = ref([])
const isLoading = ref(false)
const pageSize = 10
const currentPage = ref(1)
const expandedId = ref(null)

const filters = reactive({
  search: '',
  ip: '',
  category: '',
  action: '',
  result: '',
})

const entries = computed(() => {
  if (filters.result === 'success') return allEntries.value.filter(auditSucceeded)
  if (filters.result === 'failed') return allEntries.value.filter((entry) => !auditSucceeded(entry))
  return allEntries.value
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

const totalPages = computed(() => Math.max(1, Math.ceil(entries.value.length / pageSize)))

const pageStart = computed(() => {
  if (!entries.value.length) return 0
  return (currentPage.value - 1) * pageSize + 1
})

const pageEnd = computed(() => Math.min(currentPage.value * pageSize, entries.value.length))

const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return entries.value.slice(start, start + pageSize)
})

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

watch(
  () => entries.value.length,
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  },
)

watch(
  () => filters.result,
  () => {
    currentPage.value = 1
  },
)

const categoryOptions = AUDIT_CATEGORIES
const actionOptions = AUDIT_ACTIONS

const formatTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const loadHistory = async () => {
  isLoading.value = true
  try {
    const data = await fetchAuditLogs({
      limit: 300,
      category: filters.category,
      action: filters.action,
      search: filters.search.trim(),
      ip: filters.ip.trim(),
    })
    allEntries.value = Array.isArray(data) ? data : []
    currentPage.value = 1
    expandedId.value = null
  } catch (error) {
    allEntries.value = []
    currentPage.value = 1
    notifyError(HISTORY_TITLE, error?.message || 'Could not load audit history.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadHistory()
})
</script>

<style scoped>
.history-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-gap-lg, 14px);
}

.history-card {
  background: var(--app-surface);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: var(--space-card, 14px 16px);
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.card-header h2 {
  font-size: var(--type-section-title);
  font-weight: 700;
  color: var(--app-heading);
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.card-subtitle {
  margin: 0;
  color: var(--app-text-muted);
  font-size: var(--type-base);
  max-width: 46rem;
  line-height: 1.45;
}

.filters {
  display: grid;
  grid-template-columns: minmax(180px, 1.6fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(120px, 0.8fr) auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 16px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-field label {
  font-size: var(--type-caption);
  font-weight: 600;
  color: var(--app-text-muted);
}

.filter-field input,
.filter-field select {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: var(--type-base);
  color: var(--app-text);
  background: var(--app-input-bg);
}

.filter-btn {
  min-height: 42px;
}

.history-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

thead {
  background: var(--app-surface-muted);
}

th {
  padding: 12px 14px;
  text-align: left;
  font-size: var(--type-caption);
  font-weight: 600;
  color: var(--app-text-muted);
  border-bottom: 2px solid var(--app-border-strong);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--app-border-strong);
  color: var(--app-text);
  vertical-align: top;
}

tbody tr:hover {
  background: var(--app-surface-hover);
}

.time-cell {
  white-space: nowrap;
  font-size: var(--type-base);
}

.entry-row {
  cursor: pointer;
}

.entry-row.is-failed td:first-child {
  box-shadow: inset 3px 0 0 #dc2626;
}

.entry-row.is-expanded,
.entry-row.is-expanded + .entry-detail-row {
  background: var(--app-surface-hover);
}

.actor-cell,
.resource-cell,
.source-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.actor-cell strong,
.resource-cell strong,
.source-cell strong {
  font-size: var(--type-base);
  color: var(--app-heading);
  word-break: break-word;
}

.actor-email,
.actor-role,
.source-agent {
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.activity-cell {
  min-width: 300px;
  max-width: 460px;
}

.activity-summary {
  margin: 6px 0 0;
  font-size: var(--type-base);
  line-height: 1.4;
  color: var(--app-heading);
  word-break: break-word;
}

.activity-changes {
  margin: 6px 0 0;
  padding-left: 16px;
  font-size: var(--type-caption);
  line-height: 1.5;
  color: var(--app-text-secondary);
  word-break: break-word;
}

.entry-detail-row td {
  padding-top: 0;
}

.entry-detail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px 20px;
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--app-surface-muted);
}

.entry-detail__wide {
  grid-column: 1 / -1;
}

.entry-detail dt {
  font-size: var(--type-caption);
  font-weight: 600;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.entry-detail dd {
  margin: 2px 0 0;
  font-size: var(--type-base);
  color: var(--app-text);
  word-break: break-all;
}

.badge {
  padding: 5px 10px;
  border-radius: var(--badge-radius, 4px);
  font-size: var(--type-caption);
  font-weight: 700;
  display: inline-block;
  white-space: nowrap;
}

.badge.action.is-login {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.badge.action.is-logout {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.badge.action.is-failed {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.badge.action.is-create {
  background: rgba(124, 58, 237, 0.12);
  color: var(--app-accent);
}

.badge.action.is-update {
  background: rgba(217, 119, 6, 0.14);
  color: #b45309;
}

.badge.action.is-delete {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.badge.action.is-operate {
  background: rgba(14, 165, 233, 0.12);
  color: #0369a1;
}

.badge.action.is-security {
  background: rgba(219, 39, 119, 0.12);
  color: #be185d;
}

.badge.category {
  background: var(--app-surface-muted);
  color: var(--app-text-secondary);
  font-weight: 600;
}

.badge.result.is-success {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.badge.result.is-failure {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.empty-state {
  padding: 36px 16px;
  text-align: center;
  color: var(--app-text-muted);
  font-size: var(--type-base);
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.pagination-info {
  color: var(--app-text-muted);
  font-size: var(--type-base);
}

.pagination-controls {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.pagination-page {
  color: var(--app-text-muted);
  font-size: var(--type-caption);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
