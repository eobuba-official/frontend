<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RefreshCw } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import OtpInput from '@/components/common/OtpInput.vue'
import PhoneNumberField from '@/components/common/PhoneNumberField.vue'
import logoMark from '@/assets/img/logo-mark.png'
import { routePaths } from '@/router/routePaths'
import { authService } from '@/services/authService'
import { useAuthFlowStore } from '@/stores/authFlow'

const router = useRouter()
const authFlow = useAuthFlowStore()

const userName = ref(authFlow.userName)
const phoneDigits = ref('')
const code = ref('')
const isCodeStep = ref(false)
const secondsLeft = ref(180)
const isSubmitting = ref(false)
const errorMessage = ref('')
let timer: number | undefined

const phoneNumber = computed(() => `010${phoneDigits.value}`)
const maskedPhone = computed(() => phoneNumber.value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3'))
const canRequestCode = computed(
  () => userName.value.trim().length > 0 && phoneDigits.value.length === 8 && !isSubmitting.value,
)
const canVerifyCode = computed(() => code.value.length === 6 && !isSubmitting.value)
const canSubmit = computed(() => (isCodeStep.value ? canVerifyCode.value : canRequestCode.value))
const timerLabel = computed(() => {
  const minutes = Math.floor(secondsLeft.value / 60)
  const seconds = secondsLeft.value % 60
  return `${minutes}분 ${seconds.toString().padStart(2, '0')}초`
})

function startTimer(expiresInSeconds = 180) {
  window.clearInterval(timer)
  secondsLeft.value = expiresInSeconds
  timer = window.setInterval(() => {
    if (secondsLeft.value > 0) secondsLeft.value -= 1
  }, 1000)
}

function handleEditPhoneNumber() {
  window.clearInterval(timer)
  code.value = ''
  errorMessage.value = ''
  authFlow.setMockCode(null)
  authFlow.setSignupToken(null)
  isCodeStep.value = false
}

async function handleSubmit() {
  if (!canSubmit.value) return

  if (isCodeStep.value) {
    await handleVerifySms()
    return
  }

  await handleRequestSms()
}

async function handleRequestSms() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const result = await authService.requestSms({ phoneNumber: phoneNumber.value })
    authFlow.setUserName(userName.value.trim())
    authFlow.setPhoneNumber(phoneNumber.value)
    authFlow.setMockCode(result.mockCode)
    code.value = ''
    isCodeStep.value = true
    startTimer(result.expiresInSeconds)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '인증번호 요청에 실패했어요. 다시 시도해 주세요.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleVerifySms() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const result = await authService.verifySms({
      phoneNumber: authFlow.phoneNumber,
      code: code.value,
    })

    if (result.registered) {
      authFlow.reset()
      await router.push(routePaths.home)
      return
    }

    authFlow.setSignupToken(result.signupToken)
    await router.push(routePaths.guardianRegister)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '인증번호가 맞지 않아요. 다시 확인해 주세요.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleResend() {
  if (!authFlow.phoneNumber || isSubmitting.value) return

  errorMessage.value = ''

  try {
    const result = await authService.requestSms({ phoneNumber: authFlow.phoneNumber })
    authFlow.setMockCode(result.mockCode)
    code.value = ''
    startTimer(result.expiresInSeconds)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '인증번호를 다시 보내지 못했어요.'
  }
}

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <AppScreen>
    <section class="login">
      <div class="login__brand">
        <span
          class="login__logo"
          :style="{ backgroundImage: `url(${logoMark})` }"
          aria-hidden="true"
        ></span>
        <div class="login__brand-copy">
          <strong class="login__brand-name" aria-label="어부바">
            <span class="login__brand-initial login__brand-initial--eo">어</span>
            <span class="login__brand-initial login__brand-initial--bu">부</span>
            <span class="login__brand-initial login__brand-initial--ba">바</span>
          </strong>
          <span class="login__brand-tagline">어르신 부담 바로덜기</span>
        </div>
      </div>

      <h1 class="login__title">이름과 휴대폰 번호를<br />알려주세요</h1>

      <label class="login-name-field" for="login-name">
        <input
          id="login-name"
          v-model="userName"
          class="login-name-field__input"
          type="text"
          placeholder="이름을 입력해 주세요"
          autocomplete="name"
          :disabled="isCodeStep"
        />
      </label>

      <PhoneNumberField
        id="login-phone"
        v-model="phoneDigits"
        :error-message="!isCodeStep ? errorMessage : ''"
        :disabled="isCodeStep"
        :show-label="false"
      />

      <Transition name="login-code-slide">
        <div v-if="isCodeStep" class="login-code" aria-label="인증번호 입력">
          <p class="login-code__sent">{{ maskedPhone }}로 보내드렸어요.</p>
          <button class="login-code__edit-phone" type="button" @click="handleEditPhoneNumber">
            전화번호 다시 입력
          </button>
          <OtpInput v-model="code" />
          <p v-if="errorMessage" class="login-code__error">{{ errorMessage }}</p>
          <div v-else class="login-code__meta">
            <span v-if="authFlow.mockCode">테스트 코드: {{ authFlow.mockCode }}</span>
            <strong>{{ timerLabel }}</strong>
          </div>
          <button class="login-code__resend" type="button" @click="handleResend">
            <RefreshCw :size="14" :stroke-width="2.2" />
            문자 다시 받기
          </button>
        </div>
      </Transition>
    </section>

    <template #footer>
      <p class="login__footer-lede">인증번호만 확인되면 바로 시작해요.</p>
      <BaseButton block :disabled="!canSubmit" @click="handleSubmit">
        {{
          isSubmitting
            ? isCodeStep
              ? '확인 중...'
              : '요청 중...'
            : isCodeStep
              ? '확인'
              : '인증번호 받기'
        }}
      </BaseButton>
    </template>
  </AppScreen>
