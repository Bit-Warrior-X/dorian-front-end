<template>
  <div class="dashboard-view acct-view">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <p class="acct-kicker">Account</p>
        <h2>Team</h2>
        <p>Who can sign in, what they can manage, and how their accounts are protected.</p>
      </div>
      <div class="dash-topbar__right">
        <button class="acct-btn acct-btn--primary" type="button" @click="openAddDialog">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 3v10M3 8h10" /></svg>
          Add member
        </button>
        <AppTopbarActions />
      </div>
    </header>

    <section class="team-kpis acct-kpis" aria-label="Team summary">
      <div class="acct-kpi tone-signal">
        <span class="acct-kpi__label">Members</span>
        <span class="acct-kpi__value num">{{ users.length }}</span>
        <span class="acct-kpi__hint">{{ counts.active }} active · {{ counts.blocked }} blocked</span>
      </div>
      <div class="acct-kpi tone-info">
        <span class="acct-kpi__label">Admins</span>
        <span class="acct-kpi__value num">{{ counts.admins }}</span>
        <span class="acct-kpi__hint">full workspace access</span>
      </div>
      <div class="acct-kpi" :class="counts.mfa === users.length && users.length ? 'tone-signal' : 'tone-warn'">
        <span class="acct-kpi__label">Two-factor</span>
        <span class="acct-kpi__value num">{{ counts.mfa }} / {{ users.length }}</span>
        <span class="acct-kpi__hint">{{ policyLabel }}</span>
      </div>
      <div class="acct-kpi" :class="counts.waiting ? 'tone-warn' : 'tone-signal'">
        <span class="acct-kpi__label">Pending</span>
        <span class="acct-kpi__value num">{{ counts.waiting }}</span>
        <span class="acct-kpi__hint">invited, not signed in yet</span>
      </div>
    </section>

    <section class="dash-panel" aria-label="Sign-in policy">
      <div class="dash-panel-head">
        <h3 class="acct-panel-title">
          <span class="acct-panel-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5l5 2v4c0 3.3-2.2 5.8-5 6.9-2.8-1.1-5-3.6-5-6.9v-4l5-2z" /></svg>
          </span>
          Sign-in policy
          <span class="acct-panel-hint">applies to everyone in this console</span>
        </h3>
      </div>
      <div class="policy-grid">
        <div class="acct-field">
          <span class="acct-field__label">Require two-factor authentication</span>
          <div class="policy-row">
            <div class="acct-segment" role="radiogroup" aria-label="Require two-factor authentication">
              <button
                v-for="option in POLICY_OPTIONS"
                :key="option.id"
                type="button"
                role="radio"
                :aria-checked="policyDraft === option.id"
                :class="{ active: policyDraft === option.id }"
                :disabled="policySaving"
                @click="policyDraft = option.id"
              >
                {{ option.label }}
              </button>
            </div>
            <button
              class="acct-btn acct-btn--primary acct-btn--sm"
              type="button"
              :disabled="policySaving || policyDraft === security.requireMfa"
              @click="savePolicy"
            >
              {{ policySaving ? 'Saving…' : 'Save' }}
            </button>
          </div>
          <p class="acct-hint">{{ policyHint }}</p>
        </div>
        <dl class="policy-facts">
          <div>
            <dt>Session length</dt>
            <dd>{{ security.sessionHours || 24 }} h · {{ security.rememberMeDays || 30 }} days with “keep me signed in”</dd>
          </div>
          <div>
            <dt>Idle sign-out</dt>
            <dd>15 min without activity, unless kept signed in</dd>
          </div>
          <div>
            <dt>Email delivery</dt>
            <dd>
              <span class="acct-badge" :class="security.emailDelivery ? 'tone-signal' : 'tone-warn'"><i />{{ security.emailDelivery ? 'Configured' : 'Not configured' }}</span>
              <span v-if="!security.emailDelivery" class="policy-note">Invite and reset links are shown here for you to share.</span>
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="dash-panel" aria-label="Members">
      <div class="dash-panel-head">
        <h3 class="acct-panel-title">
          <span class="acct-panel-icon tone-info" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="5.5" r="2.3" /><path d="M1.8 13.5c.6-2.2 2.2-3.3 4.2-3.3s3.6 1.1 4.2 3.3" /><path d="M10.5 3.5a2.2 2.2 0 0 1 0 4.2M12 10.4c1.1.4 1.9 1.4 2.2 3.1" /></svg>
          </span>
          Members
          <span class="acct-panel-hint">{{ filteredUsers.length }} of {{ users.length }}</span>
        </h3>
        <div class="acct-panel-actions">
          <input v-model="search" class="acct-input team-search" type="search" placeholder="Search name or email" aria-label="Search members" />
          <select v-model="statusFilter" class="acct-select team-filter" aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Waiting">Pending</option>
            <option value="Block">Blocked</option>
          </select>
        </div>
      </div>

      <p v-if="loadError" class="acct-error">{{ loadError }}</p>
      <p v-else-if="isLoading && !users.length" class="acct-hint">Loading members…</p>
      <p v-else-if="!filteredUsers.length" class="acct-empty">No members match.</p>
      <div v-else class="acct-table-wrap team-table-wrap">
        <table class="acct-table">
          <thead>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">2FA</th>
              <th scope="col">Edges</th>
              <th scope="col">Last sign-in</th>
              <th scope="col" class="right"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="acct-user-cell">
                  <span class="acct-avatar acct-avatar--sm" aria-hidden="true">{{ initialsFor(user) }}</span>
                  <span>
                    <span class="acct-cell-main">
                      {{ user.name || user.email }}
                      <span v-if="user.id === myId" class="acct-badge tone-signal">You</span>
                    </span>
                    <span class="acct-cell-sub">{{ user.email }}</span>
                  </span>
                </div>
              </td>
              <td>
                <span class="acct-badge" :class="user.role === 'Admin' ? 'tone-violet' : 'tone-info'">{{ user.role }}</span>
              </td>
              <td>
                <span class="acct-badge" :class="statusTone(user.status)"><i />{{ statusLabel(user) }}</span>
              </td>
              <td>
                <span v-if="user.mfaEnabled" class="acct-badge tone-signal">On</span>
                <span v-else class="acct-badge" :class="policyAppliesTo(user) ? 'tone-danger' : ''">{{ policyAppliesTo(user) ? 'Required' : 'Off' }}</span>
              </td>
              <td>
                <span v-if="user.role === 'Admin'" class="muted">All edges</span>
                <span v-else-if="user.servers?.length" class="team-edges">
                  <span v-for="server in user.servers.slice(0, 2)" :key="server" class="team-edge">{{ server }}</span>
                  <span v-if="user.servers.length > 2" class="team-edge team-edge--more">+{{ user.servers.length - 2 }}</span>
                </span>
                <span v-else class="muted">None assigned</span>
              </td>
              <td class="nowrap">
                <span v-if="user.lastSignInAt" :title="formatDateTime24(user.lastSignInAt)">{{ formatRelativeTime(user.lastSignInAt) }}</span>
                <span v-else class="muted">Never</span>
              </td>
              <td class="right">
                <div class="team-actions">
                  <button class="acct-btn acct-btn--sm" type="button" @click="openEditDialog(user)">Edit</button>
                  <div class="team-menu">
                    <button
                      class="acct-icon-btn"
                      type="button"
                      :aria-label="`More actions for ${user.name || user.email}`"
                      :aria-expanded="menuFor === user.id"
                      @click.stop="toggleMenu(user.id)"
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="3.5" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="12.5" cy="8" r="1.3" /></svg>
                    </button>
                    <div v-if="menuFor === user.id" class="team-menu__list" role="menu" @click.stop>
                      <button v-if="canInvite(user)" role="menuitem" type="button" @click="runLink(user, 'invite')">
                        New invite link
                      </button>
                      <button v-if="!canInvite(user) && user.status !== 'Block'" role="menuitem" type="button" @click="runLink(user, 'reset')">
                        Create password reset link
                      </button>
                      <button role="menuitem" type="button" @click="confirmSignOutEverywhere(user)">Sign out everywhere</button>
                      <button v-if="user.mfaEnabled" role="menuitem" type="button" @click="confirmResetMFA(user)">Reset two-factor</button>
                      <template v-if="user.id !== myId">
                        <button role="menuitem" type="button" class="danger" @click="confirmBlockUser(user)">
                          {{ user.status === 'Block' ? 'Unblock' : 'Block' }}
                        </button>
                        <button role="menuitem" type="button" class="danger" @click="confirmDeleteUser(user)">Delete</button>
                      </template>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="isAddDialogOpen" class="acct-modal-backdrop" @click.self="closeAddDialog">
        <form class="acct-modal" role="dialog" aria-modal="true" @submit.prevent="submitUser">
          <div class="acct-modal__head">
            <div>
              <h3>{{ isEditMode ? 'Edit member' : 'Add member' }}</h3>
              <p>{{ isEditMode ? 'Changes to role or status take effect on their next request.' : 'They get access as soon as they set a password.' }}</p>
            </div>
            <button class="acct-icon-btn" type="button" aria-label="Close" @click="closeAddDialog">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          </div>

          <div class="acct-form-grid">
            <div class="acct-field">
              <label for="member-first-name">First name</label>
              <input id="member-first-name" v-model="newUser.firstName" class="acct-input" type="text" autocomplete="off" required />
            </div>
            <div class="acct-field">
              <label for="member-second-name">Last name</label>
              <input id="member-second-name" v-model="newUser.secondName" class="acct-input" type="text" autocomplete="off" />
            </div>
            <div class="acct-field acct-field--full">
              <label for="member-email">Email</label>
              <input id="member-email" v-model="newUser.email" class="acct-input" type="email" autocomplete="off" required />
            </div>
            <div class="acct-field">
              <label for="member-role">Role</label>
              <select id="member-role" v-model="newUser.role" class="acct-select">
                <option value="User">User · assigned edges</option>
                <option value="Admin">Admin · everything</option>
              </select>
            </div>
            <div v-if="isEditMode" class="acct-field">
              <label for="member-status">Status</label>
              <select id="member-status" v-model="newUser.status" class="acct-select">
                <option value="Active">Active</option>
                <option value="Waiting">Pending</option>
                <option value="Block">Blocked</option>
              </select>
            </div>
            <div v-else class="acct-field">
              <span class="acct-field__label">How they sign in</span>
              <div class="acct-segment" role="radiogroup" aria-label="How they sign in">
                <button type="button" role="radio" :aria-checked="newUser.mode === 'invite'" :class="{ active: newUser.mode === 'invite' }" @click="newUser.mode = 'invite'">Invite link</button>
                <button type="button" role="radio" :aria-checked="newUser.mode === 'password'" :class="{ active: newUser.mode === 'password' }" @click="newUser.mode = 'password'">Set password</button>
              </div>
            </div>
            <div v-if="newUser.mode === 'password' || isEditMode" class="acct-field acct-field--full">
              <label for="member-password">{{ isEditMode ? 'New password (optional)' : 'Password' }}</label>
              <input
                id="member-password"
                v-model="newUser.password"
                class="acct-input"
                type="password"
                autocomplete="new-password"
                minlength="8"
                maxlength="72"
                :required="!isEditMode"
              />
              <p class="acct-hint">
                {{ isEditMode ? 'Setting a password signs them out everywhere. A reset link from the row menu lets them choose their own.' : 'At least 8 characters. Share it with them securely.' }}
              </p>
            </div>
            <p v-else class="acct-hint acct-field--full">
              We create a one-time link that is valid for 7 days{{ security.emailDelivery ? ' and email it to them' : '. Email is not configured, so you will copy the link and share it yourself' }}.
            </p>
            <div v-if="newUser.role === 'User'" class="acct-field acct-field--full">
              <span class="acct-field__label">Edges they can manage</span>
              <div v-if="serverOptions.length" class="acct-checks">
                <label v-for="server in serverOptions" :key="server.id" class="acct-check">
                  <input v-model="newUser.serverIds" type="checkbox" :value="server.id" />
                  <span>{{ server.name || `Edge #${server.id}` }}</span>
                </label>
              </div>
              <p v-else class="acct-hint">No edges yet.</p>
            </div>
          </div>

          <p v-if="dialogError" class="acct-error">{{ dialogError }}</p>
          <div class="acct-form-actions">
            <button class="acct-btn" type="button" @click="closeAddDialog">Cancel</button>
            <button class="acct-btn acct-btn--primary" type="submit" :disabled="dialogBusy">
              {{ dialogBusy ? 'Saving…' : isEditMode ? 'Save changes' : newUser.mode === 'invite' ? 'Create and invite' : 'Add member' }}
            </button>
          </div>
        </form>
      </div>

      <div v-if="linkResult" class="acct-modal-backdrop" @click.self="linkResult = null">
        <div class="acct-modal" role="dialog" aria-modal="true">
          <div class="acct-modal__head">
            <div>
              <h3>{{ linkResult.purpose === 'invite' ? 'Invite link' : 'Password reset link' }}</h3>
              <p>For {{ linkResult.email }} · works once · expires {{ formatDateTime24(linkResult.expiresAt) }}</p>
            </div>
            <button class="acct-icon-btn" type="button" aria-label="Close" @click="linkResult = null">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          </div>
          <div v-if="linkResult.emailed" class="acct-banner tone-signal">
            <span><strong>Email sent.</strong> You can also share the link below directly.</span>
          </div>
          <div v-else-if="linkResult.emailError" class="acct-banner">
            <span><strong>Email failed.</strong> {{ linkResult.emailError }}</span>
          </div>
          <div class="acct-secret">
            <p class="acct-hint">Anyone with this link can set the password for this account. Send it only to them.</p>
            <div class="acct-secret__row">
              <code class="acct-code">{{ linkResult.link }}</code>
              <button class="acct-btn" type="button" @click="copyLink">{{ linkCopied ? 'Copied' : 'Copy' }}</button>
            </div>
          </div>
          <div class="acct-form-actions">
            <button class="acct-btn acct-btn--primary" type="button" @click="linkResult = null">Done</button>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmDialog
      v-model="confirmState.open"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-text="confirmState.confirmText"
      :danger="confirmState.danger"
      @confirm="runConfirm"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { fetchSecuritySettings, updateSecuritySettings } from '@/api/auth'
