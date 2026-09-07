<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import WarningBox from '@/components/common/WarningBox.vue'
import { routePaths } from '@/router/routePaths'

const router = useRouter()
</script>

<template>
  <AppScreen>
    <template #header>
      <button class="back-button" type="button" @click="router.push(routePaths.home)">← 이전</button>
    </template>

    <section class="placeholder">
      <h1>보이스피싱 예방</h1>
      <WarningBox
        title="수상한 전화는 바로 확인하세요"
        description="은행은 안전계좌로 돈을 옮기라고 요구하지 않습니다."
      />
    </section>

    <template #footer>
      <BaseButton block @click="router.push(routePaths.home)">홈으로 돌아가기</BaseButton>
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
  gap: var(--space-4);
}

.placeholder h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
}
</style>
