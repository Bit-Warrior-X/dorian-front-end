<template>
  <div ref="rootRef" class="app-topbar-actions">
    <ThemeToggleButton variant="icon-btn" />
    <div class="app-topbar-user">
      <button
        class="app-topbar-avatar"
        type="button"
        :title="displayName"
        :aria-label="`Account menu for ${displayName}`"
        @click="toggleUserMenu"
      >
        {{ userInitials }}
      </button>
      <div v-if="isUserMenuOpen" class="app-topbar-menu">
        <div class="app-topbar-menu-head">
          <span class="app-topbar-menu-name">{{ displayName }}</span>
        </div>
        <button class="app-topbar-menu-item" type="button" @click="handleChangePassword">
          Change Password
        </button>
        <button class="app-topbar-menu-item app-topbar-menu-item--danger" type="button" @click="handleLogout">
          Log out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '@/api/auth'
import { useAuth } from '@/stores/auth'
import ThemeToggleButton from './ThemeToggleButton.vue'

const auth = useAuth()
const router = useRouter()
const rootRef = ref(null)
const isUserMenuOpen = ref(false)

const displayName = computed(() => auth.state.user?.name || auth.state.user?.email || 'User')
const userInitials = computed(() => {
  const name = displayName.value.trim()
  if (!name) return 'U'
  if (name.includes('@')) return name[0].toUpperCase()
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
})

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const handleLogout = async () => {
  closeUserMenu()
  await logout('manual')
  auth.clearSession()
  await router.replace('/login')
}

const handleChangePassword = async () => {
  closeUserMenu()
  await router.push({ name: 'users-information', query: { focus: 'password' } })
}

const handleDocumentClick = (event) => {
  if (!rootRef.value?.contains(event.target)) {
    closeUserMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

