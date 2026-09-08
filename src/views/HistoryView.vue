<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import InfoCard from '@/components/common/InfoCard.vue'
import { consultationService } from '@/services/consultationService'
import type { ConsultationHistoryItem, ConsultationStatus } from '@/api/types'

const router = useRouter()
const items = ref<ConsultationHistoryItem[]>([])
const taskTypeNames = ref<Record<string, string>>({})
const isLoading = ref(true)
const errorMessage = ref('')

const statusLabel: Record<ConsultationStatus, string> = {
  FRAUD_WARNING: '사기 의심',
  TASK_CONFIRMED: '업무 확정',
  CANDIDATES_SUGGESTED: '후보 제안',
  UNCLASSIFIED: '미분류',
  WARNING_DISMISSED: '경고 확인 후 진행',
}

function taskLabel(taskTypeCode: string | null) {
  if (!taskTypeCode) return null
  return taskTypeNames.value[taskTypeCode] ?? taskTypeCode
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

onMounted(async () => {
  try {
    const [historyResult, taskTypes] = await Promise.all([
      consultationService.getConsultationHistory(),
      consultationService.getTaskTypes(),
    ])

    items.value = historyResult.consultations
    taskTypeNames.value = Object.fromEntries(taskTypes.map((taskType) => [taskType.taskTypeCode, taskType.name]))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '상담 내역을 불러오지 못했어요.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <AppScreen>
    <template #header>
      <button class="back-button" type="button" @click="router.back()">← 이전</button>
    </template>

    <section class="history">
      <h1>상담 내역</h1>

      <p v-if="isLoading" class="history__status">불러오는 중...</p>
      <p v-else-if="errorMessage" class="history__status history__status--error">{{ errorMessage }}</p>
      <InfoCard
        v-else-if="items.length === 0"
        title="아직 상담 내역이 없어요"
        description="말씀하시면 여기에 기록이 남아요."
      />

      <ul v-else class="history__list">
        <li v-for="item in items" :key="item.consultationId" class="history-card">
          <div class="history-card__top">
            <span class="history-card__status">{{ statusLabel[item.status] }}</span>
            <time class="history-card__date">{{ formatDate(item.createdAt) }}</time>
          </div>
          <strong class="history-card__utterance">{{ item.correctedUtterance }}</strong>
          <p v-if="taskLabel(item.taskTypeCode)" class="history-card__task">{{ taskLabel(item.taskTypeCode) }}</p>
        </li>
      </ul>
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

.history {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.history__status {
  color: var(--color-ink-soft);
  font-size: var(--text-base);
}

.history__status--error {
  color: var(--color-alert);
}

.history__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.history-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.history-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.history-card__status {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
  font-size: var(--text-sm);
  font-weight: 700;
}

.history-card__date {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.history-card__utterance {
  font-size: var(--text-base);
  font-weight: 700;
}

.history-card__task {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}
</style>
