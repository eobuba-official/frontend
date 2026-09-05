<script setup lang="ts">
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
    <span class="task-option-card__content">
      <strong class="task-option-card__title">{{ title }}</strong>
      <span class="task-option-card__description">{{ description }}</span>
    </span>
    <span class="task-option-card__mark" aria-hidden="true">
      {{ selected ? '✓' : '' }}
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
  background: var(--color-surface-alt);
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
  font-size: var(--text-sm);
}

.task-option-card__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-accent-ink);
  font-weight: 700;
}
</style>
