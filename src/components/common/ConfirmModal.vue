<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  role?: 'dialog' | 'alertdialog'
  singleAction?: boolean
}>()

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="confirm-modal-overlay" @click.self="emit('close')">
    <div class="confirm-modal" :role="role ?? 'dialog'" aria-modal="true" :aria-label="title">
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
      <slot />
      <div class="confirm-modal__actions" :class="{ 'confirm-modal__actions--single': singleAction }">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: rgba(31, 35, 41, 0.4);
}

.confirm-modal {
  width: 100%;
  max-width: 360px;
  padding: var(--space-6) var(--space-5) var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.confirm-modal h2 {
  font-family: var(--font-body);
  font-size: var(--text-xl);
  font-weight: 800;
}

.confirm-modal > p {
  margin-top: var(--space-2);
  color: var(--color-ink-soft);
  font-size: var(--text-base);
}

.confirm-modal__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.confirm-modal__actions--single {
  grid-template-columns: 1fr;
}
</style>
