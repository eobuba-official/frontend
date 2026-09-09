<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: '지도를 불러오고 있어요...' })
</script>

<template>
  <div class="map-loading">
    <span class="map-loading__spinner" aria-hidden="true"></span>
    <p>{{ label }}</p>
  </div>
</template>

<style scoped>
.map-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  background: var(--color-surface-alt);
}

.map-loading p {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.map-loading__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-line);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: map-loading-spin 700ms linear infinite;
}

@keyframes map-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .map-loading__spinner {
    animation: none;
  }
}
</style>
