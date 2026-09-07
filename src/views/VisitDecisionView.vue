<script setup lang="ts">
import { Check, Home } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import InfoCard from '@/components/common/InfoCard.vue'
import { mockAnalyzeConfirmed } from '@/mocks'
import { routePaths } from '@/router/routePaths'

const router = useRouter()
const task = mockAnalyzeConfirmed.classification.task
const checks = ['통장에 쓰신 도장이 있는지', '본인이 직접 가시는지', '신분증 유효기간이 남았는지']
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="3" :total="6" :back-to="routePaths.taskConfirm" />
    </template>

    <section class="visit-decision">
      <div class="visit-decision__icon" aria-hidden="true">
        <Home :size="42" :stroke-width="1.8" />
      </div>

      <div class="visit-decision__copy">
        <h1>이 업무는<br />은행에 가셔야 해요</h1>
        <p>{{ mockAnalyzeConfirmed.visitDecision?.reason }}</p>
      </div>

      <InfoCard title="가시기 전에 확인하세요">
        <ul class="check-list">
          <li v-for="check in checks" :key="check">
            <Check :size="18" :stroke-width="2.4" />
            {{ check }}
          </li>
        </ul>
      </InfoCard>
    </section>

    <template #footer>
      <BaseButton block @click="router.push(routePaths.checklist)">준비물 보기</BaseButton>
    </template>
  </AppScreen>
</template>

<style scoped>
.visit-decision {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-7);
  text-align: center;
}

.visit-decision__icon {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  margin-inline: auto;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
}

.visit-decision__copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.visit-decision h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 800;
  line-height: 1.35;
}

.visit-decision__copy p {
  color: var(--color-ink-soft);
}

.check-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
  text-align: left;
}

.check-list li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-ink);
  font-weight: 700;
}

.check-list svg {
  flex-shrink: 0;
  color: var(--color-accent-deep);
}
</style>
