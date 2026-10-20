<template>
  <div class="dashboard-view acct-view">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <p class="acct-kicker">Account</p>
        <h2>Profile</h2>
        <p>Your identity, sign-in security, active sessions, and API tokens.</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <div v-if="mfaRequiredNow" class="acct-banner" role="alert">
      <span>
        <strong>Two-factor authentication is required.</strong>
        Your organization requires it for {{ requireMfa === 'admins' ? 'Admins' : 'every account' }}.
        Set it up below to continue using the console.
      </span>
    </div>

    <section class="acct-hero" aria-label="Account summary">
      <div class="acct-hero__identity">
        <span class="acct-avatar" aria-hidden="true">{{ initials }}</span>
        <div class="acct-hero__copy">
          <p class="acct-kicker">Signed in as</p>
          <h3>{{ profile.name || profile.email || '—' }}</h3>
          <p>{{ profile.email || '—' }}</p>
        </div>
      </div>
      <div class="acct-kpis" role="list">
        <div class="acct-kpi tone-signal" role="listitem">
          <span class="acct-kpi__label">Role</span>
          <span class="acct-kpi__value">{{ profile.role || '—' }}</span>
          <span class="acct-kpi__hint">{{ profile.role === 'Admin' ? 'full workspace access' : 'assigned edges only' }}</span>
        </div>
        <div class="acct-kpi" :class="mfaStatus.enabled ? 'tone-signal' : 'tone-warn'" role="listitem">
          <span class="acct-kpi__label">Two-factor</span>
          <span class="acct-kpi__value">{{ mfaStatus.enabled ? 'On' : 'Off' }}</span>
          <span class="acct-kpi__hint">
            {{ mfaStatus.enabled ? `${mfaStatus.recoveryCodesRemaining} recovery codes left` : 'not protecting sign-in' }}
          </span>
        </div>
        <div class="acct-kpi tone-info" role="listitem">
          <span class="acct-kpi__label">Sessions</span>
          <span class="acct-kpi__value num">{{ sessions.length || '—' }}</span>
          <span class="acct-kpi__hint">{{ sessions.length === 1 ? 'this device only' : 'signed-in devices' }}</span>
        </div>
        <div class="acct-kpi" :class="profile.status === 'Active' ? 'tone-signal' : 'tone-warn'" role="listitem">
          <span class="acct-kpi__label">Status</span>
          <span class="acct-kpi__value">{{ profile.status || '—' }}</span>
          <span class="acct-kpi__hint">{{ currentSessionHint }}</span>
        </div>
      </div>
    </section>

    <div class="acct-grid">
      <div class="acct-stack">
        <section class="dash-panel" aria-label="Profile details">
          <div class="dash-panel-head">
            <h3 class="acct-panel-title">
              <span class="acct-panel-icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5.5" r="2.5" /><path d="M3 13.5c.8-2.4 2.7-3.5 5-3.5s4.2 1.1 5 3.5" /></svg>
              </span>
              Details
              <span class="acct-panel-hint">shown across the console</span>
            </h3>
          </div>

          <p v-if="loading" class="acct-hint">Loading your information…</p>
          <p v-else-if="loadError" class="acct-error">{{ loadError }}</p>
          <form v-else class="acct-form" @submit.prevent="saveDetails">
            <div class="acct-form-grid">
              <div class="acct-field">
                <label for="info-first-name">First name</label>
                <input id="info-first-name" v-model="form.firstName" class="acct-input" type="text" autocomplete="given-name" :disabled="saving" />
              </div>
              <div class="acct-field">
                <label for="info-second-name">Last name</label>
                <input id="info-second-name" v-model="form.secondName" class="acct-input" type="text" autocomplete="family-name" :disabled="saving" />
              </div>
              <div class="acct-field acct-field--full">
                <div class="acct-field__row">
                  <label for="info-email" class="acct-field__label">Email</label>
                  <button v-if="!isEditingEmail" class="acct-btn acct-btn--sm" type="button" :disabled="saving" @click="startEmailChange">Change</button>
                  <button v-else class="acct-btn acct-btn--sm" type="button" :disabled="saving" @click="cancelEmailEdit">Cancel</button>
                </div>
                <input
                  id="info-email"
                  v-model="form.email"
                  class="acct-input"
                  type="email"
                  autocomplete="email"
                  :readonly="!isEditingEmail"
                  :disabled="saving"
                />
                <p class="acct-hint">Used to sign in and for invite and reset emails.</p>
              </div>
            </div>
            <div class="acct-form-actions">
              <button class="acct-btn" type="button" :disabled="!detailsDirty || saving" @click="resetForm">Discard</button>
              <button class="acct-btn acct-btn--primary" type="submit" :disabled="!detailsDirty || saving">
                {{ saving === 'details' ? 'Saving…' : 'Save details' }}
              </button>
            </div>
          </form>
        </section>

        <section ref="passwordSectionRef" class="dash-panel" aria-label="Password">
          <div class="dash-panel-head">
            <h3 class="acct-panel-title">
              <span class="acct-panel-icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></svg>
              </span>
              Password
              <span class="acct-panel-hint">{{ profile.hasPassword ? 'changing it signs out your other sessions' : 'not set yet' }}</span>
            </h3>
          </div>
          <p v-if="!profile.hasPassword" class="acct-hint">
            You signed up with Google, GitHub, or SSO. Set a password to also sign in with your email address.
          </p>
          <form class="acct-form" @submit.prevent="savePassword">
            <div class="acct-form-grid">
              <div v-if="profile.hasPassword" class="acct-field acct-field--full">
                <label for="info-current-password">Current password</label>
                <input
                  id="info-current-password"
                  v-model="form.currentPassword"
                  class="acct-input"
                  :class="{ 'is-invalid': currentPasswordRejected }"
                  type="password"
                  autocomplete="current-password"
                  :disabled="saving"
                />
                <p v-if="currentPasswordRejected" class="acct-hint acct-hint--error">Current password is incorrect.</p>
              </div>
              <div class="acct-field">
                <label for="info-password">New password</label>
                <input id="info-password" v-model="form.password" class="acct-input" type="password" autocomplete="new-password" minlength="8" maxlength="72" :disabled="saving" />
              </div>
              <div class="acct-field">
                <label for="info-confirm-password">Confirm</label>
                <input
                  id="info-confirm-password"
                  v-model="form.confirmPassword"
                  class="acct-input"
                  :class="{ 'is-invalid': showPasswordMismatch }"
                  type="password"
                  autocomplete="new-password"
                  :disabled="saving"
                />
              </div>
            </div>
            <div class="acct-form-actions">
              <p class="acct-hint" :class="{ 'acct-hint--error': showPasswordMismatch }">
                {{ showPasswordMismatch ? 'The two passwords do not match.' : 'At least 8 characters.' }}
              </p>
              <button class="acct-btn acct-btn--primary" type="submit" :disabled="!passwordReady || saving">
                {{ saving === 'password' ? 'Saving…' : profile.hasPassword ? 'Change password' : 'Set password' }}
              </button>
            </div>
          </form>
        </section>
      </div>

      <div class="acct-stack">
        <section ref="mfaSectionRef" class="dash-panel" aria-label="Two-factor authentication">
          <div class="dash-panel-head">
            <h3 class="acct-panel-title">
              <span class="acct-panel-icon" :class="{ 'tone-warn': !mfaStatus.enabled }" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5l5 2v4c0 3.3-2.2 5.8-5 6.9-2.8-1.1-5-3.6-5-6.9v-4l5-2z" /><path d="M6 8l1.5 1.5L10.5 6.5" /></svg>
              </span>
              Two-factor authentication
            </h3>
            <span class="acct-badge" :class="mfaStatus.enabled ? 'tone-signal' : 'tone-warn'"><i />{{ mfaStatus.enabled ? 'On' : 'Off' }}</span>
          </div>

          <p v-if="mfaError" class="acct-error">{{ mfaError }}</p>
          <p v-else-if="mfaLoading" class="acct-hint">Loading two-factor status…</p>

          <template v-else-if="recoveryCodes.length">
            <p class="acct-hint">
              Save these recovery codes somewhere safe. Each one works once if you lose your authenticator. They will not be shown again.
            </p>
            <ul class="mfa-codes">
              <li v-for="code in recoveryCodes" :key="code"><code>{{ code }}</code></li>
            </ul>
            <div class="acct-form-actions">
              <button class="acct-btn" type="button" @click="copyRecoveryCodes">{{ recoveryCopied ? 'Copied' : 'Copy codes' }}</button>
              <button class="acct-btn acct-btn--primary" type="button" @click="recoveryCodes = []">I saved them</button>
            </div>
          </template>

          <template v-else-if="mfaStatus.enabled">
            <p class="acct-hint">
              Sign-in asks for a code from your authenticator app. Enter a current code to create new recovery codes or turn 2FA off.
            </p>
            <form class="acct-form" @submit.prevent>
              <div class="acct-field">
                <label for="mfa-action-code">Authenticator or recovery code</label>
                <input id="mfa-action-code" v-model="mfaActionCode" class="acct-input" type="text" autocomplete="one-time-code" :disabled="mfaBusy" />
              </div>
              <div class="acct-form-actions">
                <p v-if="mfaPolicyLocks" class="acct-hint">Your organization requires 2FA, so it cannot be turned off.</p>
                <button class="acct-btn" type="button" :disabled="mfaBusy || !mfaActionCode.trim()" @click="regenerateCodes">New recovery codes</button>
                <button v-if="!mfaPolicyLocks" class="acct-btn acct-btn--danger" type="button" :disabled="mfaBusy || !mfaActionCode.trim()" @click="turnOffMFA">Turn off</button>
              </div>
            </form>
          </template>

          <template v-else-if="mfaSetup">
            <div class="mfa-setup">
              <img v-if="mfaSetup.qrDataUrl" :src="mfaSetup.qrDataUrl" alt="Authenticator QR code" class="mfa-qr" width="160" height="160" />
              <form class="acct-form mfa-setup__steps" @submit.prevent="confirmMFASetup">
                <p class="acct-hint">1. Scan the QR code with your authenticator app, or enter this key:</p>
                <code class="acct-code">{{ mfaSetup.secret }}</code>
                <div class="acct-field">
                  <label for="mfa-setup-code">2. Enter the 6-digit code it shows</label>
                  <input id="mfa-setup-code" v-model="mfaSetupCode" class="acct-input" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" :disabled="mfaBusy" />
                </div>
                <div class="acct-form-actions">
                  <button class="acct-btn" type="button" :disabled="mfaBusy" @click="mfaSetup = null">Cancel</button>
                  <button class="acct-btn acct-btn--primary" type="submit" :disabled="mfaBusy || mfaSetupCode.trim().length !== 6">
                    {{ mfaBusy ? 'Verifying…' : 'Turn on' }}
                  </button>
                </div>
              </form>
            </div>
          </template>

          <template v-else>
            <p class="acct-hint">
              Ask for a code from an authenticator app (Google Authenticator, 1Password, Authy…) each time you sign in.
            </p>
            <div class="acct-form-actions">
              <button class="acct-btn acct-btn--primary" type="button" :disabled="mfaBusy" @click="beginMFASetup">
                {{ mfaBusy ? 'Starting…' : 'Set up two-factor' }}
              </button>
            </div>
          </template>
        </section>

        <section class="dash-panel" aria-label="Active sessions">
          <div class="dash-panel-head">
            <h3 class="acct-panel-title">
              <span class="acct-panel-icon tone-info" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="3" width="13" height="8.5" rx="1.2" /><path d="M5.5 14h5" /></svg>
              </span>
              Active sessions
              <span class="acct-panel-hint">devices signed in to your account</span>
            </h3>
            <button
              v-if="otherSessions.length"
              class="acct-btn acct-btn--sm acct-btn--danger"
              type="button"
              :disabled="sessionsBusy"
              @click="signOutOthers"
            >
              Sign out other sessions
            </button>
          </div>

          <p v-if="sessionsError" class="acct-error">{{ sessionsError }}</p>
          <p v-else-if="sessionsLoading && !sessions.length" class="acct-hint">Loading sessions…</p>
          <p v-else-if="!sessions.length" class="acct-empty">No active sessions found.</p>
          <ul v-else class="acct-list">
            <li v-for="item in sessions" :key="item.id" class="acct-list__item">
              <span class="acct-list__icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="3" width="13" height="8.5" rx="1.2" /><path d="M5.5 14h5" /></svg>
              </span>
              <div class="acct-list__main">
                <span class="acct-cell-main">
                  {{ describeUserAgent(item.userAgent) || 'Unknown device' }}
                  <span v-if="item.current" class="acct-badge tone-signal">This device</span>
                </span>
                <span class="acct-cell-sub">
                  {{ describeSignInMethod(item.method) }} · <span class="num">{{ maskIp(item.ipAddress) }}</span> ·
                  signed in {{ formatDateTime24(item.createdAt) }} · active {{ formatRelativeTime(item.lastSeenAt) }}
                  <template v-if="item.remember"> · kept signed in</template>
                </span>
              </div>
              <button
                v-if="!item.current"
                class="acct-btn acct-btn--sm"
                type="button"
                :disabled="sessionsBusy"
                @click="signOutSession(item)"
              >
                Sign out
              </button>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <section class="dash-panel" aria-label="API tokens">
      <div class="dash-panel-head">
        <h3 class="acct-panel-title">
          <span class="acct-panel-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="8" r="2.5" /><path d="M7.5 8H14M11.5 8v2.5M13.5 8v1.5" /></svg>
          </span>
          API tokens
          <span class="acct-panel-hint">personal access tokens for scripts and CI · secrets are shown once</span>
        </h3>
        <RouterLink class="dash-panel-link" :to="{ name: 'docs-account', hash: '#api-tokens' }">How to use tokens</RouterLink>
      </div>

      <form class="acct-form token-form" @submit.prevent="createToken">
        <div class="token-form__row">
          <div class="acct-field token-form__name">
            <label for="api-token-name">Name</label>
            <input id="api-token-name" v-model="tokenForm.name" class="acct-input" type="text" maxlength="80" placeholder="e.g. CI deploy" :disabled="tokenCreating" />
          </div>
          <div class="acct-field">
            <span class="acct-field__label">Access</span>
            <div class="acct-segment" role="radiogroup" aria-label="Token access">
              <button
                v-for="option in ACCESS_OPTIONS"
                :key="option.id"
                type="button"
                role="radio"
                :aria-checked="tokenForm.access === option.id"
                :class="{ active: tokenForm.access === option.id }"
                :disabled="tokenCreating"
                @click="tokenForm.access = option.id"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <div class="acct-field">
            <label for="api-token-expiry">Expires</label>
            <select id="api-token-expiry" v-model="tokenForm.expiry" class="acct-select" :disabled="tokenCreating">
              <option v-for="option in EXPIRY_OPTIONS" :key="option.id" :value="option.id">{{ option.label }}</option>
            </select>
          </div>
          <button class="acct-btn acct-btn--primary token-form__submit" type="submit" :disabled="!canCreateToken">
            {{ tokenCreating ? 'Creating…' : 'Create token' }}
          </button>
        </div>
        <div v-if="tokenForm.access === 'custom'" class="acct-checks">
          <label v-for="scope in customScopes" :key="scope.id" class="acct-check">
            <input v-model="tokenForm.scopes" type="checkbox" :value="scope.id" :disabled="tokenCreating" />
            <span>{{ scope.label }}<small>{{ scope.description }}</small></span>
          </label>
        </div>
        <p class="acct-hint">{{ accessHint }}</p>
      </form>

      <div v-if="createdSecret" class="acct-secret">
        <p class="acct-hint">Copy this token now. It will not be shown again.</p>
        <div class="acct-secret__row">
          <code class="acct-code">{{ createdSecret }}</code>
          <button class="acct-btn" type="button" @click="copyCreatedSecret">{{ secretCopied ? 'Copied' : 'Copy' }}</button>
          <button class="acct-btn" type="button" @click="createdSecret = ''">Done</button>
        </div>
      </div>

      <p v-if="tokensError" class="acct-error">{{ tokensError }}</p>
      <p v-else-if="tokensLoading && !apiTokens.length" class="acct-hint">Loading tokens…</p>
      <p v-else-if="!apiTokens.length" class="acct-empty">No API tokens yet.</p>
      <div v-else class="acct-table-wrap">
        <table class="acct-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Access</th>
              <th scope="col">Created</th>
              <th scope="col">Last used</th>
              <th scope="col">Expires</th>
              <th scope="col" class="right"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in apiTokens" :key="item.id">
              <td>
                <span class="acct-cell-main">{{ item.name }}</span>
                <span class="acct-cell-sub num">{{ item.tokenPrefix }}…</span>
              </td>
              <td>
                <span class="token-scopes">
                  <span v-for="scope in item.scopes" :key="scope" class="acct-badge" :class="scope === '*' ? 'tone-warn' : 'tone-info'">
                    {{ scopeLabel(scope) }}
                  </span>
                </span>
              </td>
              <td class="nowrap num">{{ formatDateTime24(item.createdAt) }}</td>
              <td class="nowrap muted">{{ item.lastUsedAt ? formatRelativeTime(item.lastUsedAt) : 'Never' }}</td>
              <td class="nowrap">
                <span v-if="!item.expiresAt" class="muted">Never</span>
                <span v-else-if="isExpired(item.expiresAt)" class="acct-badge tone-danger">Expired</span>
                <span v-else class="num">{{ formatDate24(item.expiresAt) }}</span>
              </td>
              <td class="right">
                <button class="acct-btn acct-btn--sm acct-btn--danger" type="button" :disabled="tokenRevokingId === item.id" @click="revokeToken(item)">
                  {{ tokenRevokingId === item.id ? 'Revoking…' : 'Revoke' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="dash-panel" aria-label="Recent activity">
      <div class="dash-panel-head">
        <h3 class="acct-panel-title">
          <span class="acct-panel-icon tone-info" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6" /><path d="M8 4.5V8l2.5 1.5" /></svg>
          </span>
          Recent activity
          <span class="acct-panel-hint">sign-ins, password, 2FA, tokens, and license changes</span>
        </h3>
        <button class="acct-btn acct-btn--sm" type="button" :disabled="historyLoading || !profile.id" @click="loadUserHistory">
          {{ historyLoading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>

      <p v-if="historyError" class="acct-error">{{ historyError }}</p>
      <p v-else-if="historyLoading && !historyEntries.length" class="acct-hint">Loading activity…</p>
      <p v-else-if="!historyEntries.length" class="acct-empty">No sign-in, security, or license activity recorded yet.</p>
      <div v-else class="acct-table-wrap activity-wrap">
        <table class="acct-table">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Event</th>
              <th scope="col">Details</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in historyEntries" :key="entry.id">
              <td class="nowrap num">{{ formatDateTime24(entry.createdAt) }}</td>
              <td class="nowrap">
                <span class="audit-pill" :class="auditActionClass(entry.action)">{{ formatAuditAction(entry.action) }}</span>
              </td>
              <td>
                <span class="activity-summary">{{ historySummary(entry) }}</span>
                <span v-if="!auditSucceeded(entry)" class="acct-badge tone-danger">{{ auditResultLabel(entry) }}</span>
              </td>
              <td class="nowrap muted">
                <span v-if="entry.ipAddress" class="num">{{ maskIp(entry.ipAddress) }}</span>
                <template v-if="entry.userAgent"> · {{ describeUserAgent(entry.userAgent) }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { createApiToken, fetchApiTokenScopes, listApiTokens, revokeApiToken } from '@/api/apiTokens'
import { fetchAuditLogs } from '@/api/auditLogs'
import { fetchMe, listSessions, revokeOtherSessions, revokeSession } from '@/api/auth'
import { fetchUser, updateUser } from '@/api/users'
import { disableMFA, enableMFA, fetchMFAStatus, regenerateRecoveryCodes, startMFASetup } from '@/api/mfa'
import { useAuth } from '@/stores/auth'
import {
  auditActionClass,
  auditResultLabel,
  auditSucceeded,
  describeSignInMethod,
  describeUserAgent,
  formatAuditAction,
  formatDate24,
  formatDateTime24,
  formatRelativeTime,
  splitAuditDetails,
} from '@/utils/auditFormat'
import { maskIp } from '@/utils/maskIp'
import { notifyError, notifySuccess } from '@/utils/notify'
import { joinDisplayName, splitDisplayName } from '@/utils/userName'

const TITLE = 'Profile'
const MFA_TITLE = 'Two-factor authentication'
const DAY_MS = 24 * 60 * 60 * 1000

const ACCESS_OPTIONS = [
  { id: 'read', label: 'Read only' },
  { id: 'custom', label: 'Custom' },
  { id: 'full', label: 'Full access' },
]

const EXPIRY_OPTIONS = [
  { id: '30', label: '30 days', days: 30 },
  { id: '90', label: '90 days', days: 90 },
  { id: '365', label: '1 year', days: 365 },
  { id: 'never', label: 'Never', days: 0 },
]

const auth = useAuth()
const route = useRoute()

const loading = ref(false)
const saving = ref('')
const loadError = ref('')
const isEditingEmail = ref(false)
const passwordSectionRef = ref(null)
const mfaSectionRef = ref(null)
const currentPasswordRejected = ref(false)

const profile = reactive({
  id: null,
  name: '',
  email: '',
  hasPassword: true,
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

const requireMfa = ref('off')
const currentSession = ref(null)

const initials = computed(() => {
  const source = profile.name || profile.email || ''
  const parts = source.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean)
  return (parts[0]?.[0] || '?').toUpperCase() + (parts[1]?.[0] || '').toUpperCase()
})

const currentSessionHint = computed(() => {
  if (!currentSession.value) return 'account state'
  const expires = new Date(currentSession.value.expiresAt)
  if (Number.isNaN(expires.getTime())) return 'account state'
  return `session ends ${formatDateTime24(expires)}`
})

const profileNames = computed(() => splitDisplayName(profile.name))

const detailsDirty = computed(() => {
  const nameChanged =
    form.firstName.trim() !== profileNames.value.firstName || form.secondName.trim() !== profileNames.value.secondName
  const emailChanged =
    isEditingEmail.value && form.email.trim().toLowerCase() !== String(profile.email || '').trim().toLowerCase()
  return nameChanged || emailChanged
})

const showPasswordMismatch = computed(
  () => form.confirmPassword !== '' && form.password !== form.confirmPassword
)

const passwordReady = computed(() => {
  if (profile.hasPassword && !form.currentPassword.trim()) return false
  if (form.password.trim().length < 8) return false
  return form.password === form.confirmPassword
})

watch(
  () => form.currentPassword,
  () => {
    currentPasswordRejected.value = false
  }
)

// --- profile ----------------------------------------------------------------

const applyProfile = (user) => {
  profile.id = user?.id ?? null
  profile.name = user?.name || ''
  profile.email = user?.email || ''
  profile.hasPassword = user?.hasPassword !== false
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
  currentPasswordRejected.value = false
  isEditingEmail.value = false
}

const startEmailChange = async () => {
  isEditingEmail.value = true
  await nextTick()
  document.getElementById('info-email')?.focus()
}

const cancelEmailEdit = () => {
  form.email = profile.email
  isEditingEmail.value = false
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
    applyProfile((await fetchUser(sessionUser.id)) || sessionUser)
  } catch (error) {
    applyProfile(sessionUser)
    if (!sessionUser.name && !sessionUser.email) {
      loadError.value = error?.message || 'Could not load your information.'
    }
  } finally {
    loading.value = false
  }
}

const basePayload = () => ({
  name: joinDisplayName(form.firstName.trim(), form.secondName.trim()) || profile.name,
  email: (isEditingEmail.value ? form.email : profile.email).trim().toLowerCase(),
  role: profile.role || 'User',
  status: profile.status || 'Active',
  serverIds: profile.role === 'User' ? [...profile.serverIds] : [],
})

const syncSessionUser = () => {
  auth.updateUser({ id: profile.id, name: profile.name, email: profile.email, role: profile.role })
}

const saveDetails = async () => {
  if (!profile.id || saving.value || !detailsDirty.value) return
  const payload = basePayload()
  if (!form.firstName.trim() || !payload.email) {
    notifyError(TITLE, 'First name and email are required.')
    return
  }
  saving.value = 'details'
  try {
    applyProfile((await updateUser(profile.id, payload)) || { ...profile, ...payload })
    syncSessionUser()
    notifySuccess(TITLE, 'Your details were updated.')
    void loadUserHistory()
  } catch (error) {
    notifyError(TITLE, error?.message || 'Could not update your details.')
  } finally {
    saving.value = ''
  }
}

const savePassword = async () => {
  if (!profile.id || saving.value || !passwordReady.value) return
  const payload = {
    name: profile.name,
    email: profile.email,
    role: profile.role || 'User',
    status: profile.status || 'Active',
    serverIds: profile.role === 'User' ? [...profile.serverIds] : [],
    password: form.password,
  }
  if (profile.hasPassword) payload.currentPassword = form.currentPassword
  saving.value = 'password'
  try {
    applyProfile((await updateUser(profile.id, payload)) || { ...profile, hasPassword: true })
    profile.hasPassword = true
    notifySuccess(TITLE, 'Password changed. Your other sessions were signed out.')
    void loadUserHistory()
    void loadSessions()
    void loadUserHistory()
  } catch (error) {
    if (error?.payload?.error === 'invalid_current_password') currentPasswordRejected.value = true
    notifyError(TITLE, error?.message || 'Could not change your password.')
  } finally {
    saving.value = ''
  }
}

// --- two-factor ---------------------------------------------------------------

const mfaLoading = ref(false)
const mfaBusy = ref(false)
const mfaError = ref('')
const mfaStatus = reactive({ enabled: false, recoveryCodesRemaining: 0 })
const mfaSetup = ref(null)
const mfaSetupCode = ref('')
const mfaActionCode = ref('')
const recoveryCodes = ref([])
const recoveryCopied = ref(false)

const policyAppliesToMe = computed(
  () => requireMfa.value === 'all' || (requireMfa.value === 'admins' && profile.role === 'Admin')
)
const mfaPolicyLocks = computed(() => policyAppliesToMe.value && mfaStatus.enabled)
const mfaRequiredNow = computed(() => auth.state.mfaSetupRequired || (policyAppliesToMe.value && !mfaStatus.enabled && !mfaLoading.value && !mfaError.value))

const loadMFAStatus = async () => {
  mfaLoading.value = true
  mfaError.value = ''
  try {
    const status = await fetchMFAStatus()
    mfaStatus.enabled = Boolean(status?.enabled)
    mfaStatus.recoveryCodesRemaining = Number(status?.recoveryCodesRemaining) || 0
  } catch (error) {
    mfaError.value = error?.message || 'Could not load two-factor status.'
  } finally {
    mfaLoading.value = false
  }
}

const beginMFASetup = async () => {
  mfaBusy.value = true
  try {
    const result = await startMFASetup()
    const qrDataUrl = await QRCode.toDataURL(result.otpauthUrl, { margin: 1, width: 160 })
    mfaSetup.value = { secret: result.secret, qrDataUrl }
    mfaSetupCode.value = ''
  } catch (error) {
    notifyError(MFA_TITLE, error?.message || 'Could not start two-factor setup.')
  } finally {
    mfaBusy.value = false
  }
}

const confirmMFASetup = async () => {
  mfaBusy.value = true
  try {
    const result = await enableMFA(mfaSetupCode.value.trim())
    recoveryCodes.value = Array.isArray(result?.recoveryCodes) ? result.recoveryCodes : []
    recoveryCopied.value = false
    mfaSetup.value = null
    mfaSetupCode.value = ''
    auth.setMFASetupRequired(false)
    await loadMFAStatus()
    notifySuccess(MFA_TITLE, 'Two-factor authentication is on.')
    void loadUserHistory()
  } catch (error) {
    notifyError(MFA_TITLE, error?.message || 'Could not verify that code.')
  } finally {
    mfaBusy.value = false
  }
}

const turnOffMFA = async () => {
  mfaBusy.value = true
  try {
    await disableMFA(mfaActionCode.value.trim())
    mfaActionCode.value = ''
    await loadMFAStatus()
    notifySuccess(MFA_TITLE, 'Two-factor authentication is off.')
    void loadUserHistory()
  } catch (error) {
    notifyError(MFA_TITLE, error?.message || 'Could not turn off two-factor authentication.')
  } finally {
    mfaBusy.value = false
  }
}

const regenerateCodes = async () => {
  mfaBusy.value = true
  try {
    const result = await regenerateRecoveryCodes(mfaActionCode.value.trim())
    recoveryCodes.value = Array.isArray(result?.recoveryCodes) ? result.recoveryCodes : []
    recoveryCopied.value = false
    mfaActionCode.value = ''
    await loadMFAStatus()
  } catch (error) {
    notifyError(MFA_TITLE, error?.message || 'Could not create new recovery codes.')
  } finally {
    mfaBusy.value = false
  }
}

const copyRecoveryCodes = async () => {
  try {
    await navigator.clipboard.writeText(recoveryCodes.value.join('\n'))
    recoveryCopied.value = true
  } catch {
    notifyError(MFA_TITLE, 'Copy failed. Please copy the codes manually.')
  }
}

// --- sessions -------------------------------------------------------------------

const sessions = ref([])
const sessionsLoading = ref(false)
const sessionsBusy = ref(false)
const sessionsError = ref('')
const otherSessions = computed(() => sessions.value.filter((item) => !item.current))

const loadSessions = async () => {
  sessionsLoading.value = true
  sessionsError.value = ''
  try {
    const data = await listSessions()
    sessions.value = (Array.isArray(data) ? data : []).sort(
      (a, b) => Number(b.current) - Number(a.current) || new Date(b.lastSeenAt) - new Date(a.lastSeenAt)
    )
  } catch (error) {
    sessions.value = []
    sessionsError.value = error?.message || 'Could not load sessions.'
  } finally {
    sessionsLoading.value = false
  }
}

const signOutSession = async (item) => {
  sessionsBusy.value = true
  try {
    await revokeSession(item.id)
    notifySuccess(TITLE, 'That session was signed out.')
    void loadUserHistory()
    await loadSessions()
  } catch (error) {
    notifyError(TITLE, error?.message || 'Could not sign out that session.')
  } finally {
    sessionsBusy.value = false
  }
}

const signOutOthers = async () => {
  sessionsBusy.value = true
  try {
    const result = await revokeOtherSessions()
    const count = Number(result?.revoked) || 0
    notifySuccess(TITLE, count === 1 ? 'Signed out 1 other session.' : `Signed out ${count} other sessions.`)
    void loadUserHistory()
    await loadSessions()
  } catch (error) {
    notifyError(TITLE, error?.message || 'Could not sign out other sessions.')
  } finally {
    sessionsBusy.value = false
  }
}

const loadMe = async () => {
  try {
    const me = await fetchMe()
    requireMfa.value = me?.requireMfa || 'off'
    currentSession.value = me?.session || null
    auth.setMFASetupRequired(Boolean(me?.mfaSetupRequired))
    if (me?.user) auth.updateUser(me.user)
  } catch {
    // keep defaults
  }
}

// --- API tokens -------------------------------------------------------------------

const apiTokens = ref([])
const tokensLoading = ref(false)
const tokensError = ref('')
const tokenCreating = ref(false)
const tokenRevokingId = ref(null)
const createdSecret = ref('')
const secretCopied = ref(false)
const scopeCatalog = ref([])
const tokenForm = reactive({ name: '', access: 'read', expiry: '90', scopes: [] })

const customScopes = computed(() => scopeCatalog.value.filter((item) => item.id !== '*' && item.id !== 'read'))

const scopeLabel = (id) => scopeCatalog.value.find((item) => item.id === id)?.label || id

const tokenScopes = computed(() => {
  if (tokenForm.access === 'full') return ['*']
  if (tokenForm.access === 'read') return ['read']
  return [...tokenForm.scopes]
})

const accessHint = computed(() => {
  if (tokenForm.access === 'full') {
    return 'Full access can do anything your account can, including managing users, tokens, and settings. Prefer narrower access for automation.'
  }
  if (tokenForm.access === 'read') return 'Read only can list and view edges, sites, WAF rules, and analytics. It cannot change anything.'
  return 'Write access to an area includes read access to it. Account endpoints always need Full access.'
})

const canCreateToken = computed(
  () => Boolean(tokenForm.name.trim()) && tokenScopes.value.length > 0 && !tokenCreating.value
)

const isExpired = (value) => new Date(value).getTime() <= Date.now()

const loadApiTokens = async () => {
  tokensLoading.value = true
  tokensError.value = ''
  try {
    const data = await listApiTokens()
    apiTokens.value = Array.isArray(data) ? data : []
  } catch (error) {
    tokensError.value = error?.message || 'Could not load API tokens.'
    apiTokens.value = []
  } finally {
    tokensLoading.value = false
  }
}

const createToken = async () => {
  if (!canCreateToken.value) return
  tokenCreating.value = true
  secretCopied.value = false
  try {
    const days = EXPIRY_OPTIONS.find((option) => option.id === tokenForm.expiry)?.days || 0
    const expiresAt = days ? new Date(Date.now() + days * DAY_MS).toISOString() : undefined
    const result = await createApiToken({ name: tokenForm.name.trim(), scopes: tokenScopes.value, expiresAt })
    createdSecret.value = result?.secret || ''
    tokenForm.name = ''
    tokenForm.scopes = []
    notifySuccess(TITLE, 'API token created.')
    void loadUserHistory()
    await loadApiTokens()
  } catch (error) {
    notifyError(TITLE, error?.message || 'Could not create API token.')
  } finally {
    tokenCreating.value = false
  }
}

const revokeToken = async (item) => {
  if (!item?.id || tokenRevokingId.value != null) return
  tokenRevokingId.value = item.id
  try {
    await revokeApiToken(item.id)
    if (createdSecret.value && createdSecret.value.startsWith(String(item.tokenPrefix || ''))) createdSecret.value = ''
    notifySuccess(TITLE, 'API token revoked.')
    void loadUserHistory()
    await loadApiTokens()
  } catch (error) {
    notifyError(TITLE, error?.message || 'Could not revoke API token.')
  } finally {
    tokenRevokingId.value = null
  }
}

const copyCreatedSecret = async () => {
  try {
    await navigator.clipboard.writeText(createdSecret.value)
    secretCopied.value = true
  } catch {
    notifyError(TITLE, 'Could not copy the token. Select and copy it manually.')
  }
}

// --- activity -------------------------------------------------------------------------

const historyLoading = ref(false)
const historyError = ref('')
const historyEntries = ref([])

const AUTH_ACTIONS = new Set([
  'login',
  'logout',
  'login_failed',
  'password_change',
  'password_reset',
  'invite_accept',
  'mfa_enable',
  'mfa_disable',
  'mfa_reset',
  'recovery_codes',
  'token_create',
  'token_revoke',
  'session_revoke',
])

const isRelevantHistoryEntry = (entry) => {
  if (entry?.category === 'auth' || entry?.category === 'api_token') return true
  if (AUTH_ACTIONS.has(String(entry?.action || '').toLowerCase())) return true
  const path = String(entry?.path || '').toLowerCase()
  return path.includes('license') || String(entry?.details || '').toLowerCase().includes('license')
}

const historySummary = (entry) => {
  const { summary } = splitAuditDetails(entry?.details)
  return summary || entry?.resourceName || entry?.path || 'Account activity'
}

const loadUserHistory = async () => {
  if (!profile.id) return
  historyLoading.value = true
  historyError.value = ''
  try {
    const data = await fetchAuditLogs({ limit: 200, actorUserId: profile.id })
    historyEntries.value = (Array.isArray(data) ? data : []).filter(isRelevantHistoryEntry).slice(0, 40)
  } catch (error) {
    historyEntries.value = []
    historyError.value = error?.message || 'Could not load activity.'
  } finally {
    historyLoading.value = false
  }
}

// --- deep links ---------------------------------------------------------------------------

const applyRouteFocus = async () => {
  await nextTick()
  if (String(route.query.focus || '').toLowerCase() === 'password') {
    passwordSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    document.getElementById(profile.hasPassword ? 'info-current-password' : 'info-password')?.focus()
  } else if (route.query.setup2fa) {
    mfaSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

watch(() => [route.query.focus, route.query.setup2fa], applyRouteFocus)

onMounted(async () => {
  void loadMe()
  void loadMFAStatus()
  void loadSessions()
  void loadApiTokens()
  void fetchApiTokenScopes()
    .then((data) => {
      scopeCatalog.value = Array.isArray(data) ? data : []
    })
    .catch(() => {})
  await loadProfile()
  void loadUserHistory()
  void applyRouteFocus()
})
</script>

<style scoped>
.mfa-setup {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

.mfa-setup__steps {
  flex: 1 1 260px;
}

.mfa-qr {
  border-radius: 8px;
  background: #fff;
  padding: 6px;
}

.mfa-codes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.mfa-codes code {
  display: block;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--app-bg);
  border: 0.5px solid var(--app-border);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--app-heading);
}

.token-form__row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.token-form__name {
  flex: 1 1 220px;
}

.token-form__submit {
  height: 34px;
}

.token-scopes {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}

.activity-wrap {
  max-height: 420px;
  overflow-y: auto;
}

.activity-summary {
  margin-right: 6px;
}

.audit-pill {
  --pill-tone: var(--dorian-l4, #6b9fd4);
  display: inline-flex;
  padding: 2px 8px;
  border-radius: var(--badge-radius, 999px);
  font-size: 11px;
  font-weight: 600;
  color: var(--pill-tone);
  background: color-mix(in srgb, var(--pill-tone) 12%, transparent);
}

.audit-pill.is-login,
.audit-pill.is-create { --pill-tone: var(--dorian-viper-400, var(--app-accent)); }
.audit-pill.is-logout { --pill-tone: var(--app-text-muted); }
.audit-pill.is-delete { --pill-tone: var(--dorian-danger, #e15241); }
.audit-pill.is-security,
.audit-pill.is-operate { --pill-tone: var(--dorian-warn, #e0a83f); }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
