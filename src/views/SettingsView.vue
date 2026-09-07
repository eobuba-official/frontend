<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import InfoCard from '@/components/common/InfoCard.vue'
import { routePaths } from '@/router/routePaths'

const router = useRouter()
</script>

<template>
  <AppScreen>
    <template #header>
      <button class="back-button" type="button" @click="router.push(routePaths.home)">← 이전</button>
    </template>

    <section class="placeholder">
      <h1>설정</h1>
      <InfoCard title="아직 화면 준비 중이에요" description="홈 화면 이동 확인을 위한 임시 페이지입니다." />
    </section>
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
  gap: var(--space-4);
}

.placeholder h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
}
</style>
