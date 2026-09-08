<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Pencil, RotateCcw, Sparkles } from '@lucide/vue'
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

const isAnalyzing = ref(false)
const errorMessage = ref('')
const originalUtterance = computed(
  () => consultationFlow.originalUtterance || consultationFlow.utterance,
)
const correctedUtterance = computed(
  () => consultationFlow.correctedUtterance || consultationFlow.utterance,
)
const showGeminiCorrection = computed(
  () => consultationFlow.correctionApplied && correctedUtterance.value.length > 0,
)
const hasAnalysis = computed(() => consultationFlow.status !== null)

async function analyzeCurrentUtterance() {
  if (!consultationFlow.utterance || isAnalyzing.value) return

  isAnalyzing.value = true
  errorMessage.value = ''

  try {
    const result = await consultationService.analyze({
      utterance: consultationFlow.utterance,
      inputMethod: consultationFlow.inputMethod,
      sttConfidence: consultationFlow.sttConfidence,
    })
    consultationFlow.setAnalyzeResult(result)

    if (result.status === 'FRAUD_WARNING') {
      await router.replace(routePaths.fraudWarning)
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '분석에 실패했어요. 다시 시도해 주세요.'
  } finally {
    isAnalyzing.value = false
  }
}

function handleConfirm() {
  switch (consultationFlow.status) {
    case 'TASK_CONFIRMED':
      void router.push(routePaths.visitDecision)
      break
    case 'CANDIDATES_SUGGESTED':
      void router.push(routePaths.taskConfirm)
      break
    case 'UNCLASSIFIED':
      void router.push(routePaths.consultationEnd)
      break
    case 'FRAUD_WARNING':
      void router.push(routePaths.fraudWarning)
      break
  }
}

onMounted(() => {
  if (!hasAnalysis.value) {
    void analyzeCurrentUtterance()
  }
})
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

      <Transition name="correction-reveal" appear>
        <div v-if="showGeminiCorrection" class="gemini-result">
          <article class="gemini-card">
            <p class="gemini-card__label">
              <span class="gemini-card__icon" aria-hidden="true">
                <Sparkles :size="18" :stroke-width="2.4" />
              </span>
              Gemini가 이렇게 다듬었어요
            </p>
            <strong>{{ correctedUtterance }}</strong>
          </article>
        </div>
      </Transition>

      <article class="recognized-card" :class="{ 'recognized-card--source': showGeminiCorrection }">
        <p>이렇게 들었어요</p>
        <strong>{{ originalUtterance }}</strong>
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

      <div v-if="errorMessage" class="confirm__error" role="alert">
        <p>{{ errorMessage }}</p>
        <button type="button" :disabled="isAnalyzing" @click="analyzeCurrentUtterance">
          다시 분석하기
        </button>
      </div>
    </section>

    <template #footer>
      <BaseButton
        data-test="confirm-analysis"
        block
        :disabled="isAnalyzing || !hasAnalysis"
        @click="handleConfirm"
      >
        {{ isAnalyzing ? 'AI가 확인하고 있어요...' : '네, 맞아요' }}
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

.confirm__heading p {
  color: var(--color-ink-soft);
  font-size: var(--text-lg);
  font-weight: 600;
}

@property --gemini-border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: true;
}

.gemini-result {
  --gemini-glow-stops: #ff9a7b 0%, #ffd84d 30%, #67c7ff 62%, #ff9a7b 100%;

  position: relative;
  isolation: isolate;
  padding: 2px;
  border-radius: 20px;
  background: conic-gradient(from var(--gemini-border-angle, 0deg), var(--gemini-glow-stops));
  box-shadow: 0 10px 30px -20px rgba(63, 129, 246, 0.68);
  animation: gemini-border-spin 4.8s linear infinite;
}

.gemini-result::before {
  position: absolute;
  z-index: -1;
  inset: -8px;
  border-radius: 26px;
  background: conic-gradient(from var(--gemini-border-angle, 0deg), var(--gemini-glow-stops));
  content: '';
  filter: blur(16px) saturate(145%);
  opacity: 0.48;
  pointer-events: none;
}

.gemini-card {
  position: relative;
  padding: var(--space-5);
  border-radius: 18px;
  background:
    radial-gradient(circle at 12% 8%, rgba(255, 248, 218, 0.92), transparent 44%),
    rgba(255, 255, 255, 0.98);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.96);
}

.gemini-card__label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  color: #5a5368;
  font-size: var(--text-base);
  font-weight: 800;
}

.gemini-card__icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, #fff0a8, #d9f2ff);
  color: #4969a8;
}

.gemini-card strong {
  color: var(--color-ink);
  font-size: var(--text-2xl);
  font-weight: 900;
  line-height: 1.35;
  overflow-wrap: anywhere;
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
  overflow-wrap: anywhere;
}

.recognized-card--source {
  border-color: var(--color-line);
  background: var(--color-surface-alt);
  box-shadow: none;
}

.recognized-card--source strong {
  color: var(--color-ink-soft);
}

.correction-reveal-enter-active {
  transition:
    opacity 360ms ease,
    transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.correction-reveal-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.confirm__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-alert-bg);
  color: var(--color-alert);
  font-size: var(--text-sm);
}

.confirm__error button {
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: var(--color-alert-deep);
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.confirm__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

@keyframes gemini-border-spin {
  to {
    --gemini-border-angle: 360deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gemini-result {
    animation: none;
  }

  .correction-reveal-enter-active {
    transition: none;
  }
}
</style>
