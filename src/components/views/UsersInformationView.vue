<template>
  <div class="users-information-view">
    <div class="content-card account-overview">
      <div class="section-head">
          <h3>Account overview</h3>
          <p>Your panel identity and account status.</p>
      </div>

      <div class="overview-grid">
          <div class="overview-item">
            <span class="overview-label">Display name</span>
            <span class="overview-value">{{ displayName || '—' }}</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">Email</span>
            <span class="overview-value">{{ profile.email || '—' }}</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">Role</span>
            <span class="overview-value">
              <span v-if="profile.role" class="badge" :class="profile.role === 'Admin' ? 'admin' : 'user'">
                {{ profile.role }}
              </span>
              <span v-else>—</span>
            </span>
          </div>
          <div class="overview-item">
            <span class="overview-label">Status</span>
            <span class="overview-value">
              <span
                v-if="profile.status"
                class="badge"
                :class="profile.status === 'Active' ? 'active' : profile.status === 'Waiting' ? 'pending' : 'blocked'"
              >
                {{ profile.status }}
              </span>
              <span v-else>—</span>
            </span>
          </div>
        </div>
    </div>

    <div class="info-layout">
      <aside class="content-card history-panel">
        <div class="history-panel__head">
          <div class="section-head section-head--compact">
            <h3>Activity history</h3>
            <p>Login, logout, and license events for your account.</p>
          </div>
          <button
            class="ghost-btn history-panel__refresh"
            type="button"
            :disabled="historyLoading || !profile.id"
            @click="loadUserHistory"
          >
            {{ historyLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        <p v-if="historyError" class="helper-text error-text">{{ historyError }}</p>
        <p v-else-if="historyLoading && !historyEntries.length" class="helper-text">Loading activity...</p>
        <p v-else-if="!historyEntries.length" class="helper-text">No login, logout, or license activity recorded yet.</p>

        <ul v-else class="history-list">
          <li v-for="entry in historyEntries" :key="entry.id" class="history-item">
            <div class="history-item__head">
              <span class="badge action" :class="actionClass(entry.action)">{{ formatAction(entry.action) }}</span>
              <span
                class="history-item__kind"
                :class="isLicenseHistoryEntry(entry) && !isAuthHistoryEntry(entry) ? 'history-item__kind--license' : 'history-item__kind--auth'"
              >
                {{ historyKindLabel(entry) }}
              </span>
              <time class="history-item__time">{{ formatHistoryTime(entry.createdAt) }}</time>
            </div>
            <p class="history-item__summary">{{ historySummary(entry) }}</p>
            <div v-if="entry.resourceName || entry.ipAddress" class="history-item__meta">
              <span v-if="entry.resourceName">{{ entry.resourceName }}</span>
              <span v-if="entry.ipAddress">{{ entry.ipAddress }}</span>
            </div>
          </li>
        </ul>
      </aside>

      <div class="content-card info-card">
      <div class="card-header">
        <div>
          <h2>Information</h2>
          <p class="card-subtitle">Update profile details, email, and password for this account.</p>
        </div>
      </div>

      <p v-if="loading" class="helper-text">Loading your information...</p>
      <p v-else-if="loadError" class="helper-text error-text">{{ loadError }}</p>

      <form v-else class="info-form" @submit.prevent="saveProfile">
        <section class="info-section">
          <div class="section-head section-head--compact">
            <h3>Profile</h3>
            <p>Your name as shown across the operator console.</p>
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label for="info-first-name">First Name</label>
              <input
                id="info-first-name"
                v-model="form.firstName"
                type="text"
                autocomplete="given-name"
                placeholder="First name"
                :disabled="saving"
              />
            </div>
            <div class="form-field">
              <label for="info-second-name">Second Name</label>
              <input
                id="info-second-name"
                v-model="form.secondName"
                type="text"
                autocomplete="family-name"
                placeholder="Second name"
                :disabled="saving"
              />
            </div>
          </div>
        </section>

        <section ref="emailSectionRef" class="info-section">
          <div class="section-head section-head--compact">
            <h3>Email address</h3>
            <p>Used for sign-in and account notifications.</p>
          </div>
          <div class="form-field form-field--full email-field">
            <div class="field-label-row">
              <label for="info-email">Email</label>
              <button
                v-if="!isEditingEmail"
                class="secondary-btn field-action-btn"
                type="button"
                :disabled="saving"
                @click="startEmailChange"
              >
                Change email
              </button>
              <button
                v-else
                class="ghost-btn field-action-btn"
                type="button"
                :disabled="saving"
                @click="cancelEmailEdit"
              >
                Cancel
              </button>
            </div>
            <input
              id="info-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              :readonly="!isEditingEmail"
              :disabled="saving"
              :class="{ 'input-readonly': !isEditingEmail }"
            />
            <p v-if="!isEditingEmail" class="field-hint">Select Change email to update your sign-in address.</p>
            <p v-else class="field-hint">Save changes to apply the new email address.</p>
          </div>
        </section>

        <section ref="securitySectionRef" class="info-section">
          <div class="section-head section-head--compact">
            <h3>Security</h3>
            <p>Enter your current password before setting a new one.</p>
          </div>
          <div class="form-grid">
            <div class="form-field form-field--full">
              <label for="info-current-password">Current password</label>
              <input
                id="info-current-password"
                v-model="form.currentPassword"
                type="password"
                autocomplete="current-password"
                placeholder="Required to change password"
                :disabled="saving"
                :class="{ 'input-invalid': showCurrentPasswordError }"
              />
              <p v-if="showCurrentPasswordError" class="field-hint field-hint--error">Current password is incorrect.</p>
            </div>
            <div class="form-field">
              <label for="info-password">New password</label>
              <input
                id="info-password"
                v-model="form.password"
                type="password"
                autocomplete="new-password"
                placeholder="Leave blank to keep current"
                :disabled="saving"
              />
            </div>
            <div class="form-field">
              <label for="info-confirm-password">Confirm new password</label>
              <input
                id="info-confirm-password"
                v-model="form.confirmPassword"
                type="password"
                autocomplete="new-password"
                placeholder="Re-enter new password"
                :disabled="saving"
                :class="{ 'input-invalid': showPasswordMismatch }"
              />
              <p v-if="showPasswordMismatch" class="field-hint field-hint--error">New passwords do not match.</p>
            </div>
          </div>
        </section>

        <div class="form-actions">
          <button class="ghost-btn" type="button" :disabled="!isDirty || saving" @click="resetForm">
            Discard
          </button>
          <button class="primary-btn" type="submit" :disabled="!canSave">
            {{ saving ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchAuditLogs } from '@/api/auditLogs'
import { fetchUsers, updateUser } from '@/api/users'
import { useAuth } from '@/stores/auth'
import { notifyError, notifySuccess } from '@/utils/notify'
import { joinDisplayName, splitDisplayName } from '@/utils/userName'

const INFO_TITLE = 'Information'

const auth = useAuth()
const route = useRoute()

const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const historyLoading = ref(false)
const historyError = ref('')
const historyEntries = ref([])
const isEditingEmail = ref(false)
const emailSectionRef = ref(null)
const securitySectionRef = ref(null)

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
  firstName: '',
  secondName: '',
  email: '',
  currentPassword: '',
  password: '',
  confirmPassword: '',
})

const profileNames = computed(() => splitDisplayName(profile.name))

const displayName = computed(() => joinDisplayName(form.firstName.trim(), form.secondName.trim()) || profile.name)

const isChangingPassword = computed(
  () =>
    form.password.trim() !== '' ||
    form.confirmPassword.trim() !== '' ||
    form.currentPassword.trim() !== ''
)

const showPasswordMismatch = computed(
  () =>
    (form.password.trim() !== '' || form.confirmPassword.trim() !== '') &&
    form.confirmPassword !== '' &&
    form.password !== form.confirmPassword
)

const showCurrentPasswordError = computed(
  () =>
    isChangingPassword.value &&
    form.currentPassword.trim() !== '' &&
    form.currentPassword !== profile.password
)

const passwordsValid = computed(() => {
  if (!isChangingPassword.value) return true
  if (!form.currentPassword.trim() || form.currentPassword !== profile.password) return false
  if (!form.password.trim() || !form.confirmPassword.trim()) return false
  return form.password === form.confirmPassword
})

const emailChanged = computed(
  () => isEditingEmail.value && form.email.trim().toLowerCase() !== String(profile.email || '').trim().toLowerCase()
)

const isDirty = computed(() => {
  const nameChanged =
    form.firstName.trim() !== profileNames.value.firstName ||
    form.secondName.trim() !== profileNames.value.secondName
  return nameChanged || emailChanged.value || isChangingPassword.value
})

const canSave = computed(() => isDirty.value && passwordsValid.value && !saving.value)

const AUTH_ACTIONS = new Set(['login', 'logout', 'login_failed'])

const isAuthHistoryEntry = (entry) =>
  entry?.category === 'auth' || AUTH_ACTIONS.has(String(entry?.action || '').toLowerCase())

const isLicenseHistoryEntry = (entry) => {
  const path = String(entry?.path || '').toLowerCase()
  const details = String(entry?.details || '').toLowerCase()
  const resource = String(entry?.resourceName || '').toLowerCase()
  if (path.includes('license') || path.includes('upgrade-license')) return true
  if (details.includes('license') || resource.includes('license')) return true
  if (path === '/servers' && entry?.action === 'create' && entry?.category === 'edge') return true
  return /\/servers\/\d+\/upgrade-license/.test(path)
}

const isRelevantHistoryEntry = (entry) => isAuthHistoryEntry(entry) || isLicenseHistoryEntry(entry)

const formatHistoryTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
  }
  return map[String(value || '').toLowerCase()] || value || 'Event'
}

