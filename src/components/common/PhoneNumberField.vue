<script setup lang="ts">
import { computed } from 'vue'

const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    id: string
    label?: string
    helperText?: string
    errorMessage?: string
    disabled?: boolean
  }>(),
  {
    label: '휴대폰 번호',
    helperText: '',
    errorMessage: '',
    disabled: false,
  },
)

const formatted = computed(() => {
  const digits = model.value
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits
})

function handleInput(event: Event) {
  const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 8)
  model.value = digits
  ;(event.target as HTMLInputElement).value = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits
}
</script>

<template>
  <label class="phone-field" :for="id">
    <span class="phone-field__label">{{ label }}</span>
    <span class="phone-field__row" :class="{ 'phone-field__row--error': errorMessage }">
      <span class="phone-field__prefix" aria-hidden="true">010-</span>
      <input
        :id="id"
        class="phone-field__input"
        type="tel"
        inputmode="numeric"
        placeholder="0000-0000"
        :value="formatted"
        :disabled="disabled"
        :aria-invalid="Boolean(errorMessage)"
        :aria-describedby="helperText || errorMessage ? `${id}-message` : undefined"
        @input="handleInput"
      />
    </span>
    <span v-if="errorMessage || helperText" :id="`${id}-message`" class="phone-field__message">
      {{ errorMessage || helperText }}
    </span>
  </label>
</template>

<style scoped>
.phone-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.phone-field:focus-within {
  border-color: var(--color-accent);
}

.phone-field__label {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.phone-field__row {
  display: inline-flex;
  align-items: baseline;
}

.phone-field__row--error {
  color: var(--color-alert);
}

.phone-field__prefix {
  font-size: var(--text-xl);
  font-weight: 800;
  color: var(--color-ink);
}

.phone-field__input {
  width: 9ch;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  font-size: var(--text-xl);
  font-weight: 800;
  text-align: left;
}

.phone-field__input::placeholder {
  color: var(--color-ink-faint);
  font-weight: 800;
}

.phone-field__input:focus {
  outline: none;
}

.phone-field__message {
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
}

.phone-field__row--error + .phone-field__message {
  color: var(--color-alert);
}
</style>
