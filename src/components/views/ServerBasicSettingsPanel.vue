<template>
  <div class="basic-cfg">
    <header class="cfg-head">
      <div class="cfg-head__copy">
        <span class="cfg-head__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></svg>
        </span>
        <div>
          <p class="cfg-head__kicker">Edge</p>
          <h4>Basic info</h4>
          <p class="cfg-head__desc">Name, address, SSH credentials and who can manage this edge.</p>
        </div>
      </div>
    </header>

    <div class="basic-cfg__grid">
      <div class="basic-cfg__col">
        <section class="basic-cfg__card">
          <header class="basic-cfg__card-head">
            <h4>General</h4>
            <p>How this edge is named and reached across the console.</p>
          </header>
          <div class="basic-cfg__fields">
            <label class="basic-cfg__field">
              <span>Edge name</span>
              <input v-model.trim="form.name" type="text" placeholder="e.g. edge-fra-01" :class="{ invalid: !form.name }" />
            </label>
            <label class="basic-cfg__field">
              <span>IP address</span>
              <input v-model.trim="form.ip" class="num" type="text" placeholder="203.0.113.10" :class="{ invalid: !form.ip }" />
            </label>
          </div>
        </section>

        <section class="basic-cfg__card">
          <header class="basic-cfg__card-head">
            <h4>SSH access</h4>
            <p>Credentials Dorian uses to deploy, probe and manage this host.</p>
          </header>
          <div class="basic-cfg__fields">
            <label class="basic-cfg__field">
              <span>Username</span>
              <input v-model.trim="form.sshUser" type="text" placeholder="root" autocomplete="off" />
            </label>
            <label class="basic-cfg__field">
              <span>SSH port</span>
              <input v-model.trim="form.sshPort" class="num" type="number" min="1" max="65535" placeholder="22" :class="{ invalid: !portValid }" />
            </label>
            <div class="basic-cfg__field basic-cfg__field--full">
              <span id="basic-cfg-auth">Authentication</span>
              <div class="basic-cfg__segment" role="radiogroup" aria-labelledby="basic-cfg-auth">
                <button
                  v-for="opt in authOptions"
                  :key="opt.id"
                  type="button"
                  role="radio"
                  :aria-checked="form.sshAuthType === opt.id"
                  :class="{ active: form.sshAuthType === opt.id }"
                  @click="form.sshAuthType = opt.id"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <label v-if="form.sshAuthType === 'password'" class="basic-cfg__field basic-cfg__field--full">
              <span>
                Password
                <em v-if="baseline.hasSshPassword" class="basic-cfg__stored">Stored</em>
              </span>
              <div class="basic-cfg__secret">
                <input
                  v-model="form.sshPassword"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  :placeholder="baseline.hasSshPassword ? 'Leave blank to keep the current password' : 'Enter SSH password'"
                />
                <button type="button" class="basic-cfg__reveal" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
                  {{ showPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
            </label>
            <template v-else>
              <label class="basic-cfg__field basic-cfg__field--full">
                <span>
                  Private key
                  <em v-if="baseline.hasSshKey" class="basic-cfg__stored">Stored</em>
                </span>
                <textarea
                  v-model="form.sshPrivateKey"
                  class="num"
                  rows="4"
                  spellcheck="false"
                  autocomplete="off"
                  :placeholder="baseline.hasSshKey ? 'A key is stored. Leave blank to keep it, or paste a new key to replace it.' : '-----BEGIN OPENSSH PRIVATE KEY-----'"
                ></textarea>
              </label>
              <label class="basic-cfg__field basic-cfg__field--full">
                <span>Key passphrase <small>optional</small></span>
                <input
                  v-model="form.sshKeyPassphrase"
                  type="password"
                  autocomplete="new-password"
                  :placeholder="baseline.hasSshKey && !form.sshPrivateKey.trim() ? 'Leave blank to keep the current passphrase' : 'Only if the key is encrypted'"
                />
              </label>
            </template>

            <p v-if="authTypeChanged" class="basic-cfg__note basic-cfg__note--warn basic-cfg__field--full">
              Saving switches this edge to {{ form.sshAuthType === 'key' ? 'SSH key' : 'password' }} authentication and deletes the stored
              {{ form.sshAuthType === 'key' ? 'password' : 'SSH key' }}.
            </p>
            <p v-else-if="!credentialsReady" class="basic-cfg__note basic-cfg__note--warn basic-cfg__field--full">
              {{ form.sshAuthType === 'key' ? 'Paste a private key' : 'Enter a password' }} to save SSH access.
            </p>

            <label class="basic-cfg__check basic-cfg__field--full">
              <input v-model="form.resetSshHostKey" type="checkbox" />
              <span>
                Reset trusted SSH host key
                <small>Only after reinstalling the edge OS.</small>
              </span>
            </label>
          </div>
        </section>
      </div>

      <div class="basic-cfg__col">
        <section class="basic-cfg__card">
          <header class="basic-cfg__card-head">
            <h4>Assigned users <span class="basic-cfg__count num">{{ form.userIds.length }}</span></h4>
            <p>Users who can see and manage this edge.</p>
          </header>

          <div ref="pickerEl" class="basic-cfg__picker">
            <input
              v-model="userSearch"
              type="search"
              placeholder="Search users to assign…"
              @focus="pickerOpen = true"
              @keydown.esc="pickerOpen = false"
            />
            <div v-if="pickerOpen" class="basic-cfg__picker-menu" role="listbox">
              <button
                v-for="user in pickableUsers"
                :key="user.id"
                type="button"
                role="option"
                @click="assignUser(user.id)"
              >
                <i class="basic-cfg__avatar" aria-hidden="true">{{ initials(user) }}</i>
                <span>
                  <strong>{{ user.name || user.email }}</strong>
                  <small v-if="user.name && user.email">{{ user.email }}</small>
                </span>
              </button>
              <p v-if="!pickableUsers.length" class="basic-cfg__picker-empty">
                {{ usersLoading ? 'Loading users…' : 'No more users to assign' }}
              </p>
            </div>
          </div>

          <ul v-if="form.userIds.length" class="basic-cfg__users">
            <li v-for="id in form.userIds" :key="id">
              <i class="basic-cfg__avatar" aria-hidden="true">{{ initials(userById(id)) }}</i>
              <span class="basic-cfg__user-copy">
                <strong>{{ userLabel(id) }}</strong>
                <small v-if="userById(id)?.email && userById(id)?.name">{{ userById(id).email }}</small>
              </span>
              <span v-if="!baseline.userIds.includes(id)" class="basic-cfg__tag">New</span>
              <button type="button" class="basic-cfg__remove" :aria-label="`Remove ${userLabel(id)}`" @click="unassignUser(id)">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            </li>
          </ul>
          <p v-else class="basic-cfg__empty">No users assigned. Only administrators can manage this edge.</p>
          <p v-if="removedCount" class="basic-cfg__note">{{ removedCount }} user{{ removedCount === 1 ? '' : 's' }} will lose access when you save.</p>
        </section>

        <section class="basic-cfg__card">
          <header class="basic-cfg__card-head">
            <h4>Edge record</h4>
            <p>Managed from the license and upgrade flows.</p>
          </header>
          <dl class="basic-cfg__record">
            <div><dt>License</dt><dd>{{ server.license || 'Unlicensed' }}</dd></div>
            <div><dt>Expires</dt><dd class="num">{{ expiresLabel }}</dd></div>
            <div><dt>Version</dt><dd class="num">{{ server.version || '—' }}</dd></div>
            <div><dt>OS</dt><dd>{{ server.os || '—' }}</dd></div>
            <div><dt>Auth</dt><dd>{{ baseline.sshAuthType === 'key' ? 'SSH key' : 'Password' }}</dd></div>
          </dl>
        </section>
      </div>
    </div>

    <footer class="basic-cfg__savebar" :class="{ dirty: isDirty }">
      <span class="basic-cfg__savebar-copy">
        <i aria-hidden="true" />
        {{ saveStatus }}
      </span>
      <div class="basic-cfg__savebar-actions">
        <button class="secondary-btn" type="button" :disabled="!isDirty || saving" @click="resetForm">Discard</button>
        <button class="primary-btn" type="button" :disabled="!canSave || saving" @click="confirmOpen = true">
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </footer>

    <ConfirmDialog
      v-model="confirmOpen"
      title="Apply edge changes"
      :message="confirmMessage"
      confirm-text="Apply"
      cancel-text="Cancel"
      @confirm="save"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import ConfirmDialog from '../ConfirmDialog.vue'
import { updateServer, updateServerUsers } from '@/api/servers'
import { fetchUsers } from '@/api/users'
import { useAuth } from '@/stores/auth'
import { notifyError, notifySuccess } from '@/utils/notify'

const props = defineProps({
  server: { type: Object, required: true },
})

const emit = defineEmits(['updated'])

const auth = useAuth()

const authOptions = [
  { id: 'password', label: 'Password' },
  { id: 'key', label: 'SSH key' },
]

const snapshot = (server) => {
  const authType = server.sshAuthType || (server.hasSshKey ? 'key' : 'password')
  return {
    name: server.name || '',
    ip: server.ip || '',
    sshUser: server.sshUser || '',
    sshPort: server.sshPort ? String(server.sshPort) : '',
    sshAuthType: authType,
    hasSshPassword: Boolean(server.hasSshPassword),
    hasSshKey: Boolean(server.hasSshKey),
    userIds: Array.isArray(server.managedUserIds) ? [...server.managedUserIds] : [],
  }
}

const baseline = ref(snapshot(props.server))

const blankForm = (base) => ({
  name: base.name,
  ip: base.ip,
  sshUser: base.sshUser,
  sshPort: base.sshPort,
  sshAuthType: base.sshAuthType,
  sshPassword: '',
  sshPrivateKey: '',
  sshKeyPassphrase: '',
  resetSshHostKey: false,
  userIds: [...base.userIds],
})

const form = reactive(blankForm(baseline.value))
const showPassword = ref(false)
const saving = ref(false)
const confirmOpen = ref(false)

const resetForm = () => {
  Object.assign(form, blankForm(baseline.value))
  showPassword.value = false
}

watch(
  () => props.server.id,
  () => {
    baseline.value = snapshot(props.server)
    resetForm()
  },
)

const sameIds = (a, b) => a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',')

const isDirty = computed(() => {
  const base = baseline.value
  return (
    form.name !== base.name
    || form.ip !== base.ip
    || form.sshUser !== base.sshUser
    || String(form.sshPort || '') !== base.sshPort
    || form.sshAuthType !== base.sshAuthType
    || Boolean(form.sshPassword)
    || Boolean(form.sshPrivateKey.trim())
    || Boolean(form.sshKeyPassphrase)
    || form.resetSshHostKey
    || !sameIds(form.userIds, base.userIds)
  )
})

const authTypeChanged = computed(() => form.sshAuthType !== baseline.value.sshAuthType)

const credentialsReady = computed(() => {
  if (form.sshAuthType === 'key') return Boolean(form.sshPrivateKey.trim()) || (baseline.value.hasSshKey && !authTypeChanged.value)
  return Boolean(form.sshPassword) || (baseline.value.hasSshPassword && !authTypeChanged.value)
})

const portValid = computed(() => {
  const raw = String(form.sshPort || '').trim()
  if (!raw) return true
  const port = Number(raw)
  return Number.isInteger(port) && port >= 1 && port <= 65535
})

const canSave = computed(() => isDirty.value && Boolean(form.name) && Boolean(form.ip) && portValid.value && credentialsReady.value)

const saveStatus = computed(() => {
  if (saving.value) return 'Saving changes…'
  if (!isDirty.value) return 'All changes saved'
  if (!form.name || !form.ip) return 'Edge name and IP address are required'
  if (!portValid.value) return 'SSH port must be between 1 and 65535'
  if (!credentialsReady.value) return form.sshAuthType === 'key' ? 'Paste a private key to save' : 'Enter a password to save'
  return 'You have unsaved changes'
})

const usersChanged = computed(() => !sameIds(form.userIds, baseline.value.userIds))
const removedCount = computed(() => baseline.value.userIds.filter((id) => !form.userIds.includes(id)).length)

const confirmMessage = computed(() => {
  const parts = []
  if (authTypeChanged.value) parts.push(`switch SSH to ${form.sshAuthType === 'key' ? 'key' : 'password'} authentication`)
  if (form.resetSshHostKey) parts.push('reset the trusted host key')
  if (usersChanged.value) parts.push('update assigned users')
  const extra = parts.length ? ` This will ${parts.join(', ')}.` : ''
  return `Apply these changes to ${baseline.value.name || 'this edge'}?${extra}`
})

const save = async () => {
  if (!canSave.value || saving.value) return
  saving.value = true
  const useKey = form.sshAuthType === 'key'
  try {
    await updateServer(props.server.id, {
      name: form.name,
      ip: form.ip,
      sshUser: form.sshUser,
      sshPort: String(form.sshPort || '').trim(),
      resetSshHostKey: form.resetSshHostKey,
      sshAuthType: useKey ? 'key' : 'password',
      sshPassword: useKey ? '' : form.sshPassword,
      sshPrivateKey: useKey ? form.sshPrivateKey.trim() : '',
      sshKeyPassphrase: useKey ? form.sshKeyPassphrase : '',
    })
    if (usersChanged.value) await updateServerUsers(props.server.id, [...form.userIds])
  } catch (err) {
    notifyError('Edge settings', err?.message || 'The edge could not be updated.')
    saving.value = false
    return
  }
  const updated = {
    id: props.server.id,
    name: form.name,
    ip: form.ip,
    sshUser: form.sshUser,
    sshPort: String(form.sshPort || '').trim(),
    sshAuthType: useKey ? 'key' : 'password',
    hasSshPassword: !useKey && (baseline.value.hasSshPassword || Boolean(form.sshPassword)),
    hasSshKey: useKey && (baseline.value.hasSshKey || Boolean(form.sshPrivateKey.trim())),
    managedUserIds: [...form.userIds],
    users: form.userIds.length,
    managedUsers: form.userIds.map((id) => userById(id)?.name).filter(Boolean),
  }
  baseline.value = snapshot({ ...props.server, ...updated })
  resetForm()
  saving.value = false
  emit('updated', updated)
  notifySuccess('Edge settings', 'The edge is successfully updated.')
}

/* Users */
const allUsers = ref([])
const usersLoading = ref(false)
const userSearch = ref('')
const pickerOpen = ref(false)
const pickerEl = ref(null)

const assignableUsers = computed(() => {
  const current = auth.state.user
  if (!current?.id || allUsers.value.some((user) => user.id === current.id)) return allUsers.value
  return [current, ...allUsers.value]
})

const userById = (id) => assignableUsers.value.find((user) => user.id === id) || null
const userLabel = (id) => {
  const user = userById(id)
  return user?.name || user?.email || `User #${id}`
}

const initials = (user) => {
  const source = String(user?.name || user?.email || '?').trim()
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase()
}

const pickableUsers = computed(() => {
  const query = userSearch.value.trim().toLowerCase()
  return assignableUsers.value
    .filter((user) => !form.userIds.includes(user.id))
    .filter((user) => !query || `${user.name || ''} ${user.email || ''}`.toLowerCase().includes(query))
    .slice(0, 50)
})

const assignUser = (id) => {
  if (!form.userIds.includes(id)) form.userIds = [...form.userIds, id]
  userSearch.value = ''
  pickerOpen.value = false
}

const unassignUser = (id) => {
  form.userIds = form.userIds.filter((item) => item !== id)
}

const onDocClick = (event) => {
  if (pickerOpen.value && pickerEl.value && !pickerEl.value.contains(event.target)) pickerOpen.value = false
}

const loadUsers = async () => {
  usersLoading.value = true
  try {
    const data = await fetchUsers()
    allUsers.value = Array.isArray(data) ? data.filter((user) => user.role === 'User') : []
  } catch {
    allUsers.value = []
  } finally {
    usersLoading.value = false
  }
}

const expiresLabel = computed(() => {
  const raw = props.server.expiredDate
  if (!raw || raw === '—') return '—'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return String(raw)
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000)
  const stamp = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  if (days < 0) return `${stamp} · expired`
  return `${stamp} · ${days}d`
})