const historyKindLabel = (entry) => (isLicenseHistoryEntry(entry) && !isAuthHistoryEntry(entry) ? 'License' : 'Authentication')

const historySummary = (entry) => {
  if (entry?.details) return entry.details
  if (entry?.resourceName) return entry.resourceName
  if (entry?.path) return entry.path
  return 'Account activity'
}

const actionClass = (value) => {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'login') return 'is-login'
  if (normalized === 'logout') return 'is-logout'
  if (normalized === 'login_failed') return 'is-failed'
  if (normalized === 'create') return 'is-create'
  if (normalized === 'update') return 'is-update'
  return 'is-update'
}

const loadUserHistory = async () => {
  if (!profile.id) {
    historyEntries.value = []
    return
  }

  historyLoading.value = true
  historyError.value = ''
  try {
    const data = await fetchAuditLogs({
      limit: 200,
      actorUserId: profile.id,
    })
    const list = Array.isArray(data) ? data : []
    historyEntries.value = list.filter(isRelevantHistoryEntry)
  } catch (error) {
    historyEntries.value = []
    historyError.value = error?.message || 'Could not load activity history.'
  } finally {
    historyLoading.value = false
  }
}

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
  const names = splitDisplayName(profile.name)
  form.firstName = names.firstName
  form.secondName = names.secondName
  form.email = profile.email
  form.currentPassword = ''
  form.password = ''
  form.confirmPassword = ''
  isEditingEmail.value = false
}

