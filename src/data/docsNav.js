/** In-app Docs navigation — one route per article (CDN-style). */

export const docsNav = [
  {
    group: 'Start here',
    items: [
      {
        slug: 'get-started',
        name: 'docs-get-started',
        title: 'Get started',
        description: 'From an empty console to a protected domain',
        keywords: 'onboard deploy first setup checklist',
      },
      {
        slug: 'architecture',
        name: 'docs-architecture',
        title: 'Architecture',
        description: 'Control plane, Angelos, Athens, and Sparta',
        keywords: 'angelos athens sparta edge site waf agent',
      },
    ],
  },
  {
    group: 'Build',
    items: [
      {
        slug: 'edges',
        name: 'docs-edges',
        title: 'Edges',
        description: 'Deploy, monitor, and configure protection nodes',
        keywords: 'server ssh new edge xdp monitor ports sparta',
      },
      {
        slug: 'sites',
        name: 'docs-sites',
        title: 'Sites',
        description: 'Domains, SSL, origins, cache, and DNS',
        keywords: 'domain ssl origin cache compress lets encrypt acme',
      },
      {
        slug: 'security',
        name: 'docs-security',
        title: 'Security',
        description: 'WAF packs, blocklists, and L4 mitigation',
        keywords: 'waf blacklist whitelist geo rate bot l4 l7',
      },
    ],
  },
  {
    group: 'Operate',
    items: [
      {
        slug: 'insights',
        name: 'docs-insights',
        title: 'Insights',
        description: 'Detection, traffic, and access logs',
        keywords: 'analytics traffic access log export bandwidth',
      },
      {
        slug: 'licensing',
        name: 'docs-licensing',
        title: 'Licensing',
        description: 'Trial, L4, L7, Unified, and billing periods',
        keywords: 'trial l4 l7 unified monthly annual price',
      },
      {
        slug: 'account',
        name: 'docs-account',
        title: 'Account & team',
        description: 'Profile, API tokens, admins, and audit log',
        keywords: 'profile team audit api token admin session 2fa invite password reset',
      },
    ],
  },
  {
    group: 'Reference',
    items: [
      {
        slug: 'api',
        name: 'docs-api',
        title: 'API reference',
        description: 'Endpoints, scopes, and errors for automation',
        keywords: 'api rest token curl endpoint scope automation ci',
      },
      {
        slug: 'metrics',
        name: 'docs-metrics',
        title: 'Metric definitions',
        description: 'What every analytics number counts',
        keywords: 'metrics hit ratio bandwidth p95 latency nic l7 dropped blocked',
      },
      {
        slug: 'troubleshooting',
        name: 'docs-troubleshooting',
        title: 'Troubleshooting',
        description: 'Fix common first-week issues',
        keywords: 'expired unknown angelos port dns ssl',
      },
      {
        slug: 'faq',
        name: 'docs-faq',
        title: 'FAQ',
        description: 'Quick answers to common questions',
        keywords: 'questions help',
      },
      {
        slug: 'glossary',
        name: 'docs-glossary',
        title: 'Glossary',
        description: 'Terms used across the console',
        keywords: 'definitions terms',
      },
      {
        slug: 'cheat-sheet',
        name: 'docs-cheat-sheet',
        title: 'Route cheat sheet',
        description: 'Jump to any console path',
        keywords: 'routes paths navigation',
      },
      {
        slug: 'changelog',
        name: 'docs-changelog',
        title: "What's new",
        description: 'Recent changes to the console',
        keywords: 'changelog release new updates',
      },
    ],
  },
]

export const docsPages = docsNav.flatMap((group) => group.items)

export function docsPageByName(name) {
  return docsPages.find((page) => page.name === name) || null
}

export function docsAdjacent(name) {
  const index = docsPages.findIndex((page) => page.name === name)
  if (index < 0) return { prev: null, next: null }
  return {
    prev: index > 0 ? docsPages[index - 1] : null,
    next: index < docsPages.length - 1 ? docsPages[index + 1] : null,
  }
}
