<script setup lang="ts">
type ButtonVariant = 'primary' | 'alert' | 'ghost' | 'text'
type ButtonSize = 'md' | 'lg'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    type?: 'button' | 'submit' | 'reset'
    block?: boolean
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'lg',
    type: 'button',
    block: false,
    disabled: false,
  },
)
</script>

<template>
  <button
    class="base-button"
    :class="[
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'base-button--block': block },
    ]"
    :type="type"
    :disabled="disabled"
  >
    <span v-if="$slots.icon" class="base-button__icon">
      <slot name="icon" />
    </span>
    <span class="base-button__label">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  transition:
    transform 120ms ease,
    opacity 120ms ease,
    background-color 120ms ease,
    border-color 120ms ease;
}

.base-button:active:not(:disabled) {
  transform: translateY(1px);
}

.base-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.base-button--block {
  width: 100%;
}

.base-button--md {
  min-height: 44px;
  padding: var(--space-3) var(--space-4);
}

.base-button--lg {
  min-height: 52px;
  padding: var(--space-4) var(--space-5);
}

.base-button--primary {
  background: var(--color-accent);
  color: var(--color-accent-ink);
}

.base-button--alert {
  background: var(--color-alert);
  color: var(--color-surface);
}

.base-button--ghost {
  background: var(--color-surface);
  border-color: var(--color-line);
  color: var(--color-ink);
}

.base-button--text {
  min-height: auto;
  padding-inline: 0;
  background: transparent;
  color: var(--color-ink-soft);
}

.base-button__icon {
  display: inline-flex;
  flex-shrink: 0;
}

.base-button__label {
  min-width: 0;
}
</style>