const scrollToSection = async (sectionRef) => {
  await nextTick()
  sectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const startEmailChange = async () => {
  isEditingEmail.value = true
  await scrollToSection(emailSectionRef)
  document.getElementById('info-email')?.focus()
}

const cancelEmailEdit = () => {
  form.email = profile.email
  isEditingEmail.value = false
}

const startPasswordChange = async () => {
  await scrollToSection(securitySectionRef)
  document.getElementById('info-current-password')?.focus()
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
    applyProfile(match || sessionUser)
  } catch (error) {
    applyProfile(sessionUser)
    if (!sessionUser.name && !sessionUser.email) {
      loadError.value = error?.message || 'Could not load your information.'
    }
  } finally {
    loading.value = false
    if (profile.id) {
      void loadUserHistory()
    }
  }
}

const saveProfile = async () => {
  if (!profile.id || saving.value || !canSave.value) return

  const firstName = form.firstName.trim()
  const secondName = form.secondName.trim()
  const name = joinDisplayName(firstName, secondName)
  const email = (isEditingEmail.value ? form.email : profile.email).trim().toLowerCase()

  if (!firstName || !email) {
    notifyError(INFO_TITLE, 'First name and email are required.')
    return
  }

  const newPassword = form.password.trim()
  if (isChangingPassword.value) {
    if (form.currentPassword !== profile.password) {
      notifyError(INFO_TITLE, 'Current password is incorrect.')
      return
    }
    if (!newPassword) {
      notifyError(INFO_TITLE, 'Enter a new password to complete the change.')
      return
    }
    if (newPassword !== form.confirmPassword) {
      notifyError(INFO_TITLE, 'New password and confirm password must match.')
      return
    }
  }

  const nextPassword = newPassword || profile.password || ''
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
      rememberMe: auth.state.rememberMe,
    })
    notifySuccess(INFO_TITLE, 'Your information was updated.')
    void loadUserHistory()
  } catch (error) {
    notifyError(INFO_TITLE, error?.message || 'Could not update your information.')
  } finally {
    saving.value = false
  }
}

const focusPasswordIfRequested = () => {
  if (String(route.query.focus || '').toLowerCase() !== 'password') return
  startPasswordChange()
}

watch(
  () => route.query.focus,
  () => {
    focusPasswordIfRequested()
  }
)

onMounted(async () => {
  await loadProfile()
  focusPasswordIfRequested()
})
</script>

<style scoped>
.users-information-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-gap-lg);
}

.account-overview,
.info-card,
.history-panel {
  width: 100%;
}

.info-layout {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.35fr);
  gap: var(--space-gap-lg);
  align-items: start;
}

.history-panel {
  min-height: 420px;
  display: flex;
  flex-direction: column;
}

