<template>
  <div class="docs-article">
    <h1 class="docs-article__title">Troubleshooting</h1>
    <p class="docs-article__lead">Fix the issues operators hit in the first week.</p>
    <div class="docs-article__body">
      <div class="docs-faq">
        <details v-for="item in troubleshooting" :key="item.q" class="docs-faq__item" open>
          <summary>{{ item.q }}</summary>
          <div class="docs-faq__body">
            <p>{{ item.a }}</p>
            <ul v-if="item.steps?.length" class="docs-mini-list">
              <li v-for="s in item.steps" :key="s">{{ s }}</li>
            </ul>
            <RouterLink v-if="item.to" class="docs-inline-link" :to="item.to">
              {{ item.cta }}
            </RouterLink>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { troubleshooting } from '@/data/docsContent'
</script>
