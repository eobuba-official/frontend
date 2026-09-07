<script setup lang="ts">
import { computed } from 'vue'
import { Landmark, PhoneOff, ShieldAlert, Users } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import WarningBox from '@/components/common/WarningBox.vue'
import { routePaths } from '@/router/routePaths'
import { useConsultationFlowStore } from '@/stores/consultationFlow'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

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
</script>

<template>
  <AppScreen>
    <template #header>
      <div class="fraud-header">
        <button
          class="fraud-header__button"
          type="button"
          @click="router.push(consultationFlow.fraudCheck ? routePaths.utteranceConfirm : routePaths.home)"
        >
          ← 뒤로
        </button>
        <button class="fraud-header__button" type="button" @click="router.push(routePaths.home)">처음으로</button>
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
          <li v-for="pattern in consultationFlow.fraudCheck.patterns" :key="pattern.type" class="fraud__phrase">
            <span class="fraud__phrase-icon" aria-hidden="true">!</span>
            <span>{{ pattern.evidence }}</span>
          </li>
        </ul>
        <p v-if="summaryLine" class="fraud__summary">{{ summaryLine }}</p>
      </div>

      <div v-if="consultationFlow.fraudCheck.safetyActions.length > 0" class="fraud__card">
        <h2>안전하게 확인하는 방법</h2>
        <ul class="fraud__steps">
          <li v-for="action in consultationFlow.fraudCheck.safetyActions" :key="action.order" class="fraud__step">
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
      <div class="fraud__stop">
        <div class="fraud__stop-icon" aria-hidden="true">
          <ShieldAlert :size="26" :stroke-width="2" />
        </div>
        <div>
          <strong>보이스피싱 예방</strong>
        </div>
      </div>
      <WarningBox
        title="수상한 전화는 바로 확인하세요"
        description="은행은 안전계좌로 돈을 옮기라고 요구하지 않습니다."
      />
    </section>

    <template #footer>
      <BaseButton variant="alert" block @click="callFss">
        <template #icon>
          <PhoneOff :size="20" :stroke-width="2.2" />
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
}

.fraud-header__button {
  border: 0;
  background: transparent;
  color: var(--color-ink-soft);
  font: inherit;
  font-weight: 700;
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

</style>
