<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import { routePaths } from '@/router/routePaths'

const router = useRouter()
const hasError = ref(false)

// a render or setup error in any view would otherwise tear down the whole app and
// leave a blank white screen that only a manual refresh recovers from
onErrorCaptured((error) => {
  console.error('[app] unhandled error', error)
  hasError.value = true
  return false
})

async function goHome() {
  hasError.value = false
  await router.push(routePaths.home)
}

function reload() {
  window.location.reload()
}
</script>

<template>
  <div class="error-boundary">
    <section v-if="hasError" class="app-error">
      <h1>화면을 여는 중<br />문제가 생겼어요</h1>
      <p>잠시 후 다시 시도해 주세요.</p>

      <div class="app-error__actions">
        <BaseButton block @click="goHome">처음 화면으로</BaseButton>
        <BaseButton variant="ghost" block @click="reload">새로고침</BaseButton>
      </div>
    </section>

    <slot v-else />
  </div>
</template>

<style scoped>
/* no layout box of its own, so the page below keeps its normal placement */
.error-boundary {
  display: contents;
}

.app-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-4);
  min-height: 100dvh;
  padding: var(--space-6) var(--screen-padding-x);
  background: var(--color-bg);
  text-align: center;
}

.app-error p {
  color: var(--color-ink-soft);
  font-size: var(--text-lg);
}

.app-error__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
</style>
