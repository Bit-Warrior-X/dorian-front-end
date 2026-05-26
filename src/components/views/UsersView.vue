<template>
  <div class="users-view">
    <div class="users-card">
      <div class="card-header">
        <h2>User Management</h2>
        <button class="add-button" type="button" @click="openAddDialog">+ Add User</button>
      </div>
      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Password</th>
              <th>Role</th>
              <th>Status</th>
              <th>Servers</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ maskPassword(user.password) }}</td>
              <td>
                <span class="badge" :class="user.role === 'Admin' ? 'admin' : 'user'">{{ user.role }}</span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="user.status === 'Active' ? 'active' : user.status === 'Waiting' ? 'pending' : 'blocked'"
                >
                  {{ user.status }}
                </span>
              </td>
              <td>
                <div v-if="user.role === 'User' && user.servers?.length" class="server-list">
                  <span v-for="server in user.servers" :key="server" class="server-pill">{{ server }}</span>
                </div>
                <span v-else class="muted-text">—</span>
              </td>
              <td>
                <div class="actions">
                  <button class="action-btn action-btn--edit" type="button" aria-label="Edit" @click="openEditDialog(user)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                    </svg>
                  </button>
                  <button class="action-btn action-btn--block" type="button" aria-label="Block" @click="confirmBlockUser(user)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9"></circle>
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                    </svg>
                  </button>
                  <button class="action-btn action-btn--delete" type="button" aria-label="Delete" @click="confirmDeleteUser(user)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6l-1 14H6L5 6"></path>
                      <path d="M10 11v6"></path>
                      <path d="M14 11v6"></path>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-if="isAddDialogOpen" class="dialog-backdrop" @click="closeAddDialog">
      <div class="dialog-card" @click.stop>
        <div class="dialog-header">
          <h4>{{ isEditMode ? 'Edit User' : 'Add User' }}</h4>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeAddDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-grid">
          <div class="dialog-field">
            <label for="add-user-name">Name</label>
            <input id="add-user-name" v-model="newUser.name" type="text" placeholder="Jane Doe" />
          </div>
          <div class="dialog-field">
            <label for="add-user-email">Email</label>
            <input id="add-user-email" v-model="newUser.email" type="email" placeholder="jane@example.com" />
          </div>
          <div class="dialog-field">
            <label for="add-user-password">Password</label>
            <input id="add-user-password" v-model="newUser.password" type="password" placeholder="Enter a password" />
          </div>
          <div class="dialog-field">
            <label for="add-user-role">Role</label>
            <select id="add-user-role" v-model="newUser.role">
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>
          <div class="dialog-field">
            <label for="add-user-status">Status</label>
            <select id="add-user-status" v-model="newUser.status">
              <option value="Waiting">Waiting</option>
              <option value="Active">Active</option>
              <option value="Block">Block</option>
            </select>
          </div>
          <div v-if="newUser.role === 'User'" class="dialog-field dialog-field--full">
            <label>Servers</label>
            <div class="server-options">
              <label v-for="server in serverOptions" :key="server.id" class="server-option">
                <input v-model="newUser.serverIds" type="checkbox" :value="server.id" />
                <span>{{ server.name || server.ip || `Server #${server.id}` }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="ghost-btn" type="button" @click="closeAddDialog">Cancel</button>
          <button class="primary-btn" type="button" @click="submitAddUser">
            {{ isEditMode ? 'Save Changes' : 'Add User' }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="isConfirmDialogOpen" class="dialog-backdrop" @click="closeConfirmDialog">
      <div class="dialog-card dialog-card--confirm" @click.stop>
        <div class="dialog-header">
          <h4>{{ confirmTitle }}</h4>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeConfirmDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p class="dialog-text">{{ confirmMessage }}</p>
        <div class="dialog-actions">
          <button class="ghost-btn" type="button" @click="closeConfirmDialog">Cancel</button>
          <button class="danger-btn" type="button" @click="confirmAction">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { createUser, deleteUser, fetchUsers, updateUser } from '@/api/users'
import { fetchServers } from '@/api/servers'

const users = ref([])
const isLoading = ref(false)

const isAddDialogOpen = ref(false)
const isEditMode = ref(false)
const editingUserId = ref(null)
const isConfirmDialogOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
let pendingConfirmAction = null
const serverOptions = ref([])
const newUser = reactive({
  name: '',
  email: '',
  password: '',
  role: 'User',
  status: 'Waiting',
  serverIds: [],
})

const openAddDialog = () => {
  isEditMode.value = false
  editingUserId.value = null
  resetNewUser()
  isAddDialogOpen.value = true
}

const openEditDialog = (user) => {
  isEditMode.value = true
  editingUserId.value = user.id
  newUser.name = user.name
  newUser.email = user.email
  newUser.password = user.password || ''
  newUser.role = user.role
  newUser.status = user.status
  newUser.serverIds = user.serverIds ? [...user.serverIds] : []
  isAddDialogOpen.value = true
}

const closeAddDialog = () => {
  isAddDialogOpen.value = false
}

const resetNewUser = () => {
  newUser.name = ''
  newUser.email = ''
  newUser.password = ''
  newUser.role = 'User'
  newUser.status = 'Waiting'
  newUser.serverIds = []
}

const loadUsers = async () => {
  isLoading.value = true
  try {
    const data = await fetchUsers()
    users.value = Array.isArray(data) ? data : []
  } catch {
    users.value = []
  } finally {
    isLoading.value = false
  }
}

const submitAddUser = async () => {
  const name = newUser.name.trim()
  const email = newUser.email.trim()

  if (!name || !email) {
    return
  }

  const payload = {
    name,
    email,
    password: newUser.password.trim(),
    role: newUser.role,
    status: newUser.status,
    serverIds: newUser.role === 'User' ? [...newUser.serverIds] : [],
  }

  if (isEditMode.value && editingUserId.value) {
    try {
      await updateUser(editingUserId.value, payload)
      await loadUsers()
    } catch {
      return
    }
  } else {
    try {
      await createUser(payload)
      await loadUsers()
    } catch {
      return
    }
  }

  resetNewUser()
  isAddDialogOpen.value = false
}

const closeConfirmDialog = () => {
  isConfirmDialogOpen.value = false
  pendingConfirmAction = null
}

const openConfirmDialog = (title, message, action) => {
  confirmTitle.value = title
  confirmMessage.value = message
  pendingConfirmAction = action
  isConfirmDialogOpen.value = true
}

const confirmAction = () => {
  if (pendingConfirmAction) {
    pendingConfirmAction()
  }
  closeConfirmDialog()
}

const confirmDeleteUser = (user) => {
  openConfirmDialog(
    'Delete User',
    `Are you sure you want to delete ${user.name}?`,
    async () => {
      try {
        await deleteUser(user.id)
        await loadUsers()
      } catch {
        return
      }
    },
  )
}

const confirmBlockUser = (user) => {
  const nextStatus = user.status === 'Block' ? 'Active' : 'Block'
  const actionLabel = nextStatus === 'Block' ? 'block' : 'unblock'
  openConfirmDialog(
    `${nextStatus === 'Block' ? 'Block' : 'Unblock'} User`,
    `Are you sure you want to ${actionLabel} ${user.name}?`,
    async () => {
      const payload = {
        name: user.name,
        email: user.email,
        password: user.password || '',
        role: user.role,
        status: nextStatus,
        serverIds: user.role === 'User' ? [...(user.serverIds || [])] : [],
      }
      try {
        await updateUser(user.id, payload)
        await loadUsers()
      } catch {
        return
      }
    },
  )
}

const maskPassword = (value) => {
  if (!value) return 'N/A'
  return '******'
}

const loadServers = async () => {
  try {
    const data = await fetchServers()
    serverOptions.value = Array.isArray(data) ? data : []
  } catch {
    serverOptions.value = []
  }
}

watch(
  () => newUser.role,
  (role) => {
    if (role !== 'User') {
      newUser.serverIds = []
    }
  },
)

onMounted(() => {
  void loadUsers()
  void loadServers()
})
</script>

<style scoped>
.users-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-gap-lg, 14px);
}

