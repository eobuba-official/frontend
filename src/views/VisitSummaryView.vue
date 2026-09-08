<script setup lang="ts">
import { computed } from 'vue'
import { Clock, FileText, MapPin } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import { routePaths } from '@/router/routePaths'
import { useConsultationFlowStore } from '@/stores/consultationFlow'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

if (!consultationFlow.selectedBranch) {
  router.replace(routePaths.home)
}

const neededItems = computed(
  () => consultationFlow.checklist?.items.filter((item) => item.status === 'INCLUDED') ?? [],
)

const consultationNote = computed(() => {
  const utterance = consultationFlow.utterance.trim()
  if (!utterance) return null
  if (utterance === consultationFlow.checklist?.taskTypeName.trim()) return null
  return utterance
})

function handleFinish() {
  consultationFlow.reset()
  void router.push(routePaths.home)
}
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="6" :total="6" />
    </template>

    <section v-if="consultationFlow.selectedBranch" class="summary">
      <div class="summary__done" aria-hidden="true">
        <svg class="success-check" viewBox="0 0 52 52" fill="none">
          <circle class="success-check__ring" cx="26" cy="26" r="23" />
          <path class="success-check__mark" d="M14 27l7.5 7.5L38 17" />
        </svg>
      </div>

      <h1>이렇게 가시면 돼요</h1>

      <ul class="summary-list" role="list">
        <li class="summary-item">
          <span class="summary-item__icon" aria-hidden="true">
            <Clock :size="20" :stroke-width="2.3" />
          </span>
          <span class="summary-item__body">
            <strong>{{ consultationFlow.selectedBranch.visitTime.dayLabel }} {{ consultationFlow.selectedBranch.visitTime.timeLabel }}</strong>
            <small>대기 {{ consultationFlow.selectedBranch.expectedWaitMinutes }}분 예상</small>
          </span>
        </li>
        <li class="summary-item">
          <span class="summary-item__icon" aria-hidden="true">
            <MapPin :size="20" :stroke-width="2.3" />
          </span>
          <span class="summary-item__body">
            <strong>{{ consultationFlow.selectedBranch.branch.name }}</strong>
            <small>{{ consultationFlow.selectedBranch.branch.address }}</small>
          </span>
        </li>
        <li v-if="consultationFlow.checklist && neededItems.length > 0" class="summary-item">
          <span class="summary-item__icon" aria-hidden="true">
            <FileText :size="20" :stroke-width="2.3" />
          </span>
          <span class="summary-item__body">
            <strong>{{ consultationFlow.checklist.taskTypeName }}</strong>
            <small>{{ neededItems.map((item) => item.name).join(', ') }}</small>
          </span>
        </li>
      </ul>

      <div v-if="consultationNote" class="summary-note">
        <p class="summary-note__label">상담 요약</p>
        <p class="summary-note__text">{{ consultationNote }}</p>
      </div>
    </section>

    <template #footer>
      <BaseButton block @click="handleFinish">끝내고 보기</BaseButton>
    </template>
  </AppScreen>
</template>

<style scoped>
.summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  text-align: center;
}

.summary__done {
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
  animation: badge-pop 480ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.success-check {
  width: 52px;
  height: 52px;
  overflow: visible;
}

.success-check__ring {
  stroke: var(--color-accent-deep);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 145;
  stroke-dashoffset: 145;
  animation: success-draw 480ms cubic-bezier(0.65, 0, 0.35, 1) 80ms both;
}

.success-check__mark {
  stroke: var(--color-accent-deep);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 36;
  stroke-dashoffset: 36;
  animation: success-draw 320ms cubic-bezier(0.65, 0, 0.35, 1) 460ms both;
}

.summary h1 {
  animation: summary-rise 520ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  text-align: left;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  animation: summary-rise 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.summary-item:nth-child(1) {
  animation-delay: 120ms;
}

.summary-item:nth-child(2) {
  animation-delay: 180ms;
}

.summary-item:nth-child(3) {
  animation-delay: 240ms;
}

.summary-item__icon {
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
}

.summary-item__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.summary-item strong {
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: 800;
  line-height: 1.35;
}

.summary-item small {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.summary-note {
  width: 100%;
  margin-top: var(--space-1);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-line);
  text-align: left;
  animation: summary-rise 560ms cubic-bezier(0.16, 1, 0.3, 1) 300ms both;
}

.summary-note__label {
  margin: 0 0 var(--space-1);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.summary-note__text {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 400;
  line-height: 1.6;
}

@keyframes summary-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes badge-pop {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  70% {
    opacity: 1;
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes success-draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