</template>

<style scoped>
.login {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  text-align: center;
  padding-block: var(--space-8);
}

.login__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-lg);
  font-weight: 800;
}

.login__logo {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-pill);
  background-color: transparent;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.login__brand-name {
  color: var(--color-ink);
  font-family: 'JalnanGothic', 'Cafe24Ssurround', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
  font-size: var(--text-base);
  font-weight: 900;
  line-height: 1.12;
  letter-spacing: 0;
  word-break: keep-all;
  font-variation-settings: 'wght' 900;
}

.login__brand-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.login__brand-tagline {
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1.2;
}

.login__brand-initial {
  display: inline-block;
  font-weight: 950;
}

.login__brand-initial--eo {
  color: var(--color-ink);
}

.login__brand-initial--bu {
  color: var(--color-ink);
}

.login__brand-initial--ba {
  color: var(--color-ink);
}

.login-name-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.login-name-field:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(255, 188, 0, 0.1);
  transform: translateY(-1px);
}

.login-name-field__input {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  font-size: var(--text-xl);
  font-weight: 800;
  text-align: center;
  transition:
    color 0.2s ease,
    opacity 0.2s ease;
}

.login-name-field__input::placeholder {
  color: var(--color-ink-faint);
}

.login-name-field__input:focus {
  outline: none;
}

.login-code {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding-top: var(--space-2);
  overflow: hidden;
  transform-origin: top center;
}

.login-code__sent {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.login-code__edit-phone {
  margin-top: calc(var(--space-2) * -1);
  border: 0;
  background: transparent;
  color: var(--color-accent-deep);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 800;
  cursor: pointer;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.login-code__edit-phone:hover {
  color: var(--color-accent);
  transform: translateY(-1px);
}

.login-code__meta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-ink-faint);
  font-size: var(--text-sm);
}

.login-code__meta strong {
  color: var(--color-accent-deep);
}

.login-code__error {
  color: var(--color-alert);
  font-size: var(--text-sm);
}

.login-code__resend {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border: 0;
  background: transparent;
  color: var(--color-ink-soft);
  font: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
}

.login-code-slide-enter-active,
.login-code-slide-leave-active {
  transition:
    opacity 0.32s ease,
    transform 0.32s ease,
    max-height 0.32s ease;
}

.login-code-slide-enter-from,
.login-code-slide-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.login-code-slide-enter-to,
.login-code-slide-leave-from {
  max-height: 190px;
  opacity: 1;
  transform: translateY(0);
}

.login__footer-lede {
  margin-bottom: var(--space-3);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.5;
  text-align: center;
}
</style>
