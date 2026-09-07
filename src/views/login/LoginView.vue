<script setup lang="ts">
import { computed, ref } from 'vue'
import { LockKeyhole } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import PhoneNumberField from '@/components/common/PhoneNumberField.vue'
import { routePaths } from '@/router/routePaths'
import { authService } from '@/services/authService'
import { useAuthFlowStore } from '@/stores/authFlow'

const router = useRouter()
const authFlow = useAuthFlowStore()

const phoneDigits = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const canSubmit = computed(() => phoneDigits.value.length === 8 && !isSubmitting.value)

async function handleSubmit() {
  if (!canSubmit.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const phoneNumber = `010${phoneDigits.value}`
    const result = await authService.requestSms({ phoneNumber })
    authFlow.setPhoneNumber(phoneNumber)
    authFlow.setMockCode(result.mockCode)
    await router.push(routePaths.smsVerify)
  } catch {
    errorMessage.value = '인증번호 요청에 실패했어요. 다시 시도해 주세요.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppScreen>
    <section class="login">
      <div class="login__brand">
        <span class="login__logo" aria-hidden="true"></span>
        <strong>어부바</strong>
      </div>

      <h1 class="login__title">휴대폰 번호를<br />알려주세요</h1>
      <p class="login__lede">비밀번호는 없어요.<br />번호만 확인하면 바로 시작해요.</p>

      <PhoneNumberField id="login-phone" v-model="phoneDigits" :error-message="errorMessage" />

      <p class="login__notice">
        <LockKeyhole :size="14" :stroke-width="2.2" />
        번호는 본인 확인에만 쓰여요
      </p>
    </section>

    <template #footer>
      <BaseButton block :disabled="!canSubmit" @click="handleSubmit">
        {{ isSubmitting ? '요청 중...' : '인증번호 받기' }}
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
  gap: var(--space-5);
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
  width: 32px;
  height: 32px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
}

.login__title {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 800;
  line-height: 1.35;
}

.login__lede {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.login__notice {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-ink-faint);
  font-size: var(--text-xs);
}
</style>
