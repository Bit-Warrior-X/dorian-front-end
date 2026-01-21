import { computed, reactive } from 'vue'

const STORAGE_KEY = 'cdnproxy.auth'

const state = reactive({
  user: null,
  token: null,
  hydrated: false
})

const persist = () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: state.user,
        token: state.token
      })
    )
  } catch {
    // ignore storage errors (private mode, denied, etc)
  }
}

const hydrate = () => {
  if (state.hydrated) return
  state.hydrated = true

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    state.user = parsed?.user || null
    state.token = parsed?.token || null
  } catch {
    state.user = null
    state.token = null
  }
}

const setSession = ({ user, token }) => {
  state.user = user || null
  state.token = token || null
  persist()
}

const clearSession = () => {
  state.user = null
  state.token = null
  persist()
}

const isAuthenticated = computed(() => Boolean(state.user))
const role = computed(() => state.user?.role || 'user')
const email = computed(() => state.user?.email || '')
const token = computed(() => state.token)

export const auth = {
  state,
  hydrate,
  setSession,
  clearSession,
  isAuthenticated,
  role,
  email,
  token
}

export const useAuth = () => {
  hydrate()
  return auth
}
