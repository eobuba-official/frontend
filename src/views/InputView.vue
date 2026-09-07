<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { routePaths } from '@/router/routePaths'
import { useConsultationFlowStore } from '@/stores/consultationFlow'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

const text = ref('')
const canSubmit = computed(() => text.value.trim().length > 0)

function handleSubmit() {
  if (!canSubmit.value) return

  consultationFlow.setUtterance({ utterance: text.value.trim(), inputMethod: 'TEXT' })
  void router.push(routePaths.utteranceConfirm)
}
</script>

<template>
  <AppScreen>
    <template #header>
      <button class="back-button" type="button" @click="router.push(routePaths.home)">← 이전</button>
    </template>

    <section class="input">
      <h1>은행 업무를 알려주세요</h1>
      <p>어떤 도움이 필요하신지 편하게 적어주세요.</p>

      <textarea
        v-model="text"
        class="input__textarea"
        rows="5"
        placeholder="예) 통장을 잃어버려서 다시 만들고 싶어요"
      ></textarea>
    </section>

    <template #footer>
      <BaseButton block :disabled="!canSubmit" @click="handleSubmit">다음</BaseButton>
    </template>
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

.input {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.input h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
}

.input > p {
  color: var(--color-ink-soft);
}

.input__textarea {
  width: 100%;
  margin-top: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  font-size: var(--text-lg);
  resize: vertical;
}

.input__textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

.input__textarea::placeholder {
  color: var(--color-ink-faint);
}
</style>
