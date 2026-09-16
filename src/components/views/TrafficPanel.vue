<template>
  <div class="cfg-subpanel">
    <header class="cfg-subpanel__intro">
      <div>
        <p class="cfg-subpanel__kicker">Delivery</p>
        <h4>Traffic &amp; edges</h4>
        <p>Tune cache behavior, compression, and listening ports for this hostname.</p>
      </div>
    </header>

    <div class="cfg-subpanel__body">
      <nav class="cfg-subnav" aria-label="Traffic sections">
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
            <span class="cfg-subnav__item-label">{{ item.label }}</span>
            <span class="cfg-subnav__item-hint">{{ item.hint }}</span>
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
  --cfg-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 420px;
}

.cfg-subpanel__intro {
  padding: 0 0 14px;
  border-bottom: 1px solid var(--app-border);
  margin-bottom: 14px;
}

.cfg-subpanel__kicker {
  margin: 0 0 3px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.cfg-subpanel__intro h4 {
  margin: 0 0 4px;
  font-size: 1.15rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--app-heading);
}

.cfg-subpanel__intro p:last-child {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-muted);
  line-height: 1.45;
}

.cfg-subpanel__body {
  display: grid;
  grid-template-columns: minmax(200px, 240px) minmax(0, 1fr);
  gap: 14px;
  min-height: 360px;
}

.cfg-subnav {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 2px 4px 0;
  border-right: 1px solid var(--app-border);
}

.cfg-subnav__group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cfg-subnav__group-label {
  margin: 0 0 2px;
  padding: 0 10px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.cfg-subnav__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  width: 100%;
  border: 1px solid transparent;
  background: transparent;
  color: var(--app-text);
  text-align: left;
  padding: 8px 10px;
  border-radius: var(--cfg-radius);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.cfg-subnav__item:hover:not(.active) {
  background: color-mix(in srgb, var(--app-accent) 5%, transparent);
  border-color: color-mix(in srgb, var(--app-accent) 25%, transparent);
}

.cfg-subnav__item.active {
  background: rgba(46, 158, 108, 0.1);
  border-color: rgba(46, 158, 108, 0.35);
  box-shadow: inset 2px 0 0 var(--dorian-viper-500, var(--app-accent));
}

.cfg-subnav__item-label {
  font-size: 13px;
  font-weight: 650;
  color: var(--app-heading);
}

.cfg-subnav__item.active .cfg-subnav__item-label {
  color: var(--dorian-viper-400, var(--app-accent));
}

.cfg-subnav__item-hint {
  font-size: 11.5px;
  color: var(--app-text-muted);
  line-height: 1.3;
}

.cfg-subpanel__content {
  min-width: 0;
  padding: 2px 0 0;
}

.cfg-subpanel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 280px;
  padding: 32px 16px;
  border: 1px dashed var(--app-border);
  border-radius: var(--cfg-radius);
  color: var(--app-text-muted);
}

.cfg-subpanel__empty h4 {
  margin: 0 0 6px;
  color: var(--app-heading);
  font-size: 1rem;
}

.cfg-subpanel__empty p {
  margin: 0;
  font-size: 13px;
}

@media (max-width: 900px) {
  .cfg-subpanel__body {
    grid-template-columns: 1fr;
  }

  .cfg-subnav {
    border-right: none;
    border-bottom: 1px solid var(--app-border);
    padding-bottom: 12px;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .cfg-subnav__group {
    flex: 1 1 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .cfg-subnav__item {
    flex: 1 1 140px;
  }
}
</style>
