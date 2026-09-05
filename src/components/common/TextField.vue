<script setup lang="ts">
const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    id: string
    label: string
    placeholder?: string
    type?: 'text' | 'tel' | 'number' | 'search'
    helperText?: string
    errorMessage?: string
    disabled?: boolean
  }>(),
  {
    placeholder: '',
    type: 'text',
    helperText: '',
    errorMessage: '',
    disabled: false,
  },
)
</script>

<template>
  <label class="text-field" :for="id">
    <span class="text-field__label">{{ label }}</span>
    <input
      :id="id"
      v-model="model"
      class="text-field__input"
      :class="{ 'text-field__input--error': errorMessage }"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="Boolean(errorMessage)"
      :aria-describedby="helperText || errorMessage ? `${id}-message` : undefined"
    />
    <span v-if="errorMessage || helperText" :id="`${id}-message`" class="text-field__message">
      {{ errorMessage || helperText }}
    </span>
  </label>
</template>

<style scoped>
.text-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

.text-field__label {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.text-field__input {
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  padding: var(--space-3) var(--space-4);
}

.text-field__input::placeholder {
  color: var(--color-ink-faint);
}

.text-field__input--error {
  border-color: var(--color-alert);
}

.text-field__message {
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
}

.text-field__input--error + .text-field__message {
  color: var(--color-alert);
}
</style>
