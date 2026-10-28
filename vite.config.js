import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          apexcharts: ['apexcharts'],
          'svg-maps': ['@svg-maps/world', 'vue-svg-map'],
          flatpickr: ['flatpickr', 'vue-flatpickr-component'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['panel.dorian.center', '.dorian.center'],
    proxy: {
      '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true, ws: true },
      '/servers': { target: 'http://127.0.0.1:8080', changeOrigin: true, ws: true },
      '/auth': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/audit-logs': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/users': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/sites': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/waf-rules': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/dashboard': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/analytics': { target: 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
})
