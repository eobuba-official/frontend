<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    required?: boolean
    checked?: boolean
  }>(),
  {
    description: '',
    required: false,
    checked: false,
  },
)
</script>

<template>
  <div class="checklist-item" :class="{ 'checklist-item--checked': checked }">
    <span class="checklist-item__check" aria-hidden="true">
      {{ checked ? '✓' : '' }}
    </span>
    <div class="checklist-item__body">
      <div class="checklist-item__header">
        <strong class="checklist-item__title">{{ title }}</strong>
        <span class="checklist-item__badge" :class="{ 'checklist-item__badge--required': required }">
          {{ required ? '필수' : '선택' }}
        </span>
      </div>
      <p v-if="description" class="checklist-item__description">{{ description }}</p>
    </div>
  </div>
</template>

<style scoped>
.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.checklist-item--checked {
  border-color: var(--color-success);
}

.checklist-item__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
  color: var(--color-success);
  font-weight: 700;
}

.checklist-item--checked .checklist-item__check {
  background: var(--color-success);
  color: var(--color-surface);
}

.checklist-item__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.checklist-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.checklist-item__title {
  font-size: var(--text-base);
  line-height: 1.4;
}

.checklist-item__badge {
  flex-shrink: 0;
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  font-weight: 700;
}

.checklist-item__badge--required {
  background: var(--color-alert-bg);
  color: var(--color-alert);
}

.checklist-item__description {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}
</style>