import { fetchServers } from '@/api/servers'
import {
  createUser,
  createUserResetLink,
  deleteUser,
  fetchUsers,
  resetUserMFA,
  revokeUserSessions,
  sendUserInvite,
  updateUser,
} from '@/api/users'
import { useAuth } from '@/stores/auth'
import { formatDateTime24, formatRelativeTime } from '@/utils/auditFormat'
import { notifyError, notifySuccess } from '@/utils/notify'
import { joinDisplayName, splitDisplayName } from '@/utils/userName'

const TITLE = 'Team'

const POLICY_OPTIONS = [
  { id: 'off', label: 'Optional' },
  { id: 'admins', label: 'Admins' },
  { id: 'all', label: 'Everyone' },
]

const auth = useAuth()
const myId = computed(() => auth.state.user?.id)

const users = ref([])
const isLoading = ref(false)
const loadError = ref('')
const serverOptions = ref([])
const search = ref('')
const statusFilter = ref('')
const menuFor = ref(null)

const security = reactive({ requireMfa: 'off', emailDelivery: false, sessionHours: 24, rememberMeDays: 30 })
const policyDraft = ref('off')
const policySaving = ref(false)

const counts = computed(() => ({
  active: users.value.filter((u) => u.status === 'Active').length,
  blocked: users.value.filter((u) => u.status === 'Block').length,
  waiting: users.value.filter((u) => u.status === 'Waiting').length,
  admins: users.value.filter((u) => u.role === 'Admin').length,
  mfa: users.value.filter((u) => u.mfaEnabled).length,
}))

