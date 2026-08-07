<template>
  <div class="history-view">
    <div class="history-card">
      <div class="card-header">
        <div>
          <h2>Audit History</h2>
          <p class="card-subtitle">
            Sensitive panel activity including authentication, users, edges, sites, WAF rules, and blocked lists.
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
            placeholder="User, email, IP, resource, details..."
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
              <th>Action</th>
              <th>Category</th>
              <th>Resource</th>
              <th>IP</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in entries" :key="entry.id">
              <td class="time-cell">{{ formatTime(entry.createdAt) }}</td>
              <td>
                <div class="actor-cell">
                  <strong>{{ entry.actorName || 'System' }}</strong>
                  <span v-if="entry.actorEmail" class="actor-email">{{ entry.actorEmail }}</span>
                  <span v-if="entry.actorRole" class="actor-role">{{ entry.actorRole }}</span>
                </div>
              </td>
              <td>
                <span class="badge action" :class="actionClass(entry.action)">
                  {{ formatAction(entry.action) }}
                </span>
              </td>
              <td>
                <span class="badge category">{{ formatCategory(entry.category) }}</span>
              </td>
              <td>
                <div class="resource-cell">
                  <strong>{{ entry.resourceName || '—' }}</strong>
                  <span v-if="entry.resourceId" class="resource-id">#{{ entry.resourceId }}</span>
                </div>
              </td>
              <td>{{ entry.ipAddress || '—' }}</td>
              <td class="details-cell">{{ entry.details || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!isLoading && !entries.length" class="empty-state">
          No audit history matches the current filters.
        </div>
        <div v-else-if="isLoading && !entries.length" class="empty-state">
          Loading audit history...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { fetchAuditLogs } from '@/api/auditLogs'
import { notifyError } from '@/utils/notify'

const HISTORY_TITLE = 'Audit History'

const entries = ref([])
const isLoading = ref(false)

const filters = reactive({
  search: '',
  category: '',
  action: '',
})

const categoryOptions = [
  { value: 'auth', label: 'Authentication' },
  { value: 'user', label: 'Users' },
  { value: 'edge', label: 'Edges' },
  { value: 'listening_port', label: 'Listening ports' },
  { value: 'l4', label: 'L4' },
  { value: 'site', label: 'Sites' },
  { value: 'origin', label: 'Origins' },
  { value: 'cache', label: 'Cache' },
  { value: 'compress', label: 'Compress' },
  { value: 'ports', label: 'Ports' },
  { value: 'waf', label: 'WAF' },
  { value: 'waf_rule', label: 'WAF rules' },
  { value: 'blacklist', label: 'Blocked list' },
]

const actionOptions = [
  { value: 'login', label: 'Login' },
  { value: 'login_failed', label: 'Login failed' },
  { value: 'logout', label: 'Logout' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'batch_delete', label: 'Batch delete' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'fork', label: 'Fork' },
]

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

const formatAction = (value) => {
  const map = {
    login: 'Login',
    login_failed: 'Login failed',
    logout: 'Logout',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    batch_delete: 'Batch delete',
    duplicate: 'Duplicate',
    fork: 'Fork',
  }
  return map[String(value || '').toLowerCase()] || value || '—'
}

const formatCategory = (value) => {
  const map = {
    auth: 'Authentication',
    user: 'Users',
    edge: 'Edges',
    listening_port: 'Listening ports',
    l4: 'L4',
    site: 'Sites',
    origin: 'Origins',
    cache: 'Cache',
    compress: 'Compress',
    ports: 'Ports',
    waf: 'WAF',
    waf_rule: 'WAF rules',
    blacklist: 'Blocked list',
  }
  return map[String(value || '').toLowerCase()] || value || '—'
}

const actionClass = (value) => {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'login') return 'is-login'
  if (normalized === 'logout') return 'is-logout'
  if (normalized === 'login_failed') return 'is-failed'
  if (normalized === 'delete' || normalized === 'batch_delete') return 'is-delete'
  if (normalized === 'create') return 'is-create'
  return 'is-update'
}

const loadHistory = async () => {
  isLoading.value = true
  try {
    const data = await fetchAuditLogs({
      limit: 300,
      category: filters.category,
      action: filters.action,
      search: filters.search.trim(),
    })
    entries.value = Array.isArray(data) ? data : []
  } catch (error) {
    entries.value = []
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
  grid-template-columns: minmax(220px, 2fr) minmax(160px, 1fr) minmax(160px, 1fr) auto;
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

.actor-cell,
.resource-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.actor-cell strong,
.resource-cell strong {
  font-size: var(--type-base);
  color: var(--app-heading);
}

.actor-email,
.actor-role,
.resource-id {
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.details-cell {
  max-width: 280px;
  font-size: var(--type-base);
  line-height: 1.4;
  color: var(--app-text-secondary);
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

.badge.category {
  background: var(--app-surface-muted);
  color: var(--app-text-secondary);
}

.empty-state {
  padding: 36px 16px;
  text-align: center;
  color: var(--app-text-muted);
  font-size: var(--type-base);
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
