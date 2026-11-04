/**
 * Single source of truth for Analytics sidebar groups and related shell chrome.
 * Keep labels short; put role-of-page guidance in route meta.description.
 *
 * Items with ownTopbar:false (or omitted on non-dashboard analytics pages that
 * still use the shell header) keep the MainPage topbar visible.
 */
export const analyticsNavGroups = [
  {
    id: 'traffic',
    label: 'Traffic',
    items: [
      { name: 'l7-traffic-analytics', label: 'L7 Traffic', path: '/app/analytics/traffic', ownTopbar: true },
      { name: 'l4-traffic-analytics', label: 'L4 Traffic', path: '/app/analytics/traffic-l4', ownTopbar: true },
      { name: 'cache-analytics', label: 'Cache', path: '/app/analytics/cache', ownTopbar: true },
      { name: 'performance-analytics', label: 'Performance', path: '/app/analytics/performance', ownTopbar: true },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    items: [
      { name: 'security-events', label: 'Security events', path: '/app/analytics/security-events', ownTopbar: true },
      { name: 'firewall-analytics', label: 'Firewall (L7)', path: '/app/analytics/firewall', ownTopbar: true },
      { name: 'ddos-analytics', label: 'DDoS (L4)', path: '/app/analytics/ddos', ownTopbar: true },
      // Runtime bans from Drop+Block / L7 Guard — not WAF authoring.
      { name: 'temp-blocks', label: 'Temporary blocks', path: '/app/analytics/temp-blocks', ownTopbar: false },
    ],
  },
  {
    id: 'logs',
    label: 'Logs',
    items: [
      { name: 'access-log', label: 'Live access', path: '/app/analytics/logs', ownTopbar: true },
      { name: 'log-export', label: 'Export & history', path: '/app/analytics/log-export', ownTopbar: true },
    ],
  },
]

export const analyticsRouteNames = analyticsNavGroups.flatMap((group) =>
  group.items.map((item) => item.name),
)

/** Pages that render their own dash-topbar (theme/user controls). */
export const shellTopbarHiddenRouteNames = [
  'dashboard',
  ...analyticsNavGroups.flatMap((group) =>
    group.items.filter((item) => item.ownTopbar !== false).map((item) => item.name),
  ),
  'waf-rules',
  'server-license',
  'users-information',
  'users',
  'users-history',
]
