<script setup lang="ts">
import { computed, ref } from 'vue'
import { CircleCheck } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BottomActionBar from '@/components/common/BottomActionBar.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import TaskOptionCard from '@/components/common/TaskOptionCard.vue'
import { routePaths } from '@/router/routePaths'
import { consultationService } from '@/services/consultationService'
import { useConsultationFlowStore } from '@/stores/consultationFlow'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

if (!consultationFlow.consultationId || consultationFlow.candidates.length === 0) {
  router.replace(routePaths.home)
}

const primaryCandidate = computed(() => consultationFlow.candidates[0] ?? null)
const alternateCandidates = computed(() => consultationFlow.candidates.slice(1))
const confidencePercent = computed(() =>
  consultationFlow.confidence == null ? null : Math.round(consultationFlow.confidence * 100),
)

const selectedCode = ref<string | null>(primaryCandidate.value?.taskTypeCode ?? null)
const isSubmitting = ref(false)
const errorMessage = ref('')

const taskDescriptionOverrides: Record<string, string> = {
  CARD_REISSUE: '잃어버리거나 손상된 카드를 다시 발급받는 업무',
  PASSBOOK_REISSUE: '잃어버리거나 손상된 통장을 다시 발급받는 업무',
  PROXY_TASK: '가족의 은행 업무를 대신 처리하는 업무',
  DEPOSIT_EARLY_CLOSE: '예금 만기 전에 해지하고 돈을 찾는 업무',
  PASSWORD_CHANGE: '은행 거래 비밀번호를 변경하거나 재설정하는 업무',
  AUTO_TRANSFER_CHANGE: '자동이체 금액이나 날짜, 계좌를 변경하는 업무',
  BALANCE_INQUIRY: '계좌 잔액이나 입출금 내역을 확인하는 업무',
  ACCOUNT_TRANSFER: '내 계좌에서 다른 계좌로 돈을 보내는 업무',
}

function taskDescription(taskTypeCode: string, easyDescription: string) {
  return taskDescriptionOverrides[taskTypeCode] ?? easyDescription
}

const canSubmit = computed(() => Boolean(selectedCode.value) && !isSubmitting.value)

async function handleConfirm() {
  if (!selectedCode.value || !consultationFlow.consultationId) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const result = await consultationService.selectTask(consultationFlow.consultationId, {
      taskTypeCode: selectedCode.value,
    })
    consultationFlow.setTaskSelection(result)
    await router.push(routePaths.visitDecision)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '선택을 처리하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="2" :total="6" label="업무 확인" />
    </template>

    <section v-if="primaryCandidate" class="task-confirm">
      <h1>찾으시는 업무가 맞나요?</h1>

      <button
        class="task-confirm__primary"
        :class="{ 'task-confirm__primary--selected': selectedCode === primaryCandidate.taskTypeCode }"
        type="button"
        @click="
          selectedCode = selectedCode === primaryCandidate.taskTypeCode ? null : primaryCandidate.taskTypeCode
        "
      >
        <span class="task-confirm__primary-text">
          <strong>{{ primaryCandidate.name }}</strong>
          <span>{{ taskDescription(primaryCandidate.taskTypeCode, primaryCandidate.easyDescription) }}</span>
        </span>
        <span v-if="confidencePercent !== null" class="task-confirm__confidence-badge">
          일치도 {{ confidencePercent }}%
        </span>
      </button>

      <p class="task-confirm__hint">
        <CircleCheck :size="16" :stroke-width="2.2" aria-hidden="true" />
        <span>맞으면 그대로 진행해 주세요.</span>
      </p>

      <template v-if="alternateCandidates.length > 0">
        <p class="task-confirm__alt-label">다른 업무를 찾으시나요?</p>
        <div class="task-confirm__list">
          <TaskOptionCard
            v-for="candidate in alternateCandidates"
            :key="candidate.taskTypeCode"
            :title="candidate.name"
            :description="taskDescription(candidate.taskTypeCode, candidate.easyDescription)"
            :selected="selectedCode === candidate.taskTypeCode"
            @click="selectedCode = selectedCode === candidate.taskTypeCode ? null : candidate.taskTypeCode"
          />
        </div>
      </template>

      <p v-if="errorMessage" class="task-confirm__error">{{ errorMessage }}</p>
    </section>

    <template #footer>
      <BottomActionBar stacked>
        <BaseButton variant="ghost" block @click="router.push(routePaths.consultationEnd)">
          찾는 업무가 없어요
        </BaseButton>
        <BaseButton block :disabled="!canSubmit" @click="handleConfirm">
          {{ isSubmitting ? '확인하는 중...' : '이 업무로 진행하기' }}
        </BaseButton>
      </BottomActionBar>
    </template>
  </AppScreen>
</template>

<style scoped>
.task-confirm {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.task-confirm__primary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  padding: var(--card-padding);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  text-align: left;
  cursor: pointer;
}

.task-confirm__primary--selected {
  border-color: var(--color-accent);
}

.task-confirm__primary-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.task-confirm__primary-text strong {
  font-size: var(--text-lg);
  font-weight: 800;
}

.task-confirm__primary-text span {
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  word-break: keep-all;
  overflow-wrap: normal;
}

.task-confirm__confidence-badge {
  flex: none;
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--color-success-bg);
  color: var(--color-success);
  font-size: var(--text-2xs);
  font-weight: 700;
  white-space: nowrap;
}

.task-confirm__hint {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-inline: var(--space-1);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 600;
}

.task-confirm__hint svg {
  flex-shrink: 0;
  color: var(--color-accent-deep);
}

.task-confirm__alt-label {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.task-confirm__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.task-confirm__error {
  color: var(--color-alert);
  font-size: var(--text-sm);
}
</style>
