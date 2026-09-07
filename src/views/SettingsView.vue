<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
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
      <button class="settings-item" type="button" @click="router.push(routePaths.history)">
        <span>
          <strong>상담 내역</strong>
          <small>이전 상담 내용을 확인해요</small>
        </span>
        <ChevronRight :size="20" :stroke-width="2.2" aria-hidden="true" />
      </button>
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

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  cursor: pointer;
  text-align: left;
}

.settings-item span {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.settings-item strong {
  font-size: var(--text-lg);
  font-weight: 800;
}

.settings-item small {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 600;
}

.settings-item :deep(svg) {
  color: var(--color-ink-muted);
}
</style>
