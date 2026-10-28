import { analyticsNavGroups } from '@/utils/analyticsNav'

/** Shared copy for multi-page Docs articles. */

export const startSteps = [
  {
    title: 'Deploy an edge',
    body: 'Add a Linux host with SSH. Dorian installs Angelos, Sparta (L4), and Athens (L7).',
    tips: [
      'Use a stable public IP and confirm port 22 (or your SSH port) is open from the control plane.',
      'Pick a package that matches the OS detected in the Version step.',
    ],
    to: { name: 'server-list' },
    cta: 'Go to All edges → New Edge',
  },
  {
    title: 'Choose capacity',
    body: 'Start on Trial, or select L4, L7, or Unified for production. Billing can be monthly or annual.',
    tips: [
      'Trial is always 3 days and does not use the Monthly/Annual toggle.',
      'You can upgrade later from Licensing without a full reinstall in most cases.',
    ],
    to: { name: 'server-license' },
    cta: 'Open Licensing',
  },
  {
    title: 'Create a site',
    body: 'Register the domain, attach edges, set upstream origins, and configure SSL.',
    tips: [
      'For Let’s Encrypt, set the ACME CNAME before requesting a certificate.',
      'Attach the site to every edge that should terminate its traffic.',
    ],
    to: { name: 'site-list' },
    cta: 'Go to All sites → New Site',
  },
  {
    title: 'Attach WAF rules',
    body: 'Create or reuse a WAF pack, then assign it so every edge enforces the same policy.',
    tips: [
      'Start from a Predefined pack, then fork to Custom when you need site-specific rules.',
    ],
    to: { name: 'waf-rules' },
    cta: 'Open WAF rules',
  },
  {
    title: 'Point DNS and verify',
    body: 'Aim A/AAAA (or CNAME) at the edge IP, then confirm traffic and mitigations in Insights.',
    tips: [
      'Use Access logs for immediate request proof; Traffic for bandwidth and L7 request trends.',
    ],
    to: { name: 'dashboard' },
    cta: 'Open Overview',
  },
]

export const concepts = [
  {
    title: 'Edge',
    body: 'A protected Linux host. Runs Angelos (agent), Sparta (L4 / XDP), and Athens (L7 proxy).',
  },
  {
    title: 'Angelos',
    body: 'Edge agent on port 5000. Receives config from the Dorian API and applies it to L4/L7 locally.',
  },
  {
    title: 'Athens',
    body: 'Layer-7 data plane — HTTP proxy, WAF, cache, compression, and SSL termination.',
  },
  {
    title: 'Sparta',
    body: 'Layer-4 / XDP data plane — volumetric flood mitigation and NIC-level controls.',
  },
  {
    title: 'Site',
    body: 'Customer domain with origins, SSL, cache, compress, ports, and WAF assignment across edges.',
  },
  {
    title: 'WAF pack',
    body: 'Reusable L7 rule set (Predefined or Custom) attached to sites so policies stay consistent.',
  },
]

export const insightRows = [
  {
    title: 'L7 Traffic',
    body: 'Application bandwidth, request counts, status codes, HTTP methods/versions, countries, ISPs, referers',
    to: { name: 'l7-traffic-analytics' },
  },
  {
    title: 'L4 Traffic',
    body: 'NIC RX / TX throughput at the network interface, before L7 processing',
    to: { name: 'l4-traffic-analytics' },
  },
  {
    title: 'Cache',
    body: 'Hit ratio, byte hit ratio, cache status mix, origin offload, top uncached URLs',
    to: { name: 'cache-analytics' },
  },
  {
    title: 'Performance',
    body: 'Edge and origin response time (p50/p95/p99), origin 5xx and timeouts, per edge and per site',
    to: { name: 'performance-analytics' },
  },
  {
    title: 'Security events',
    body: 'Timeline of L4 floods and L7 block bursts for the selected window',
    to: { name: 'attack-detection' },
  },
  {
    title: 'Firewall (L7)',
    body: 'Blocked HTTP requests over time, blocks by rule, geography, request context',
    to: { name: 'security-analytics-detail' },
  },
  {
    title: 'DDoS (L4)',
    body: 'Allowed vs dropped volume, protocol mix, recent attempts, top attacking IPs',
    to: { name: 'layer4-attack-analytics' },
  },
  {
    title: 'Access logs',
    body: 'Live HTTP stream, status KPIs, filters, CSV export',
    to: { name: 'access-log' },
  },
  {
    title: 'Log export',
    body: 'Historical access / error / security downloads (CSV, JSON, TXT)',
    to: { name: 'log-export' },
  },
]

export const troubleshooting = [
  {
    q: 'Edge shows Expired or unknown status',
    a: 'Runtime capacity or agent reachability is usually the cause.',
    steps: [
      'Open Licensing and confirm the expire date for that edge.',
      'Configure edges → Monitor → refresh Angelos / Sparta / Athens.',
      'On the host, ensure angelos.service is running and port 5000 is reachable from the control plane.',
    ],
    to: { name: 'server-settings' },
    cta: 'Open Configure edges',
  },
  {
    q: 'SSL / Let’s Encrypt never becomes Ready',
    a: 'DNS-01 validation must resolve before issuance completes.',
    steps: [
      'Set _acme-challenge.<domain> CNAME to acme-validation.dorian.center (DNS-only, not proxied).',
      'Wait for DNS propagation, then retry Automatic SSL or Renew on Overview.',
      'Check the certificate status / last error on the Origin tab.',
    ],
    to: { name: 'site-settings' },
    cta: 'Open Configure sites',
  },
  {
    q: 'Site is configured but browsers cannot reach it',
    a: 'Usually DNS, listening ports, or upstream health.',
    steps: [
      'Confirm DNS A/AAAA points at the edge public IP.',
      'Verify HTTP/HTTPS listeners on the site Traffic → Ports and edge Ports tabs.',
      'Test the origin from the edge network; watch Access logs for 502/504 clues.',
    ],
    to: { name: 'access-log' },
    cta: 'Open Access logs',
  },
  {
    q: 'L4 floods still hurt the origin',
    a: 'Ensure the edge is in path and Sparta thresholds match the attack.',
    steps: [
      'Traffic must hairpin through the edge (DNS / routing), not bypass it.',
      'Configure edges → XDP: enable relevant flood checks and set block duration.',
      'Use DDoS (L4) analytics to identify top sources, then Block IP / Temporary blocks.',
    ],
    to: { name: 'layer4-attack-analytics' },
    cta: 'Open DDoS (L4)',
  },
]

