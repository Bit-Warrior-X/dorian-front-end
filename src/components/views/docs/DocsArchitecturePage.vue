<template>
  <div class="docs-article">
    <h1 class="docs-article__title">Architecture</h1>
    <p class="docs-article__lead">How the control plane and edge data plane fit together.</p>
    <div class="docs-article__body">
      <div class="docs-flow" aria-hidden="true">
        <span>Panel</span>
        <span class="docs-flow__arrow">→</span>
        <span>Dorian API</span>
        <span class="docs-flow__arrow">→</span>
        <span>Angelos :5000</span>
        <span class="docs-flow__arrow">→</span>
        <span>Athens (L7) · Sparta (L4)</span>
      </div>

      <div class="docs-concept-grid">
        <article v-for="item in concepts" :key="item.title" class="docs-concept">
          <h2>{{ item.title }}</h2>
          <p>{{ item.body }}</p>
        </article>
      </div>

      <h2 class="docs-subhead">Mental model</h2>
      <ul class="docs-bullets">
        <li>
          The <strong>Vue console</strong> never calls Angelos directly. Mutations go to the
          Dorian back-end, which POSTs JSON to each edge.
        </li>
        <li>
          A <strong>site</strong> is the unit of customer traffic (domain + SSL + origins + WAF).
          An <strong>edge</strong> is the host that terminates and protects that traffic.
        </li>
        <li>
          One site can attach to multiple edges; one edge can host many sites (capacity and
          license permitting).
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { concepts } from '@/data/docsContent'
</script>
