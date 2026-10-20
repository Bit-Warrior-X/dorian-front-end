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
    path: '/login/set-password',
    name: 'set-password',
    component: LoginPage,
    meta: {
      public: true,
      title: 'Set password'
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
        path: 'docs',
        component: () => import('@/components/views/docs/DocsLayout.vue'),
        meta: {
          title: 'Docs',
          section: 'docs',
          hideShellTopbar: true,
          description: 'Operator handbook for the Dorian CDN console.',
        },
        children: [
          { path: '', redirect: { name: 'docs-get-started' } },
          {
            path: 'get-started',
            name: 'docs-get-started',
            component: () => import('@/components/views/docs/DocsGetStartedPage.vue'),
            meta: {
              title: 'Get started',
              section: 'docs',
              hideShellTopbar: true,
              description: 'From an empty console to a protected domain.',
            },
          },
          {
            path: 'architecture',
            name: 'docs-architecture',
            component: () => import('@/components/views/docs/DocsArchitecturePage.vue'),
            meta: {
              title: 'Architecture',
              section: 'docs',
              hideShellTopbar: true,
              description: 'Control plane, Angelos, Athens, and Sparta.',
            },
          },
          {
            path: 'edges',
            name: 'docs-edges',
            component: () => import('@/components/views/docs/DocsEdgesPage.vue'),
            meta: {
              title: 'Edges',
              section: 'docs',
              hideShellTopbar: true,
              description: 'Deploy, monitor, and configure protection nodes.',
            },
          },
          {
            path: 'sites',
            name: 'docs-sites',
            component: () => import('@/components/views/docs/DocsSitesPage.vue'),
            meta: {
              title: 'Sites',
              section: 'docs',
              hideShellTopbar: true,
              description: 'Domains, SSL, origins, cache, and DNS.',
            },
          },
          {
            path: 'security',
            name: 'docs-security',
            component: () => import('@/components/views/docs/DocsSecurityPage.vue'),
            meta: {
              title: 'Security',
              section: 'docs',
              hideShellTopbar: true,
              description: 'WAF packs, blocklists, and L4 mitigation.',
            },
          },
          {
            path: 'insights',
            name: 'docs-insights',
            component: () => import('@/components/views/docs/DocsInsightsPage.vue'),
            meta: {
              title: 'Insights',
              section: 'docs',
              hideShellTopbar: true,
              description: 'Traffic, cache, performance, security, and logs.',
            },
          },
          {
            path: 'licensing',
            name: 'docs-licensing',
            component: () => import('@/components/views/docs/DocsLicensingPage.vue'),
            meta: {
              title: 'Licensing',
              section: 'docs',
              hideShellTopbar: true,
              description: 'Trial, L4, L7, Unified, and billing periods.',
            },
          },
          {
            path: 'account',
            name: 'docs-account',
            component: () => import('@/components/views/docs/DocsAccountPage.vue'),
            meta: {
              title: 'Account & team',
              section: 'docs',
              hideShellTopbar: true,
              description: 'Sign-in, sessions, 2FA, members, API tokens, and audit log.',
            },
          },
          {
            path: 'api',
            name: 'docs-api',
            component: () => import('@/components/views/docs/DocsApiPage.vue'),
            meta: {
              title: 'API reference',
              section: 'docs',
              hideShellTopbar: true,
              description: 'Endpoints, scopes, and errors for automation.',
            },
          },
          {
            path: 'metrics',
            name: 'docs-metrics',
            component: () => import('@/components/views/docs/DocsMetricsPage.vue'),
            meta: {
              title: 'Metric definitions',
              section: 'docs',
              hideShellTopbar: true,
              description: 'What every analytics number counts.',
            },
          },
          {
            path: 'changelog',
            name: 'docs-changelog',
            component: () => import('@/components/views/docs/DocsChangelogPage.vue'),
            meta: {
              title: "What's new",
              section: 'docs',
              hideShellTopbar: true,
              description: 'Recent changes to the console.',
            },
          },
          {
            path: 'troubleshooting',
            name: 'docs-troubleshooting',
            component: () => import('@/components/views/docs/DocsTroubleshootingPage.vue'),
            meta: {
              title: 'Troubleshooting',
              section: 'docs',
              hideShellTopbar: true,
              description: 'Fix common first-week issues.',
            },
          },
          {
            path: 'faq',
            name: 'docs-faq',
            component: () => import('@/components/views/docs/DocsFaqPage.vue'),
            meta: {
              title: 'FAQ',
              section: 'docs',
              hideShellTopbar: true,
              description: 'Quick answers to common questions.',
            },
          },
          {
            path: 'glossary',
            name: 'docs-glossary',
            component: () => import('@/components/views/docs/DocsGlossaryPage.vue'),
            meta: {
              title: 'Glossary',
              section: 'docs',
              hideShellTopbar: true,
              description: 'Terms used across the console.',
            },
          },
          {
            path: 'cheat-sheet',
            name: 'docs-cheat-sheet',
            component: () => import('@/components/views/docs/DocsCheatSheetPage.vue'),
            meta: {
              title: 'Route cheat sheet',
              section: 'docs',
              hideShellTopbar: true,
              description: 'Jump to any console path.',
            },
          },
        ],
      },
      {
        path: 'blacklist',
        name: 'server-blacklist',
        component: () => import('@/components/views/ServerBlacklistView.vue'),
        meta: {
          title: 'Temporary blocks',
          section: 'blacklist',
          description: 'Current temporary blocks, with URL, rule, and time remaining.',
        }
      },
      {
        path: 'servers/blacklist',
        redirect: { name: 'server-blacklist' }
      },
      {
        path: 'analytics/traffic',
        name: 'security-analytics',
        component: () => import('@/components/views/Analytics.vue'),
        meta: {
          title: 'Traffic',
          section: 'analytics',
          description: 'Requests, bandwidth, status codes, HTTP versions, and visitors served by your edges.',
        }
      },
      {
        path: 'analytics/cache',
        name: 'cache-analytics',
        component: () => import('@/components/views/CacheAnalyticsView.vue'),
        meta: {
          title: 'Cache',
          section: 'analytics',
          description: 'Cache hit ratio, bandwidth served from cache, origin offload, and the URLs that miss most.',
        }
      },
      {
        path: 'analytics/performance',
        name: 'performance-analytics',
        component: () => import('@/components/views/PerformanceAnalyticsView.vue'),
        meta: {
          title: 'Performance',
          section: 'analytics',
          description: 'Edge and origin response times (p50/p95/p99), origin errors, and timeouts.',
        }
      },
      {
        path: 'analytics/security-events',
        name: 'attack-detection',
        component: () => import('@/components/views/DetectionAnalyticsView.vue'),
        meta: {
          title: 'Security events',
          section: 'analytics',
          description: 'Timeline of L4 floods and L7 block bursts detected in the selected window.',
        }
      },
      {
        path: 'analytics/firewall',
        name: 'security-analytics-detail',
        component: () => import('@/components/views/SecurityAnalyticsView.vue'),
        meta: {
          title: 'Firewall (L7)',
          section: 'analytics',
          description: 'HTTP requests blocked by WAF rules, rate limits, and IP/geo blocks, with where they came from.',
        }
      },
      {
        path: 'analytics/ddos',
        name: 'layer4-attack-analytics',
        component: () => import('@/components/views/Layer4AttackAnalyticsView.vue'),
        meta: {
          title: 'DDoS (L4)',
          section: 'analytics',
          description: 'Network-layer flood volume, allowed vs dropped packets, and attacking sources.',
        }
      },
      {
        path: 'analytics/logs',
        name: 'access-log',
        component: () => import('@/components/views/AccessLogView.vue'),
        meta: {
          title: 'Access logs',
          section: 'analytics',
          description: 'Raw HTTP access log lines streamed from your edges.',
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
      { path: 'analytics/security-analytics', redirect: { name: 'security-analytics' } },
      { path: 'analytics/security-analytics-detail', redirect: { name: 'security-analytics-detail' } },
      { path: 'analytics/layer4-attack-analytics', redirect: { name: 'layer4-attack-analytics' } },
      { path: 'analytics/detection', redirect: { name: 'attack-detection' } },
      { path: 'analytics/access-log', redirect: { name: 'access-log' } },
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

  if (requiresAuth && auth.state.mfaSetupRequired && to.name !== 'users-information') {
    return { name: 'users-information', query: { setup2fa: '1' } }
  }

  if (requiresAdmin && !isAdmin) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