export const faq = [
  {
    q: 'Do I need both L4 and L7?',
    a: 'L4 stops volumetric floods at the network layer. L7 protects HTTP apps (WAF, bots, rates). Use Unified when you want both on one host license.',
  },
  {
    q: 'Can I change license without redeploying?',
    a: 'Yes for most upgrades. Use Licensing to apply a new tier — Dorian generates a license and runs a license-only update on the edge.',
  },
  {
    q: 'Where should DNS point?',
    a: 'After the site is healthy on an edge, point the domain’s A/AAAA (or CNAME) at that edge’s public IP. Keep ACME challenge records in place if you use Automatic SSL.',
  },
  {
    q: 'Who can manage team users?',
    a: 'Admins see Team and Audit log under Account, where they add members by invite link, create reset links, and set the sign-in policy. Regular users manage their own Profile, sessions, and API tokens.',
  },
  {
    q: 'Why is Trial not under Monthly / Annual?',
    a: 'Trial is a free evaluation period (3 days). Billing period only applies to paid L4, L7, and Unified plans.',
  },
]

export const glossary = [
  {
    t: 'API token',
    d: 'A personal access token (dorian_pat_…) that lets scripts call the API as you, limited to the access you pick.',
  },
  {
    t: 'Attach mode',
    d: 'Where Sparta runs its XDP program. Native (drv) runs inside the network driver and is fastest; skb (generic) works on any NIC but is slower. Chosen under Configure edges → XDP.',
  },
  {
    t: 'Byte hit ratio',
    d: 'Share of response bytes served from the edge cache instead of the origin.',
  },
  {
    t: 'Control plane',
    d: 'Dorian front-end + back-end API that operators use; pushes policy to edges.',
  },
  {
    t: 'Data plane',
    d: 'Athens (L7) and Sparta (L4) processes on the edge that handle real traffic.',
  },
  { t: 'Edge', d: 'A deployed protection host registered in All edges.' },
  {
    t: 'Hit ratio',
    d: 'Share of requests answered from the edge cache (HIT, STALE, UPDATING, or REVALIDATED).',
  },
  {
    t: 'Invite link',
    d: 'A one-time link, valid 7 days, that lets a new member set their password and activate their account.',
  },
  {
    t: 'Origin',
    d: 'Your backend server (IP:port) that Athens proxies to after inspection.',
  },
  {
    t: 'p95',
    d: '95% of requests finished within this time; the slowest 5% took longer.',
  },
  {
    t: 'PoP / edge node',
    d: 'Same as Edge in this console — one licensed host in your network.',
  },
  {
    t: 'Scope',
    d: 'What an API token may do: read, per-area read or write (edges, sites, WAF, analytics), or * for full access.',
  },
  {
    t: 'Session',
    d: 'One signed-in device. Lasts 24 hours, or 30 days with Keep me signed in; listed and revocable under Profile.',
  },
  {
    t: 'Sign-in policy',
    d: 'Team setting that makes two-factor authentication optional, required for Admins, or required for everyone.',
  },
  {
    t: 'WAF pack',
    d: 'Named Layer-7 rule collection assigned to one or more sites. Also called a WAF rule set.',
  },
  {
    t: 'XDP',
    d: 'eXpress Data Path: a Linux feature that lets Sparta inspect and drop packets at the network card, before the kernel network stack.',
  },
]

export const cheatSheet = [
  { label: 'Overview', path: '/app/dashboard', to: { name: 'dashboard' } },
  { label: 'Docs', path: '/app/docs', to: { name: 'docs-get-started' } },
  { label: 'All edges', path: '/app/servers/list', to: { name: 'server-list' } },
  { label: 'Configure edges', path: '/app/servers/settings', to: { name: 'server-settings' } },
  { label: 'All sites', path: '/app/sites/list', to: { name: 'site-list' } },
  { label: 'Configure sites', path: '/app/sites/settings', to: { name: 'site-settings' } },
  { label: 'WAF rules', path: '/app/waf', to: { name: 'waf-rules' } },
  { label: 'Temporary blocks', path: '/app/blacklist', to: { name: 'server-blacklist' } },
  ...analyticsNavGroups.flatMap((group) =>
    group.items.map((item) => ({ label: item.label, path: item.path, to: { name: item.name } })),
  ),
  { label: 'Licensing', path: '/app/license', to: { name: 'server-license' } },
  { label: 'Profile', path: '/app/users/information', to: { name: 'users-information' } },
  { label: 'Team', path: '/app/users/list', to: { name: 'users' } },
  { label: 'Audit log', path: '/app/users/history', to: { name: 'users-history' } },
]
