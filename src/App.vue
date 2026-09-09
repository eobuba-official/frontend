<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { skipNextPageTransition } from '@/utils/pageTransition'

const route = useRoute()
const transitionName = ref('page-slide-forward')
let previousPosition = historyPosition()

function historyPosition() {
  return Number((window.history.state as { position?: number } | null)?.position ?? 0)
}

watch(
  () => route.fullPath,
  () => {
    const nextPosition = historyPosition()

    if (skipNextPageTransition.value) {
      transitionName.value = 'page-none'
      skipNextPageTransition.value = false
    } else {
      transitionName.value = nextPosition < previousPosition ? 'page-slide-back' : 'page-slide-forward'
    }

    previousPosition = nextPosition
  },
)
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="transitionName" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </RouterView>
</template>

<style>
.page-slide-forward-enter-active,
.page-slide-forward-leave-active,
.page-slide-back-enter-active,
.page-slide-back-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.page-slide-forward-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.page-slide-forward-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}

.page-slide-back-enter-from {
  opacity: 0;
  transform: translateX(-24px);
}

.page-slide-back-leave-to {
  opacity: 0;
  transform: translateX(18px);
}
</style>
