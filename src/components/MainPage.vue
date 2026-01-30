<template>
  <div class="main-page">
    <!-- Overlay for mobile -->
    <div v-if="isPanelOpen" class="overlay" @click="togglePanel"></div>
    
    <!-- Left Panel -->
    <aside :class="['left-panel', { 'panel-hidden': !isPanelOpen }]">
      <div class="panel-header">
        <h2>CDNProxy</h2>
        <button class="panel-toggle-btn" @click="togglePanel" title="Toggle Panel">
          <svg v-if="isPanelOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      <nav class="panel-nav">
        <ul class="nav-list">
          <li :class="['nav-item', isRouteActive('dashboard') ? 'active' : '']">
            <RouterLink to="/app/dashboard">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </span>
              <span>Dashboard</span>
            </RouterLink>
          </li>
          <li :class="['nav-item', 'nav-item-parent', isServersOpen ? 'open' : '', isServersRoute ? 'active' : '']">
            <a href="#" @click.prevent="toggleServers">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="20" height="8" rx="2"></rect>
                  <rect x="2" y="13" width="20" height="8" rx="2"></rect>
                  <line x1="6" y1="7" x2="6.01" y2="7"></line>
                  <line x1="6" y1="17" x2="6.01" y2="17"></line>
                </svg>
              </span>
              <span>Servers</span>
              <span class="nav-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
            </a>
            <ul v-show="isServersOpen" class="nav-submenu">
              <li :class="['nav-subitem', isRouteActive('server-list') ? 'active' : '']">
                <RouterLink to="/app/servers/list">
                  <span>Server List</span>
                </RouterLink>
              </li>
              <li :class="['nav-subitem', isRouteActive('server-settings') ? 'active' : '']">
                <RouterLink to="/app/servers/settings">
                  <span>Server Settings</span>
                </RouterLink>
              </li>
              <li :class="['nav-subitem', isRouteActive('server-blacklist') ? 'active' : '']">
                <RouterLink to="/app/servers/blacklist">
                  <span>Blacklist</span>
                </RouterLink>
              </li>
            </ul>
          </li>
          <li :class="['nav-item', 'nav-item-parent', isDataAnalyticsOpen ? 'open' : '', isAnalyticsRoute ? 'active' : '']">
            <a href="#" @click.prevent="toggleDataAnalytics">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3v18h18"></path>
                  <path d="M18 7c0 2.5-2 5-5 5s-5-2.5-5-5 2-5 5-5 5 2.5 5 5z"></path>
                  <path d="M12 3v18"></path>
                </svg>
              </span>
              <span>DataAnalytics</span>
              <span class="nav-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
            </a>
            <ul v-show="isDataAnalyticsOpen" class="nav-submenu">
              <li :class="['nav-subitem', isRouteActive('access-log') ? 'active' : '']">
                <RouterLink to="/app/analytics/access-log">
                  <span>Access Log</span>
                </RouterLink>
              </li>
              <li :class="['nav-subitem', isRouteActive('log-export') ? 'active' : '']">
                <RouterLink to="/app/analytics/log-export">
                  <span>Log Export</span>
                </RouterLink>
              </li>
              <li :class="['nav-subitem', isRouteActive('security-analytics') ? 'active' : '']">
                <RouterLink to="/app/analytics/security-analytics">
                  <span>Analytics</span>
                </RouterLink>
              </li>
              <li :class="['nav-subitem', isRouteActive('security-analytics-detail') ? 'active' : '']">
                <RouterLink to="/app/analytics/security-analytics-detail">
                  <span>Security Analytics</span>
                </RouterLink>
              </li>
              <li :class="['nav-subitem', isRouteActive('layer4-attack-analytics') ? 'active' : '']">
                <RouterLink to="/app/analytics/layer4-attack-analytics">
                  <span>Layer 4 Attack Analytics</span>
                </RouterLink>
              </li>
            </ul>
          </li>
          <li v-if="isAdmin" :class="['nav-item', isRouteActive('users') ? 'active' : '']">
            <RouterLink to="/app/users">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              <span>Users</span>
            </RouterLink>
          </li>
        </ul>
      </nav>
      <div class="panel-footer">
        <button @click="handleLogout" class="logout-button">
          <span class="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Right Main View -->
    <main :class="['main-view', { 'main-view-expanded': !isPanelOpen }]">
      <!-- Floating toggle button when panel is hidden -->
      <button 
        v-if="!isPanelOpen" 
        class="floating-toggle-btn" 
        @click="togglePanel" 
        title="Show Panel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      
      <div class="toast-stack">
        <div
          v-for="note in notifications.state.queue"
          :key="note.id"
          class="toast"
          :class="note.type"
        >
          {{ note.message }}
        </div>
      </div>
      <div class="view-header">
        <button 
          v-if="isPanelOpen" 
          class="menu-toggle-btn" 
          @click="togglePanel" 
          title="Hide Panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h1>{{ currentViewTitle }}</h1>
        <div ref="userMenuRef" class="user-info">
          <button class="user-menu-button" type="button" @click="toggleUserMenu">
            <span class="user-avatar">{{ userInitials }}</span>
            <span class="user-name">{{ displayName }}</span>
            <span class="user-caret">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>
          <div v-if="isUserMenuOpen" class="user-menu">
            <button class="user-menu-item" type="button" @click="handleChangePassword">
              Change Password
            </button>
            <button class="user-menu-item user-menu-item--danger" type="button" @click="handleLogout">
              Log out
            </button>
          </div>
        </div>
      </div>
      <div class="view-content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { useNotifications } from '@/stores/notifications'

