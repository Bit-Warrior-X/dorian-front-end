<template>
  <div class="docs-article">
    <h1 class="docs-article__title">Insights</h1>
    <p class="docs-article__lead">Traffic, security, logs, and L4 attack views.</p>
    <div class="docs-article__body">
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Nav</th>
              <th>What you’ll see</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in insightRows" :key="row.title">
              <td><strong>{{ row.title }}</strong></td>
              <td>{{ row.body }}</td>
              <td>
                <RouterLink class="docs-inline-link" :to="row.to">Open</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ul class="docs-bullets">
        <li>
          Most charts share <strong>edge</strong>, <strong>site</strong>, and time-range filters
          (presets + custom).
        </li>
        <li>
          <RouterLink :to="{ name: 'log-export' }">Log export</RouterLink>
          builds offline downloads (access / error / security / all · CSV, JSON, or TXT).
        </li>
        <li>
          On L4 Attacks → Attacks, you can promote noisy sources into the blacklist from the top
          attacking IPs list.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { insightRows } from '@/data/docsContent'
</script>
