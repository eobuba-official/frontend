<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { routePaths } from '@/router/routePaths'

const route = useRoute()
const router = useRouter()

const methodLabel = computed(() => (route.query.method === 'text' ? '글자 입력' : '음성 입력'))
</script>

<template>
  <AppScreen>
    <template #header>
      <button class="back-button" type="button" @click="router.push(routePaths.home)">← 이전</button>
    </template>

    <section class="placeholder">
      <p class="placeholder__eyebrow">{{ methodLabel }}</p>
      <h1>은행 업무를 알려주세요</h1>
      <p>다음 단계에서 이 화면을 실제 입력 페이지로 구현할 예정입니다.</p>
    </section>

    <template #footer>
      <BaseButton block @click="router.push(routePaths.utteranceConfirm)">다음 화면 보기</BaseButton>
    </template>
  </AppScreen>
</template>

<style scoped>
.back-button {
  border: 0;
  background: transparent;
  color: var(--color-ink-soft);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.placeholder {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.placeholder__eyebrow {
  color: var(--color-accent-deep);
  font-weight: 800;
}

.placeholder h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
}

.placeholder p:last-child {
  color: var(--color-ink-soft);
}
</style>
