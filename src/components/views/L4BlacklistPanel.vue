<template>
  <L4IpListPanel mode="block" :server-id="serverId" />
</template>

<script setup>
import L4IpListPanel from './L4IpListPanel.vue'

defineProps({
  serverId: { type: [Number, String], default: null },
})
</script>
