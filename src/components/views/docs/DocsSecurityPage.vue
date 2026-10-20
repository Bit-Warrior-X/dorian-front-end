<template>
  <div class="docs-article">
    <div class="docs-article__head">
      <div>
        <h1 class="docs-article__title">Security</h1>
        <p class="docs-article__lead">WAF packs, temporary blocks, and Layer-4 mitigation.</p>
      </div>
      <RouterLink class="docs-panel-link" :to="{ name: 'waf-rules' }">Open WAF rules</RouterLink>
    </div>
    <div class="docs-article__body">
      <h2 class="docs-subhead">When to use L4 vs L7</h2>
      <div class="docs-split">
        <div class="docs-concept">
          <h3>Layer 4 (Sparta / XDP)</h3>
          <p>
            Stops volumetric network floods — SYN, ACK, RST, STOMP (TCP PSH+ACK), UDP, ICMP, GRE — and drops SOCKET scans (NULL, XMAS, FIN) before HTTP. Tune
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

      <h2 id="waf-rule-types" class="docs-subhead docs-anchor">WAF rule types</h2>
      <p class="docs-lead">
        A WAF rule set is a named group of rules. Create one under <strong>WAF rules → New Rule</strong>, assign it to
        sites, and every edge serving those sites applies it. Each rule matches a URL pattern (<code>/*</code> for all
        paths) and can be switched on or off without deleting it.
      </p>
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Matches on</th>
              <th>Use it to</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in WAF_TYPES" :key="row.type">
              <td class="nowrap">
                <strong>{{ row.type }}</strong>
                <div v-if="row.soon" class="docs-soon">Not saved yet</div>
              </td>
              <td>{{ row.fields }}</td>
              <td>{{ row.use }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="docs-subhead">What happens on a match</h2>
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Behavior</th>
              <th>Effect</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Deny</strong></td>
              <td>Answer with an error page. The client sees the request was refused.</td>
            </tr>
            <tr>
              <td><strong>Drop</strong></td>
              <td>Close the connection without answering. Cheaper for the edge and gives bots nothing to learn from.</td>
            </tr>
            <tr>
              <td><strong>Drop + Block</strong></td>
              <td>Drop, and also add the client IP to <strong>Temporary blocks</strong> so its next requests are refused early.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="docs-lead">
        Blocked requests appear in
        <RouterLink :to="{ name: 'security-analytics-detail' }">Firewall (L7)</RouterLink>; see
        <RouterLink :to="{ name: 'docs-metrics', hash: '#firewall' }">metric definitions</RouterLink>.
      </p>
      <ul class="docs-bullets">
        <li>
          Assign a pack on the site so every attached edge receives the same policy via Angelos.
        </li>
        <li>
          Edge-scoped and global IP blocks:
          <RouterLink :to="{ name: 'server-blacklist' }">Temporary blocks</RouterLink>
          and Configure edges → Block IP / Allow IP.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'

const WAF_TYPES = [
  { type: 'Whitelist', fields: 'IP or CIDR list · URL · method', use: 'Let trusted sources (office, monitoring, payment callbacks) through without further checks.' },
  { type: 'Blacklist', fields: 'IP or CIDR list · URL · method', use: 'Refuse known bad sources on part or all of a site.' },
  { type: 'GEO locations', fields: 'Countries · black or white list · URL', use: 'Allow only the countries you serve, or refuse specific ones.' },
  { type: 'IP reputation', fields: 'IP or CIDR · risk score · category', use: 'Act on sources by threat score. The panel shows sample rows and does not save yet.', soon: true },
  { type: 'Anti CC', fields: 'URL · method · threshold · window', use: 'Stop request floods (CC attacks) against expensive pages such as login or search.' },
  { type: 'Interval limit', fields: 'URL · seconds · request count', use: 'Cap requests per client over a window, for example 100 per 60 s on an API.' },
  { type: 'Per-second limit', fields: 'URL · request count · burst', use: 'Smooth short bursts; burst is how far a client may go over for a moment.' },
  { type: 'Response freq', fields: 'URL · response code · seconds · count', use: 'Act on clients that keep triggering a status, such as many 404s (scanners) or 401s (password guessing).' },
  { type: 'Anti header', fields: 'URL · header · value · block mode', use: 'Refuse requests with a missing or suspicious header value.' },
  { type: 'User agent', fields: 'URL · user agent · match type', use: 'Refuse or allow clients by User-Agent, such as known scrapers.' },
  { type: 'Advanced rule', fields: 'Custom expressions', use: 'Combine conditions in one rule. Planned; the tab is a placeholder for now.', soon: true },
]
</script>

<style scoped>
.docs-soon {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 500;
  color: var(--dorian-gold-500, #c9a24a);
}
</style>
