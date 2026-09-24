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
      'Use Access logs for immediate request proof; Traffic for bandwidth trends.',
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
    title: 'Traffic',
    body: 'Bandwidth & traffic, requests & status, audience, HTTP methods/protocols',
    to: { name: 'security-analytics' },
  },
  {
    title: 'Access logs',
    body: 'Live HTTP stream, status KPIs, filters, CSV export',
    to: { name: 'access-log' },
  },
  {
    title: 'Security',
    body: 'Block counts, geography, top URLs / referers / user agents',
    to: { name: 'security-analytics-detail' },
  },
  {
    title: 'L4 attacks',
    body: 'Allowed vs blocked volume, protocol mix, recent attempts, top attacking IPs',
    to: { name: 'layer4-attack-analytics' },
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
      'Use L4 Attacks analytics to identify top sources, then Block IP / IP blocklist.',
    ],
    to: { name: 'layer4-attack-analytics' },
    cta: 'Open L4 attacks',
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
    a: 'Admins see Team and Audit log under Account. Regular users manage their own Profile and API tokens.',
  },
  {
    q: 'Why is Trial not under Monthly / Annual?',
    a: 'Trial is a free evaluation period (3 days). Billing period only applies to paid L4, L7, and Unified plans.',
  },
]

export const glossary = [
  {
    t: 'Attach mode',
    d: 'How Sparta binds XDP to a NIC (e.g. native, skb, drv) — chosen under Configure edges → XDP.',
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
    t: 'Origin',
    d: 'Your backend server (IP:port) that Athens proxies to after inspection.',
  },
  {
    t: 'PoP / edge node',
    d: 'Same as Edge in this console — one licensed host in your network.',
  },
  {
    t: 'WAF pack',
    d: 'Named Layer-7 rule collection assigned to one or more sites.',
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
  { label: 'IP blocklist', path: '/app/blacklist', to: { name: 'server-blacklist' } },
  {
    label: 'Traffic',
    path: '/app/analytics/security-analytics',
    to: { name: 'security-analytics' },
  },
  { label: 'Access logs', path: '/app/analytics/access-log', to: { name: 'access-log' } },
  {
    label: 'Security',
    path: '/app/analytics/security-analytics-detail',
    to: { name: 'security-analytics-detail' },
  },
  {
    label: 'L4 attacks',
    path: '/app/analytics/layer4-attack-analytics',
    to: { name: 'layer4-attack-analytics' },
  },
  { label: 'Log export', path: '/app/analytics/log-export', to: { name: 'log-export' } },
  { label: 'Licensing', path: '/app/license', to: { name: 'server-license' } },
  { label: 'Profile', path: '/app/users/information', to: { name: 'users-information' } },
  { label: 'Team', path: '/app/users/list', to: { name: 'users' } },
  { label: 'Audit log', path: '/app/users/history', to: { name: 'users-history' } },
]
