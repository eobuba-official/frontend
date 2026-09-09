<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BottomActionBar from '@/components/common/BottomActionBar.vue'
import whatMascot from '@/assets/img/what.png'
import { routePaths } from '@/router/routePaths'

const router = useRouter()
</script>

<template>
  <AppScreen>
    <section class="end">
      <div class="end__icon" aria-hidden="true">
        <img :src="whatMascot" alt="" />
      </div>
      <h1>가까운 지점에서<br />상담받으시는 게 좋겠어요</h1>
      <p>말씀해주신 내용으로는 어떤 업무인지 확인이 어려워요.</p>
    </section>

    <template #footer>
      <BottomActionBar stacked>
        <BaseButton variant="ghost" block @click="router.push(routePaths.home)">홈으로</BaseButton>
        <BaseButton block @click="router.push(routePaths.branchExplore)">가까운 지점 찾기</BaseButton>
      </BottomActionBar>
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
  width: 140px;
  height: 140px;
}

.end__icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.end p {
  color: var(--color-ink-soft);
}
</style>