const policyLabel = computed(() => {
  if (security.requireMfa === 'all') return 'required for everyone'
  if (security.requireMfa === 'admins') return 'required for Admins'
  return 'optional'
})

const policyHint = computed(() => {
  const affected = users.value.filter((u) => policyAppliesTo(u, policyDraft.value) && !u.mfaEnabled && u.status === 'Active')
  if (policyDraft.value === 'off') return 'Members choose whether to turn on 2FA from their Profile.'
  const scope = policyDraft.value === 'all' ? 'Every member' : 'Every Admin'
  const tail = affected.length
    ? ` ${affected.length} active ${affected.length === 1 ? 'member has' : 'members have'} not set it up yet and will be sent to their Profile until they do.`
    : ' Everyone it applies to already uses 2FA.'
  return `${scope} must use 2FA. They cannot turn it off.${tail}`
})

const policyAppliesTo = (user, policy = security.requireMfa) =>
  policy === 'all' || (policy === 'admins' && user.role === 'Admin')

const filteredUsers = computed(() => {
  const query = search.value.trim().toLowerCase()
  return users.value.filter((user) => {
    if (statusFilter.value && user.status !== statusFilter.value) return false
    if (!query) return true
    return `${user.name || ''} ${user.email || ''}`.toLowerCase().includes(query)
  })
})

