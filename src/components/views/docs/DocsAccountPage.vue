<template>
  <div class="docs-article">
    <div class="docs-article__head">
      <div>
        <h1 class="docs-article__title">Account &amp; team</h1>
        <p class="docs-article__lead">Sign-in, sessions, two-factor, members, API tokens, and the audit log.</p>
      </div>
      <RouterLink class="docs-panel-link" :to="{ name: 'users-information' }">Open Profile</RouterLink>
    </div>
    <div class="docs-article__body">
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Who</th>
              <th>Contents</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <RouterLink :to="{ name: 'users-information' }">Profile</RouterLink>
              </td>
              <td>Everyone</td>
              <td>Name and email, password, two-factor, active sessions, API tokens, your recent activity</td>
            </tr>
            <tr>
              <td>
                <RouterLink :to="{ name: 'users' }">Team</RouterLink>
              </td>
              <td>Admin</td>
              <td>Members, roles, edge access, invites and reset links, sign-in policy</td>
            </tr>
            <tr>
              <td>
                <RouterLink :to="{ name: 'users-history' }">Audit log</RouterLink>
              </td>
              <td>Admin</td>
              <td>Every change and sign-in with old and new values, date range filter, CSV export</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="sessions" class="docs-subhead docs-anchor">Signing in and sessions</h2>
      <ul class="docs-bullets">
        <li>
          A session lasts <strong>24 hours</strong>. Tick <strong>Keep me signed in</strong> to stay signed in for
          <strong>30 days</strong> on that device. Without it, the console also signs you out after 15 minutes
          without activity.
        </li>
        <li>
          Profile → <strong>Active sessions</strong> lists every device signed in to your account. Sign out one
          device, or all of them except the one you are using.
        </li>
        <li>
          Changing your password signs out your other sessions. Blocking, demoting, or deleting a member takes effect
          on their very next request, without waiting for the session to expire.
        </li>
        <li>
          Forgot your password? Use <strong>Forgot password</strong> on the sign-in page. When email is not
          configured, ask an Admin for a reset link from Team.
        </li>
      </ul>

      <h2 id="two-factor" class="docs-subhead docs-anchor">Two-factor authentication</h2>
      <ul class="docs-bullets">
        <li>
          Turn it on under Profile → <strong>Two-factor authentication</strong> with any authenticator app. Save
          the recovery codes; each one works once if you lose your phone.
        </li>
        <li>
          Admins can require it under Team → <strong>Sign-in policy</strong>: <em>Optional</em>,
          <em>Admins</em> (every Admin must use it), or <em>Everyone</em>. You need 2FA on your own account before
          you can require it.
        </li>
        <li>
          When the policy covers someone who has not set it up, they can sign in but only reach their Profile until
          they turn it on. An Admin can reset a member's 2FA from the Team row menu if they lose their device.
        </li>
      </ul>

      <h2 id="members" class="docs-subhead docs-anchor">Members, roles, and invites</h2>
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Can do</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Admin</strong></td>
              <td>Everything, including Team, Audit log, sign-in policy, and paid license changes</td>
            </tr>
            <tr>
              <td><strong>User</strong></td>
              <td>Works with the edges an Admin assigns (or all edges) and their sites; manages their own Profile</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul class="docs-bullets">
        <li>
          <strong>Add member → Invite link</strong> creates the account as <em>Pending</em> and gives you a one-time
          link, valid for 7 days. The member opens it, picks a password, and becomes <em>Active</em>. With email
          configured, the link is also sent to them.
        </li>
        <li>
          <strong>Set password</strong> creates the account with a password you choose and share yourself.
        </li>
        <li>
          The row menu creates a <strong>password reset link</strong> (valid 24 hours), signs a member out
          everywhere, resets their 2FA, blocks, or deletes them. Each link works once.
        </li>
        <li>The console always keeps at least one active Admin; promote someone else before demoting the last one.</li>
      </ul>

      <h2 id="api-tokens" class="docs-subhead docs-anchor">API tokens</h2>
      <p class="docs-lead">
        Personal access tokens let scripts and CI call the same API the console uses. A token acts as you, limited
        by the access you pick. Create one under Profile → <strong>API tokens</strong>; the secret is shown once.
      </p>
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Access</th>
              <th>Scopes</th>
              <th>Allows</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Read only</strong></td>
              <td><code class="nowrap">read</code></td>
              <td>GET requests on edges, sites, WAF rules, temporary blocks, and analytics</td>
            </tr>
            <tr>
              <td><strong>Custom</strong></td>
              <td>
                <span class="docs-code-list">
                  <code v-for="scope in CUSTOM_SCOPES" :key="scope">{{ scope }}</code>
                </span>
              </td>
              <td>Only the areas you tick. <em>Write</em> includes read for the same area.</td>
            </tr>
            <tr>
              <td><strong>Full access</strong></td>
              <td><code class="nowrap">*</code></td>
              <td>Everything your account can do, including tokens, sessions, team, and audit endpoints</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="docs-lead">Send the token in the <code>Authorization</code> header (or <code>X-API-Key</code>):</p>
      <pre class="docs-code">{{ tokenExample }}</pre>
      <ul class="docs-bullets">
        <li>
          Pick an expiry of 30 days, 90 days, 1 year, or never. Expired and revoked tokens get
          <code>401</code>; a request outside the token's access gets <code>403 insufficient_scope</code>.
        </li>
        <li>
          A token can never do more than its owner. If you are demoted to User, your tokens follow your new edge
          access; if you are blocked or deleted, they stop working. When the sign-in policy requires 2FA for you,
          your tokens pause until you turn it on.
        </li>
        <li>
          The token list shows when each one was last used. Revoke anything you do not recognise; creating and
          revoking tokens is recorded in the audit log.
        </li>
        <li>
          Endpoints and parameters are listed in the
          <RouterLink :to="{ name: 'docs-api' }">API reference</RouterLink>.
        </li>
      </ul>

      <h2 id="audit-log" class="docs-subhead docs-anchor">Audit log</h2>
      <ul class="docs-bullets">
        <li>
          Records who did what, to which resource, from which IP and browser, and whether it succeeded. Changes show
          old and new values; passwords, keys, and token secrets are never stored.
        </li>
        <li>
          Filter by time range (24h, 7d, 30d, 90d, all, or custom dates), category, action, result, or free text.
          Click a row for the request, status code, and full user agent.
        </li>
        <li>
          IP addresses are partly hidden on screen; tick <strong>Show full IPs</strong> to see them. <strong>Export
          CSV</strong> downloads the filtered rows with full values and UTC timestamps.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'

const CUSTOM_SCOPES = ['analytics:read', 'edges:read', 'edges:write', 'sites:read', 'sites:write', 'waf:read', 'waf:write']

const origin = typeof window !== 'undefined' ? window.location.origin : 'https://panel.example.com'

const tokenExample = `# List your edges with a read-only token
curl -H "Authorization: Bearer dorian_pat_..." ${origin}/servers

# Same request with the alternative header
curl -H "X-API-Key: dorian_pat_..." ${origin}/servers`
</script>
