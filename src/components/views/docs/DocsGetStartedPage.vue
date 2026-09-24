<template>
  <div class="docs-article">
    <h1 class="docs-article__title">Get started</h1>
    <p class="docs-article__lead">
      From an empty console to a protected domain — follow these steps in order.
    </p>
    <div class="docs-article__body">
      <div class="docs-callout docs-callout--info">
        <p>
          <strong>What you need.</strong>
          A Linux host with a public IP and SSH (root or sudo), DNS control for your domain, and a
          Dorian account. Trial licenses need no payment.
        </p>
      </div>

      <ol class="docs-steps">
        <li v-for="(step, index) in startSteps" :key="step.title" class="docs-step">
          <header class="docs-step__head">
            <span class="docs-step__num" aria-hidden="true">{{ index + 1 }}</span>
            <h2 class="docs-step__title">{{ step.title }}</h2>
          </header>
          <div class="docs-step__body">
            <p class="docs-step__text">{{ step.body }}</p>
            <ul v-if="step.tips?.length" class="docs-mini-list">
              <li v-for="tip in step.tips" :key="tip">{{ tip }}</li>
            </ul>
            <RouterLink v-if="step.to" class="docs-inline-link" :to="step.to">
              {{ step.cta }}
            </RouterLink>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { startSteps } from '@/data/docsContent'
</script>
