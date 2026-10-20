<template>
  <div class="docs-article">
    <div class="docs-article__head">
      <div>
        <h1 class="docs-article__title">API reference</h1>
        <p class="docs-article__lead">Automate edges, sites, WAF, and analytics with the same REST API the console uses.</p>
      </div>
      <RouterLink class="docs-panel-link" :to="{ name: 'users-information', hash: '#api-tokens' }">Create a token</RouterLink>
    </div>
    <div class="docs-article__body">
      <div class="docs-callout docs-callout--info">
        <p>
          <strong>Base URL</strong> <code>{{ origin }}</code>. Requests and responses are JSON. Authenticate with an
          <RouterLink :to="{ name: 'docs-account', hash: '#api-tokens' }">API token</RouterLink> in
          <code>Authorization: Bearer dorian_pat_…</code> or <code>X-API-Key</code>.
        </p>
      </div>

      <pre class="docs-code">{{ quickStart }}</pre>

      <h2 class="docs-subhead">Endpoints</h2>
      <p class="docs-lead">
        Paths are relative to the base URL. The scope column is what an API token needs; console sessions can call
        everything their role allows.
      </p>
      <div v-for="group in API_GROUPS" :key="group.title" class="docs-table-wrap">
        <table class="docs-table api-table">
          <colgroup>
            <col class="api-col-methods" />
            <col />
            <col class="api-col-scope" />
          </colgroup>
          <thead>
            <tr>
              <th colspan="2">{{ group.title }}</th>
              <th>Scope</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in group.rows" :key="row.path">
              <td class="nowrap"><code>{{ row.methods }}</code></td>
              <td>
                <code>{{ row.path }}</code>
                <div v-if="row.note" class="api-note">{{ row.note }}</div>
              </td>
              <td class="nowrap"><code>{{ row.scope || group.scope }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="docs-subhead">Filters and time windows</h2>
      <ul class="docs-bullets">
        <li>
          Analytics and dashboard endpoints accept <code>serverId</code> and <code>siteId</code>. Omit both for every
          edge and site; set <code>siteId</code> alone to use that site's edges.
        </li>
        <li>
          Pick the window with <code>range</code> (<code>30m</code>, <code>1h</code>, <code>24h</code>,
          <code>7d</code>, <code>today</code>, <code>yesterday</code>, …) or <code>start</code> and <code>end</code>
          (RFC3339 or <code>2006-01-02 15:04:05</code>).
        </li>
        <li>
          <code>/audit-logs</code> takes <code>from</code>, <code>to</code> (RFC3339), <code>category</code>,
          <code>action</code>, <code>search</code>, <code>actorUserId</code>, and <code>limit</code> (default 200,
          newest first).
        </li>
        <li>
          Site WAF entries live under <code>/sites/{id}/waf/{type}</code>, where type is <code>whitelist</code>,
          <code>blacklist</code>, <code>geolocation</code>, <code>anti-cc</code>, <code>anti-header</code>,
          <code>interval-freq-limit</code>, <code>second-freq-limit</code>, <code>response-freq</code>, or
          <code>user-agent</code>. Rule set templates use <code>/waf-rules/{id}/waf/{type}</code>.
        </li>
        <li>
          Changes to ports, cache, origins, compression, and WAF are pushed to the edge right away. If the edge
          cannot be reached the API answers <code>502</code>; check the edge and retry.
        </li>
      </ul>

      <h2 class="docs-subhead">Errors</h2>
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>error</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in ERRORS" :key="row.code + row.error">
              <td class="nowrap"><code>{{ row.code }}</code></td>
              <td class="nowrap"><code>{{ row.error }}</code></td>
              <td>{{ row.meaning }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="docs-lead">Errors share one shape: <code>{"error": "…", "message": "…"}</code>. Show <code>message</code> to people; branch on <code>error</code>.</p>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'

const origin = typeof window !== 'undefined' ? window.location.origin : 'https://panel.example.com'

const quickStart = `TOKEN=dorian_pat_...

# Edges and their status
curl -H "Authorization: Bearer $TOKEN" ${origin}/servers

# Requests and bandwidth for one site over the last 24 hours
curl -H "Authorization: Bearer $TOKEN" "${origin}/analytics/summary?siteId=12&range=24h"

# Block an IP on a site (needs sites:write)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \\
  -d '{"ips":"198.51.100.7","url":"/*","method":"*","behavior":"Deny"}' \\
  ${origin}/sites/12/waf/blacklist`

const API_GROUPS = [
  {
    title: 'Edges',
    scope: 'edges:read / write',
    rows: [
      { methods: 'GET POST', path: '/servers', note: 'List edges with status; deploy a new edge.' },
      { methods: 'GET PUT DELETE', path: '/servers/{id}' },
      { methods: 'GET', path: '/servers/{id}/host-metrics', note: 'CPU, memory, disk, and NIC load.' },
      { methods: 'POST', path: '/servers/{id}/refresh-runtime-status', note: 'Re-check Angelos, Sparta, and Athens.' },
      { methods: 'GET PUT', path: '/servers/{id}/l4', note: 'XDP settings. L4 license required.' },
      { methods: 'GET POST', path: '/servers/{id}/l4/blacklist · /l4/whitelist', note: 'Block IP and Allow IP lists.' },
      { methods: 'GET POST …', path: '/servers/{id}/listening-ports · /upstream-servers · /cache-rules · /compress' },
      { methods: 'POST', path: '/servers/{id}/upgrade-license', note: 'Change tier. Admin only.' },
      { methods: 'GET', path: '/license-plans · /deploy-versions' },
    ],
  },
  {
    title: 'Sites',
    scope: 'sites:read / write',
    rows: [
      { methods: 'GET POST', path: '/sites' },
      { methods: 'GET PUT DELETE', path: '/sites/{id}', note: 'Domain, edges, SSL, and WAF rule set.' },
      { methods: 'GET PUT …', path: '/sites/{id}/ports · /upstream-servers · /cache-rules · /compress' },
      { methods: 'GET POST PUT DELETE', path: '/sites/{id}/waf/{type}', note: 'WAF entries for this site only.' },
      { methods: 'POST', path: '/sites/{id}/waf/fork', note: 'Copy the assigned rule set so the site can diverge.' },
    ],
  },
  {
    title: 'WAF rule sets and temporary blocks',
    scope: 'waf:read / write',
    rows: [
      { methods: 'GET POST', path: '/waf-rules' },
      { methods: 'GET PUT DELETE', path: '/waf-rules/{id}' },
      { methods: 'POST', path: '/waf-rules/{id}/duplicate' },
      { methods: 'GET POST PUT DELETE', path: '/waf-rules/{id}/waf/{type}' },
      { methods: 'GET POST · DELETE', path: '/servers/blacklist · /servers/blacklist/{id}', note: 'Temporary blocks across edges.' },
    ],
  },
  {
    title: 'Analytics',
    scope: 'analytics:read',
    rows: [
      { methods: 'GET', path: '/dashboard/*', note: 'Overview KPIs, bandwidth, status codes, top domains.' },
      { methods: 'GET', path: '/analytics/summary · /analytics/series/*', note: 'Traffic totals and time series.' },
      { methods: 'GET', path: '/analytics/summary/{status-codes|methods|protocols|top-ips|isps|referers|countries}' },
      { methods: 'GET', path: '/analytics/security/*', note: 'L7 blocks by rule, country, URL, user agent.' },
      { methods: 'GET', path: '/analytics/l4/*', note: 'L4 traffic, protocols, recent attacks, top attacking IPs.' },
      { methods: 'WS', path: '/servers/{id}/access-log/stream', note: 'Live access log. Pass the token as ?access_token=.' },
    ],
  },
  {
    title: 'Account and team',
    scope: '*',
    rows: [
      { methods: 'GET', path: '/auth/me' },
      { methods: 'GET POST DELETE', path: '/auth/api-tokens · /auth/api-tokens/{id}' },
      { methods: 'GET POST PUT DELETE', path: '/users · /users/{id}', note: 'Admin. Members can read and update themselves.' },
      { methods: 'POST', path: '/users/{id}/invite · /password-reset · /sessions/revoke', note: 'Admin.' },
      { methods: 'GET PUT', path: '/settings/security', note: 'Admin. Require 2FA: off, admins, or all.' },
      { methods: 'GET', path: '/audit-logs', note: 'Admin.' },
      { methods: 'POST', path: '/auth/login · /auth/login/mfa · /auth/logout', scope: 'none', note: 'Console sign-in; scripts should use a token instead.' },
    ],
  },
]

const ERRORS = [
  { code: 400, error: 'Bad Request', meaning: 'Missing or invalid field; the message says which.' },
  { code: 401, error: 'unauthorized', meaning: 'No token, or the token is wrong, expired, or revoked.' },
  { code: 401, error: 'session_ended', meaning: 'The console session was signed out elsewhere.' },
  { code: 401, error: 'account_inactive', meaning: 'The account is blocked, pending, or deleted.' },
  { code: 403, error: 'insufficient_scope', meaning: "The token's access does not cover this request." },
  { code: 403, error: 'mfa_setup_required', meaning: 'The sign-in policy requires 2FA for this account.' },
  { code: 403, error: 'Forbidden', meaning: 'Your role cannot do this, or the edge is not assigned to you.' },
  { code: 409, error: 'last_admin', meaning: 'The change would leave no active Admin.' },
  { code: 429, error: 'too_many_attempts', meaning: 'Too many sign-in or 2FA attempts; wait and try again.' },
  { code: 502, error: 'Bad Gateway', meaning: 'The edge agent could not be reached or rejected the change.' },
]
</script>

<style scoped>
.api-table {
  table-layout: fixed;
  min-width: 640px;
}

.api-col-methods {
  width: 170px;
}

.api-col-scope {
  width: 150px;
}

.api-table td code {
  overflow-wrap: anywhere;
}

.api-table td.nowrap code {
  overflow-wrap: normal;
}

.api-note {
  margin-top: 2px;
  font-size: 12px;
  color: var(--app-text-muted);
}
</style>
