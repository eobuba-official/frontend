<script setup lang="ts">
import { Home, MapPin, ScrollText, User } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
import { routePaths } from '@/router/routePaths'
import { skipNextPageTransition } from '@/utils/pageTransition'

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'home', label: '홈', icon: Home, path: routePaths.home },
  { key: 'map', label: '지도', icon: MapPin, path: routePaths.branchExplore },
  { key: 'history', label: '이용내역', icon: ScrollText, path: routePaths.history },
  { key: 'mypage', label: '마이페이지', icon: User, path: routePaths.settings },
]

function isActive(path: string) {
  return path === routePaths.home ? route.path === path : route.path.startsWith(path)
}

function go(path: string) {
  if (route.path === path) return
  skipNextPageTransition.value = true
  void router.push(path)
}
</script>

<template>
  <nav class="tab-bar" aria-label="주요 메뉴">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="tab-bar__item"
      :class="{ 'tab-bar__item--active': isActive(tab.path) }"
      @click="go(tab.path)"
    >
      <component
        :is="tab.icon"
        class="tab-bar__icon"
        :size="24"
        :stroke-width="isActive(tab.path) ? 2.4 : 2"
      />
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tab-bar {
  display: flex;
  flex-shrink: 0;
  align-items: stretch;
  justify-content: space-around;
  height: calc(var(--tabbar-height) + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--color-line);
  background: var(--color-surface);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.tab-bar__item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: var(--space-2) 0 0;
  border: 0;
  background: transparent;
  color: var(--color-ink-faint);
  font-size: var(--text-xs);
  font-weight: 700;
  cursor: pointer;
}

.tab-bar__icon {
  width: 1.5rem !important;
  height: 1.5rem !important;
  flex: 0 0 1.5rem;
}

.tab-bar__item--active {
  color: var(--color-accent-deep);
}
</style>
