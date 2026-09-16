<template>
  <div class="cfg-subpanel">
    <header class="cfg-subpanel__intro">
      <div>
        <p class="cfg-subpanel__kicker">Security</p>
        <h4>WAF protection</h4>
        <p>Pick a rule category to allow, block, or rate-limit traffic for this site.</p>
      </div>
    </header>

    <div class="cfg-subpanel__body">
      <nav class="cfg-subnav" aria-label="WAF sections">
        <div v-for="group in wafGroups" :key="group.id" class="cfg-subnav__group">
          <p class="cfg-subnav__group-label">{{ group.label }}</p>
          <button
            v-for="item in group.items"
            :key="item.id"
            type="button"
            class="cfg-subnav__item"
            :class="{ active: activeWafItem === item.id }"
            @click="activeWafItem = item.id"
          >
            <span class="cfg-subnav__item-label">{{ item.label }}</span>
            <span class="cfg-subnav__item-hint">{{ item.hint }}</span>
          </button>
        </div>
      </nav>

      <div class="cfg-subpanel__content">
        <WafWhitelistPanel v-if="activeWafItem === 'whitelist'" :site-id="siteId" :waf-rule-id="wafRuleId" />
        <WafBlacklistPanel v-else-if="activeWafItem === 'blacklist'" :site-id="siteId" :waf-rule-id="wafRuleId" />
        <WafIpRepulationPanel v-else-if="activeWafItem === 'ip-repulation'" />
        <WafGeoLocationPanel v-else-if="activeWafItem === 'geo-locations'" :site-id="siteId" :waf-rule-id="wafRuleId" />
        <WafAntiCcPanel v-else-if="activeWafItem === 'anti-cc'" :site-id="siteId" :waf-rule-id="wafRuleId" />
        <WafAntiHeaderSettingPanel v-else-if="activeWafItem === 'anti-header-setting'" :site-id="siteId" :waf-rule-id="wafRuleId" />
        <WafIntervalFreqLimitPanel v-else-if="activeWafItem === 'interval-freq-limit'" :site-id="siteId" :waf-rule-id="wafRuleId" />
        <WafSecondFreqLimitPanel v-else-if="activeWafItem === 'second-freq-limit'" :site-id="siteId" :waf-rule-id="wafRuleId" />
        <WafResponseFreqPanel v-else-if="activeWafItem === 'response-freq'" :site-id="siteId" :waf-rule-id="wafRuleId" />
        <WafUserAgentPanel v-else-if="activeWafItem === 'user-agent'" :site-id="siteId" :waf-rule-id="wafRuleId" />
        <div v-else class="cfg-subpanel__empty">
          <h4>{{ activeWafLabel }}</h4>
          <p>Configure this WAF section next.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import WafWhitelistPanel from './WafWhitelistPanel.vue'
import WafBlacklistPanel from './WafBlacklistPanel.vue'
import WafGeoLocationPanel from './WafGeoLocationPanel.vue'
import WafAntiCcPanel from './WafAntiCcPanel.vue'
import WafAntiHeaderSettingPanel from './WafAntiHeaderSettingPanel.vue'
import WafIntervalFreqLimitPanel from './WafIntervalFreqLimitPanel.vue'
import WafSecondFreqLimitPanel from './WafSecondFreqLimitPanel.vue'
import WafResponseFreqPanel from './WafResponseFreqPanel.vue'
import WafUserAgentPanel from './WafUserAgentPanel.vue'
import WafIpRepulationPanel from './WafIpRepulationPanel.vue'

defineProps({
  siteId: {
    type: [Number, String],
    default: null,
  },
  wafRuleId: {
    type: [Number, String],
    default: null,
  },
})

const wafGroups = [
  {
    id: 'access',
    label: 'Access control',
    items: [
      { id: 'whitelist', label: 'Whitelist', hint: 'Allow trusted sources' },
      { id: 'blacklist', label: 'Blacklist', hint: 'Block known threats' },
      { id: 'ip-repulation', label: 'IP reputation', hint: 'Score-based filtering' },
      { id: 'geo-locations', label: 'GEO locations', hint: 'Country allow / deny' },
    ],
  },
  {
    id: 'rate',
    label: 'Rate limits',
    items: [
      { id: 'anti-cc', label: 'Anti CC', hint: 'Challenge floods' },
      { id: 'interval-freq-limit', label: 'Interval limit', hint: 'Windowed request caps' },
      { id: 'second-freq-limit', label: 'Per-second limit', hint: 'Burst protection' },
      { id: 'response-freq', label: 'Response freq', hint: 'Throttle by response' },
    ],
  },
  {
    id: 'request',
    label: 'Request filters',
    items: [
      { id: 'anti-header-setting', label: 'Anti header', hint: 'Header anomalies' },
      { id: 'user-agent', label: 'User agent', hint: 'UA allow / deny' },
      { id: 'advanced-rule', label: 'Advanced rule', hint: 'Custom expressions' },
    ],
  },
]

const wafItems = wafGroups.flatMap((group) => group.items)
const activeWafItem = ref(wafItems[0].id)

const activeWafLabel = computed(() => {
  const item = wafItems.find((entry) => entry.id === activeWafItem.value)
  return item ? item.label : 'WAF'
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
  max-height: 640px;
  overflow: auto;
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
    max-height: none;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
  }

  .cfg-subnav__group {
    flex: 1 1 180px;
  }
}
</style>
