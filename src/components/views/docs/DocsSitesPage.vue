<template>
  <div class="docs-article">
    <div class="docs-article__head">
      <div>
        <h1 class="docs-article__title">Sites</h1>
        <p class="docs-article__lead">Domains, SSL, origins, cache, and edge assignment.</p>
      </div>
      <RouterLink class="docs-panel-link" :to="{ name: 'site-list' }">Open All sites</RouterLink>
    </div>
    <div class="docs-article__body">
      <h2 class="docs-subhead">New Site wizard</h2>
      <ul class="docs-bullets">
        <li><strong>Basics</strong> — domain and identity.</li>
        <li><strong>SSL</strong> — not configured, automatic (ACME), or manual PEM.</li>
        <li><strong>Origins</strong> — upstream servers (IP:port + protocol).</li>
        <li><strong>Edges</strong> — which protection nodes terminate this site.</li>
      </ul>

      <h2 class="docs-subhead">Configure sites</h2>
      <p class="docs-lead">
        Route:
        <RouterLink :to="{ name: 'site-settings' }">Configure sites</RouterLink>
        <span class="docs-path num">/app/sites/settings</span>
      </p>
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Tab</th>
              <th>What you configure</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Overview</td>
              <td>Live KPIs (egress, cache hit, edges) and shortcuts into SSL / WAF / Traffic</td>
            </tr>
            <tr>
              <td>Origin</td>
              <td>
                Domain; SSL modes Not configured / Automatic / Manual; Automatic providers Let’s
                Encrypt, ZeroSSL, Google Trust; upstream origin servers
              </td>
            </tr>
            <tr>
              <td>WAF</td>
              <td>Site-level WAF editor; fork a predefined pack to customize for this site</td>
            </tr>
            <tr>
              <td>Traffic</td>
              <td>
                <strong>Cache</strong> rules &amp; purge · <strong>Compress</strong> (gzip MIME
                categories) · <strong>Ports</strong> (HTTP/HTTPS listeners for the hostname)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="docs-callout docs-callout--warn">
        <strong>Let’s Encrypt (DNS-01)</strong>
        <span>
          Create a DNS-only CNAME:
          <code class="num">_acme-challenge.&lt;your-domain&gt;</code>
          →
          <code class="num">acme-validation.dorian.center</code>
          (not proxied / grey-cloud). Issuance runs in the background — watch certificate status
          and last error on Origin / Overview.
        </span>
      </div>

      <h2 class="docs-subhead">Go-live checklist</h2>
      <ul class="docs-checklist">
        <li>Site attached to at least one healthy edge</li>
        <li>Upstream origin responds from the edge network</li>
        <li>SSL issued or manual cert uploaded</li>
        <li>WAF pack assigned (or intentionally left open for testing)</li>
        <li>DNS A/AAAA (or CNAME) pointed at the edge public IP</li>
        <li>Confirm hits in Access logs and Traffic analytics</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
