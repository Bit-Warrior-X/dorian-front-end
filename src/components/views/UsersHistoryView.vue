<template>
  <div class="history-view">
    <div class="history-card">
      <div class="card-header">
        <div>
          <h2>User History</h2>
          <p class="card-subtitle">Account activity for panel users, newest first.</p>
        </div>
        <button class="ghost-btn" type="button" :disabled="isLoading" @click="loadHistory">
          {{ isLoading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <div class="history-table">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Email</th>
              <th>Event</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in historyEntries" :key="entry.id">
              <td>{{ formatTime(entry.time) }}</td>
              <td>{{ entry.name }}</td>
              <td>{{ entry.email }}</td>
              <td>
                <span class="badge event">{{ entry.event }}</span>
              </td>
              <td>
                <span class="badge" :class="entry.role === 'Admin' ? 'admin' : 'user'">
                  {{ entry.role }}
                </span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="entry.status === 'Active' ? 'active' : entry.status === 'Waiting' ? 'pending' : 'blocked'"
                >
                  {{ entry.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!isLoading && !historyEntries.length" class="empty-state">
          No user history available yet.
        </div>
        <div v-else-if="isLoading && !historyEntries.length" class="empty-state">
          Loading history...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchUsers } from '@/api/users'
import { notifyError } from '@/utils/notify'

const HISTORY_TITLE = 'User History'

const users = ref([])
const isLoading = ref(false)

const historyEntries = computed(() =>
  [...users.value]
    .map((user) => ({
      id: `created-${user.id}`,
      time: user.created || null,
      name: user.name || '—',
      email: user.email || '—',
      event: 'Account created',
      role: user.role || 'User',
      status: user.status || 'Waiting',
    }))
    .sort((a, b) => {
      const aTime = a.time ? new Date(a.time).getTime() : 0
      const bTime = b.time ? new Date(b.time).getTime() : 0
      return bTime - aTime
    }),
)

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
  })
}

const loadHistory = async () => {
  isLoading.value = true
  try {
    const data = await fetchUsers()
    users.value = Array.isArray(data) ? data : []
  } catch (error) {
    users.value = []
    notifyError(HISTORY_TITLE, error?.message || 'Could not load user history.')
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
  margin-bottom: var(--space-gap-lg, 14px);
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--app-heading);
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.card-subtitle {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.history-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: var(--app-surface-muted);
}

th {
  padding: 12px 14px;
  text-align: left;
  font-size: 0.75rem;
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
}

tbody tr:hover {
  background: var(--app-surface-hover);
}

.badge {
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
}

.badge.event {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.badge.admin {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
}

.badge.user {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #374151;
}

.badge.active {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.badge.pending {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.badge.blocked {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.empty-state {
  padding: 36px 16px;
  text-align: center;
  color: var(--app-text-muted);
  font-size: 0.95rem;
}
</style>
