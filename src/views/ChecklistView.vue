<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Check } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import { routePaths } from '@/router/routePaths'
import { consultationService } from '@/services/consultationService'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import type { ChecklistConditionCode, ChecklistQuestion } from '@/api/types'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

if (!consultationFlow.consultationId || !consultationFlow.task) {
  router.replace(routePaths.home)
}

const phase = ref<'questions' | 'items'>('items')
const questions = ref<ChecklistQuestion[]>([])
const answers = ref<Partial<Record<ChecklistConditionCode, boolean>>>({})
const checkedItemCodes = ref<Set<string>>(new Set())
const isLoading = ref(true)
const isSubmittingAnswers = ref(false)
const errorMessage = ref('')

const checklistItems = computed(
  () => consultationFlow.checklist?.items.filter((item) => item.status !== 'EXCLUDED') ?? [],
)
const requiredComplete = computed(() =>
  checklistItems.value.filter((item) => item.required).every((item) => checkedItemCodes.value.has(item.itemCode)),
)
const allQuestionsAnswered = computed(() =>
  questions.value.every((question) => answers.value[question.conditionCode] !== undefined),
)

onMounted(async () => {
  if (!consultationFlow.consultationId || !consultationFlow.task) return

  try {
    const questionsResult = await consultationService.getChecklistQuestions(consultationFlow.consultationId)
    questions.value = questionsResult.questions

    for (const question of questions.value) {
      if (question.answered && question.answer !== null) {
        answers.value[question.conditionCode] = question.answer
      }
    }

    if (questions.value.length === 0 || allQuestionsAnswered.value) {
      await loadResolvedChecklist()
      phase.value = 'items'
    } else {
      phase.value = 'questions'
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '준비물을 불러오지 못했어요.'
  } finally {
    isLoading.value = false
  }
})

async function loadResolvedChecklist() {
  if (!consultationFlow.consultationId) return
  const result = await consultationService.getResolvedChecklist(consultationFlow.consultationId)
  consultationFlow.setChecklist(result)
}

function answerQuestion(conditionCode: ChecklistConditionCode, value: boolean) {
  answers.value = { ...answers.value, [conditionCode]: value }
}

async function submitAnswers() {
  if (!consultationFlow.consultationId || !allQuestionsAnswered.value) return

  isSubmittingAnswers.value = true
  errorMessage.value = ''

  try {
    await consultationService.saveChecklistAnswers(consultationFlow.consultationId, {
      answers: questions.value.map((question) => ({
        conditionCode: question.conditionCode,
        value: answers.value[question.conditionCode] as boolean,
      })),
    })
    await loadResolvedChecklist()
    phase.value = 'items'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '답변을 저장하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isSubmittingAnswers.value = false
  }
}

function toggleItem(itemCode: string) {
  const nextCheckedItems = new Set(checkedItemCodes.value)

  if (nextCheckedItems.has(itemCode)) {
    nextCheckedItems.delete(itemCode)
  } else {
    nextCheckedItems.add(itemCode)
  }

  checkedItemCodes.value = nextCheckedItems
}
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="4" :total="6" />
    </template>

    <section v-if="phase === 'questions'" class="checklist-questions">
      <h1>몇 가지만 확인할게요</h1>
      <p v-if="isLoading">확인하고 있어요.</p>
      <p v-else-if="errorMessage" class="checklist__error">{{ errorMessage }}</p>
      <p v-else>정확한 준비물을 알려드리기 위해 필요해요.</p>

      <div v-if="!isLoading && questions.length > 0" class="checklist-questions__list">
        <div v-for="question in questions" :key="question.conditionCode" class="question-card">
          <p>{{ question.question }}</p>
          <div class="question-card__options">
            <button
              type="button"
              class="question-card__option"
              :class="{ 'question-card__option--selected': answers[question.conditionCode] === true }"
              @click="answerQuestion(question.conditionCode, true)"
            >
              네
            </button>
            <button
              type="button"
              class="question-card__option"
              :class="{ 'question-card__option--selected': answers[question.conditionCode] === false }"
              @click="answerQuestion(question.conditionCode, false)"
            >
              아니요
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="checklist">
      <h1>이것들을 챙겨 가세요</h1>
      <p v-if="isLoading">준비물을 확인하고 있어요.</p>
      <p v-else-if="errorMessage" class="checklist__error">{{ errorMessage }}</p>
      <p v-else>하나씩 눌러서 확인해보세요.</p>

      <div v-if="checklistItems.length > 0" class="checklist__items">
        <label
          v-for="item in checklistItems"
          :key="item.itemCode"
          class="prepare-item"
          :class="{ 'prepare-item--checked': checkedItemCodes.has(item.itemCode) }"
        >
          <input
            type="checkbox"
            :checked="checkedItemCodes.has(item.itemCode)"
            @change="toggleItem(item.itemCode)"
          />
          <span class="prepare-item__box" aria-hidden="true">
            <Check :size="15" :stroke-width="3" />
          </span>
          <span class="prepare-item__text">
            <strong>
              {{ item.name }}
              <em v-if="item.required">필수</em>
            </strong>
            <small>{{ item.easyDescription }}</small>
          </span>
        </label>
      </div>
    </section>

    <template #footer>
      <BaseButton
        v-if="phase === 'questions'"
        block
        :disabled="isLoading || !allQuestionsAnswered || isSubmittingAnswers"
        @click="submitAnswers"
      >
        {{ isSubmittingAnswers ? '확인하는 중...' : '다음' }}
      </BaseButton>
      <BaseButton
        v-else
        block
        :disabled="isLoading || checklistItems.length === 0 || !requiredComplete"
        @click="router.push(routePaths.branches)"
      >
        지점 보기
      </BaseButton>
    </template>
  </AppScreen>
</template>

<style scoped>
.checklist-questions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.checklist-questions > p {
  color: var(--color-ink-soft);
}

.checklist-questions__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.question-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.question-card > p {
  color: var(--color-ink);
  font-size: var(--text-base);
  font-weight: 800;
}

.question-card__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.question-card__option {
  min-height: 48px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.question-card__option--selected {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-accent-ink);
}

.checklist {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.checklist > p {
  color: var(--color-ink-soft);
}

.checklist__error {
  color: var(--color-alert);
}

.checklist__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.prepare-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 76px;
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.prepare-item--checked {
  border-color: var(--color-accent);
  background: var(--color-yellow-faint);
}

.prepare-item:active {
  transform: scale(0.99);
}

.prepare-item input {
  position: absolute;
  opacity: 0;
}

.prepare-item__box {
  display: grid;
  place-items: center;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-accent-deep);
  background: transparent;
  color: var(--color-accent-deep);
  transform: scale(1);
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1.2);
}

.prepare-item__box svg {
  opacity: 0;
  transform: scale(0.45);
  transition:
    opacity 140ms ease,
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1.4);
}

.prepare-item input:checked + .prepare-item__box {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-accent-ink);
  transform: scale(1.08);
}

.prepare-item input:checked + .prepare-item__box svg {
  opacity: 1;
  transform: scale(1);
}

.prepare-item__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.prepare-item strong {
  color: var(--color-ink);
  font-size: var(--text-base);
  font-weight: 800;
}

.prepare-item em {
  margin-left: var(--space-1);
  color: var(--color-alert);
  font-size: var(--text-xs);
  font-style: normal;
}

.prepare-item small {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}
</style>
