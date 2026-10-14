<template>
  <nav class="dash-tabbar" aria-label="Attack detection">
    <RouterLink
      v-for="item in items"
      :key="item.name"
      class="dash-tab"
      :class="{ active: route.name === item.name }"
      :to="{ name: item.name }"
    >
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { name: 'attack-detection', label: 'Detection' },
  { name: 'layer4-attack-analytics', label: 'L4 attacks' },
  { name: 'security-analytics-detail', label: 'L7 attacks' },
]
</script>

<style scoped>
a.dash-tab {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
</style>
