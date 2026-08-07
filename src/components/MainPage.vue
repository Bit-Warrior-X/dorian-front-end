<template>
  <div class="main-page">
    <!-- Overlay for mobile -->
    <div v-if="isPanelOpen" class="overlay" @click="togglePanel"></div>
    
    <!-- Left Panel -->
    <aside :class="['left-panel', { 'panel-hidden': !isPanelOpen }]">
      <div class="panel-header">
        <DorianBrandMark size="sm" wordmark wordmark-class="panel-header__wordmark" />
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                  <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                  <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                  <rect width="7" height="5" x="3" y="16" rx="1"></rect>
                </svg>
              </span>
              <span>Dashboard</span>
            </RouterLink>
          </li>
          <li :class="['nav-item', 'nav-item-parent', isServersOpen ? 'open' : '', isServersRoute ? 'active' : '']">
            <a href="#" @click.prevent="toggleServers">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="8" x="2" y="2" rx="2" ry="2"></rect>
                  <rect width="20" height="8" x="2" y="14" rx="2" ry="2"></rect>
                  <line x1="6" x2="6.01" y1="6" y2="6"></line>
                  <line x1="6" x2="6.01" y1="18" y2="18"></line>
                </svg>
              </span>
              <span>Edges</span>
              <span class="nav-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
            </a>
            <ul v-show="isServersOpen" class="nav-submenu">
              <li :class="['nav-subitem', isRouteActive('server-list') ? 'active' : '']">
                <RouterLink to="/app/servers/list">
                  <span>Edge List</span>
                </RouterLink>
              </li>
              <li :class="['nav-subitem', isRouteActive('server-settings') ? 'active' : '']">
                <RouterLink to="/app/servers/settings">
                  <span>Edge Settings</span>
                </RouterLink>
              </li>
            </ul>
          </li>
          <li :class="['nav-item', 'nav-item-parent', isSitesOpen ? 'open' : '', isSitesRoute ? 'active' : '']">
            <a href="#" @click.prevent="toggleSites">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                  <path d="M2 12h20"></path>
                </svg>
              </span>
              <span>Sites</span>
              <span class="nav-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
            </a>
            <ul v-show="isSitesOpen" class="nav-submenu">
              <li :class="['nav-subitem', isRouteActive('site-list') ? 'active' : '']">
                <RouterLink to="/app/sites/list">
                  <span>Site List</span>
                </RouterLink>
              </li>
              <li :class="['nav-subitem', isRouteActive('site-settings') ? 'active' : '']">
                <RouterLink to="/app/sites/settings">
                  <span>Site Settings</span>
                </RouterLink>
              </li>
            </ul>
          </li>
          <li :class="['nav-item', isRouteActive('waf-rules') ? 'active' : '']">
            <RouterLink to="/app/waf">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </span>
              <span>WAF Rule Set</span>
            </RouterLink>
          </li>
          <li :class="['nav-item', isRouteActive('server-blacklist') ? 'active' : '']">
            <RouterLink to="/app/blacklist">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                  <path d="m4.9 4.9 14.2 14.2"></path>
                </svg>
              </span>
              <span>Blocked List</span>
            </RouterLink>
          </li>
          <li :class="['nav-item', 'nav-item-parent', isDataAnalyticsOpen ? 'open' : '', isAnalyticsRoute ? 'active' : '']">
            <a href="#" @click.prevent="toggleDataAnalytics">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3v18h18"></path>
                  <path d="M18 17V9"></path>
                  <path d="M13 17V5"></path>
                  <path d="M8 17v-3"></path>
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
              <li :class="['nav-subitem', isRouteActive('security-analytics') ? 'active' : '']">
                <RouterLink to="/app/analytics/security-analytics">
                  <span>Analytics</span>
                </RouterLink>
              </li>
              <li :class="['nav-subitem', isRouteActive('access-log') ? 'active' : '']">
                <RouterLink to="/app/analytics/access-log">
                  <span>Access Log</span>
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
          <li :class="['nav-item', isRouteActive('server-license') ? 'active' : '']">
            <RouterLink to="/app/license">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="m9 15 2 2 4-4"></path>
                </svg>
              </span>
              <span>License</span>
            </RouterLink>
          </li>
          <li
            :class="['nav-item', 'nav-item-parent', isUsersOpen ? 'open' : '', isUsersRoute ? 'active' : '']"
          >
            <a href="#" @click.prevent="toggleUsers">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              <span>Users</span>
              <span class="nav-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </a>
            <ul v-show="isUsersOpen" class="nav-submenu">
              <li :class="['nav-subitem', isRouteActive('users-information') ? 'active' : '']">
                <RouterLink to="/app/users/information">Information</RouterLink>
              </li>
              <li v-if="isAdmin" :class="['nav-subitem', isRouteActive('users') ? 'active' : '']">
                <RouterLink to="/app/users/list">Users</RouterLink>
              </li>
              <li v-if="isAdmin" :class="['nav-subitem', isRouteActive('users-history') ? 'active' : '']">
                <RouterLink to="/app/users/history">History</RouterLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      <div class="panel-footer">
        <button @click="handleLogout" class="logout-button">
          <span class="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
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
      
      <NotificationToastStack />
      <header v-if="!isDashboardRoute" class="view-header app-topbar">
        <div class="app-topbar__left">
          <button
            v-if="isPanelOpen"
            class="menu-toggle-btn"
            type="button"
            @click="togglePanel"
            title="Hide Panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div class="app-topbar__titles">
            <h1>{{ currentViewTitle }}</h1>
          </div>
        </div>
        <AppTopbarActions />
      </header>
      <div class="view-content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/stores/auth'
import AppTopbarActions from './AppTopbarActions.vue'
import DorianBrandMark from './DorianBrandMark.vue'
import NotificationToastStack from './NotificationToastStack.vue'

const auth = useAuth()
const route = useRoute()

const isPanelOpen = ref(true)
const isDataAnalyticsOpen = ref(false)
const isServersOpen = ref(false)
const isSitesOpen = ref(false)
const isUsersOpen = ref(false)

const isServersRoute = computed(
  () => route.meta?.section === 'servers' || route.path.startsWith('/app/servers')
)
const isSitesRoute = computed(
  () => route.meta?.section === 'sites' || route.path.startsWith('/app/sites')
)
const isUsersRoute = computed(
  () => route.meta?.section === 'users' || route.path.startsWith('/app/users')
)
const isAnalyticsRoute = computed(
  () =>
    route.meta?.section === 'analytics' ||
    route.path.startsWith('/app/analytics')
)

const isRouteActive = (name) => route.name === name
const isDashboardRoute = computed(() => route.name === 'dashboard')

const currentViewTitle = computed(() => route.meta?.title || 'Dashboard')
const isAdmin = computed(
  () => String(auth.state.user?.role || '').toLowerCase() === 'admin'
)

watch(
  () => route.path,
  () => {
    if (isServersRoute.value) {
      isServersOpen.value = true
    }
    if (isSitesRoute.value) {
      isSitesOpen.value = true
    }
    if (isUsersRoute.value) {
      isUsersOpen.value = true
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

const toggleSites = () => {
  isSitesOpen.value = !isSitesOpen.value
}

const toggleUsers = () => {
  isUsersOpen.value = !isUsersOpen.value
}

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value
}
</script>


