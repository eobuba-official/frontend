<script setup lang="ts">
import { CircleHelp } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { routePaths } from '@/router/routePaths'

const router = useRouter()
</script>

<template>
  <AppScreen>
    <section class="end">
      <div class="end__icon" aria-hidden="true">
        <CircleHelp :size="42" :stroke-width="1.8" />
      </div>
      <h1>가까운 지점에서<br />상담받으시는 게 좋겠어요</h1>
      <p>말씀해주신 내용으로는 어떤 업무인지 확인이 어려워요.</p>
    </section>

    <template #footer>
      <div class="end__footer">
        <BaseButton variant="ghost" block @click="router.push(routePaths.home)">다시 말해볼게요</BaseButton>
        <BaseButton block>KB국민은행 1588-9999</BaseButton>
      </div>
    </template>
  </AppScreen>
</template>

<style scoped>
.end {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-5);
  text-align: center;
}

.end__icon {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border-radius: var(--radius-pill);
  background: var(--color-surface-alt);
  color: var(--color-accent);
}

.end h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 800;
  line-height: 1.35;
}

.end p {
  color: var(--color-ink-soft);
}

.end__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
