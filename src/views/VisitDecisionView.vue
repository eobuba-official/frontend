<script setup lang="ts">
import { computed } from 'vue'
import { Check, Home, PhoneCall, Smartphone } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import InfoCard from '@/components/common/InfoCard.vue'
import { routePaths } from '@/router/routePaths'
import { useConsultationFlowStore } from '@/stores/consultationFlow'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

if (!consultationFlow.visitDecision) {
  router.replace(routePaths.home)
}

const decision = computed(() => consultationFlow.visitDecision?.decision)

const heading = computed(() => {
  if (decision.value === 'NO_VISIT') return '은행에 안 가셔도 돼요'
  if (decision.value === 'CHECK_NEEDED') return '먼저 확인이 필요해요'
  return '이 업무는\n은행에 가셔야 해요'
})
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="3" :total="6" />
    </template>

    <section v-if="consultationFlow.visitDecision" class="visit-decision">
      <div class="visit-decision__icon" aria-hidden="true">
        <Smartphone v-if="decision === 'NO_VISIT'" :size="42" :stroke-width="1.8" />
        <PhoneCall v-else-if="decision === 'CHECK_NEEDED'" :size="42" :stroke-width="1.8" />
        <Home v-else :size="42" :stroke-width="1.8" />
      </div>

      <div class="visit-decision__copy">
        <h1 style="white-space: pre-line">{{ heading }}</h1>
        <p>{{ consultationFlow.visitDecision.reason }}</p>
      </div>

      <InfoCard v-if="decision === 'NO_VISIT'" title="이렇게 하실 수 있어요">
        <ul class="check-list">
          <li v-for="method in consultationFlow.visitDecision.remoteMethods" :key="method.channel">
            <Check :size="18" :stroke-width="2.4" />
            {{ method.easyDescription }}
          </li>
        </ul>
      </InfoCard>

      <InfoCard v-else-if="decision === 'CHECK_NEEDED'" title="여기서 확인해 보세요">
        <ul class="check-list">
          <li v-for="channel in consultationFlow.visitDecision.officialChannels" :key="channel.name">
            <a :href="`tel:${channel.phone}`">
              <PhoneCall :size="18" :stroke-width="2.4" />
              {{ channel.name }} ({{ channel.phone }})
            </a>
          </li>
        </ul>
      </InfoCard>

      <InfoCard v-else title="가시기 전에 확인하세요">
        <p>{{ consultationFlow.task?.name }} 업무로 안내해 드릴게요.</p>
      </InfoCard>
    </section>

    <template #footer>
      <BaseButton v-if="decision === 'VISIT_REQUIRED'" block @click="router.push(routePaths.checklist)">
        준비물 보기
      </BaseButton>
      <BaseButton v-else block @click="router.push(routePaths.home)">확인했어요</BaseButton>
    </template>
  </AppScreen>
</template>

<style scoped>
.visit-decision {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-7);
  text-align: center;
}

.visit-decision__icon {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  margin-inline: auto;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
}

.visit-decision__copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.visit-decision__copy p {
  color: var(--color-ink-soft);
}

.check-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
  text-align: left;
}

.check-list li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-ink);
  font-weight: 700;
}

.check-list a {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: inherit;
  text-decoration: none;
}

.check-list svg {
  flex-shrink: 0;
  color: var(--color-accent-deep);
}
</style>
