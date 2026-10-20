<template>
  <nav v-if="group" class="dash-tabbar" :aria-label="`${group.label} analytics`">
    <RouterLink
      v-for="item in group.items"
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
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { analyticsNavGroups } from '@/utils/analyticsNav'

const route = useRoute()

const group = computed(() =>
  analyticsNavGroups.find((entry) => entry.items.some((item) => item.name === route.name)),
)
</script>

<style scoped>
a.dash-tab {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
</style>