const initialsFor = (user) => {
  const parts = String(user.name || user.email || '?').replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean)
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase()
}

const statusTone = (status) => (status === 'Active' ? 'tone-signal' : status === 'Waiting' ? 'tone-warn' : 'tone-danger')
const statusLabel = (user) => (user.status === 'Waiting' ? 'Pending' : user.status === 'Block' ? 'Blocked' : user.status)
const canInvite = (user) => user.status === 'Waiting'

const displayUserName = (user) => {
  const { firstName, secondName } = splitDisplayName(user.name)
  return joinDisplayName(firstName, secondName) || user.email || 'this member'
}

const loadUsers = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const data = await fetchUsers()
    users.value = (Array.isArray(data) ? data : []).sort(
      (a, b) => Number(b.id === myId.value) - Number(a.id === myId.value) || String(a.name || a.email).localeCompare(String(b.name || b.email))
    )
  } catch (error) {
    loadError.value = error?.message || 'Could not load members.'
  } finally {
    isLoading.value = false
  }
}

const loadSecurity = async () => {
  try {
    const data = await fetchSecuritySettings()
    Object.assign(security, data || {})
    policyDraft.value = security.requireMfa || 'off'
  } catch {
    // defaults stay
  }
}

const savePolicy = async () => {
  policySaving.value = true
  try {
    const data = await updateSecuritySettings({ requireMfa: policyDraft.value })
    Object.assign(security, data || {})
    policyDraft.value = security.requireMfa
    notifySuccess(TITLE, `Two-factor authentication is now ${policyLabel.value}.`)
  } catch (error) {
    notifyError(TITLE, error?.message || 'Could not save the sign-in policy.')
    policyDraft.value = security.requireMfa
  } finally {
    policySaving.value = false
  }
}

