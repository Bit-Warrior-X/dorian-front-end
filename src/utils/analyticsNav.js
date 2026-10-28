export const analyticsNavGroups = [
  {
    id: 'traffic',
    label: 'Traffic',
    items: [
      { name: 'l7-traffic-analytics', label: 'L7 Traffic', path: '/app/analytics/traffic' },
      { name: 'l4-traffic-analytics', label: 'L4 Traffic', path: '/app/analytics/traffic-l4' },
      { name: 'cache-analytics', label: 'Cache', path: '/app/analytics/cache' },
      { name: 'performance-analytics', label: 'Performance', path: '/app/analytics/performance' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    items: [
      { name: 'attack-detection', label: 'Security events', path: '/app/analytics/security-events' },
      { name: 'security-analytics-detail', label: 'Firewall (L7)', path: '/app/analytics/firewall' },
      { name: 'layer4-attack-analytics', label: 'DDoS (L4)', path: '/app/analytics/ddos' },
    ],
  },
  {
    id: 'logs',
    label: 'Logs',
    items: [
      { name: 'access-log', label: 'Access logs', path: '/app/analytics/logs' },
      { name: 'log-export', label: 'Log export', path: '/app/analytics/log-export' },
    ],
  },
]

export const analyticsRouteNames = analyticsNavGroups.flatMap((group) => group.items.map((item) => item.name))
