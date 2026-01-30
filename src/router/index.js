import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/components/LoginPage.vue'
import MainPage from '@/components/MainPage.vue'
import { auth } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/app'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: {
      public: true,
      title: 'Login'
    }
  },
  {
    path: '/app',
    component: MainPage,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        redirect: { name: 'dashboard' }
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/components/views/DashboardView.vue'),
        meta: {
          title: 'Dashboard'
        }
      },
      {
        path: 'servers/list',
        name: 'server-list',
        component: () => import('@/components/views/ServerListView.vue'),
        meta: {
          title: 'Server List',
          section: 'servers'
        }
      },
      {
        path: 'servers/settings',
        name: 'server-settings',
        component: () => import('@/components/views/ServerSettingsView.vue'),
        meta: {
          title: 'Server Settings',
          section: 'servers'
        }
      },
      {
        path: 'servers/blacklist',
        name: 'server-blacklist',
        component: () => import('@/components/views/ServerBlacklistView.vue'),
        meta: {
          title: 'Blacklist',
          section: 'servers'
        }
      },
      {
        path: 'analytics/access-log',
        name: 'access-log',
        component: () => import('@/components/views/AccessLogView.vue'),
        meta: {
          title: 'Access Log',
          section: 'analytics'
        }
      },
      {
        path: 'analytics/log-export',
        name: 'log-export',
        component: () => import('@/components/views/LogExportView.vue'),
        meta: {
          title: 'Log Export',
          section: 'analytics'
        }
      },
      {
        path: 'analytics/security-analytics',
        name: 'security-analytics',
        component: () => import('@/components/views/Analytics.vue'),
        meta: {
          title: 'Analytics',
          section: 'analytics'
        }
      },
      {
        path: 'analytics/security-analytics-detail',
        name: 'security-analytics-detail',
        component: () => import('@/components/views/SecurityAnalyticsView.vue'),
        meta: {
          title: 'Security Analytics',
          section: 'analytics'
        }
      },
      {
        path: 'analytics/layer4-attack-analytics',
        name: 'layer4-attack-analytics',
        component: () => import('@/components/views/Layer4AttackAnalyticsView.vue'),
        meta: {
          title: 'Layer 4 Attack Analytics',
          section: 'analytics'
        }
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/components/views/UsersView.vue'),
        meta: {
          title: 'Users',
          requiresAdmin: true
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/app'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  auth.hydrate()

  const isLoggedIn = auth.isAuthenticated.value
  const isAdmin = auth.state.user?.role === 'Admin'
  const isPublic = to.matched.some((record) => record.meta?.public)
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta?.requiresAdmin)

  if (to.name === 'login' && isLoggedIn) {
    return { name: 'dashboard' }
  }

  if (isPublic && !requiresAuth) {
    return true
  }

  if (requiresAuth && !isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (requiresAdmin && !isAdmin) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