const auth = useAuth()
const notifications = useNotifications()
const route = useRoute()
const router = useRouter()

const isPanelOpen = ref(true)
const isDataAnalyticsOpen = ref(false)
const isServersOpen = ref(false)
const isUserMenuOpen = ref(false)
const userMenuRef = ref(null)

const isServersRoute = computed(
  () => route.meta?.section === 'servers' || route.path.startsWith('/app/servers')
)
const isAnalyticsRoute = computed(
  () =>
    route.meta?.section === 'analytics' ||
    route.path.startsWith('/app/analytics')
)

const isRouteActive = (name) => route.name === name

const currentViewTitle = computed(() => route.meta?.title || 'Dashboard')
const isAdmin = computed(
  () => String(auth.state.user?.role || '').toLowerCase() === 'admin'
)
const displayName = computed(() => auth.state.user?.name || auth.state.user?.email || 'User')
const userInitials = computed(() => {
  const name = displayName.value.trim()
  if (!name) return 'U'
  if (name.includes('@')) {
    return name[0].toUpperCase()
  }
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
})

watch(
  () => route.path,
  () => {
    if (isServersRoute.value) {
      isServersOpen.value = true
    }
    if (isAnalyticsRoute.value) {
      isDataAnalyticsOpen.value = true
    }
  },
  { immediate: true }
)

const toggleDataAnalytics = () => {
  isDataAnalyticsOpen.value = !isDataAnalyticsOpen.value
}

const toggleServers = () => {
  isServersOpen.value = !isServersOpen.value
}

const handleLogout = async () => {
  auth.clearSession()
  await router.replace('/login')
}

const handleChangePassword = () => {
  isUserMenuOpen.value = false
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const handleDocumentClick = (event) => {
  if (!userMenuRef.value) return
  if (!userMenuRef.value.contains(event.target)) {
    closeUserMenu()
  }
}

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.main-page {
  /* For full viewport coverage */
  position: fixed; /* or absolute */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  display: flex;
  /* Alternative using viewport units */
  width: 100%;
  min-height: 100vh;
  
  overflow: hidden;
}

/* Overlay for mobile */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  display: none;
}

@media (max-width: 768px) {
  .overlay {
    display: block;
  }
}

/* Left Panel Styles */
.left-panel {
  width: 280px;
  min-width: 280px;
  background: linear-gradient(180deg, #1a202c 0%, #2d3748 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 999;
  position: relative;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.left-panel.panel-hidden {
  width: 0;
  min-width: 0;
  transform: translateX(-100%);
  border-right: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .left-panel {
    position: fixed;
    height: 100vh;
    left: 0;
    top: 0;
    width: 280px;
    min-width: 280px;
  }
  
  .left-panel.panel-hidden {
    transform: translateX(-100%);
    width: 280px;
    min-width: 280px;
  }
  
  .main-view-expanded {
    width: 100%;
  }
}

.panel-header {
  padding: 28px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.panel-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.panel-toggle-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
}

.panel-toggle-btn svg {
  width: 16px;
  height: 16px;
}

.panel-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.panel-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin: 4px 0;
}

.nav-item a {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 24px;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border-radius: 0 12px 12px 0;
  margin-right: 12px;
  position: relative;
}

.nav-item a::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 4px 4px 0;
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item a:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  transform: translateX(4px);
}

.nav-item a:hover .nav-icon svg {
  transform: scale(1.1);
}

.nav-item a:hover::before {
  height: 60%;
}

.nav-item.active > a {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: white;
  box-shadow: inset 0 0 20px rgba(102, 126, 234, 0.1);
}

