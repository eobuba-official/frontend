<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
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

const selectedCode = ref<string | null>(null)
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
      <FlowHeader :current="2" :total="6" :back-to="routePaths.utteranceConfirm" />
    </template>

    <section v-if="consultationFlow.candidates.length > 0" class="task-confirm">
      <h1>어떤 업무가 맞을까요?</h1>
      <p class="task-confirm__hint">가장 비슷한 것을 골라주세요.</p>

      <div class="task-confirm__list">
        <TaskOptionCard
          v-for="candidate in consultationFlow.candidates"
          :key="candidate.taskTypeCode"
          :title="candidate.name"
          :description="candidate.easyDescription"
          :selected="selectedCode === candidate.taskTypeCode"
          @click="selectedCode = candidate.taskTypeCode"
        />
      </div>

      <p v-if="errorMessage" class="task-confirm__error">{{ errorMessage }}</p>
    </section>

    <template #footer>
      <div class="task-confirm__footer">
        <BaseButton variant="ghost" block @click="router.push(routePaths.consultationEnd)">
          모르겠어요, 상담받을게요
        </BaseButton>
        <BaseButton block :disabled="!canSubmit" @click="handleConfirm">
          {{ isSubmitting ? '선택하는 중...' : '이 업무가 맞아요' }}
        </BaseButton>
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

.task-confirm__hint {
  color: var(--color-ink-soft);
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

.task-confirm__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