// --- row menu --------------------------------------------------------------------

const toggleMenu = (id) => {
  menuFor.value = menuFor.value === id ? null : id
}

const closeMenu = () => {
  menuFor.value = null
}

// --- add / edit -----------------------------------------------------------------------

const isAddDialogOpen = ref(false)
const isEditMode = ref(false)
const editingUserId = ref(null)
const dialogBusy = ref(false)
const dialogError = ref('')
const newUser = reactive({
  firstName: '',
  secondName: '',
  email: '',
  password: '',
  role: 'User',
  status: 'Waiting',
  mode: 'invite',
  serverIds: [],
})

const resetNewUser = () => {
  Object.assign(newUser, { firstName: '', secondName: '', email: '', password: '', role: 'User', status: 'Waiting', mode: 'invite', serverIds: [] })
  dialogError.value = ''
}

const openAddDialog = () => {
  isEditMode.value = false
  editingUserId.value = null
  resetNewUser()
  isAddDialogOpen.value = true
}

const openEditDialog = (user) => {
  closeMenu()
  isEditMode.value = true
  editingUserId.value = user.id
  resetNewUser()
  const names = splitDisplayName(user.name)
  Object.assign(newUser, {
    firstName: names.firstName,
    secondName: names.secondName,
    email: user.email,
    role: user.role,
    status: user.status,
    mode: 'password',
    serverIds: user.serverIds ? [...user.serverIds] : [],
  })
  isAddDialogOpen.value = true
}

