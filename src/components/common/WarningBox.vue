<script setup lang="ts">
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
    <div class="warning-box__icon" aria-hidden="true">!</div>
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
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-pill);
  background: var(--color-alert);
  color: var(--color-surface);
  font-size: var(--text-sm);
  font-weight: 700;
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
}

.warning-box__description {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}
</style>
