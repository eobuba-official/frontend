<script setup lang="ts">
import { ref } from 'vue'
import { PhoneCall, ShieldAlert } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import WarningBox from '@/components/common/WarningBox.vue'
import { routePaths } from '@/router/routePaths'
import { consultationService } from '@/services/consultationService'
import { useConsultationFlowStore } from '@/stores/consultationFlow'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

if (!consultationFlow.fraudCheck) {
  router.replace(routePaths.home)
}

const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleDismiss() {
  if (!consultationFlow.consultationId) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const result = await consultationService.dismissWarning(consultationFlow.consultationId, { confirmed: true })
    consultationFlow.setDismissWarningResult(result)

    switch (result.status) {
      case 'TASK_CONFIRMED':
        await router.push(routePaths.visitDecision)
        break
      case 'CANDIDATES_SUGGESTED':
        await router.push(routePaths.taskConfirm)
        break
      default:
        await router.push(routePaths.consultationEnd)
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '처리하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppScreen>
    <template #header>
      <button class="back-button" type="button" @click="router.push(routePaths.home)">← 이전</button>
    </template>

    <section v-if="consultationFlow.fraudCheck" class="fraud">
      <div class="fraud__icon" aria-hidden="true">
        <ShieldAlert :size="42" :stroke-width="1.8" />
      </div>
      <h1>보이스피싱이 의심돼요</h1>
      <p v-if="consultationFlow.guidance" class="fraud__guidance">{{ consultationFlow.guidance }}</p>

      <div class="fraud__patterns">
        <WarningBox
          v-for="pattern in consultationFlow.fraudCheck.patterns"
          :key="pattern.type"
          :title="pattern.label"
          :description="pattern.explanation"
        >
          <p class="fraud__evidence">"{{ pattern.evidence }}"</p>
        </WarningBox>
      </div>

      <div v-if="consultationFlow.fraudCheck.safetyActions.length > 0" class="fraud__safety">
        <h2>지금 이렇게 하세요</h2>
        <ol>
          <li v-for="action in consultationFlow.fraudCheck.safetyActions" :key="action.order">
            {{ action.action }}
          </li>
        </ol>
      </div>

      <p v-if="consultationFlow.fraudCheck.guardianNotification?.sent" class="fraud__guardian">
        <PhoneCall :size="18" :stroke-width="2.2" />
        <span>
          {{
            consultationFlow.fraudCheck.guardianNotification.notifiedGuardians
              .map((guardian) => `${guardian.name}(${guardian.relation})`)
              .join(', ')
          }}님께 알려드렸어요.
        </span>
      </p>

      <p v-if="errorMessage" class="fraud__error">{{ errorMessage }}</p>
    </section>

    <template #footer>
      <div class="fraud__footer">
        <BaseButton
          v-if="consultationFlow.fraudCheck?.dismissible"
          variant="ghost"
          block
          :disabled="isSubmitting"
          @click="handleDismiss"
        >
          {{ isSubmitting ? '처리하는 중...' : '괜찮아요, 계속할게요' }}
        </BaseButton>
        <BaseButton block @click="router.push(routePaths.home)">홈으로 돌아가기</BaseButton>
      </div>
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

.fraud {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.fraud__icon {
  display: grid;
  place-items: center;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-pill);
  background: var(--color-alert-bg);
  color: var(--color-alert);
}

.fraud h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 800;
  line-height: 1.3;
}

.fraud__guidance {
  color: var(--color-ink-soft);
  font-size: var(--text-lg);
  font-weight: 600;
}

.fraud__patterns {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.fraud__evidence {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-style: italic;
}

.fraud__safety h2 {
  margin-bottom: var(--space-2);
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: 800;
}

.fraud__safety ol {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding-left: 1.3em;
}

.fraud__guardian {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
  font-size: var(--text-sm);
  font-weight: 700;
}

.fraud__error {
  color: var(--color-alert);
  font-size: var(--text-sm);
}

.fraud__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
