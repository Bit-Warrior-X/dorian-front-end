<template>
  <div class="docs-article">
    <div class="docs-article__head">
      <div>
        <h1 class="docs-article__title">Licensing</h1>
        <p class="docs-article__lead">Order what you want to protect, pay, and get one license per edge and per site.</p>
      </div>
      <RouterLink class="docs-panel-link" :to="{ name: 'orders' }">Open Orders</RouterLink>
    </div>
    <div class="docs-article__body">
      <div class="docs-callout docs-callout--info">
        <strong>Orders first, licenses after</strong>
        <span>
          Every edge and site starts as an order. Once the payment is confirmed, an operator sets everything up
          and the licenses start. Licenses run monthly or annually (~20% off) and are renewed through renewal orders.
        </span>
      </div>

      <h2 class="docs-subhead">What you can order</h2>
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>You provide</th>
              <th>You get</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Site protection · own edge</strong></td>
              <td>Your server (SSH access) and N sites</td>
              <td>L7 on your edge, optional L4, one license per site</td>
            </tr>
            <tr>
              <td><strong>Site protection · platform edge</strong></td>
              <td>N sites</td>
              <td>Sites served by Dorian edges, one license per site</td>
            </tr>
            <tr>
              <td><strong>Edge protection</strong></td>
              <td>N servers (SSH access)</td>
              <td>L4 network protection on each edge</td>
            </tr>
            <tr>
              <td><strong>Edge + site protection</strong></td>
              <td>Your server and N sites</td>
              <td>L4 + L7 on your edge, one license per site</td>
            </tr>
            <tr>
              <td><strong>Add-on</strong></td>
              <td>More sites, another edge, or L4 for an L7 edge</td>
              <td>Prorated so it ends together with your current licenses</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="docs-subhead">Order steps</h2>
      <ol class="docs-bullets">
        <li><strong>Draft</strong> — build the order and save it; edit it any time.</li>
        <li><strong>Submit</strong> — the price is locked and an invoice number (INV-…) is issued.</li>
        <li><strong>Pay</strong> — bank transfer with the invoice number as reference; we confirm it manually.</li>
        <li><strong>Setup</strong> — an operator installs your edges and creates your sites.</li>
        <li><strong>Active</strong> — licenses run; the order page links to each edge and site.</li>
      </ol>

      <h2 class="docs-subhead">Renewals and expiry</h2>
      <ul class="docs-bullets">
        <li>Seven days before a period ends, a renewal order is created and you are notified.</li>
        <li>After the end date the license is <strong>past due</strong>; everything keeps working.</li>
        <li>
          Fourteen days later it <strong>expires</strong>: protection keeps running, but configuration changes on that
          edge or site are locked until you renew.
        </li>
        <li>
          Renew one or several licenses any time from
          <RouterLink :to="{ name: 'server-license' }">Licensing</RouterLink>.
        </li>
      </ul>

      <h2 class="docs-subhead">Cancelling</h2>
      <ul class="docs-bullets">
        <li>
          <strong>Cancel</strong> on a Licensing row stops renewal. The license stays active until its end date, then
          becomes cancelled and changes are locked. There are no refunds.
        </li>
        <li>Changed your mind? Click <strong>Keep</strong> any time before the end date, or pay a renewal.</li>
        <li>If the license is in an unpaid renewal order, that order is re-issued without it.</li>
        <li>A cancelled license can't be renewed; place a new order instead.</li>
      </ul>

      <h2 class="docs-subhead">Good to know</h2>
      <ul class="docs-bullets">
        <li>
          L4 settings and the Sparta service need an L4 or Unified license; L7 Guard and the Athens service need an L7
          or Unified license. Order the L4 add-on from the Licensing table.
        </li>
        <li>
          A site's domain can't be changed; order a new site instead. Sites on your own edges can only move to edges
          that hold your active L7 license, and platform sites are placed by the operator.
        </li>
        <li>Deleting an edge or a site is always allowed, whatever its license state.</li>
        <li>Admins can place orders for customers and override an edge's tier directly on Licensing.</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
