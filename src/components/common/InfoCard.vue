<script setup lang="ts">
type InfoCardTone = 'default' | 'accent' | 'success' | 'alert'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    tone?: InfoCardTone
  }>(),
  {
    title: '',
    description: '',
    tone: 'default',
  },
)
</script>

<template>
  <section class="info-card" :class="`info-card--${tone}`">
    <div v-if="$slots.badge || $slots.icon" class="info-card__meta">
      <slot name="badge" />
      <slot name="icon" />
    </div>
    <h2 v-if="title" class="info-card__title">{{ title }}</h2>
    <p v-if="description" class="info-card__description">{{ description }}</p>
    <slot />
  </section>
</template>

<style scoped>
.info-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  padding: var(--card-padding);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.info-card--accent {
  background: var(--color-surface-alt);
}

.info-card--success {
  border-color: var(--color-success);
  background: var(--color-success-bg);
}

.info-card--alert {
  border-color: var(--color-alert-line);
  background: var(--color-alert-bg);
}

.info-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.info-card__title {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 700;
  line-height: 1.4;
}

.info-card__description {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}
</style>
