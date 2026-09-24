<template>
  <div class="docs-article">
    <div class="docs-article__head">
      <div>
        <h1 class="docs-article__title">Security</h1>
        <p class="docs-article__lead">WAF packs, IP blocklist, and Layer-4 mitigation.</p>
      </div>
      <RouterLink class="docs-panel-link" :to="{ name: 'waf-rules' }">Open WAF rules</RouterLink>
    </div>
    <div class="docs-article__body">
      <h2 class="docs-subhead">When to use L4 vs L7</h2>
      <div class="docs-split">
        <div class="docs-concept">
          <h3>Layer 4 (Sparta / XDP)</h3>
          <p>
            Stops volumetric network floods — SYN, ACK, RST, UDP, ICMP, GRE — before HTTP. Tune
            under Configure edges → <strong>XDP</strong>.
          </p>
        </div>
        <div class="docs-concept">
          <h3>Layer 7 (Athens / WAF)</h3>
          <p>
            Protects HTTP applications — bots, rates, geo, headers, lists. Build packs under
            <strong>WAF rules</strong>, assign per site.
          </p>
        </div>
      </div>

      <h2 class="docs-subhead">WAF rule types</h2>
      <p class="docs-lead">
        Create packs via <strong>New Rule</strong> (Name → rules → Role: Predefined or Custom).
      </p>
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Types</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Access control</td>
              <td>Whitelist · Blacklist · IP reputation · GEO locations</td>
            </tr>
            <tr>
              <td>Rate limits</td>
              <td>Anti CC · Interval limit · Per-second limit · Response freq</td>
            </tr>
            <tr>
              <td>Request filters</td>
              <td>Anti header · User agent · Advanced rule</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul class="docs-bullets">
        <li>
          Assign a pack on the site so every attached edge receives the same policy via Angelos.
        </li>
        <li>
          Edge-scoped and global IP blocks:
          <RouterLink :to="{ name: 'server-blacklist' }">IP blocklist</RouterLink>
          and Configure edges → Block IP / Allow IP.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
