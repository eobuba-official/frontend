<script setup lang="ts">
import { computed, ref } from 'vue'
import { Pencil, RotateCcw } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
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
const correctedUtterance = computed(() => consultationFlow.utterance)

async function handleConfirm() {
  if (!consultationFlow.utterance) return

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
      <FlowHeader :current="1" :total="6" :back-to="routePaths.home" label="음성 확인" hide-home />
    </template>

    <section v-if="consultationFlow.utterance" class="confirm">
      <div class="confirm__heading">
        <h1>음성 결과 확인</h1>
        <p>아래 내용이 맞는지 확인해 주세요.</p>
      </div>

      <article class="recognized-card">
        <p>이렇게 들었어요</p>
        <strong>{{ correctedUtterance }}</strong>
      </article>

      <div class="confirm__actions" aria-label="음성 결과 수정">
        <BaseButton variant="ghost" @click="router.push(routePaths.home)">
          <template #icon>
            <RotateCcw :size="20" :stroke-width="2.2" />
          </template>
          다시 말하기
        </BaseButton>
        <BaseButton variant="ghost" @click="router.push(routePaths.input)">
          <template #icon>
            <Pencil :size="20" :stroke-width="2.2" />
          </template>
          직접 수정하기
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
  gap: var(--space-4);
}

.confirm__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.confirm h1 {
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 900;
  line-height: 1.3;
}

.confirm__heading p {
  color: var(--color-ink-soft);
  font-size: var(--text-lg);
  font-weight: 600;
}

.recognized-card {
  padding: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 15% 10%, rgba(255, 243, 191, 0.88), transparent 42%),
    var(--color-yellow-faint);
  box-shadow: var(--shadow-card);
}

.recognized-card p {
  margin-bottom: var(--space-3);
  color: var(--color-ink-soft);
  font-size: var(--text-lg);
  font-weight: 700;
}

.recognized-card strong {
  color: var(--color-ink);
  font-size: var(--text-2xl);
  font-weight: 900;
  line-height: 1.35;
}

.confirm__error {
  color: var(--color-alert);
  font-size: var(--text-sm);
}

.confirm__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
</style>
