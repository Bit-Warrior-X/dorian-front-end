<template>
  <div class="waf-panel">
    <div class="waf-list">
      <button
        v-for="item in wafItems"
        :key="item.id"
        type="button"
        class="waf-item"
        :class="{ active: activeWafItem === item.id }"
        @click="activeWafItem = item.id"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="waf-content">
      <WafWhitelistPanel v-if="activeWafItem === 'whitelist'" :server-id="serverId" />
      <WafBlacklistPanel v-else-if="activeWafItem === 'blacklist'" :server-id="serverId" />
      <WafIpRepulationPanel v-else-if="activeWafItem === 'ip-repulation'" />
      <WafGeoLocationPanel v-else-if="activeWafItem === 'geo-locations'" :server-id="serverId" />
      <WafAntiCcPanel v-else-if="activeWafItem === 'anti-cc'" :server-id="serverId" />
      <WafAntiHeaderSettingPanel v-else-if="activeWafItem === 'anti-header-setting'" :server-id="serverId" />
      <WafIntervalFreqLimitPanel v-else-if="activeWafItem === 'interval-freq-limit'" :server-id="serverId" />
      <WafSecondFreqLimitPanel v-else-if="activeWafItem === 'second-freq-limit'" :server-id="serverId" />
      <WafResponseFreqPanel v-else-if="activeWafItem === 'response-freq'" :server-id="serverId" />
      <WafUserAgentPanel v-else-if="activeWafItem === 'user-agent'" :server-id="serverId" />
      <div v-else class="waf-section-card empty-state">
        <h4>{{ activeWafLabel }}</h4>
        <p>Configure this WAF section next.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import WafWhitelistPanel from "./WafWhitelistPanel.vue";
import WafBlacklistPanel from "./WafBlacklistPanel.vue";
import WafGeoLocationPanel from "./WafGeoLocationPanel.vue";
import WafAntiCcPanel from "./WafAntiCcPanel.vue";
import WafAntiHeaderSettingPanel from "./WafAntiHeaderSettingPanel.vue";
import WafIntervalFreqLimitPanel from "./WafIntervalFreqLimitPanel.vue";
import WafSecondFreqLimitPanel from "./WafSecondFreqLimitPanel.vue";
import WafResponseFreqPanel from "./WafResponseFreqPanel.vue";
import WafUserAgentPanel from "./WafUserAgentPanel.vue";
import WafIpRepulationPanel from "./WafIpRepulationPanel.vue";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const wafItems = [
  { id: "whitelist", label: "WhiteList" },
  { id: "blacklist", label: "BlackList" },
  { id: "ip-repulation", label: "IP Repulation" },
  { id: "geo-locations", label: "GEO Locations" },
  { id: "anti-cc", label: "Anti CC" },
  { id: "anti-header-setting", label: "Anti Header Setting" },
  { id: "interval-freq-limit", label: "Interval Freq Limit" },
  { id: "second-freq-limit", label: "Second Freq Limit" },
  { id: "response-freq", label: "Response Freq" },
  { id: "user-agent", label: "User Agent" },
  { id: "advanced-rule", label: "Advanced Rule" }
];

const activeWafItem = ref(wafItems[0].id);

const activeWafLabel = computed(() => {
  const item = wafItems.find((entry) => entry.id === activeWafItem.value);
  return item ? item.label : "WAF";
});
</script>

<style scoped>
.waf-panel {
  display: grid;
  grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
  min-height: 260px;
}

.waf-list {
  border-right: 1px solid var(--app-border-strong);
  background: var(--app-surface-muted);
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 6px;
}

.waf-item {
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

.waf-item:hover {
  background: var(--app-surface-hover);
}

.waf-item.active {
  background: var(--app-surface-solid);
  border-color: rgba(124, 58, 237, 0.35);
  color: var(--app-accent);
  box-shadow: 0 8px 16px rgba(124, 58, 237, 0.12);
}

.waf-content {
  padding: 18px 20px;
  background: var(--app-surface);
}

.waf-section-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.waf-section-card h4 {
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