.users-card {
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
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: var(--space-gap-lg, 14px);
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--app-heading);
  margin: 0;
  letter-spacing: -0.5px;
}

.add-button {
  /* colors from theme.css */
}

.users-table {
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
  transition: background 0.2s;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  color: #b91c1c;
}

.muted-text {
  color: var(--app-text-muted);
  font-size: 0.85rem;
}

.server-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.server-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--app-accent);
  background: var(--app-accent-soft);
  border: 1px solid var(--app-border);
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  background: var(--app-surface-hover);
  border: 1px solid var(--app-border-strong);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--app-border-strong);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn--edit {
  color: #1d4ed8;
  border-color: rgba(147, 197, 253, 0.8);
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.action-btn--edit:hover {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.action-btn--block {
  color: #b45309;
  border-color: rgba(253, 230, 138, 0.9);
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.action-btn--block:hover {
  background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
}

.action-btn--delete {
  color: #b91c1c;
  border-color: rgba(254, 202, 202, 0.9);
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.action-btn--delete:hover {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: var(--app-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.dialog-card {
  width: 100%;
  max-width: 560px;
  background: var(--app-surface-solid);
  border-radius: 18px;
  box-shadow: 0 24px 48px var(--app-shadow);
  border: 1px solid var(--app-border-strong);
  padding: 24px;
}

.dialog-card--confirm {
  max-width: 480px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.dialog-header h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--app-heading);
}

.dialog-close {
  border: none;
  background: var(--app-surface-hover);
  color: var(--app-text-muted);
  width: 32px;
  height: 32px;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.dialog-close:hover {
  background: var(--app-border-strong);
  color: var(--app-text);
}

.dialog-text {
  margin: 4px 0 16px;
  color: var(--app-text-secondary);
  font-size: 0.95rem;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.dialog-field--full {
  grid-column: 1 / -1;
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-field label {
  font-size: 0.85rem;
  color: var(--app-text-muted);
  font-weight: 500;
}

.dialog-field input,
.dialog-field select {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.9rem;
  color: var(--app-text);
  background: var(--app-input-bg);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.server-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.server-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  font-size: 0.85rem;
  color: var(--app-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.server-option input {
  accent-color: var(--app-accent);
}

.server-option:hover {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
}

.dialog-field input:focus,
.dialog-field select:focus {
  outline: none;
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.ghost-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-hover);
  color: var(--app-text-secondary);
  transition: all 0.2s ease;
}

.ghost-btn:hover {
  border-color: var(--app-border-strong);
  color: var(--app-text);
  background: var(--app-border-strong);
}

.danger-btn,
.primary-btn {
  /* colors from theme.css */
}

[data-theme='dark'] .badge.admin {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

[data-theme='dark'] .badge.user {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
}

[data-theme='dark'] .badge.active {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
}

[data-theme='dark'] .badge.pending {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}

[data-theme='dark'] .badge.blocked {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

[data-theme='dark'] .action-btn--delete,
[data-theme='dark'] .action-btn--block {
  color: var(--app-btn-danger-bg);
}
</style>

