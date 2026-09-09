<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import PhoneNumberField from '@/components/common/PhoneNumberField.vue'
import { routePaths } from '@/router/routePaths'
import { authService } from '@/services/authService'
import { useAuthFlowStore } from '@/stores/authFlow'
import type { GuardianRelation } from '@/api/types'

interface RelationOption {
  label: string
  value: GuardianRelation
}

const router = useRouter()
const authFlow = useAuthFlowStore()

if (!authFlow.signupToken) {
  router.replace(routePaths.login)
}

const relations: RelationOption[] = [
  { label: '아들', value: '아들' },
  { label: '딸', value: '딸' },
  { label: '배우자', value: '배우자' },
  { label: '보호자', value: '기타' },
]

const guardianName = ref('')
const guardianPhoneDigits = ref('')
const relation = ref<GuardianRelation>('아들')
const isSubmitting = ref(false)
const errorMessage = ref('')
const isConfirmOpen = ref(false)

const canRegister = computed(
  () =>
    authFlow.userName.trim().length > 0 &&
    guardianName.value.trim().length > 0 &&
    guardianPhoneDigits.value.length === 8 &&
    !isSubmitting.value,
)

const guardianPhoneNumber = computed(() => `010${guardianPhoneDigits.value}`)
const formattedGuardianPhone = computed(() =>
  guardianPhoneNumber.value.length === 11
    ? `${guardianPhoneNumber.value.slice(0, 3)}-${guardianPhoneNumber.value.slice(3, 7)}-${guardianPhoneNumber.value.slice(7)}`
    : guardianPhoneNumber.value,
)
const relationLabel = computed(
  () => relations.find((option) => option.value === relation.value)?.label ?? relation.value,
)
const confirmDescription = computed(
  () => `${formattedGuardianPhone.value}, ${relationLabel.value} ${guardianName.value.trim()}님이 맞나요?`,
)

function handleRegister() {
  if (!canRegister.value) return
  errorMessage.value = ''
  isConfirmOpen.value = true
}

function closeConfirm() {
  if (isSubmitting.value) return
  isConfirmOpen.value = false
}

async function confirmRegister() {
  if (!canRegister.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await authService.signup({
      signupToken: authFlow.signupToken ?? '',
      name: authFlow.userName.trim(),
      guardians: [
        {
          name: guardianName.value.trim(),
          phoneNumber: guardianPhoneNumber.value,
          relation: relation.value,
        },
      ],
    })
    authFlow.reset()
    await router.push(routePaths.home)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '가입을 완료하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppScreen>
    <template #header>
      <button class="back-button" type="button" aria-label="뒤로" @click="router.push(routePaths.smsVerify)">
        <ChevronLeft :size="24" :stroke-width="2.4" aria-hidden="true" />
      </button>
    </template>

    <section class="guardian">
      <h1>보호자를<br />등록해 주세요</h1>
      <p class="guardian__lede">수상한 전화가 감지되면<br />보호자에게 알려드릴게요.</p>

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
            :key="option.value"
            type="button"
            class="relation__chip"
            :class="{ 'relation__chip--active': relation === option.value }"
            @click="relation = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="guardian__error">{{ errorMessage }}</p>
    </section>

    <template #footer>
      <BaseButton block :disabled="!canRegister" @click="handleRegister">
        {{ isSubmitting ? '시작하는 중...' : '어부바 시작하기' }}
      </BaseButton>
    </template>
  </AppScreen>

  <ConfirmModal
    v-if="isConfirmOpen"
    role="alertdialog"
    title="가족 정보를 확인해 주세요"
    :description="confirmDescription"
    @close="closeConfirm"
  >
    <p class="modal-guide">번호가 틀리면 안내 문자가 다른 사람에게 갈 수 있어요.</p>
    <p v-if="errorMessage" class="guardian__error">{{ errorMessage }}</p>

    <template #actions>
      <BaseButton variant="ghost" block :disabled="isSubmitting" @click="closeConfirm">
        다시 수정
      </BaseButton>
      <BaseButton block :disabled="isSubmitting" @click="confirmRegister">
        {{ isSubmitting ? '시작하는 중...' : '맞아요' }}
      </BaseButton>
    </template>
  </ConfirmModal>
</template>

<style scoped>
.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-ink-soft);
  font: inherit;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.back-button > svg {
  display: block;
  flex-shrink: 0;
}

.guardian {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  text-align: center;
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

.modal-guide {
  margin-top: var(--space-3);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.5;
}
</style>
