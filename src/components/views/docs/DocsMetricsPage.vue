<template>
  <div class="docs-article">
    <div class="docs-article__head">
      <div>
        <h1 class="docs-article__title">Metric definitions</h1>
        <p class="docs-article__lead">What each number on Overview and Analytics counts, and where it comes from.</p>
      </div>
      <RouterLink class="docs-panel-link" :to="{ name: 'l7-traffic-analytics' }">Open Analytics</RouterLink>
    </div>
    <div class="docs-article__body">
      <div class="docs-callout docs-callout--info">
        <p>
          Athens (L7) and Sparta (L4) count traffic on each edge and the control plane collects it every 30
          seconds. Totals cover the selected edge, site, and time range. A page marked <strong>Preview</strong> is
          showing sample numbers because the edges do not report that data yet.
        </p>
      </div>

      <template v-for="section in SECTIONS" :key="section.title">
        <h2 :id="section.id" class="docs-subhead docs-anchor">{{ section.title }}</h2>
        <div class="docs-table-wrap">
          <table class="docs-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Definition</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in section.rows" :key="row.name">
                <td><strong>{{ row.name }}</strong></td>
                <td>{{ row.body }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <ul class="docs-bullets">
        <li>Bandwidth is shown in bits per second; traffic totals in bytes (1 KB = 1,024 bytes).</li>
        <li>Each chart point is the total or average for one time bucket; longer ranges use larger buckets.</li>
        <li>Times are shown in your browser's time zone. Exports use UTC.</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'

const SECTIONS = [
  {
    id: 'l7-traffic',
    title: 'L7 Traffic',
    rows: [
      { name: 'Requests', body: 'HTTP requests Athens received for your sites.' },
      { name: 'L7 bandwidth (RX / TX)', body: 'Bytes of HTTP requests received from clients and responses sent to them. Use it for site usage.' },
      { name: 'Unique IPs', body: 'Distinct client IP addresses seen in the interval.' },
      { name: 'Status codes', body: 'The status sent to the client, grouped as 2xx, 3xx, 4xx, and 5xx.' },
      { name: 'Countries, ISPs, referers', body: 'Requests grouped by the client IP location and network, and by the Referer header.' },
    ],
  },
  {
    id: 'l4-traffic',
    title: 'L4 Traffic',
    rows: [
      { name: 'NIC bandwidth (RX / TX)', body: 'Everything crossing the edge network card, in and out: HTTP, L4 floods, SSH, and system traffic. Use it for overall link load and attack volume.' },
      { name: 'NIC volume', body: 'Total bytes received and transmitted on the NIC over the selected range.' },
    ],
  },
  {
    id: 'cache',
    title: 'Cache',
    rows: [
      { name: 'Hit ratio', body: 'Requests answered from cache (HIT, STALE, UPDATING, or REVALIDATED) divided by all requests that were not blocked.' },
      { name: 'Byte hit ratio', body: 'Response bytes served from cache divided by all response bytes. Higher than the hit ratio when large files cache well.' },
      { name: 'From origin', body: 'Response bytes that had to be fetched from your origin.' },
      { name: 'Top uncached URLs', body: 'Paths (without query string) with the most MISS or EXPIRED responses. Good candidates for a cache rule.' },
    ],
  },
  {
    id: 'performance',
    title: 'Performance',
    rows: [
      { name: 'Edge response time', body: 'From the edge reading the request to sending the last byte to the client. Includes origin time on cache misses.' },
      { name: 'Origin response time', body: 'Time your origin took to answer the edge; retries are added together.' },
      { name: 'p50 / p95 / p99', body: 'Half, 95%, or 99% of requests finished within this time. Calculated from latency buckets (10 ms to 10 s), so values are rounded to the nearest bucket.' },
      { name: 'Origin 5xx', body: 'Your origin answered with a 5xx status. Timeouts and connection errors are counted separately.' },
      { name: 'Origin timeouts', body: 'The origin did not answer within the connect or read timeout.' },
      { name: 'Origin errors', body: 'The edge could not reach the origin: connection refused or reset, DNS, or TLS failure.' },
    ],
  },
  {
    id: 'firewall',
    title: 'Firewall (L7)',
    rows: [
      { name: 'Blocked requests', body: 'Requests a WAF rule stopped with Deny, Drop, or Drop + Block.' },
      { name: 'Blocked IPs', body: 'Distinct client IPs with at least one blocked request in the interval.' },
      { name: 'Top rules', body: 'Blocked requests grouped by the WAF rule that blocked them.' },
      { name: 'Block rate', body: 'Blocked requests divided by all requests.' },
    ],
  },
  {
    id: 'ddos',
    title: 'DDoS (L4)',
    rows: [
      { name: 'Allowed traffic', body: 'Packets Sparta passed to the operating system after XDP checks.' },
      { name: 'Dropped traffic', body: 'Packets XDP discarded at the network card: floods over threshold, blocked IPs, scans, or blocked countries.' },
      { name: 'Attack', body: 'A detection where one flood type (SYN, ACK, RST, UDP, ICMP, GRE, …) went over its threshold under Configure edges → XDP.' },
      { name: 'Top attacking IPs', body: 'Sources with the most dropped traffic. Add noisy ones to Block IP from this list.' },
    ],
  },
]
</script>
