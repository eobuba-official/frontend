<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { routePaths } from '@/router/routePaths'

const props = defineProps<{
  current: number
  total: number
  backTo?: string
}>()

const router = useRouter()

function goBack() {
  if (props.backTo) {
    void router.push(props.backTo)
    return
  }

  router.back()
}
</script>

<template>
  <div class="flow-header">
    <div class="flow-header__top">
      <button class="flow-header__button" type="button" @click="goBack">
        <ChevronLeft :size="18" :stroke-width="2.4" />
        뒤로
      </button>
      <span>{{ current }} / {{ total }}</span>
      <button class="flow-header__button flow-header__button--home" type="button" @click="router.push(routePaths.home)">
        처음으로
      </button>
    </div>

    <div class="flow-header__bar" aria-hidden="true">
      <span :style="{ width: `${(current / total) * 100}%` }"></span>
    </div>
  </div>
</template>

<style scoped>
.flow-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.flow-header__top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.flow-header__button {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: var(--space-1);
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.flow-header__button--home {
  justify-self: end;
}

.flow-header__bar {
  height: 4px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--color-surface-alt);
}

.flow-header__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-accent);
}
</style>
