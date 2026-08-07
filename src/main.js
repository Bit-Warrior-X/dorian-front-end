import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import '@/assets/theme.css'
import { initTheme } from '@/stores/theme'
import { auth } from '@/stores/auth'
import { initSessionIdle, isSessionIdleExpired } from '@/stores/sessionIdle'

initTheme()
auth.hydrate()

initSessionIdle({
  isAuthenticated: () => auth.isAuthenticated.value,
  onExpire: async () => {
    auth.clearSession()
    const current = router.currentRoute.value
    if (current.name === 'login') return
    await router.replace({
      name: 'login',
      query: { reason: 'idle', redirect: current.fullPath }
    })
  }
})

if (auth.isAuthenticated.value && isSessionIdleExpired()) {
  auth.clearSession()
}

const app = createApp(App)
app.component('FlatPickr', FlatPickr)
app.use(router).mount('#app')
