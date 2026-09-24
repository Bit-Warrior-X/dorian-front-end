<template>
  <div class="dashboard-view docs-shell">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>Docs</h2>
        <p>Operator handbook — browse topics like a modern CDN knowledge base.</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <div class="docs-shell__body">
      <aside class="docs-sidebar dash-panel" aria-label="Documentation">
        <div class="docs-sidebar__search">
          <label class="sr-only" for="docs-nav-search">Filter docs</label>
          <input
            id="docs-nav-search"
            v-model.trim="query"
            type="search"
            class="dash-input"
            placeholder="Filter topics…"
            autocomplete="off"
          />
        </div>

        <nav class="docs-sidebar__nav">
          <template v-for="group in filteredNav" :key="group.group">
            <p class="docs-sidebar__group">{{ group.group }}</p>
            <RouterLink
              v-for="item in group.items"
              :key="item.name"
              class="docs-sidebar__link"
              :class="{ active: route.name === item.name }"
              :to="{ name: item.name }"
            >
              {{ item.title }}
            </RouterLink>
          </template>
          <p v-if="!filteredNav.length" class="docs-sidebar__empty">No matching topics.</p>
        </nav>
      </aside>

      <div class="docs-shell__main">
        <article class="dash-panel docs-shell__article">
          <RouterView />
        </article>

        <nav v-if="prev || next" class="docs-pager" aria-label="Adjacent docs">
          <RouterLink
            v-if="prev"
            class="docs-pager__card docs-pager__card--prev"
            :to="{ name: prev.name }"
          >
            <span class="docs-pager__label">Previous</span>
            <span class="docs-pager__title">{{ prev.title }}</span>
          </RouterLink>
          <span v-else class="docs-pager__spacer" />
          <RouterLink
            v-if="next"
            class="docs-pager__card docs-pager__card--next"
            :to="{ name: next.name }"
          >
            <span class="docs-pager__label">Next</span>
            <span class="docs-pager__title">{{ next.title }}</span>
          </RouterLink>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { docsAdjacent, docsNav } from '@/data/docsNav'
import '@/assets/styles/docs.css'

const route = useRoute()
const query = ref('')

const filteredNav = computed(() => {
  const q = query.value.toLowerCase()
  if (!q) return docsNav
  return docsNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const blob = `${item.title} ${item.description} ${item.keywords}`.toLowerCase()
        return blob.includes(q)
      }),
    }))
    .filter((group) => group.items.length)
})

const adjacent = computed(() => docsAdjacent(route.name))
const prev = computed(() => adjacent.value.prev)
const next = computed(() => adjacent.value.next)

watch(
  () => route.fullPath,
  () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
    }
  },
)
</script>

<style scoped>
.docs-shell {
  max-width: 1680px;
  margin: 0 auto;
}

.docs-shell__body {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.docs-sidebar {
  position: sticky;
  top: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 28px);
  overflow: auto;
}

.docs-sidebar__search .dash-input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.docs-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.docs-sidebar__group {
  margin: 12px 0 4px;
  padding: 0 10px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-label);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.docs-sidebar__group:first-child {
  margin-top: 0;
}

.docs-sidebar__link {
  display: block;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: var(--type-caption);
  font-weight: 500;
  color: var(--app-text-muted);
  text-decoration: none;
  line-height: 1.35;
}

.docs-sidebar__link:hover {
  color: var(--app-text);
  background: var(--app-surface-hover, var(--app-surface-muted));
}

.docs-sidebar__link.active {
  color: var(--app-heading);
  background: var(--app-accent-soft);
  font-weight: 600;
}

.docs-sidebar__empty {
  margin: 8px 10px;
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.docs-shell__main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.docs-shell__article {
  padding: 22px 24px 28px;
  min-height: 420px;
}

.docs-pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.docs-pager__spacer {
  display: block;
}

.docs-pager__card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease;
}

.docs-pager__card:hover {
  border-color: var(--app-accent);
}

.docs-pager__card--next {
  text-align: right;
  justify-self: stretch;
}

.docs-pager__label {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.docs-pager__title {
  font-size: var(--type-base);
  font-weight: 600;
  color: var(--app-heading);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 960px) {
  .docs-shell__body {
    grid-template-columns: 1fr;
  }

  .docs-sidebar {
    position: static;
    max-height: none;
  }

  .docs-sidebar__nav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 4px;
  }

  .docs-sidebar__group {
    width: 100%;
    margin-top: 8px;
  }

  .docs-pager {
    grid-template-columns: 1fr;
  }

  .docs-pager__card--next {
    text-align: left;
  }

  .docs-shell__article {
    padding: 16px;
  }
}
</style>
