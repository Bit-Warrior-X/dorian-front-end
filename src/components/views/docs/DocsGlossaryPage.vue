<template>
  <div class="docs-article">
    <h1 class="docs-article__title">Glossary</h1>
    <p class="docs-article__lead">Terms used across the console.</p>
    <div class="docs-article__body">
      <dl class="docs-glossary">
        <template v-for="term in glossary" :key="term.t">
          <dt>{{ term.t }}</dt>
          <dd>{{ term.d }}</dd>
        </template>
      </dl>
    </div>
  </div>
</template>

<script setup>
import { glossary } from '@/data/docsContent'
</script>
