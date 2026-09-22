import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/components/LoginPage.vue'
import MainPage from '@/components/MainPage.vue'
import { auth } from '@/stores/auth'
import { isSessionIdleExpired } from '@/stores/sessionIdle'

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
    path: '/login/oauth/callback',
    name: 'oauth-callback',
    component: () => import('@/components/OAuthCallbackPage.vue'),
    meta: {
      public: true,
      title: 'Signing in'
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
          title: 'Overview',
          description: 'Fleet health, traffic, and shortcuts across edges and sites.',
        }
      },
      {
        path: 'servers/list',
        name: 'server-list',
        component: () => import('@/components/views/ServerListView.vue'),
        meta: {
          title: 'All edges',
          section: 'servers',
          description: 'Inventory of edge nodes with Angelos, L4 (Sparta), and L7 (Athens) runtime status.\nHover L4/L7 dots for layer details.',
        }
      },
      {
        path: 'servers/settings',
        name: 'server-settings',
        component: () => import('@/components/views/ServerSettingsView.vue'),
        meta: {
          title: 'Configure edges',
          section: 'servers',
          description: 'Monitor services, listening ports, and L4 defense for a selected edge.',
        }
      },
      {
        path: 'sites/list',
        name: 'site-list',
        component: () => import('@/components/views/SiteListView.vue'),
        meta: {
          title: 'All sites',
          section: 'sites',
          description: 'Domains protected by your edges, with SSL and WAF assignment.',
        }
      },
      {
        path: 'sites/settings',
        name: 'site-settings',
        component: () => import('@/components/views/SiteSettingsView.vue'),
        meta: {
          title: 'Configure sites',
          section: 'sites',
          description: 'Origin, ports, cache, compression, and WAF controls for a selected site.',
        }
      },
      {
        path: 'waf',
        name: 'waf-rules',
        component: () => import('@/components/views/WafRulesView.vue'),
        meta: {
          title: 'WAF rules',
          section: 'waf',
          description: 'Reusable Layer-7 rule sets applied to sites.',
        }
      },
      {
        path: 'license',
        name: 'server-license',
        component: () => import('@/components/views/ServerLicenseView.vue'),
        meta: {
          title: 'Licensing',
          section: 'license',
          description: 'Review and upgrade edge license tiers (Trial, L4, L7, Unified).',
        }
      },
      {
        path: 'blacklist',
        name: 'server-blacklist',
        component: () => import('@/components/views/ServerBlacklistView.vue'),
        meta: {
          title: 'IP blocklist',
          section: 'blacklist',
          description: 'Global or edge-scoped blocked source addresses.',
        }
      },
      {
        path: 'servers/blacklist',
        redirect: { name: 'server-blacklist' }
      },
      {
        path: 'analytics/access-log',
        name: 'access-log',
        component: () => import('@/components/views/AccessLogView.vue'),
        meta: {
          title: 'Access logs',
          section: 'analytics',
          description: 'Recent HTTP access events across the fleet.',
        }
      },
      {
        path: 'analytics/log-export',
        name: 'log-export',
        component: () => import('@/components/views/LogExportView.vue'),
        meta: {
          title: 'Log export',
          section: 'analytics',
          description: 'Export historical logs for offline analysis.',
        }
      },
      {
        path: 'analytics/security-analytics',
        name: 'security-analytics',
        component: () => import('@/components/views/Analytics.vue'),
        meta: {
          title: 'Traffic',
          section: 'analytics',
          description: 'Bandwidth, requests, and protocol trends for selected edges.',
        }
      },
      {
        path: 'analytics/security-analytics-detail',
        name: 'security-analytics-detail',
        component: () => import('@/components/views/SecurityAnalyticsView.vue'),
        meta: {
          title: 'Security',
          section: 'analytics',
          description: 'Blocked requests, geography, and top attack-related dimensions.',
        }
      },
      {
        path: 'analytics/layer4-attack-analytics',
        name: 'layer4-attack-analytics',
        component: () => import('@/components/views/Layer4AttackAnalyticsView.vue'),
        meta: {
          title: 'L4 attacks',
          section: 'analytics',
          description: 'Layer-4 flood volume and protocol mix over the selected range.',
        }
      },
      {
        path: 'users',
        redirect: { name: 'users-information' }
      },
      {
        path: 'users/information',
        name: 'users-information',
        component: () => import('@/components/views/UsersInformationView.vue'),
        meta: {
          title: 'Profile',
          section: 'users',
          description: 'Your account profile, email, password, and API tokens.',
        }
      },
      {
        path: 'users/list',
        name: 'users',
        component: () => import('@/components/views/UsersView.vue'),
        meta: {
          title: 'Team',
          section: 'users',
          requiresAdmin: true,
          description: 'Manage operator accounts and roles for this console.',
        }
      },
      {
        path: 'users/history',
        name: 'users-history',
        component: () => import('@/components/views/UsersHistoryView.vue'),
        meta: {
          title: 'Audit log',
          section: 'users',
          requiresAdmin: true,
          description: 'Administrative actions recorded for this account workspace.',
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

  if (auth.isAuthenticated.value && isSessionIdleExpired()) {
    auth.clearSession()
    if (to.name !== 'login') {
      return {
        name: 'login',
        query: { reason: 'idle', redirect: to.fullPath }
      }
    }
  }

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
