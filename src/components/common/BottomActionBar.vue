<script setup lang="ts">
withDefaults(
  defineProps<{
    stacked?: boolean
  }>(),
  {
    stacked: false,
  },
)
</script>

<template>
  <div class="bottom-action-bar" :class="{ 'bottom-action-bar--stacked': stacked }">
    <slot />
  </div>
</template>

<style scoped>
.bottom-action-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
}

.bottom-action-bar--stacked {
  flex-direction: column;
  align-items: stretch;
}
</style>
