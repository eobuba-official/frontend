<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronLeft, RefreshCw } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import OtpInput from '@/components/common/OtpInput.vue'
import { routePaths } from '@/router/routePaths'
import { authService } from '@/services/authService'
import { useAuthFlowStore } from '@/stores/authFlow'

const router = useRouter()
const authFlow = useAuthFlowStore()

if (!authFlow.phoneNumber) {
  router.replace(routePaths.login)
}

const code = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const secondsLeft = ref(180)
let timer: number | undefined

const maskedPhone = computed(() => authFlow.phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3'))
const canSubmit = computed(() => code.value.length === 6 && !isSubmitting.value)
const timerLabel = computed(() => {
  const minutes = Math.floor(secondsLeft.value / 60)
  const seconds = secondsLeft.value % 60
  return `${minutes}분 ${seconds}초`
})

function startTimer() {
  window.clearInterval(timer)
  secondsLeft.value = 180
  timer = window.setInterval(() => {
    if (secondsLeft.value > 0) secondsLeft.value -= 1
  }, 1000)
}

onMounted(startTimer)
onBeforeUnmount(() => window.clearInterval(timer))

async function handleResend() {
  errorMessage.value = ''
  try {
    const result = await authService.requestSms({ phoneNumber: authFlow.phoneNumber })
    authFlow.setMockCode(result.mockCode)
    startTimer()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '인증번호를 다시 보내지 못했어요.'
  }
}

async function handleVerify() {
  if (!canSubmit.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const result = await authService.verifySms({ phoneNumber: authFlow.phoneNumber, code: code.value })

    if (result.registered) {
      await router.push(routePaths.home)
      return
    }

    authFlow.setSignupToken(result.signupToken)
    await router.push(routePaths.guardianRegister)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '인증번호가 맞지 않아요. 다시 확인해 주세요.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppScreen>
    <template #header>
      <button class="back-button" type="button" aria-label="뒤로" @click="router.push(routePaths.login)">
        <ChevronLeft :size="24" :stroke-width="2.4" aria-hidden="true" />
      </button>
    </template>

    <section class="verify">
      <h1>문자로 받은 번호를<br />넣어주세요</h1>
      <p class="verify__lede">{{ maskedPhone }}로 보내드렸어요.</p>

      <OtpInput v-model="code" />
      <p v-if="errorMessage" class="verify__error">{{ errorMessage }}</p>
      <p v-else-if="authFlow.mockCode" class="verify__hint">테스트 코드: {{ authFlow.mockCode }}</p>

      <p class="verify__timer">
        <strong>{{ timerLabel }}</strong> 안에 넣어주세요
      </p>

      <button class="verify__resend" type="button" @click="handleResend">
        <RefreshCw :size="14" :stroke-width="2.2" />
        문자 다시 받기
      </button>
    </section>

    <template #footer>
      <BaseButton block :disabled="!canSubmit" @click="handleVerify">
        {{ isSubmitting ? '확인 중...' : '확인' }}
      </BaseButton>
    </template>
  </AppScreen>
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

.verify {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
  padding-block: var(--space-6);
}

.verify__lede {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.verify__error {
  color: var(--color-alert);
  font-size: var(--text-sm);
}

.verify__hint {
  color: var(--color-ink-faint);
  font-size: var(--text-xs);
}

.verify__timer {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.verify__timer strong {
  color: var(--color-accent-deep);
}

.verify__resend {
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
</style>