.nav-item.active > a .nav-icon svg {
  transform: scale(1.15);
  filter: drop-shadow(0 0 4px rgba(102, 126, 234, 0.5));
}

.nav-item.active > a::before {
  height: 80%;
}

.nav-item-parent {
  position: relative;
}

.nav-item-parent > a {
  position: relative;
}

.nav-arrow {
  margin-left: auto;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item-parent.open .nav-arrow {
  transform: rotate(90deg);
}

.nav-item-parent.open > a {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-submenu {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
  padding-left: 20px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-subitem {
  margin: 2px 0;
}

.nav-subitem a {
  display: flex;
  align-items: center;
  padding: 10px 24px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border-radius: 0 8px 8px 0;
  margin-right: 12px;
  position: relative;
  font-size: 0.9rem;
}

.nav-subitem a::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 3px 3px 0;
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-subitem a:hover {
  background: rgba(255, 255, 255, 0.06);
  color: white;
  transform: translateX(4px);
}

.nav-subitem a:hover::before {
  height: 50%;
}

.nav-subitem.active a {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.08) 100%);
  color: white;
}

.nav-subitem.active a::before {
  height: 70%;
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon svg {
  width: 100%;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%);
  color: white;
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.logout-button:hover {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(185, 28, 28, 0.3) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  border-color: rgba(220, 38, 38, 0.5);
}

/* Main View Styles */
.main-view {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.main-view-expanded {
  flex: 1 1 100%;
  width: 100%;
  max-width: 100%;
}

.toast-stack {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1300;
}

.toast {
  min-width: 240px;
  max-width: 360px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.14);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.toast.success {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(236, 253, 245, 0.95);
  color: #065f46;
}

.toast.error {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(254, 242, 242, 0.95);
  color: #b91c1c;
}

.view-header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  padding: 24px 40px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.menu-toggle-btn {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 1px solid rgba(226, 232, 240, 0.8);
  color: #1a202c;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.menu-toggle-btn svg {
  width: 20px;
  height: 20px;
}

.menu-toggle-btn:hover {
  background: linear-gradient(135deg, #e5e7eb 0%, #cbd5e0 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Floating toggle button when panel is hidden */
.floating-toggle-btn {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  width: 40px;
  height: 56px;
  border-radius: 0 12px 12px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  box-shadow: 4px 0 20px rgba(102, 126, 234, 0.4);
  padding: 0;
}

.floating-toggle-btn svg {
  width: 20px;
  height: 20px;
}

.floating-toggle-btn:hover {
  width: 48px;
  box-shadow: 6px 0 30px rgba(102, 126, 234, 0.5);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-50%) translateX(4px);
}

.view-header h1 {
  flex: 1;
}


.user-info {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #718096;
  font-size: 0.95rem;
}

.user-menu-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(102, 126, 234, 0.25);
  background: #ffffff;
  color: #1f2937;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-menu-button:hover {
  background: rgba(102, 126, 234, 0.08);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
}

.user-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.user-caret svg {
  width: 16px;
  height: 16px;
}

.user-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  min-width: 180px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
  padding: 8px;
  z-index: 20;
}

.user-menu-item {
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: #1f2937;
  font-size: 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.user-menu-item:hover {
  background: rgba(102, 126, 234, 0.08);
}

.user-menu-item--danger {
  color: #b91c1c;
}

.view-content {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  background: transparent;
}

.view-content::-webkit-scrollbar {
  width: 8px;
}

.view-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.view-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

.view-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

/* Responsive Design */
@media (max-width: 768px) {
  .left-panel {
    width: 250px;
  }

  .panel-header h2 {
    font-size: 1.25rem;
  }

  .nav-item a span:not(.nav-icon) {
    font-size: 0.9rem;
  }

  .view-header {
    padding: 16px 20px;
  }

  .view-header h1 {
    font-size: 1.5rem;
  }

  .view-content {
    padding: 20px;
  }
  
  .panel-toggle-btn {
    display: none;
  }
  
  .floating-toggle-btn {
    width: 32px;
    height: 40px;
    font-size: 0.9rem;
  }
  
  .floating-toggle-btn:hover {
    width: 36px;
  }
}

@media (max-width: 480px) {
  .main-page {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
    height: auto;
    max-height: 200px;
  }

  .panel-nav {
    display: flex;
    overflow-x: auto;
    padding: 10px 0;
  }

  .nav-list {
    display: flex;
    gap: 8px;
  }

  .nav-item {
    margin: 0;
  }

  .nav-item a {
    white-space: nowrap;
    padding: 8px 16px;
  }

  .panel-footer {
    display: none;
  }
}
</style>

