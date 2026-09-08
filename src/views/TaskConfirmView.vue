<script setup lang="ts">
import { computed, ref } from 'vue'
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
      <FlowHeader :current="2" :total="6" />
    </template>

    <section v-if="primaryCandidate" class="task-confirm">
      <h1>말씀하신 업무는<br />이것으로 보여요</h1>

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
          <span>{{ primaryCandidate.easyDescription }}</span>
        </span>
        <span v-if="confidencePercent !== null" class="task-confirm__confidence-badge">
          확신도 {{ confidencePercent }}%
        </span>
      </button>

      <p class="task-confirm__hint">맞으면 아래 버튼을 눌러주세요.</p>

      <template v-if="alternateCandidates.length > 0">
        <p class="task-confirm__alt-label">다른 업무일 수도 있어요</p>
        <div class="task-confirm__list">
          <TaskOptionCard
            v-for="candidate in alternateCandidates"
            :key="candidate.taskTypeCode"
            :title="candidate.name"
            :description="candidate.easyDescription"
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
          모르겠어요, 상담받을게요
        </BaseButton>
        <BaseButton block :disabled="!canSubmit" @click="handleConfirm">
          {{ isSubmitting ? '선택하는 중...' : '이 업무가 맞아요' }}
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
  font-size: var(--text-sm);
}

.task-confirm__confidence-badge {
  flex: none;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--color-success-bg);
  color: var(--color-success);
  font-size: var(--text-sm);
  font-weight: 700;
  white-space: nowrap;
}

.task-confirm__hint {
  color: var(--color-ink-soft);
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