const closeAddDialog = () => {
  isAddDialogOpen.value = false
}

const submitUser = async () => {
  const firstName = newUser.firstName.trim()
  const email = newUser.email.trim()
  if (!firstName || !email) {
    dialogError.value = 'First name and email are required.'
    return
  }
  const password = newUser.password.trim()
  if ((password || (!isEditMode.value && newUser.mode === 'password')) && password.length < 8) {
    dialogError.value = 'Passwords need at least 8 characters.'
    return
  }

  const payload = {
    name: joinDisplayName(firstName, newUser.secondName.trim()),
    email,
    role: newUser.role,
    status: isEditMode.value ? newUser.status : newUser.mode === 'invite' ? 'Waiting' : 'Active',
    serverIds: newUser.role === 'User' ? [...newUser.serverIds] : [],
  }
  if (password) payload.password = newUser.password

  dialogBusy.value = true
  dialogError.value = ''
  try {
    if (isEditMode.value) {
      await updateUser(editingUserId.value, payload)
      notifySuccess(TITLE, `${payload.name || email} was updated.`)
    } else {
      const created = await createUser({ ...payload, sendInvite: newUser.mode === 'invite' })
      if (created?.invite) {
        showLink({ ...created.invite, purpose: 'invite', email })
      } else {
        notifySuccess(TITLE, `${payload.name || email} was added.`)
      }
    }
    isAddDialogOpen.value = false
    await loadUsers()
  } catch (error) {
    dialogError.value = error?.message || 'Could not save this member.'
  } finally {
    dialogBusy.value = false
  }
}

// --- links ------------------------------------------------------------------------------

const linkResult = ref(null)
const linkCopied = ref(false)

const showLink = (result) => {
  linkCopied.value = false
  linkResult.value = result
}

const runLink = async (user, purpose) => {
  closeMenu()
  try {
    const result = purpose === 'invite' ? await sendUserInvite(user.id) : await createUserResetLink(user.id)
    showLink({ ...result, purpose, email: user.email })
  } catch (error) {
    notifyError(TITLE, error?.message || 'Could not create the link.')
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(linkResult.value.link)
    linkCopied.value = true
  } catch {
    notifyError(TITLE, 'Copy failed. Select the link and copy it manually.')
  }
}

// --- confirm actions ---------------------------------------------------------------------

const confirmState = reactive({ open: false, title: '', message: '', confirmText: 'Confirm', danger: true })
let pendingAction = null

const askConfirm = ({ title, message, confirmText = 'Confirm', danger = true }, action) => {
  closeMenu()
  Object.assign(confirmState, { open: true, title, message, confirmText, danger })
  pendingAction = action
}

const runConfirm = async () => {
  const action = pendingAction
  pendingAction = null
  if (!action) return
  try {
    await action()
  } catch (error) {
    notifyError(TITLE, error?.message || 'That action failed.')
  }
}

