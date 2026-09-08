<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronLeft, Landmark, PhoneCall, PhoneOff, ShieldAlert, Users } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import WarningBox from '@/components/common/WarningBox.vue'
import { routePaths } from '@/router/routePaths'
import { authService } from '@/services/authService'
import { consultationService } from '@/services/consultationService'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import type { ConsultationHistoryItem, Guardian } from '@/api/types'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

const guardians = ref<Guardian[]>([])
const isLoadingGuardians = ref(true)
const guardiansError = ref('')
const recentFraudHistory = ref<ConsultationHistoryItem[]>([])

const summaryLine = computed(
  () => consultationFlow.guidance ?? consultationFlow.fraudCheck?.patterns[0]?.explanation ?? null,
)

function iconForSafetyAction(action: string) {
  if (action.includes('전화') && (action.includes('끊') || action.includes('말고'))) return PhoneOff
  if (action.includes('대표번호') || action.includes('확인')) return Landmark
  if (action.includes('가족')) return Users
  return ShieldAlert
}

function callFss() {
  window.location.href = 'tel:1332'
}

function callGuardian(phoneNumber: string) {
  window.location.href = `tel:${phoneNumber}`
}

function formatPhone(phoneNumber: string) {
  return phoneNumber.length === 11
    ? `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`
    : phoneNumber
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(value))
}

onMounted(async () => {
  if (consultationFlow.fraudCheck) return

  try {
    const me = await authService.getMe()
    guardians.value = me.guardians
  } catch (error) {
    guardiansError.value = error instanceof Error ? error.message : '가족 정보를 불러오지 못했어요.'
  } finally {
    isLoadingGuardians.value = false
  }

  try {
    const history = await consultationService.getConsultationHistory()
    recentFraudHistory.value = history.consultations
      .filter((item) => item.status === 'FRAUD_WARNING' || item.status === 'WARNING_DISMISSED')
      .slice(0, 3)
  } catch {
    recentFraudHistory.value = []
  }
})
</script>

