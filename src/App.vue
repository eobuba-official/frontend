<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
const transitionName = ref('page-slide-forward')
let previousStep = Number(route.meta.step ?? 0)

watch(
  () => route.fullPath,
  () => {
    const nextStep = Number(route.meta.step ?? 0)
    transitionName.value = nextStep < previousStep ? 'page-slide-back' : 'page-slide-forward'
    previousStep = nextStep
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