.history-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.history-panel__refresh {
  flex-shrink: 0;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  max-height: min(68vh, 720px);
}

.history-item {
  padding: 12px 14px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-elevated);
}

.history-item__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.history-item__kind {
  font-family: var(--font-mono);
  font-size: var(--type-caption);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.history-item__kind--license {
  color: var(--dorian-gold-500);
}

.history-item__kind--auth {
  color: var(--dorian-viper-400);
}

.history-item__time {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.history-item__summary {
  margin: 0;
  font-size: var(--type-base);
  color: var(--app-text);
  line-height: 1.45;
}

.history-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-top: 6px;
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.badge.action {
  padding: 4px 8px;
  border-radius: var(--badge-radius, 4px);
  font-size: var(--type-caption);
  font-weight: 700;
}

.badge.action.is-login {
  background: rgba(79, 189, 122, 0.14);
  color: var(--dorian-success);
}

.badge.action.is-logout {
  background: rgba(91, 157, 240, 0.14);
  color: var(--dorian-l4);
}

.badge.action.is-failed {
  background: rgba(225, 82, 65, 0.14);
  color: var(--dorian-danger);
}

.badge.action.is-create {
  background: var(--dorian-viper-dim);
  color: var(--dorian-viper-400);
}

.badge.action.is-update {
  background: var(--dorian-gold-dim);
  color: var(--dorian-gold-500);
}

.info-card {
  max-width: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: var(--space-gap-lg);
}

.card-header h2,
.section-head h3 {
  margin: 0 0 3px;
  font-size: var(--type-section-title);
  font-weight: 600;
  color: var(--app-heading);
}

.card-subtitle,
.section-head p {
  margin: 0;
  color: var(--app-text-muted);
  font-size: var(--type-page-subtitle);
  line-height: 1.45;
}

.section-head {
  margin-bottom: var(--space-gap-lg);
}

.section-head--compact {
  margin-bottom: 12px;
}

.helper-text {
  margin: 0;
  color: var(--app-text-muted);
  font-size: var(--type-base);
}

.error-text {
  color: var(--dorian-danger);
}

.info-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-gap-lg);
}

.info-section {
  padding-top: 4px;
}

.info-section + .info-section {
  border-top: 0.5px solid var(--app-border);
  padding-top: var(--space-gap-lg);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-gap-lg);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-field--full {
  grid-column: 1 / -1;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.field-action-btn {
  min-height: var(--btn-height-sm);
  height: var(--btn-height-sm);
  padding: 0 var(--btn-padding-x-sm);
  font-size: var(--btn-font-size-sm);
}

.form-field label,
.overview-label {
  font-family: var(--font-mono);
  font-size: var(--type-label);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  font-weight: 500;
}

.form-field input {
  border: 0.5px solid var(--app-input-border);
  border-radius: 6px;
  padding: 7px 10px;
  font-size: var(--type-base);
  color: var(--app-text);
  background: var(--app-input-bg);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-field input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.form-field input.input-readonly {
  background: var(--app-surface-muted);
  color: var(--app-text-secondary);
  cursor: default;
}

.form-field input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.form-field input.input-readonly:focus {
  box-shadow: none;
  border-color: var(--app-input-border);
}

.form-field input.input-invalid {
  border-color: var(--dorian-danger);
}

.form-field input.input-invalid:focus {
  box-shadow: 0 0 0 3px rgba(225, 82, 65, 0.18);
}

.field-hint {
  margin: 0;
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.field-hint--error {
  color: var(--dorian-danger);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-gap);
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 12px 14px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-elevated);
}

.overview-value {
  font-size: var(--type-base);
  font-weight: 600;
  color: var(--app-heading);
  word-break: break-word;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-gap);
  padding-top: 2px;
}

.badge {
  padding: 5px 11px;
  border-radius: 20px;
  font-family: var(--font-mono);
  font-size: var(--type-caption);
  font-weight: 600;
  display: inline-block;
}

.badge.admin,
.badge.active {
  background: var(--dorian-viper-dim);
  color: var(--dorian-viper-400);
}

.badge.user {
  background: var(--app-surface-muted);
  color: var(--app-text-secondary);
  border: 0.5px solid var(--app-border);
}

.badge.pending {
  background: var(--dorian-gold-dim);
  color: var(--dorian-gold-500);
}

.badge.blocked {
  background: rgba(225, 82, 65, 0.15);
  color: var(--dorian-danger);
}

@media (max-width: 960px) {
  .info-layout {
    grid-template-columns: 1fr;
  }

  .history-list {
    max-height: 360px;
  }
}

@media (max-width: 720px) {
  .form-grid,
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions .ghost-btn,
  .form-actions .primary-btn {
    width: 100%;
  }
}
</style>
