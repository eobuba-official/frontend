<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppErrorBoundary from '@/components/common/AppErrorBoundary.vue'
import { skipNextPageTransition } from '@/utils/pageTransition'

const SLIDE_DURATION = '200ms'

const route = useRoute()
// the transition's CSS class names stay constant and only these values change —
// swapping the Transition's `name` mid-flight left interrupted transitions with
// stale classes and no end event, so a fast tab tap could strand the router view
// with the outgoing page removed and the incoming one never entering
const duration = ref(SLIDE_DURATION)
const enterShift = ref('24px')
const leaveShift = ref('-18px')

let previousPosition = historyPosition()

function historyPosition() {
  return Number((window.history.state as { position?: number } | null)?.position ?? 0)
}

watch(
  () => route.fullPath,
  () => {
    const nextPosition = historyPosition()

    if (skipNextPageTransition.value) {
      skipNextPageTransition.value = false
      duration.value = '0ms'
    } else {
      const isBack = nextPosition < previousPosition
      duration.value = SLIDE_DURATION
      enterShift.value = isBack ? '-24px' : '24px'
      leaveShift.value = isBack ? '18px' : '-18px'
    }

    previousPosition = nextPosition
  },
)
</script>

<template>
  <AppErrorBoundary>
    <div
      class="page-transition-root"
      :style="{
        '--page-duration': duration,
        '--page-enter-shift': enterShift,
        '--page-leave-shift': leaveShift,
      }"
    >
      <RouterView v-slot="{ Component, route }">
        <!-- deliberately not mode="out-in": that makes the incoming page wait for the
             outgoing one's leave to finish, so a leave that never completes leaves the
             app on a blank screen. Overlapping instead, with the leaving page taken out
             of flow below, means the next page always renders. -->
        <Transition name="page">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </div>
  </AppErrorBoundary>
</template>

<style>
/* carries the transition variables without adding a layout box of its own */
.page-transition-root {
  display: contents;
}

.page-enter-active,
.page-leave-active {
  transition:
    opacity var(--page-duration) ease,
    transform var(--page-duration) ease;
}

/* the two pages overlap during the transition, so the outgoing one leaves the flow
   and the incoming one keeps its normal position instead of being pushed down */
.page-leave-active {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(var(--page-enter-shift));
}

.page-leave-to {
  opacity: 0;
  transform: translateX(var(--page-leave-shift));
}
</style>
