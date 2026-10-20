import { computed, reactive } from 'vue'
import { clearSessionActivity, syncSessionIdleForAuthChange, touchSessionActivity } from './sessionIdle'
import { clearAllAuthStorage, isRememberMeEnabled, readStoredAuth, writeStoredAuth } from './authStorage'

const state = reactive({
  user: null,
  token: null,
  rememberMe: false,
  expiresAt: null,
  mfaSetupRequired: false,
  hydrated: false,
})

const persist = () => {
  writeStoredAuth(
    {
      user: state.user,
      token: state.token,
      expiresAt: state.expiresAt,
      mfaSetupRequired: state.mfaSetupRequired,
    },
    state.rememberMe,
  )
}

const hydrate = () => {
  if (state.hydrated) return
  state.hydrated = true

  const parsed = readStoredAuth()
  if (!parsed) return

  state.user = parsed?.user || null
  state.token = parsed?.token || null
  state.expiresAt = parsed?.expiresAt || null
  state.mfaSetupRequired = Boolean(parsed?.mfaSetupRequired)
  state.rememberMe = isRememberMeEnabled()
}

const setSession = ({ user, token, rememberMe = false, expiresAt = null, mfaSetupRequired = false }) => {
  state.user = user || null
  state.token = token || null
  state.rememberMe = Boolean(rememberMe)
  state.expiresAt = expiresAt || null
  state.mfaSetupRequired = Boolean(mfaSetupRequired)
  persist()
  syncSessionIdleForAuthChange(Boolean(state.user && state.token))
  touchSessionActivity(true)
}

const setMFASetupRequired = (value) => {
  if (!state.token || state.mfaSetupRequired === Boolean(value)) return
  state.mfaSetupRequired = Boolean(value)
  persist()
}

const updateUser = (patch) => {
  if (!state.user) return
  state.user = { ...state.user, ...patch }
  persist()
}

const clearSession = () => {
  state.user = null
  state.token = null
  state.rememberMe = false
  state.expiresAt = null
  state.mfaSetupRequired = false
  clearAllAuthStorage()
  clearSessionActivity()
  syncSessionIdleForAuthChange(false)
}

const isAuthenticated = computed(() => {
  if (!state.token || !state.user) return false
  if (state.expiresAt && Date.parse(state.expiresAt) <= Date.now()) return false
  return true
})
const email = computed(() => state.user?.email || '')
const token = computed(() => state.token)

export const auth = {
  state,
  hydrate,
  setSession,
  setMFASetupRequired,
  updateUser,
  clearSession,
  isAuthenticated,
  email,
  token,
}

export const useAuth = () => {
  hydrate()
  return auth
}
