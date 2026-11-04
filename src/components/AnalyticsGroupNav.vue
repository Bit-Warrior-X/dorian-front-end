<template>
  <nav v-if="group" class="analytics-group-nav" :aria-label="`${group.label} sections`">
    <span class="analytics-group-nav__label">{{ group.label }}</span>
    <div class="analytics-group-nav__links">
      <RouterLink
        v-for="item in group.items"
        :key="item.name"
        class="analytics-group-nav__link"
        :class="{ active: route.name === item.name }"
        :to="{ name: item.name }"
      >
        {{ item.label }}
      </RouterLink>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { analyticsNavGroups } from '@/utils/analyticsNav'

const route = useRoute()

const group = computed(() =>
  analyticsNavGroups.find((entry) => entry.items.some((item) => item.name === route.name)),
)
</script>

<style scoped>
.analytics-group-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 28px;
}

.analytics-group-nav__label {
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.analytics-group-nav__links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.analytics-group-nav__link {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  color: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.analytics-group-nav__link:hover {
  color: var(--app-heading);
  background: var(--app-surface-muted);
}

.analytics-group-nav__link.active {
  color: var(--app-heading);
  background: var(--app-accent-soft);
}
</style>
