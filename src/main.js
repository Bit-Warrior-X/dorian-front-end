import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'

const app = createApp(App)
app.component('FlatPickr', FlatPickr)
app.use(router).mount('#app')