onMounted(() => {
  document.addEventListener('click', onDocClick)
  void loadUsers()
})

onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.basic-cfg {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

.cfg-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.cfg-head__copy { display: flex; gap: 12px; min-width: 0; }

.cfg-head__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--dorian-viper-400, #3fbd85);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 13%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 30%, transparent);
}

.cfg-head__icon svg { width: 18px; height: 18px; }

.cfg-head__kicker {
  margin: 0 0 2px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.cfg-head h4 { margin: 0; font-size: 1.1rem; font-weight: 650; letter-spacing: -0.02em; color: var(--app-heading); }
.cfg-head__desc { margin: 3px 0 0; max-width: 44rem; font-size: 12.5px; line-height: 1.45; color: var(--app-text-muted); }

.basic-cfg__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.basic-cfg__col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.basic-cfg__card {
  padding: 16px;
  border-radius: 12px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
}

.basic-cfg__card-head { margin-bottom: 14px; }

.basic-cfg__card-head h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 650;
  color: var(--app-heading);
}

.basic-cfg__card-head p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.basic-cfg__count {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--dorian-viper-400, #3fbd85);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 14%, transparent);
}

.basic-cfg__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 14px;
}

.basic-cfg__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.basic-cfg__field--full { grid-column: 1 / -1; }

