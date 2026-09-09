<script setup lang="ts">
import { LocateFixed } from '@lucide/vue'

withDefaults(defineProps<{ disabled?: boolean; offset?: number }>(), {
  disabled: false,
  offset: 0,
})

defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="map-locate-btn"
    :disabled="disabled"
    :style="{ transform: `translateY(-${offset}px)` }"
    aria-label="내 위치로 이동"
    @click="$emit('click')"
  >
    <LocateFixed :size="22" :stroke-width="2.4" />
  </button>
</template>

<style scoped>
.map-locate-btn {
  position: absolute;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: 2;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-ink);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: transform 220ms cubic-bezier(0.65, 0, 0.35, 1);
}

.map-locate-btn:disabled {
  color: var(--color-ink-faint);
  cursor: not-allowed;
}
</style>
