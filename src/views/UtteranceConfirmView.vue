<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import InfoCard from '@/components/common/InfoCard.vue'
import { routePaths } from '@/router/routePaths'
import { consultationService } from '@/services/consultationService'
import { useConsultationFlowStore } from '@/stores/consultationFlow'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

if (!consultationFlow.utterance) {
  router.replace(routePaths.home)
}

const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleConfirm() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const result = await consultationService.analyze({
      utterance: consultationFlow.utterance,
      inputMethod: consultationFlow.inputMethod,
      sttConfidence: consultationFlow.sttConfidence,
    })
    consultationFlow.setAnalyzeResult(result)

    switch (result.status) {
      case 'FRAUD_WARNING':
        await router.push(routePaths.fraudWarning)
        break
      case 'TASK_CONFIRMED':
        await router.push(routePaths.visitDecision)
        break
      case 'CANDIDATES_SUGGESTED':
        await router.push(routePaths.taskConfirm)
        break
      default:
        // UNCLASSIFIED — 전용 안내 화면은 다음 이슈에서 구현 예정. 그때까지는
        // 상담 종료 화면으로 보내 최소한 흐름이 끊기지 않게 합니다.
        await router.push(routePaths.consultationEnd)
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '분석에 실패했어요. 다시 시도해 주세요.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="1" :total="6" :back-to="routePaths.home" />
    </template>

    <section v-if="consultationFlow.utterance" class="confirm">
      <h1>말씀을 확인해 주세요</h1>

      <InfoCard>
        <p class="confirm__label">이렇게 들었어요</p>
        <strong class="confirm__utterance">{{ consultationFlow.utterance }}</strong>
      </InfoCard>

      <p class="confirm__hint">잘못 들었으면 아래에서 고쳐 주세요.</p>

      <div class="confirm__actions">
        <BaseButton variant="ghost" @click="router.push(routePaths.home)">
          다시 말하기
        </BaseButton>
        <BaseButton variant="ghost" @click="router.push(routePaths.input)">
          글자로 고치기
        </BaseButton>
      </div>

      <p v-if="errorMessage" class="confirm__error">{{ errorMessage }}</p>
    </section>

    <template #footer>
      <BaseButton block :disabled="isSubmitting || !consultationFlow.utterance" @click="handleConfirm">
        {{ isSubmitting ? '확인하는 중...' : '네, 맞아요' }}
      </BaseButton>
    </template>
  </AppScreen>
</template>

<style scoped>
.confirm {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.confirm h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 800;
  line-height: 1.3;
}

.confirm__label {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.confirm__utterance {
  display: block;
  margin-top: var(--space-3);
  color: var(--color-ink);
  font-size: var(--text-xl);
  line-height: 1.55;
}

.confirm__error {
  color: var(--color-alert);
  font-size: var(--text-sm);
}

.confirm__hint {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.confirm__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}
</style>
