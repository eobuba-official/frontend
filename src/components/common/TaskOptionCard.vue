<script setup lang="ts">
import { Check } from '@lucide/vue'

withDefaults(
  defineProps<{
    title: string
    description: string
    selected?: boolean
  }>(),
  {
    selected: false,
  },
)
</script>

<template>
  <button class="task-option-card" :class="{ 'task-option-card--selected': selected }" type="button">
    <span class="task-option-card__mark" aria-hidden="true">
      <Check :size="15" :stroke-width="3" />
    </span>
    <span class="task-option-card__content">
      <strong class="task-option-card__title">{{ title }}</strong>
      <span class="task-option-card__description">{{ description }}</span>
    </span>
  </button>
</template>

<style scoped>
.task-option-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  min-height: 76px;
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-card);
}

.task-option-card--selected {
  border-color: var(--color-accent);
  background: var(--color-yellow-faint);
}

.task-option-card__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.task-option-card__title {
  font-size: var(--text-base);
  line-height: 1.4;
}

.task-option-card__description {
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  word-break: keep-all;
  overflow-wrap: normal;
}

.task-option-card__mark {
  display: grid;
  place-items: center;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-accent-deep);
  background: transparent;
  color: var(--color-accent-deep);
  transform: scale(1);
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1.2);
}

.task-option-card__mark svg {
  opacity: 0;
  transform: scale(0.45);
  transition:
    opacity 140ms ease,
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1.4);
}

.task-option-card--selected .task-option-card__mark {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-accent-ink);
  transform: scale(1.08);
}

.task-option-card--selected .task-option-card__mark svg {
  opacity: 1;
  transform: scale(1);
}
</style>
