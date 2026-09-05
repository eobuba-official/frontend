<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    current: number
    total: number
    label?: string
  }>(),
  {
    label: '진행 단계',
  },
)

function isActive(index: number) {
  return index + 1 === props.current
}

function isDone(index: number) {
  return index + 1 < props.current
}
</script>

<template>
  <div
    class="progress-indicator"
    role="progressbar"
    :aria-label="label"
    :aria-valuenow="current"
    aria-valuemin="1"
    :aria-valuemax="total"
  >
    <span
      v-for="step in total"
      :key="step"
      class="progress-indicator__dot"
      :class="{
        'progress-indicator__dot--active': isActive(step - 1),
        'progress-indicator__dot--done': isDone(step - 1),
      }"
    />
  </div>
</template>

<style scoped>
.progress-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.progress-indicator__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--color-ink-faint);
}

.progress-indicator__dot--active {
  width: 24px;
  background: var(--color-accent);
}

.progress-indicator__dot--done {
  background: var(--color-success);
}
</style>
