<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X } from '@lucide/vue'
import kbLogo from '@/assets/img/kb.png'

const props = defineProps<{
  // null keeps the sheet closed; pass the selected branch's id so a switch between
  // branches re-measures the sheet even when it never closes in between
  sheetKey: number | string | null
  title: string
  // first line renders slightly stronger than the rest (distance/wait vs address)
  metaLines: string[]
}>()

const emit = defineEmits<{
  close: []
  // every height change, including the first measurement
  measure: [heightPx: number]
  // only when a new branch is selected, so callers can re-center the map once
  opened: [heightPx: number]
}>()

const sheetEl = ref<HTMLElement | null>(null)
let observer: ResizeObserver | null = null

// the sheet's height depends on its content (name/address length wraps differently per
// branch), so measure it rather than assume a fixed height
watch(
  () => props.sheetKey,
  async (key) => {
    await nextTick()

    observer?.disconnect()
    observer = null

    if (key == null || !sheetEl.value) return

    emit('measure', sheetEl.value.offsetHeight)
    emit('opened', sheetEl.value.offsetHeight)

    observer = new ResizeObserver(() => {
      if (sheetEl.value) emit('measure', sheetEl.value.offsetHeight)
    })
    observer.observe(sheetEl.value)
  },
)

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <Transition name="map-sheet">
    <section v-if="sheetKey != null" ref="sheetEl" class="map-sheet">
      <button type="button" class="map-sheet__close" aria-label="닫기" @click="emit('close')">
        <X :size="18" :stroke-width="2.4" />
      </button>

      <div class="map-sheet__header">
        <span class="map-sheet__icon">
          <img :src="kbLogo" alt="" />
        </span>
        <div class="map-sheet__info">
          <h2>{{ title }}</h2>
          <p
            v-for="(line, index) in metaLines"
            :key="index"
            class="map-sheet__meta"
            :class="{ 'map-sheet__meta--sub': index > 0 }"
          >
            {{ line }}
          </p>
        </div>
      </div>

      <slot />
      <slot name="actions" />
    </section>
  </Transition>
</template>

<style scoped>
.map-sheet {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 3;
  padding: var(--space-5) var(--screen-padding-x) calc(var(--space-5) + env(safe-area-inset-bottom, 0px));
  border-radius: 24px 24px 0 0;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-bottom: 0;
}

.map-sheet__close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
  cursor: pointer;
}

.map-sheet__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.map-sheet__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-yellow-light);
}

.map-sheet__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.map-sheet__info {
  flex: 1;
  min-width: 0;
}

.map-sheet h2 {
  padding-right: var(--space-8);
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-xl);
  font-weight: 900;
}

.map-sheet__meta {
  margin-top: var(--space-1);
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
}

.map-sheet__meta--sub {
  font-weight: 500;
}

.map-sheet-enter-active,
.map-sheet-leave-active {
  transition: transform 220ms cubic-bezier(0.65, 0, 0.35, 1);
}

.map-sheet-enter-from,
.map-sheet-leave-to {
  transform: translateY(100%);
}
</style>
