<script setup lang="ts">
import { computed } from 'vue'
import { CreditCard, PiggyBank } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import InfoCard from '@/components/common/InfoCard.vue'
import { mockAnalyzeConfirmed, mockTaskTypes } from '@/mocks'
import { routePaths } from '@/router/routePaths'
import { useConsultationStore } from '@/stores/consultation'

const router = useRouter()
const consultationStore = useConsultationStore()
const mainTask = computed(() =>
  consultationStore.analyzeResult ? consultationStore.currentTask : mockAnalyzeConfirmed.classification.task,
)
const candidates = computed(() => {
  if (consultationStore.candidateTasks.length > 0) {
    return consultationStore.candidateTasks
  }

  return mockTaskTypes.filter((task) => task.taskTypeCode !== mainTask.value?.taskTypeCode)
})
const confidenceLabel = computed(() => {
  const confidence = consultationStore.analyzeResult?.classification.confidence

  if (typeof confidence !== 'number') {
    return null
  }

  return `확신도 ${Math.round(confidence * 100)}%`
})

async function selectTask(task = mainTask.value ?? candidates.value[0]) {
  if (!task) {
    return
  }

  if (consultationStore.candidateTasks.length > 0) {
    await consultationStore.selectCandidate(task)
  }

  await router.push(routePaths.visitDecision)
}
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="2" :total="6" :back-to="routePaths.utteranceConfirm" />
    </template>

    <section class="task-confirm">
      <h1>말씀하신 업무는<br />이것으로 보여요</h1>

      <InfoCard v-if="mainTask" tone="accent">
        <div class="task-confirm__main">
          <div>
            <strong>{{ mainTask.name }}</strong>
            <p>{{ mainTask.easyDescription }}</p>
          </div>
          <span v-if="confidenceLabel">{{ confidenceLabel }}</span>
        </div>
      </InfoCard>

      <div class="task-confirm__hint">
        <p>맞으면 아래 버튼을 눌러주세요.</p>
        <p>다른 업무일 수도 있어요.</p>
      </div>

      <button
        v-for="(task, index) in candidates"
        :key="task.taskTypeCode"
        class="task-card"
        type="button"
        @click="selectTask(task)"
      >
        <span class="task-card__icon" aria-hidden="true">
          <PiggyBank v-if="index === 0" :size="22" :stroke-width="2.2" />
          <CreditCard v-else :size="22" :stroke-width="2.2" />
        </span>
        <span>
          <strong>{{ task.name }}</strong>
          <small>{{ task.easyDescription }}</small>
        </span>
      </button>
    </section>

    <template #footer>
      <div class="task-confirm__footer">
        <BaseButton variant="ghost" block @click="router.push(routePaths.consultationEnd)">
          모르겠어요, 상담받을게요
        </BaseButton>
        <BaseButton block @click="selectTask()">네, 맞아요</BaseButton>
      </div>
    </template>
  </AppScreen>
</template>

<style scoped>
.task-confirm {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.task-confirm h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 800;
  line-height: 1.3;
}

.task-confirm__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.task-confirm__main strong,
.task-card strong {
  display: block;
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: 800;
}

.task-confirm__main p,
.task-card small,
.task-confirm__hint {
  color: var(--color-ink-soft);
}

.task-confirm__main span {
  flex-shrink: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--color-yellow-faint);
  color: var(--color-accent-deep);
  font-size: var(--text-xs);
  font-weight: 800;
}

.task-confirm__hint {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--text-sm);
}

.task-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 78px;
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
}

.task-card__icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
}

.task-confirm__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
