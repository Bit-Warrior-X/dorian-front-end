import { computed, reactive } from 'vue'
import { clearSessionActivity, syncSessionIdleForAuthChange, touchSessionActivity } from './sessionIdle'
import { clearAllAuthStorage, isRememberMeEnabled, readStoredAuth, writeStoredAuth } from './authStorage'

const state = reactive({
  user: null,
  token: null,
  rememberMe: false,
  hydrated: false,
})

const persist = () => {
  writeStoredAuth(
    { user: state.user, token: state.token },
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
  state.rememberMe = isRememberMeEnabled()
}

const setSession = ({ user, token, rememberMe = false }) => {
  state.user = user || null
  state.token = token || null
  state.rememberMe = Boolean(rememberMe)
  persist()
  syncSessionIdleForAuthChange(Boolean(state.user))
  touchSessionActivity(true)
}

const clearSession = () => {
  state.user = null
  state.token = null
  state.rememberMe = false
  clearAllAuthStorage()
  clearSessionActivity()
  syncSessionIdleForAuthChange(false)
}

const isAuthenticated = computed(() => Boolean(state.user))
const email = computed(() => state.user?.email || '')
const token = computed(() => state.token)

export const auth = {
  state,
  hydrate,
  setSession,
  clearSession,
  isAuthenticated,
  email,
  token,
}

export const useAuth = () => {
  hydrate()
  return auth
}
