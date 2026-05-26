import { computed, reactive } from 'vue'

const STORAGE_KEY = 'cdnproxy.theme'

const state = reactive({
  mode: 'dark',
  hydrated: false,
})

const applyTheme = () => {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', state.mode)
  window.dispatchEvent(
    new CustomEvent('cdnproxy-theme-change', { detail: { mode: state.mode } })
  )
}

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, state.mode)
  } catch {
    // ignore storage errors
  }
}

export const initTheme = () => {
  if (state.hydrated) {
    applyTheme()
    return
  }
  state.hydrated = true

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') {
      state.mode = stored
    } else {
      state.mode = 'dark'
    }
  } catch {
    state.mode = 'dark'
  }

  applyTheme()
}

export const toggleTheme = () => {
  state.mode = state.mode === 'dark' ? 'light' : 'dark'
  persist()
  applyTheme()
}

export const setTheme = (mode) => {
  if (mode !== 'dark' && mode !== 'light') return
  state.mode = mode
  persist()
  applyTheme()
}

const isDark = computed(() => state.mode === 'dark')

export const theme = {
  state,
  isDark,
  toggleTheme,
  setTheme,
  initTheme,
}

export const useTheme = () => {
  initTheme()
  return theme
}
