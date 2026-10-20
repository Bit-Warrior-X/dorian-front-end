<template>
  <div class="cfg-subpanel">
    <header class="cfg-head">
      <div class="cfg-head__copy">
        <span class="cfg-head__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" /></svg>
        </span>
        <div>
          <p class="cfg-head__kicker">Delivery</p>
          <h4>Cache, compression and ports</h4>
          <p class="cfg-head__desc">Tune cache behavior, compression, and listening ports for this hostname.</p>
        </div>
      </div>
    </header>

    <div class="cfg-subpanel__body">
      <nav class="cfg-subnav" aria-label="Delivery sections">
        <div class="cfg-subnav__group">
          <p class="cfg-subnav__group-label">Sections</p>
          <button
            v-for="item in trafficItems"
            :key="item.id"
            type="button"
            class="cfg-subnav__item"
            :class="{ active: activeTrafficItem === item.id }"
            @click="activeTrafficItem = item.id"
          >
            <span class="cfg-subnav__item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <template v-if="item.id === 'cache-management'"><ellipse cx="12" cy="6" rx="7.5" ry="2.8" /><path d="M4.5 6v6c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6M4.5 12v6c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-6" /></template>
                <template v-else-if="item.id === 'compress'"><path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5" /></template>
                <template v-else><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 9v6M15 9v6M9 12h6" /></template>
              </svg>
            </span>
            <span class="cfg-subnav__item-copy">
              <span class="cfg-subnav__item-label">{{ item.label }}</span>
              <span class="cfg-subnav__item-hint">{{ item.hint }}</span>
            </span>
          </button>
        </div>
      </nav>

      <div class="cfg-subpanel__content">
        <SitePortsPanel v-if="activeTrafficItem === 'ports'" :site-id="siteId" />
        <CacheManagementPanel v-else-if="activeTrafficItem === 'cache-management'" :site-id="siteId" />
        <CompressPanel v-else-if="activeTrafficItem === 'compress'" :site-id="siteId" />
        <div v-else class="cfg-subpanel__empty">
          <h4>{{ activeTrafficLabel }}</h4>
          <p>Configure this traffic section next.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SitePortsPanel from './SitePortsPanel.vue'
import CacheManagementPanel from './CacheManagementPanel.vue'
import CompressPanel from './CompressPanel.vue'

defineProps({
  siteId: {
    type: [Number, String],
    default: null,
  },
})

const trafficItems = [
  { id: 'cache-management', label: 'Cache', hint: 'Rules & purge' },
  { id: 'compress', label: 'Compress', hint: 'Gzip / Brotli' },
  { id: 'ports', label: 'Ports', hint: 'HTTP / HTTPS listeners' },
]

const activeTrafficItem = ref(trafficItems[0].id)

const activeTrafficLabel = computed(() => {
  const item = trafficItems.find((entry) => entry.id === activeTrafficItem.value)
  return item ? item.label : 'Traffic'
})
</script>

<style scoped>
.cfg-subpanel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 420px;
}
</style>
