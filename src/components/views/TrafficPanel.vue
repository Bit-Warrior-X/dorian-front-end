<template>
  <div class="traffic-panel">
    <div class="traffic-list">
      <button
        v-for="item in trafficItems"
        :key="item.id"
        type="button"
        class="traffic-item"
        :class="{ active: activeTrafficItem === item.id }"
        @click="activeTrafficItem = item.id"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="traffic-content">
      <ListeningPortsPanel v-if="activeTrafficItem === 'listening-ports'" :server-id="serverId" />
      <UpstreamServersPanel v-else-if="activeTrafficItem === 'upstream-servers'" :server-id="serverId" />
      <div v-else class="traffic-section-card empty-state">
        <h4>{{ activeTrafficLabel }}</h4>
        <p>Configure this traffic section next.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import ListeningPortsPanel from "./ListeningPortsPanel.vue";
import UpstreamServersPanel from "./UpstreamServersPanel.vue";

defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const trafficItems = [
  { id: "listening-ports", label: "Listening Ports" },
  { id: "upstream-servers", label: "Upstream Servers" }
];

const activeTrafficItem = ref(trafficItems[0].id);

const activeTrafficLabel = computed(() => {
  const item = trafficItems.find((entry) => entry.id === activeTrafficItem.value);
  return item ? item.label : "Traffic";
});
</script>

<style scoped>
.traffic-panel {
  display: grid;
  grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
  min-height: 260px;
}

.traffic-list {
  border-right: 1px solid var(--app-border-strong);
  background: var(--app-surface-muted);
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 6px;
}

.traffic-item {
  border: 1px solid transparent;
  background: transparent;
  color: var(--app-text-secondary);
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.traffic-item:hover {
  background: var(--app-surface-hover);
}

.traffic-item.active {
  background: var(--app-surface-solid);
  border-color: rgba(124, 58, 237, 0.35);
  color: var(--app-accent);
  box-shadow: 0 8px 16px rgba(124, 58, 237, 0.12);
}

.traffic-content {
  padding: 18px 20px;
  background: var(--app-surface);
}

.traffic-section-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.traffic-section-card h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-heading);
}

.empty-state {
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 12px;
  color: var(--app-text-muted);
}
</style>
