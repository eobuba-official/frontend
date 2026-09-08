<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronRight, CreditCard, PiggyBank, UserRoundPlus } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import { routePaths } from '@/router/routePaths'
import { useConsultationFlowStore } from '@/stores/consultationFlow'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()
const requestText = ref(consultationFlow.utterance)

const canSubmit = computed(() => requestText.value.trim().length > 0)

const popularTasks = [
  { label: '통장 재발급', icon: CreditCard },
  { label: '카드 재발급', icon: CreditCard },
  { label: '예금 / 적금 해지', icon: PiggyBank },
  { label: '계좌 개설', icon: UserRoundPlus },
]

function chooseTask(taskName: string) {
  requestText.value = taskName
}

function submitInput() {
  if (!canSubmit.value) {
    return
  }

  consultationFlow.setUtterance({ utterance: requestText.value.trim(), inputMethod: 'TEXT' })
  void router.push(routePaths.utteranceConfirm)
}
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="1" :total="6" label="직접 입력" hide-home />
    </template>

    <section class="manual-input">
      <h1>필요하신 내용을 입력해주세요</h1>

      <label class="manual-input__field">
        <textarea
          v-model="requestText"
          maxlength="500"
          placeholder="예: 통장을 잃어버렸어요"
        ></textarea>
        <span>{{ requestText.length }}/500</span>
      </label>

      <div class="manual-input__popular">
        <h2>이런 업무를 많이 물어봐요</h2>

        <button
          v-for="task in popularTasks"
          :key="task.label"
          class="popular-task"
          type="button"
          @click="chooseTask(task.label)"
        >
          <span class="popular-task__icon" aria-hidden="true">
            <component :is="task.icon" :size="28" :stroke-width="2.2" />
          </span>
          <strong>{{ task.label }}</strong>
          <ChevronRight :size="24" :stroke-width="2.4" aria-hidden="true" />
        </button>
      </div>
    </section>

    <template #footer>
      <BaseButton block :disabled="!canSubmit" @click="submitInput">확인하기</BaseButton>
    </template>
  </AppScreen>
</template>

<style scoped>
.manual-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.manual-input h1 {
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 900;
  line-height: 1.3;
}

.manual-input__field {
  position: relative;
  display: block;
  min-height: 176px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.manual-input__field textarea {
  width: 100%;
  min-height: 176px;
  padding: var(--space-5);
  padding-bottom: var(--space-9);
  resize: none;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-xl);
  font-weight: 700;
  line-height: 1.5;
  outline: none;
}

.manual-input__field textarea::placeholder {
  color: var(--color-ink-muted);
}

.manual-input__field span {
  position: absolute;
  right: var(--space-5);
  bottom: var(--space-4);
  color: var(--color-ink-faint);
  font-size: var(--text-base);
  font-weight: 600;
}

.manual-input__popular {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.manual-input__popular h2 {
  margin-bottom: var(--space-2);
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 900;
}

.popular-task {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-4);
  min-height: 76px;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-ink);
  cursor: pointer;
  text-align: left;
}

.popular-task__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-faint);
  color: var(--color-accent-deep);
}

.popular-task strong {
  font-size: var(--text-lg);
  font-weight: 800;
}

.popular-task > svg {
  color: var(--color-ink-soft);
}
</style>