const confirmDeleteUser = (user) =>
  askConfirm(
    { title: 'Delete member', message: `Delete ${displayUserName(user)}? Their sessions and API tokens stop working immediately.`, confirmText: 'Delete' },
    async () => {
      await deleteUser(user.id)
      notifySuccess(TITLE, `${displayUserName(user)} was deleted.`)
      await loadUsers()
    }
  )

const confirmResetMFA = (user) =>
  askConfirm(
    {
      title: 'Reset two-factor',
      message: `Turn off two-factor authentication for ${displayUserName(user)}? They can sign in with their password and set it up again.`,
      confirmText: 'Reset 2FA',
    },
    async () => {
      await resetUserMFA(user.id)
      notifySuccess(TITLE, `Two-factor was reset for ${displayUserName(user)}.`)
      await loadUsers()
    }
  )

const confirmSignOutEverywhere = (user) =>
  askConfirm(
    {
      title: 'Sign out everywhere',
      message:
        user.id === myId.value
          ? 'Sign out all of your other sessions? This device stays signed in.'
          : `Sign out ${displayUserName(user)} on every device? They need to sign in again.`,
      confirmText: 'Sign out',
    },
    async () => {
      const result = await revokeUserSessions(user.id)
      const count = Number(result?.revoked) || 0
      notifySuccess(TITLE, count === 1 ? 'Ended 1 session.' : `Ended ${count} sessions.`)
    }
  )

const confirmBlockUser = (user) => {
  const block = user.status !== 'Block'
  askConfirm(
    {
      title: block ? 'Block member' : 'Unblock member',
      message: block
        ? `Block ${displayUserName(user)}? They are signed out right away and their API tokens stop working.`
        : `Unblock ${displayUserName(user)}? They can sign in again.`,
      confirmText: block ? 'Block' : 'Unblock',
      danger: block,
    },
    async () => {
      await updateUser(user.id, {
        name: user.name,
        email: user.email,
        role: user.role,
        status: block ? 'Block' : 'Active',
        serverIds: user.role === 'User' ? [...(user.serverIds || [])] : [],
      })
      notifySuccess(TITLE, `${displayUserName(user)} was ${block ? 'blocked' : 'unblocked'}.`)
      await loadUsers()
    }
  )
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
    if (role !== 'User') newUser.serverIds = []
  }
)

onMounted(() => {
  document.addEventListener('click', closeMenu)
  void loadUsers()
  void loadServers()
  void loadSecurity()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<style scoped>
.team-kpis {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.policy-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.policy-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.policy-facts {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.policy-facts div {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 10px;
  font-size: 12.5px;
}

.policy-facts dt {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  padding-top: 2px;
}

.policy-facts dd {
  margin: 0;
  color: var(--app-text);
}

.policy-note {
  display: block;
  margin-top: 4px;
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.team-search {
  width: 220px;
}

.team-filter {
  width: auto;
}

.team-table-wrap {
  overflow: visible;
}

.team-edges {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}

.team-edge {
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--app-text-secondary);
  background: var(--app-surface-muted);
  border: 0.5px solid var(--app-border);
  white-space: nowrap;
}

.team-edge--more {
  color: var(--app-text-muted);
}

.team-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.team-menu {
  position: relative;
}

.team-menu__list {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 30;
  min-width: 210px;
  display: flex;
  flex-direction: column;
  padding: 4px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface-solid, var(--app-surface));
  box-shadow: 0 12px 28px var(--app-shadow, rgba(0, 0, 0, 0.4));
}

.team-menu__list button {
  padding: 7px 10px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--app-text);
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
}

.team-menu__list button:hover {
  background: var(--app-surface-hover, var(--app-surface-muted));
}

.team-menu__list button.danger {
  color: var(--dorian-danger, #e15241);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

@media (max-width: 1100px) {
  .policy-grid {
    grid-template-columns: 1fr;
  }

  .team-table-wrap {
    overflow-x: auto;
  }
}

@media (max-width: 760px) {
  .team-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
