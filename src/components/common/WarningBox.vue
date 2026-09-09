<script setup lang="ts">
import { ShieldAlert } from '@lucide/vue'

withDefaults(
  defineProps<{
    title: string
    description?: string
  }>(),
  {
    description: '',
  },
)
</script>

<template>
  <aside class="warning-box" role="alert">
    <div class="warning-box__icon" aria-hidden="true">
      <ShieldAlert :size="20" :stroke-width="2.2" />
    </div>
    <div class="warning-box__body">
      <strong class="warning-box__title">{{ title }}</strong>
      <p v-if="description" class="warning-box__description">{{ description }}</p>
      <slot />
    </div>
  </aside>
</template>

<style scoped>
.warning-box {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-alert-line);
  border-radius: var(--radius-md);
  background: var(--color-alert-bg);
  color: var(--color-alert);
}

.warning-box__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-alert);
}

.warning-box__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.warning-box__title {
  color: var(--color-alert);
  font-size: var(--text-base);
  font-weight: 800;
  line-height: 1.4;
  word-break: keep-all;
}

.warning-box__description {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.6;
  word-break: keep-all;
}
</style>
