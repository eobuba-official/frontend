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
import type { ConsultationStatus } from '@/api/types'

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

function goToStatusScreen(status: ConsultationStatus | null) {
  switch (status) {
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
    default:
      // never leave the button looking tappable but doing nothing
      errorMessage.value = '다음 화면으로 넘어가지 못했어요. 다시 시도해 주세요.'
  }
}

async function handleConfirm() {
  if (isAnalyzing.value) return

  // Gemini rewrote the sentence, so approving it re-runs the analysis on the confirmed
  // text — the response's status is what decides where to go next
  if (consultationFlow.status === 'CORRECTION_CONFIRMATION_REQUIRED') {
    if (!consultationFlow.consultationId) return

    isAnalyzing.value = true
    errorMessage.value = ''

    try {
      const result = await consultationService.confirmCorrection(consultationFlow.consultationId, {
        confirmedUtterance: correctedUtterance.value,
      })
      consultationFlow.setAnalyzeResult(result)
      goToStatusScreen(result.status)
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '확인에 실패했어요. 다시 시도해 주세요.'
    } finally {
      isAnalyzing.value = false
    }
    return
  }

  goToStatusScreen(consultationFlow.status)
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
  --gemini-spectrum:
    #718be8 0%, #9d83d4 20%, #d982c5 38%, #e991a1 53%, #e8c46f 68%, #78bdc8 84%, #718be8 100%;

  position: relative;
  isolation: isolate;
  padding: 2px;
  border-radius: 21px;
  background: conic-gradient(from var(--gemini-border-angle), var(--gemini-spectrum));
  box-shadow:
    0 0 0 1px rgba(118, 88, 255, 0.06),
    0 0 8px rgba(128, 76, 255, 0.2),
    0 0 18px rgba(60, 105, 255, 0.1);
  animation: gemini-border-spin 6s linear infinite;
}

.gemini-result::before {
  position: absolute;
  z-index: -1;
  inset: -5px;
  border-radius: 26px;
  background: conic-gradient(from var(--gemini-border-angle), var(--gemini-spectrum));
  content: '';
  filter: blur(14px) saturate(118%);
  opacity: 0.26;
  pointer-events: none;
}

.gemini-result::after {
  position: absolute;
  z-index: -2;
  inset: -12px -8px;
  border-radius: 30px;
  background: radial-gradient(
    ellipse at 50% 58%,
    rgba(111, 68, 255, 0.18),
    rgba(57, 101, 255, 0.07) 48%,
    transparent 76%
  );
  content: '';
  filter: blur(16px);
  opacity: 0.4;
  pointer-events: none;
  animation: gemini-halo-breathe 3.6s ease-in-out infinite;
}

.gemini-card {
  position: relative;
  overflow: hidden;
  padding: var(--space-5);
  border-radius: 19px;
  background:
    radial-gradient(circle at 12% 8%, rgba(235, 243, 255, 0.58), transparent 42%),
    rgba(255, 255, 255, 0.98);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.98),
    0 2px 5px rgba(38, 30, 82, 0.1);
}

.gemini-card::before {
  position: absolute;
  inset: -55% -35%;
  background:
    radial-gradient(ellipse at 28% 50%, rgba(66, 133, 244, 0.12), transparent 31%),
    radial-gradient(ellipse at 58% 50%, rgba(155, 114, 203, 0.1), transparent 29%),
    radial-gradient(ellipse at 78% 50%, rgba(244, 180, 62, 0.11), transparent 30%);
  content: '';
  pointer-events: none;
  transform: translateX(-18%);
  animation: gemini-energy-drift 7s cubic-bezier(0.45, 0, 0.25, 1) infinite;
}

.gemini-card__label {
  position: relative;
  z-index: 1;
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
  animation: gemini-sparkle-breathe 2.8s ease-in-out infinite;
}

.gemini-card strong {
  position: relative;
  z-index: 1;
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

@keyframes gemini-energy-drift {
  0%,
  100% {
    opacity: 0.68;
    transform: translateX(-18%) scale(0.96);
  }
  50% {
    opacity: 1;
    transform: translateX(18%) scale(1.04);
  }
}

@keyframes gemini-halo-breathe {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.99);
  }
  50% {
    opacity: 0.44;
    transform: scale(1.01);
  }
}

@keyframes gemini-sparkle-breathe {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(103, 199, 255, 0);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(103, 199, 255, 0.1);
    transform: scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .gemini-result {
    animation: none;
  }

  .gemini-result::before,
  .gemini-result::after,
  .gemini-card::before,
  .gemini-card__icon {
    animation: none;
  }

  .correction-reveal-enter-active {
    transition: none;
  }
}
</style>
