<template>
  <div class="main-page">
    <!-- Left Panel -->
    <aside class="left-panel">
      <div class="panel-header">
        <h2>CDNProxy</h2>
      </div>
      <nav class="panel-nav">
        <ul class="nav-list">
          <li :class="['nav-item', activeView === 'dashboard' ? 'active' : '']">
            <a href="#" @click.prevent="setActiveView('dashboard', $event)">
              <span class="nav-icon">📊</span>
              <span>Dashboard</span>
            </a>
          </li>
          <li :class="['nav-item', activeView === 'settings' ? 'active' : '']">
            <a href="#" @click.prevent="setActiveView('settings', $event)">
              <span class="nav-icon">⚙️</span>
              <span>Settings</span>
            </a>
          </li>
          <li :class="['nav-item', activeView === 'users' ? 'active' : '']">
            <a href="#" @click.prevent="setActiveView('users', $event)">
              <span class="nav-icon">👥</span>
              <span>Users</span>
            </a>
          </li>
          <li :class="['nav-item', activeView === 'reports' ? 'active' : '']">
            <a href="#" @click.prevent="setActiveView('reports', $event)">
              <span class="nav-icon">📈</span>
              <span>Reports</span>
            </a>
          </li>
        </ul>
      </nav>
      <div class="panel-footer">
        <button @click="handleLogout" class="logout-button">
          <span class="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Right Main View -->
    <main class="main-view">
      <div class="view-header">
        <h1>{{ currentViewTitle }}</h1>
        <div class="user-info">
          <span>Welcome, Super Admin</span>
        </div>
      </div>
      <div class="view-content">
        <component :is="currentViewComponent" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DashboardView from './views/DashboardView.vue'
import SettingsView from './views/SettingsView.vue'
import UsersView from './views/UsersView.vue'
import ReportsView from './views/ReportsView.vue'

const emit = defineEmits(['logout'])

const activeView = ref('dashboard')

const views = {
  dashboard: {
    title: 'Dashboard',
    component: DashboardView
  },
  settings: {
    title: 'Settings',
    component: SettingsView
  },
  users: {
    title: 'Users',
    component: UsersView
  },
  reports: {
    title: 'Reports',
    component: ReportsView
  }
}

const currentViewTitle = computed(() => views[activeView.value]?.title || 'Dashboard')
const currentViewComponent = computed(() => views[activeView.value]?.component || DashboardView)

const setActiveView = (view, event) => {
  activeView.value = view
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active')
  })
  if (event) {
    event.target.closest('.nav-item')?.classList.add('active')
  }
}

const handleLogout = () => {
  emit('logout')
}
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

/* Left Panel Styles */
.left-panel {
  width: 250px;
  background: #1a202c;
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.panel-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: white;
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
  gap: 12px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.nav-item a:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active a {
  background: rgba(102, 126, 234, 0.2);
  color: white;
  border-left: 3px solid #667eea;
}

.nav-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
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
  padding: 12px 20px;
  background: rgba(220, 38, 38, 0.2);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.logout-button:hover {
  background: rgba(220, 38, 38, 0.3);
}

/* Main View Styles */
.main-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f7fafc;
  overflow: hidden;
}

.view-header {
  background: white;
  padding: 20px 32px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.user-info {
  color: #718096;
  font-size: 0.95rem;
}

.view-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
  .left-panel {
    width: 200px;
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

