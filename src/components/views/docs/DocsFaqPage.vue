<template>
  <div class="docs-article">
    <h1 class="docs-article__title">FAQ</h1>
    <p class="docs-article__lead">Quick answers to common questions.</p>
    <div class="docs-article__body">
      <div class="docs-faq">
        <details v-for="item in faq" :key="item.q" class="docs-faq__item">
          <summary>{{ item.q }}</summary>
          <p>{{ item.a }}</p>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { faq } from '@/data/docsContent'
</script>
