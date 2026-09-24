<template>
  <div class="docs-article">
    <div class="docs-article__head">
      <div>
        <h1 class="docs-article__title">Licensing</h1>
        <p class="docs-article__lead">Per-edge capacity — Trial, L4, L7, Unified.</p>
      </div>
      <RouterLink class="docs-panel-link" :to="{ name: 'server-license' }">Open Licensing</RouterLink>
    </div>
    <div class="docs-article__body">
      <div class="docs-callout docs-callout--info">
        <strong>One host · one license</strong>
        <span>
          Licenses bind to a single edge. Trial is evaluation-only. Paid plans support Monthly
          (30-day) or Annual (365-day, ~20% off). Prices load from the control plane catalog.
        </span>
      </div>

      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Scope</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Trial</strong></td>
              <td>Full L4 + L7 preview · no card</td>
              <td>Always 3 days</td>
            </tr>
            <tr>
              <td><strong>L4</strong></td>
              <td>Network / XDP protection</td>
              <td>30 or 365 days</td>
            </tr>
            <tr>
              <td><strong>L7</strong></td>
              <td>WAF &amp; application security</td>
              <td>30 or 365 days</td>
            </tr>
            <tr>
              <td><strong>Unified</strong></td>
              <td>L4 + L7 full stack (best value)</td>
              <td>30 or 365 days</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul class="docs-bullets">
        <li>
          Prefer
          <RouterLink :to="{ name: 'server-license' }">Licensing</RouterLink>
          for upgrades — Dorian applies a license-only update when possible (no full reinstall).
        </li>
        <li>
          During New Edge you can also attach a paid tier immediately, or load an existing
          license file for non-Trial tiers.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
