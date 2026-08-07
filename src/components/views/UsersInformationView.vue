<template>
  <div class="info-view">
    <div class="info-card">
      <div class="card-header">
        <div>
          <h2>Information</h2>
          <p class="card-subtitle">Update your account details for this panel session.</p>
        </div>
        <div class="header-meta" v-if="profile.role">
          <span class="badge" :class="profile.role === 'Admin' ? 'admin' : 'user'">{{ profile.role }}</span>
          <span
            class="badge"
            :class="profile.status === 'Active' ? 'active' : profile.status === 'Waiting' ? 'pending' : 'blocked'"
          >
            {{ profile.status || '—' }}
          </span>
        </div>
      </div>

      <p v-if="loading" class="helper-text">Loading your information...</p>
      <p v-else-if="loadError" class="helper-text error-text">{{ loadError }}</p>

      <form v-else class="info-form" @submit.prevent="saveProfile">
        <div class="form-grid">
          <div class="form-field">
            <label for="info-name">Name</label>
            <input
              id="info-name"
              v-model="form.name"
              type="text"
              autocomplete="name"
              placeholder="Your name"
              :disabled="saving"
            />
          </div>
          <div class="form-field">
            <label for="info-email">Email</label>
            <input
              id="info-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              :disabled="saving"
            />
          </div>
          <div class="form-field form-field--full">
            <label for="info-password">Password</label>
            <input
              id="info-password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              placeholder="Leave blank to keep current password"
              :disabled="saving"
            />
            <p class="field-hint">Enter a new password only if you want to change it.</p>
          </div>
        </div>

        <div class="readonly-row">
          <div class="readonly-item">
            <span class="readonly-label">Role</span>
            <span class="readonly-value">{{ profile.role || '—' }}</span>
          </div>
          <div class="readonly-item">
            <span class="readonly-label">Status</span>
            <span class="readonly-value">{{ profile.status || '—' }}</span>
          </div>
          <div class="readonly-item">
            <span class="readonly-label">User ID</span>
            <span class="readonly-value">{{ profile.id || '—' }}</span>
          </div>
        </div>

        <div class="form-actions">
          <button class="ghost-btn" type="button" :disabled="!isDirty || saving" @click="resetForm">
            Discard
          </button>
          <button class="primary-btn" type="submit" :disabled="!isDirty || saving">
            {{ saving ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchUsers, updateUser } from '@/api/users'
import { useAuth } from '@/stores/auth'
import { notifyError, notifySuccess } from '@/utils/notify'

const INFO_TITLE = 'Information'

const auth = useAuth()
const route = useRoute()

const loading = ref(false)
const saving = ref(false)
const loadError = ref('')

const profile = reactive({
  id: null,
  name: '',
  email: '',
  password: '',
  role: '',
  status: '',
  serverIds: [],
})

const form = reactive({
  name: '',
  email: '',
  password: '',
})

const isDirty = computed(() => {
  const nameChanged = form.name.trim() !== String(profile.name || '').trim()
  const emailChanged = form.email.trim().toLowerCase() !== String(profile.email || '').trim().toLowerCase()
  const passwordChanged = form.password.trim() !== ''
  return nameChanged || emailChanged || passwordChanged
})

const applyProfile = (user) => {
  profile.id = user?.id ?? null
  profile.name = user?.name || ''
  profile.email = user?.email || ''
  profile.password = user?.password || ''
  profile.role = user?.role || ''
  profile.status = user?.status || ''
  profile.serverIds = Array.isArray(user?.serverIds) ? [...user.serverIds] : []
  resetForm()
}

const resetForm = () => {
  form.name = profile.name
  form.email = profile.email
  form.password = ''
}

const loadProfile = async () => {
  const sessionUser = auth.state.user
  if (!sessionUser?.id) {
    loadError.value = 'You are not signed in.'
    applyProfile({})
    return
  }

  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchUsers()
    const list = Array.isArray(data) ? data : []
    const match = list.find((item) => String(item.id) === String(sessionUser.id))
    if (match) {
      applyProfile(match)
    } else {
      applyProfile(sessionUser)
    }
  } catch (error) {
    applyProfile(sessionUser)
    if (!sessionUser.name && !sessionUser.email) {
      loadError.value = error?.message || 'Could not load your information.'
    }
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  if (!profile.id || saving.value || !isDirty.value) return

  const name = form.name.trim()
  const email = form.email.trim().toLowerCase()
  if (!name || !email) {
    notifyError(INFO_TITLE, 'Name and email are required.')
    return
  }

  const nextPassword = form.password.trim() || profile.password || ''
  const payload = {
    name,
    email,
    password: nextPassword,
    role: profile.role || 'User',
    status: profile.status || 'Active',
    serverIds: profile.role === 'User' ? [...profile.serverIds] : [],
  }

  saving.value = true
  try {
    const updated = await updateUser(profile.id, payload)
    applyProfile(updated || { ...profile, ...payload, password: nextPassword })
    auth.setSession({
      user: {
        ...(auth.state.user || {}),
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      },
      token: auth.state.token,
    })
    notifySuccess(INFO_TITLE, 'Your information was updated.')
  } catch (error) {
    notifyError(INFO_TITLE, error?.message || 'Could not update your information.')
  } finally {
    saving.value = false
  }
}

const focusPasswordIfRequested = () => {
  if (String(route.query.focus || '').toLowerCase() !== 'password') return
  requestAnimationFrame(() => {
    document.getElementById('info-password')?.focus()
  })
}

watch(
  () => route.query.focus,
  () => {
    focusPasswordIfRequested()
  },
)

onMounted(async () => {
  await loadProfile()
  focusPasswordIfRequested()
})
</script>

<style scoped>
.info-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-gap-lg, 14px);
}

.info-card {
  background: var(--app-surface);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: var(--space-card, 18px 20px);
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
  max-width: 760px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.card-header h2 {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--app-heading);
  letter-spacing: -0.5px;
}

.card-subtitle {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.helper-text {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 0.92rem;
}

.error-text {
  color: #b91c1c;
}

.info-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--app-text-muted);
}

.form-field input {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.92rem;
  color: var(--app-text);
  background: var(--app-input-bg);
  outline: none;
}

.form-field input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.field-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--app-text-muted);
}

.readonly-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
}

.readonly-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.readonly-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.readonly-value {
  font-size: 0.9rem;
  font-weight: 650;
  color: var(--app-heading);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.badge {
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
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

@media (max-width: 720px) {
  .form-grid,
  .readonly-row {
    grid-template-columns: 1fr;
  }
}
</style>
