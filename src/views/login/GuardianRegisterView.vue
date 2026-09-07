<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import PhoneNumberField from '@/components/common/PhoneNumberField.vue'
import { routePaths } from '@/router/routePaths'
import { authService } from '@/services/authService'
import { useAuthFlowStore } from '@/stores/authFlow'
import type { Guardian, GuardianRelation } from '@/api/types'

const router = useRouter()
const authFlow = useAuthFlowStore()

if (!authFlow.signupToken) {
  router.replace(routePaths.login)
}

const relations: GuardianRelation[] = ['아들', '딸', '배우자', '기타']

const guardianName = ref('')
const guardianPhoneDigits = ref('')
const relation = ref<GuardianRelation>('아들')
const isSubmitting = ref(false)
const errorMessage = ref('')

const canRegister = computed(
  () => guardianName.value.trim().length > 0 && guardianPhoneDigits.value.length === 8 && !isSubmitting.value,
)

async function completeSignup(guardians: Guardian[]) {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await authService.signup({
      signupToken: authFlow.signupToken ?? '',
      name: '',
      guardians,
    })
    authFlow.reset()
    await router.push(routePaths.home)
  } catch {
    errorMessage.value = '가입을 완료하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isSubmitting.value = false
  }
}

function handleSkip() {
  void completeSignup([])
}

function handleRegister() {
  if (!canRegister.value) return

  void completeSignup([
    {
      name: guardianName.value.trim(),
      phoneNumber: `010${guardianPhoneDigits.value}`,
      relation: relation.value,
    },
  ])
}
</script>

<template>
  <AppScreen>
    <template #header>
      <button class="back-button" type="button" @click="router.push(routePaths.smsVerify)">
        <ChevronLeft :size="18" :stroke-width="2.4" />
        뒤로
      </button>
    </template>

    <section class="guardian">
      <h1>가족 한 분을<br />등록해 주세요</h1>
      <p class="guardian__lede">수상한 전화가 감지되면 이 분께<br />바로 알려드려요.</p>

      <label class="name-field" for="guardian-name">
        <span class="name-field__label">가족 이름</span>
        <input
          id="guardian-name"
          v-model="guardianName"
          class="name-field__input"
          type="text"
          placeholder="이름을 입력해 주세요"
        />
      </label>

      <PhoneNumberField id="guardian-phone" v-model="guardianPhoneDigits" />

      <div class="relation">
        <span class="relation__label">어떤 사이신가요</span>
        <div class="relation__options">
          <button
            v-for="option in relations"
            :key="option"
            type="button"
            class="relation__chip"
            :class="{ 'relation__chip--active': relation === option }"
            @click="relation = option"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="guardian__error">{{ errorMessage }}</p>
    </section>

    <template #footer>
      <div class="guardian__actions">
        <BaseButton variant="ghost" block :disabled="isSubmitting" @click="handleSkip">나중에 등록할게요</BaseButton>
        <BaseButton block :disabled="!canRegister" @click="handleRegister">
          {{ isSubmitting ? '시작하는 중...' : '어부바 시작하기' }}
        </BaseButton>
      </div>
    </template>
  </AppScreen>
</template>

<style scoped>
.back-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border: 0;
  background: transparent;
  color: var(--color-ink-soft);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.guardian {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  text-align: center;
}

.guardian h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 800;
  line-height: 1.35;
}

.guardian__lede {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.name-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.name-field:focus-within {
  border-color: var(--color-accent);
}

.name-field__label {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.name-field__input {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  font-size: var(--text-xl);
  font-weight: 800;
  text-align: center;
}

.name-field__input::placeholder {
  color: var(--color-ink-faint);
}

.name-field__input:focus {
  outline: none;
}

.relation {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  text-align: left;
}

.relation__label {
  font-weight: 700;
}

.relation__options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}

.relation__chip {
  min-height: 44px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.relation__chip--active {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-accent-ink);
}

.guardian__error {
  color: var(--color-alert);
  font-size: var(--text-sm);
}

.guardian__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
