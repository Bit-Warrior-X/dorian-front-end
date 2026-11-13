<template>
  <div v-if="message" class="lic-banner" :class="`tone-${tone}`" role="status">
    <span class="lic-banner__dot" aria-hidden="true" />
    <span class="lic-banner__text">{{ message }}</span>
    <RouterLink class="lic-banner__link" :to="{ name: 'server-license' }">Renew</RouterLink>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { fetchLicenses } from '@/api/orders'

const auth = useAuth()
const route = useRoute()
const licenses = ref([])

const isAdmin = computed(() => String(auth.state.user?.role || '').toLowerCase() === 'admin')

const expired = computed(() => licenses.value.filter((l) => l.status === 'expired'))
const pastDue = computed(() => licenses.value.filter((l) => l.status === 'past_due'))

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

const tone = computed(() => (expired.value.length ? 'danger' : 'warn'))
const message = computed(() => {
  if (isAdmin.value || route.name === 'server-license') return ''
  if (expired.value.length) {
    return `${plural(expired.value.length, 'license')} expired. Protection keeps running, but changes are locked until you renew.`
  }
  if (pastDue.value.length) {
    return `${plural(pastDue.value.length, 'license')} past due. Renew within 14 days of the end date to keep changes unlocked.`
  }
  return ''
})

let loadedFor = null
const load = async () => {
  const userId = auth.state.user?.id
  if (!userId || isAdmin.value || loadedFor === userId) return
  loadedFor = userId
  try {
    const data = await fetchLicenses('mine')
    licenses.value = Array.isArray(data) ? data : []
  } catch {
    licenses.value = []
  }
}

onMounted(load)
watch(() => auth.state.user?.id, load)
watch(
  () => route.name,
  (name, prev) => {
    if (prev === 'server-license' || prev === 'order-detail') {
      loadedFor = null
      load()
    }
  },
)
</script>

<style scoped>
.lic-banner {
  --banner-tone: var(--dorian-warn, #e0a83f);
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  padding: 9px 14px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--app-text);
  background: color-mix(in srgb, var(--banner-tone) 10%, var(--app-surface));
  border: 0.5px solid color-mix(in srgb, var(--banner-tone) 40%, transparent);
}

.lic-banner.tone-danger {
  --banner-tone: var(--dorian-danger, #e15241);
}

.lic-banner__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--banner-tone);
}

.lic-banner__text {
  flex: 1;
  min-width: 0;
}

.lic-banner__link {
  flex: none;
  font-weight: 600;
  color: var(--banner-tone);
  text-decoration: none;
}

.lic-banner__link:hover {
  text-decoration: underline;
}
</style>