<template>
  <AppScreen>
    <template #header>
      <div class="fraud-header">
        <button
          class="fraud-header__button"
          type="button"
          @click="
            router.push(consultationFlow.fraudCheck ? routePaths.utteranceConfirm : routePaths.home)
          "
        >
          <ChevronLeft :size="18" :stroke-width="2.4" />
          뒤로
        </button>
        <button class="fraud-header__button" type="button" @click="router.push(routePaths.home)">
          처음으로
        </button>
      </div>
    </template>

    <section v-if="consultationFlow.fraudCheck" class="fraud">
      <div class="fraud__stop">
        <div class="fraud__stop-icon" aria-hidden="true">
          <ShieldAlert :size="26" :stroke-width="2" />
        </div>
        <div>
          <strong>잠깐 멈춰 주세요</strong>
          <p>말씀하신 내용에 수상한 표현이 있어요.<br />돈을 보내지 마시고 먼저 확인하세요.</p>
        </div>
      </div>

      <div class="fraud__card">
        <h2>이런 표현을 들으셨나요?</h2>
        <ul class="fraud__phrases">
          <li
            v-for="pattern in consultationFlow.fraudCheck.patterns"
            :key="pattern.type"
            class="fraud__phrase"
          >
            <span class="fraud__phrase-icon" aria-hidden="true">!</span>
            <span>{{ pattern.evidence }}</span>
          </li>
        </ul>
        <p v-if="summaryLine" class="fraud__summary">{{ summaryLine }}</p>
      </div>

      <div v-if="consultationFlow.fraudCheck.safetyActions.length > 0" class="fraud__card">
        <h2>안전하게 확인하는 방법</h2>
        <ul class="fraud__steps">
          <li
            v-for="action in consultationFlow.fraudCheck.safetyActions"
            :key="action.order"
            class="fraud__step"
          >
            <span class="fraud__step-icon" aria-hidden="true">
              <component :is="iconForSafetyAction(action.action)" :size="20" :stroke-width="2.2" />
            </span>
            <span>{{ action.action }}</span>
          </li>
        </ul>
      </div>

      <p v-if="consultationFlow.fraudCheck.guardianNotification?.sent" class="fraud__guardian">
        {{
          consultationFlow.fraudCheck.guardianNotification.notifiedGuardians
            .map((guardian) => `${guardian.name}(${guardian.relation})`)
            .join(', ')
        }}님께 알려드렸어요.
      </p>
    </section>

    <section v-else class="fraud">
      <WarningBox
        title="수상한 전화는 바로 확인하세요"
        description="은행은 안전계좌로 돈을 옮기라고 요구하지 않습니다."
      />

      <div class="fraud__card">
        <h2>수상하면 가족에게 바로 알리세요</h2>
        <p v-if="isLoadingGuardians" class="fraud__status">불러오는 중...</p>
        <p v-else-if="guardiansError" class="fraud__status fraud__status--error">
          {{ guardiansError }}
        </p>
        <ul v-else-if="guardians.length > 0" class="fraud__steps">
          <li v-for="guardian in guardians" :key="guardian.guardianId" class="fraud__guardian-row">
            <span class="fraud__step-icon" aria-hidden="true">
              <Users :size="20" :stroke-width="2.2" />
            </span>
            <span class="fraud__guardian-info">
              <strong>{{ guardian.name }} ({{ guardian.relation }})</strong>
              <small>{{ formatPhone(guardian.phoneNumber) }}</small>
            </span>
            <button
              class="fraud__call-button"
              type="button"
              :aria-label="`${guardian.name}에게 전화하기`"
              @click="callGuardian(guardian.phoneNumber)"
            >
              <PhoneCall :size="18" :stroke-width="2.2" />
            </button>
          </li>
        </ul>
        <div v-else class="fraud__empty">
          <p>등록된 가족이 없어요. 가족을 등록해두면 더 안전해요.</p>
          <BaseButton variant="ghost" block @click="router.push(routePaths.settings)"
            >가족 등록하러 가기</BaseButton
          >
        </div>
      </div>

      <div v-if="recentFraudHistory.length > 0" class="fraud__card">
        <h2>예전에 이런 전화 조심하라고 알려드렸어요</h2>
        <ul class="fraud__history">
          <li
            v-for="item in recentFraudHistory"
            :key="item.consultationId"
            class="fraud__history-item"
          >
            <small>{{ formatDate(item.createdAt) }}</small>
            <strong>{{ item.correctedUtterance }}</strong>
          </li>
        </ul>
      </div>
    </section>

    <template #footer>
      <BaseButton variant="alert" block @click="callFss">
        <template #icon>
          <PhoneCall :size="20" :stroke-width="2.2" />
        </template>
        금융감독원 1332에 전화하기
      </BaseButton>
    </template>
  </AppScreen>
</template>

<style scoped>
.fraud-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
}

.fraud-header__button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.fraud {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.fraud__stop {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-alert-line);
  border-radius: var(--radius-lg);
  background: var(--color-alert-bg);
}

.fraud__stop-icon {
  display: grid;
  flex: 0 0 44px;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-alert);
}

.fraud__stop strong {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--color-alert-deep);
  font-family: var(--font-body);
  font-size: var(--text-xl);
  font-weight: 800;
}

.fraud__stop p {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.fraud__card {
  padding: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.fraud__card h2 {
  margin-bottom: var(--space-3);
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: 800;
}

.fraud__phrases,
.fraud__steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.fraud__phrase {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-alert-bg);
  color: var(--color-ink);
  font-weight: 700;
}

.fraud__phrase-icon {
  display: inline-flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-pill);
  background: var(--color-alert);
  color: #ffffff;
  font-size: var(--text-sm);
  font-weight: 800;
}

.fraud__summary {
  margin-top: var(--space-3);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.fraud__step {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  font-weight: 700;
}

.fraud__step-icon {
  display: inline-flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-pill);
  background: var(--color-alert-bg);
  color: var(--color-alert);
}

.fraud__guardian {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
  font-size: var(--text-sm);
  font-weight: 700;
  text-align: center;
}

.fraud__status {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.fraud__status--error {
  color: var(--color-alert);
}

.fraud__guardian-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}

.fraud__guardian-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.fraud__guardian-info strong {
  font-weight: 800;
}

.fraud__guardian-info small {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 600;
}

.fraud__call-button {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
  cursor: pointer;
}

.fraud__empty {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.fraud__empty p {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.fraud__history {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.fraud__history-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-line);
}

.fraud__history-item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.fraud__history-item small {
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  font-weight: 600;
}

.fraud__history-item strong {
  font-weight: 700;
}
</style>
