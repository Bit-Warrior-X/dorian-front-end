<template>
  <div class="docs-article">
    <div class="docs-article__head">
      <div>
        <h1 class="docs-article__title">Edges</h1>
        <p class="docs-article__lead">Deploy, monitor, and configure protection nodes.</p>
      </div>
      <RouterLink class="docs-panel-link" :to="{ name: 'server-list' }">Open All edges</RouterLink>
    </div>
    <div class="docs-article__body">
      <h2 class="docs-subhead">New Edge wizard</h2>
      <p class="docs-lead">
        On <RouterLink :to="{ name: 'server-list' }">All edges</RouterLink>, open
        <strong>New Edge</strong>. The wizard walks through three stages:
      </p>
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Step</th>
              <th>What you provide</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Connection</td>
              <td>Name, IP, SSH user / password / port (default 22), optional users</td>
              <td>Host must be reachable from the control plane over SSH</td>
            </tr>
            <tr>
              <td>Version</td>
              <td>Compatible Dorian build for the detected OS</td>
              <td>OS is probed over SSH before you pick a package</td>
            </tr>
            <tr>
              <td>License</td>
              <td>Trial, L4, L7, or Unified · Monthly / Annual</td>
              <td>Paid tiers can generate a new license or reuse an existing file</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul class="docs-bullets">
        <li>
          Deploy installs Angelos plus the L4/L7 data plane (“Deploying package… may take a
          minute”).
        </li>
        <li>
          On success, the list refreshes with license, version, OS, and expire date. Status dots
          show <strong>Angelos / L4 / L7</strong> — hover for the last known reason.
        </li>
        <li>
          Later you can <strong>Upgrade</strong> the build (license/SSH unchanged) or open
          <RouterLink :to="{ name: 'server-settings' }">Configure</RouterLink> for day-2 ops.
        </li>
      </ul>

      <h2 class="docs-subhead">Configure edges</h2>
      <p class="docs-lead">
        Route:
        <RouterLink :to="{ name: 'server-settings' }">Configure edges</RouterLink>
        <span class="docs-path num">/app/servers/settings</span>
      </p>
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Tab</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Monitor</td>
              <td>
                CPU / RAM / disk, SSH summary, power actions; start · stop · refresh for Angelos,
                Sparta, Athens
              </td>
            </tr>
            <tr>
              <td>Ports</td>
              <td>Edge listening ports (HTTP/HTTPS) and system-bound ports</td>
            </tr>
            <tr>
              <td>XDP</td>
              <td>
                Sparta L4: protection mode, sensitivity, NIC, attach mode, block duration; TCP
                connection limit; SYN / ACK / RST / ICMP / UDP / GRE floods; geo IP check
              </td>
            </tr>
            <tr>
              <td>Block IP</td>
              <td>Edge-scoped XDP blacklist</td>
            </tr>
            <tr>
              <td>Allow IP</td>
              <td>Trusted sources that bypass L4 blocking</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="docs-lead">
        Fleet-wide blocks also live under
        <RouterLink :to="{ name: 'server-blacklist' }">IP blocklist</RouterLink>.
      </p>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
