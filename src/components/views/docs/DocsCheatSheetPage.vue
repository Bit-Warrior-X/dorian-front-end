<template>
  <div class="docs-article">
    <h1 class="docs-article__title">Route cheat sheet</h1>
    <p class="docs-article__lead">Jump anywhere in the console.</p>
    <div class="docs-article__body">
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>UI</th>
              <th>Path</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in cheatSheet" :key="row.path">
              <td>{{ row.label }}</td>
              <td><code class="num">{{ row.path }}</code></td>
              <td>
                <RouterLink class="docs-inline-link" :to="row.to">Open</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { cheatSheet } from '@/data/docsContent'
</script>
