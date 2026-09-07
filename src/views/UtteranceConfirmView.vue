<script setup lang="ts">
import { CreditCard, Landmark, Mic, Pencil, PiggyBank, RotateCcw } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import { mockAnalyzeConfirmed, mockTaskTypes } from '@/mocks'
import { routePaths } from '@/router/routePaths'

const router = useRouter()
const correctedUtterance = mockAnalyzeConfirmed.classification.correctedUtterance
const candidates = mockTaskTypes
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="2" :total="6" :back-to="routePaths.home" label="음성 확인" hide-home />
    </template>

    <section class="confirm">
      <div class="confirm__heading">
        <h1>음성 결과 확인</h1>
        <p>아래 내용이 맞는지 확인해 주세요.</p>
      </div>

      <article class="recognized-card">
        <span class="recognized-card__icon" aria-hidden="true">
          <Mic :size="32" :stroke-width="2.2" />
        </span>
        <div>
          <p>인식된 내용</p>
          <strong>{{ correctedUtterance }}</strong>
        </div>
      </article>

      <div class="confirm__actions" aria-label="음성 결과 수정">
        <BaseButton variant="ghost" @click="router.push(routePaths.home)">
          <template #icon>
            <RotateCcw :size="20" :stroke-width="2.2" />
          </template>
          다시 말하기
        </BaseButton>
        <BaseButton variant="ghost" @click="router.push({ path: routePaths.input, query: { method: 'text' } })">
          <template #icon>
            <Pencil :size="20" :stroke-width="2.2" />
          </template>
          직접 수정하기
        </BaseButton>
      </div>

      <div class="candidate-section">
        <h2>이런 업무로 보여요</h2>
        <p>가장 비슷한 업무를 선택해 주세요.</p>

        <button
          v-for="(task, index) in candidates"
          :key="task.taskTypeCode"
          class="candidate-card"
          type="button"
          @click="router.push(routePaths.taskConfirm)"
        >
          <span class="candidate-card__icon" aria-hidden="true">
            <CreditCard v-if="index === 0" :size="28" :stroke-width="2.2" />
            <PiggyBank v-else-if="index === 1" :size="28" :stroke-width="2.2" />
            <Landmark v-else :size="28" :stroke-width="2.2" />
          </span>
          <span>
            <strong>{{ task.name }}</strong>
            <small>{{ task.easyDescription }}</small>
          </span>
        </button>
      </div>
    </section>

    <template #footer>
      <BaseButton block @click="router.push(routePaths.taskConfirm)">네, 맞아요</BaseButton>
    </template>
  </AppScreen>
</template>

<style scoped>
.confirm {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.confirm__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.confirm h1,
.candidate-section h2 {
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 900;
  line-height: 1.3;
}

.confirm__heading p,
.candidate-section p {
  color: var(--color-ink-soft);
  font-size: var(--text-lg);
  font-weight: 600;
}

.recognized-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 15% 10%, rgba(255, 243, 191, 0.88), transparent 42%),
    var(--color-yellow-faint);
  box-shadow: var(--shadow-card);
}

.recognized-card__icon,
.candidate-card__icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-pill);
  background: rgba(255, 243, 191, 0.8);
  color: var(--color-accent-deep);
}

.recognized-card p {
  margin-bottom: var(--space-3);
  color: var(--color-ink-soft);
  font-size: var(--text-lg);
  font-weight: 700;
}

.recognized-card strong {
  color: var(--color-ink);
  font-size: 1.7rem;
  font-weight: 900;
  line-height: 1.35;
}

.confirm__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.candidate-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.candidate-section h2 {
  font-size: var(--text-xl);
}

.candidate-card {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--space-4);
  min-height: 86px;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-ink);
  cursor: pointer;
  text-align: left;
}

.candidate-card strong {
  display: block;
  font-size: var(--text-lg);
  font-weight: 900;
}

.candidate-card small {
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
}
</style>
