<template>
  <div class="docs-article">
    <h1 class="docs-article__title">What's new</h1>
    <p class="docs-article__lead">Changes to the console, newest first.</p>
    <div class="docs-article__body">
      <template v-for="release in RELEASES" :key="release.date">
        <div class="docs-version">
          <h2>{{ release.title }}</h2>
          <time :datetime="release.date">{{ release.label }}</time>
        </div>
        <ul class="docs-bullets">
          <li v-for="item in release.items" :key="item">{{ item }}</li>
        </ul>
      </template>
    </div>
  </div>
</template>

<script setup>
const RELEASES = [
  {
    date: '2026-10-20',
    label: '20 Oct 2026',
    title: 'Account security and team management',
    items: [
      'Signing out, blocking, demoting, or deleting a member now takes effect immediately.',
      'Keep me signed in for 30 days; see and sign out your active sessions from Profile.',
      'Admins can require two-factor authentication for Admins or for everyone.',
      'Invite members with a one-time link, and create password reset links from Team. Forgot password on the sign-in page.',
      'API tokens get access levels (Read only, Custom, Full access) and an expiry date.',
      'Redesigned Profile, Team, and Audit log. The audit log adds date ranges, CSV export, and a result filter.',
      'Licensing shows days left for every edge in one table. Paid tier changes are Admin-only and ask for confirmation.',
      'New docs: API reference, metric definitions, and this page.',
    ],
  },
  {
    date: '2026-10-19',
    label: '19 Oct 2026',
    title: 'L4 attack detection',
    items: [
      'Security events and DDoS (L4) name the flood method that triggered each attack.',
      'Overview dashboard refresh.',
    ],
  },
  {
    date: '2026-10-14',
    label: '14 Oct 2026',
    title: 'Control plane rebuild',
    items: [
      'Rebuilt control plane back-end.',
      'XDP, Block IP, and Allow IP stay locked on edges without a valid L4 license.',
      'Fixes in Configure sites.',
    ],
  },
  {
    date: '2026-09-24',
    label: '24 Sep 2026',
    title: 'Trial licenses and docs',
    items: [
      'Trial is a 3-day evaluation of L4 and L7 on one edge.',
      'In-app Docs.',
      'Edge settings stay in sync between Angelos and the control plane.',
    ],
  },
  {
    date: '2026-09-23',
    label: '23 Sep 2026',
    title: 'Analytics design',
    items: [
      'New layouts for Traffic and DDoS (L4).',
      'Edge and site filters fixed across analytics; steadier live access log.',
    ],
  },
  {
    date: '2026-09-21',
    label: '21 Sep 2026',
    title: 'Single sign-on',
    items: [
      'Sign in with Google, GitHub, or your SSO provider.',
      'Google accounts join as Active Users and go straight into the console.',
    ],
  },
  {
    date: '2026-09-16',
    label: '16 Sep 2026',
    title: 'Dashboard and cache',
    items: [
      'Cache hit ratio per site.',
      'IP filter in access logs.',
      'Chart sizing fixes and the new Dorian design.',
    ],
  },
  {
    date: '2026-08-20',
    label: '20 Aug 2026',
    title: 'Automatic SSL',
    items: [
      "Let's Encrypt certificates with DNS validation, and fixes for renewals.",
    ],
  },
]
</script>
