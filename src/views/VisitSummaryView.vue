<script setup lang="ts">
import { CalendarCheck, Clock, FileText, MapPin } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import InfoCard from '@/components/common/InfoCard.vue'
import { routePaths } from '@/router/routePaths'
import { useConsultationFlowStore } from '@/stores/consultationFlow'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

if (!consultationFlow.selectedBranch) {
  router.replace(routePaths.home)
}

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
      <h1>이렇게 가시면 돼요</h1>

      <InfoCard>
        <ul class="summary-list">
          <li>
            <Clock :size="19" :stroke-width="2.3" />
            <span>
              <strong>{{ consultationFlow.selectedBranch.visitTime.dayLabel }} {{ consultationFlow.selectedBranch.visitTime.timeLabel }}</strong>
              <small>대기 {{ consultationFlow.selectedBranch.expectedWaitMinutes }}분 예상</small>
            </span>
          </li>
          <li>
            <MapPin :size="19" :stroke-width="2.3" />
            <span>
              <strong>{{ consultationFlow.selectedBranch.branch.name }}</strong>
              <small>{{ consultationFlow.selectedBranch.branch.address }}</small>
            </span>
          </li>
          <li v-if="consultationFlow.checklist">
            <FileText :size="19" :stroke-width="2.3" />
            <span>
              <strong>{{ consultationFlow.checklist.taskTypeName }}</strong>
              <small>{{ consultationFlow.checklist.items.map((item) => item.name).join(', ') }}</small>
            </span>
          </li>
        </ul>
      </InfoCard>

      <div class="summary__done" aria-hidden="true">
        <CalendarCheck :size="42" :stroke-width="1.9" />
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
  gap: var(--space-6);
}

.summary h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 800;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.summary-list li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.summary-list svg {
  flex-shrink: 0;
  color: var(--color-accent-deep);
}

.summary-list span {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.summary-list strong {
  font-weight: 800;
}

.summary-list small {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.summary__done {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  margin-inline: auto;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
}
</style>
