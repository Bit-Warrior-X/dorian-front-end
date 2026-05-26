import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import '@/assets/theme.css'
import { initTheme } from '@/stores/theme'

initTheme()

const app = createApp(App)
app.component('FlatPickr', FlatPickr)
app.use(router).mount('#app')