.basic-cfg__field > span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.basic-cfg__field small {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.8;
}

.basic-cfg input[type='text'],
.basic-cfg input[type='number'],
.basic-cfg input[type='password'],
.basic-cfg input[type='search'],
.basic-cfg textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 11px;
  border-radius: 7px;
  border: 1px solid var(--app-input-border);
  background: var(--app-input-bg);
  color: var(--app-text);
  font: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.basic-cfg textarea { resize: vertical; min-height: 92px; font-size: 12px; }

.basic-cfg input:focus,
.basic-cfg textarea:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft);
}

.basic-cfg input.invalid { border-color: color-mix(in srgb, var(--dorian-danger, #e15241) 70%, var(--app-input-border)); }

.basic-cfg__stored {
  padding: 1px 6px;
  border-radius: 4px;
  font-style: normal;
  font-size: 9.5px;
  letter-spacing: 0.04em;
  color: var(--dorian-viper-400, #3fbd85);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 14%, transparent);
}

.basic-cfg__segment {
  display: inline-flex;
  align-self: flex-start;
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--app-input-border);
  background: var(--app-input-bg);
}

.basic-cfg__segment button {
  padding: 6px 14px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text-muted);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.basic-cfg__segment button.active {
  color: var(--dorian-viper-400, #3fbd85);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 14%, transparent);
}

.basic-cfg__secret { position: relative; }
.basic-cfg__secret input { padding-right: 58px; }

.basic-cfg__reveal {
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
  padding: 4px 8px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--app-text-muted);
  font: inherit;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
}

.basic-cfg__reveal:hover { color: var(--app-heading); background: var(--app-surface); }

.basic-cfg__check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
  font-size: 12.5px;
  color: var(--app-text);
  cursor: pointer;
}

.basic-cfg__check input { margin-top: 2px; accent-color: var(--dorian-viper-500, #2e9e6c); }
.basic-cfg__check small { display: block; margin-top: 2px; color: var(--app-text-muted); font-size: 11.5px; }

.basic-cfg__note {
  margin: 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.basic-cfg__note--warn {
  padding: 8px 10px;
  border-radius: 7px;
  color: var(--dorian-warn, #e0a83f);
  background: color-mix(in srgb, var(--dorian-warn, #e0a83f) 10%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--dorian-warn, #e0a83f) 30%, transparent);
}

/* Users */
.basic-cfg__picker { position: relative; }

.basic-cfg__picker-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 15;
  max-height: 260px;
  overflow-y: auto;
  padding: 5px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface-elevated, var(--app-surface));
  box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.55);
}

.basic-cfg__picker-menu button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--app-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.basic-cfg__picker-menu button:hover { background: var(--app-surface-muted); }

.basic-cfg__picker-menu strong,
.basic-cfg__user-copy strong {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--app-heading);
}

.basic-cfg__picker-menu small,
.basic-cfg__user-copy small {
  display: block;
  font-size: 11px;
  color: var(--app-text-muted);
}

.basic-cfg__picker-empty {
  margin: 0;
  padding: 10px;
  text-align: center;
  font-size: 12px;
  color: var(--app-text-muted);
}

.basic-cfg__avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-style: normal;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--dorian-viper-400, #3fbd85);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 14%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 30%, transparent);
}

.basic-cfg__users {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
}

.basic-cfg__users li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px 7px 10px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
}

.basic-cfg__user-copy { flex: 1; min-width: 0; }
.basic-cfg__user-copy strong,
.basic-cfg__user-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.basic-cfg__tag {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 650;
  color: var(--dorian-l4, #6b9fd4);
  background: color-mix(in srgb, var(--dorian-l4, #6b9fd4) 14%, transparent);
}

.basic-cfg__remove {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
}

.basic-cfg__remove:hover {
  color: var(--dorian-danger, #e15241);
  background: color-mix(in srgb, var(--dorian-danger, #e15241) 12%, transparent);
}

.basic-cfg__remove svg { width: 12px; height: 12px; }

.basic-cfg__empty {
  margin: 12px 0 0;
  padding: 18px 12px;
  border-radius: 8px;
  border: 0.5px dashed var(--app-border-strong);
  text-align: center;
  font-size: 12px;
  color: var(--app-text-muted);
}

.basic-cfg__users + .basic-cfg__note,
.basic-cfg__empty + .basic-cfg__note { margin-top: 10px; }

/* Record */
.basic-cfg__record {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--app-border);
  border: 0.5px solid var(--app-border);
}

.basic-cfg__record > div {
  padding: 9px 11px;
  background: var(--app-surface);
  min-width: 0;
}

.basic-cfg__record > div:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}

.basic-cfg__record dt {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.basic-cfg__record dd {
  margin: 3px 0 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--app-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Save bar */
.basic-cfg__savebar {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface) 92%, transparent);
  backdrop-filter: blur(6px);
}

.basic-cfg__savebar.dirty { border-color: color-mix(in srgb, var(--dorian-warn, #e0a83f) 45%, var(--app-border)); }

.basic-cfg__savebar-copy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--app-text-muted);
}

.basic-cfg__savebar-copy i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dorian-viper-400, #3fbd85);
}

.basic-cfg__savebar.dirty .basic-cfg__savebar-copy { color: var(--app-text); }
.basic-cfg__savebar.dirty .basic-cfg__savebar-copy i { background: var(--dorian-warn, #e0a83f); }

.basic-cfg__savebar-actions { display: flex; gap: 8px; }

@media (max-width: 1100px) {
  .basic-cfg__grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .basic-cfg__fields { grid-template-columns: 1fr; }
}
</style>
