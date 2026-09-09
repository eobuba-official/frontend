<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    length?: number
    disabled?: boolean
  }>(),
  {
    length: 6,
    disabled: false,
  },
)

const inputs = ref<(HTMLInputElement | null)[]>([])
const boxes = ref<string[]>(Array.from({ length: props.length }, (_, i) => model.value[i] ?? ''))

watch(
  () => model.value,
  (value) => {
    boxes.value = Array.from({ length: props.length }, (_, i) => value[i] ?? '')
  },
)

function updateModel() {
  model.value = boxes.value.join('')
}

function handleInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const digit = target.value.replace(/\D/g, '').slice(-1)
  boxes.value[index] = digit
  target.value = digit
  updateModel()

  if (digit && index < props.length - 1) {
    inputs.value[index + 1]?.focus()
  }
}

function handleKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !boxes.value[index] && index > 0) {
    boxes.value[index - 1] = ''
    updateModel()
    inputs.value[index - 1]?.focus()
  }
}

function handlePaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  const digits = text.replace(/\D/g, '').slice(0, props.length)
  if (!digits) return

  event.preventDefault()
  boxes.value = Array.from({ length: props.length }, (_, i) => digits[i] ?? '')
  updateModel()
  void nextTick(() => inputs.value[Math.min(digits.length, props.length - 1)]?.focus())
}
</script>

<template>
  <div class="otp-input" @paste="handlePaste">
    <input
      v-for="(box, index) in boxes"
      :key="index"
      ref="inputs"
      class="otp-input__box"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="1"
      :value="box"
      :disabled="disabled"
      @input="handleInput(index, $event)"
      @keydown="handleKeydown(index, $event)"
    />
  </div>
</template>

<style scoped>
.otp-input {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  width: 100%;
}

.otp-input__box {
  width: 42px;
  height: 52px;
  border: 1.5px solid #dfe3e8;
  border-radius: var(--radius-sm);
  background: #ffffff;
  color: var(--color-ink);
  font: inherit;
  font-size: var(--text-xl);
  font-weight: 800;
  text-align: center;
  box-shadow: inset 0 0 0 1px rgba(31, 35, 41, 0.02);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.otp-input__box:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow:
    inset 0 0 0 1px var(--color-accent),
    0 0 0 3px rgba(255, 188, 0, 0.12);
}
</style>
