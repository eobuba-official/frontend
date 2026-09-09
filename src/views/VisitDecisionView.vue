<script setup lang="ts">
import { computed } from 'vue'
import { ClipboardCheck, Globe, Landmark, Phone, PhoneCall, Smartphone } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BottomActionBar from '@/components/common/BottomActionBar.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import goodMascot from '@/assets/img/good.png'
import hmmMascot from '@/assets/img/hmm.png'
import whatMascot from '@/assets/img/what.png'
import { routePaths } from '@/router/routePaths'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import type { RemoteMethod } from '@/api/types'

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

if (!consultationFlow.visitDecision) {
  router.replace(routePaths.home)
}

const decision = computed(() => consultationFlow.visitDecision?.decision)

const heading = computed(() => {
  if (decision.value === 'NO_VISIT') return '은행에 방문하지 않아도 돼요'
  if (decision.value === 'CHECK_NEEDED') return '처리 방법을 먼저 확인해 주세요'
  return '은행에서 직접 처리해야 해요'
})

const mascotImage = computed(() => {
  if (decision.value === 'NO_VISIT') return goodMascot
  if (decision.value === 'CHECK_NEEDED') return hmmMascot
  return whatMascot
})

// backend's CHECK_NEEDED reason text sometimes ends by repeating the heading's own
// "먼저 확인이 필요해요" as a trailing "먼저 확인해 보세요/주세요" sentence — strip that
// duplicate rather than showing the same idea twice back to back
const reasonText = computed(() => {
  const reason = consultationFlow.visitDecision?.reason ?? ''
  if (decision.value === 'VISIT_REQUIRED' && reason.includes('본인 확인')) {
    return '본인 확인을 위해 가까운 은행 지점을 방문해\u00a0주세요.'
  }

  const withoutDuplicate =
    decision.value === 'CHECK_NEEDED'
      ? reason.replace(/\s*먼저\s*확인해\s*(보|주)세요\.?\s*$/, '').trim()
      : reason

  return withoutDuplicate
    .replace(/할 수 있습니다\.?$/, '할 수 있어요.')
    .replace(/가능합니다\.?$/, '가능해요.')
    .replace(/필요합니다\.?$/, '필요해요.')
    .replaceAll('방문해 주세요', '방문해\u00a0주세요')
})

const remoteMethodMeta: Record<RemoteMethod['channel'], { label: string; icon: typeof Smartphone }> = {
  MOBILE_APP: { label: '휴대폰 앱으로', icon: Smartphone },
  ATM: { label: '가까운 ATM에서', icon: Landmark },
  CALL_CENTER: { label: '전화 한 통으로', icon: PhoneCall },
  WEB: { label: '온라인으로', icon: Globe },
}

function goToChecklist() {
  void router.push(routePaths.checklist)
}

function callFirstOfficialChannel() {
  const phone = consultationFlow.visitDecision?.officialChannels[0]?.phone
  if (phone) window.location.href = `tel:${phone}`
}
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="3" :total="6" label="방문 방법" />
    </template>

    <section v-if="consultationFlow.visitDecision" class="visit-decision">
      <div class="visit-decision__icon visit-decision__icon--mascot" aria-hidden="true">
        <img :src="mascotImage" alt="" />
      </div>

      <div class="visit-decision__copy">
        <h1 style="white-space: pre-line">{{ heading }}</h1>
        <p>{{ reasonText }}</p>
      </div>

      <div v-if="decision === 'NO_VISIT'" class="decision-list">
        <p class="decision-list__title">편한 방법을 선택해 보세요</p>
        <div v-for="method in consultationFlow.visitDecision.remoteMethods" :key="method.channel" class="decision-row">
          <span class="decision-row__icon">
            <component :is="remoteMethodMeta[method.channel].icon" :size="20" :stroke-width="2" />
          </span>
          <span class="decision-row__body">
            <strong>{{ remoteMethodMeta[method.channel].label }}</strong>
            <small>{{ method.easyDescription }}</small>
          </span>
        </div>
      </div>

      <div v-else-if="decision === 'CHECK_NEEDED'" class="decision-list">
        <p class="decision-list__title">고객센터에 문의해 보세요</p>
        <component
          :is="channel.phone ? 'a' : 'div'"
          v-for="channel in consultationFlow.visitDecision.officialChannels"
          :key="channel.name"
          :href="channel.phone ? `tel:${channel.phone}` : undefined"
          class="decision-row"
        >
          <span class="decision-row__icon">
            <Phone :size="20" :stroke-width="2" />
          </span>
          <span class="decision-row__body">
            <strong>{{ channel.name }}</strong>
            <small>{{ channel.phone ? `${channel.phone} · ${channel.description}` : channel.description }}</small>
          </span>
        </component>
      </div>

      <div v-else class="visit-preparation">
        <span class="visit-preparation__icon" aria-hidden="true">
          <ClipboardCheck :size="22" :stroke-width="2.2" />
        </span>
        <h2>방문 전에 준비물을 확인해 주세요</h2>
      </div>
    </section>

    <template #footer>
      <BaseButton v-if="decision === 'VISIT_REQUIRED'" block @click="router.push(routePaths.checklist)">
        필요한 준비물 보기
      </BaseButton>
      <BaseButton v-else-if="decision === 'NO_VISIT'" block @click="router.push(routePaths.home)">
        확인
      </BaseButton>
      <BottomActionBar v-else-if="decision === 'CHECK_NEEDED'" stacked>
        <BaseButton variant="ghost" block @click="goToChecklist">은행 방문 준비하기</BaseButton>
        <BaseButton block @click="callFirstOfficialChannel">고객센터에 전화하기</BaseButton>
      </BottomActionBar>
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

.visit-decision__icon--mascot {
  width: 140px;
  height: 140px;
  background: none;
}

.visit-decision__icon--mascot img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.visit-decision__copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.visit-decision__copy p {
  color: var(--color-ink-soft);
}

.visit-decision__copy h1,
.visit-decision__copy p {
  word-break: keep-all;
  overflow-wrap: normal;
}

.visit-preparation {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-yellow-light);
  border-radius: var(--radius-md);
  background: var(--color-yellow-faint);
  text-align: left;
}

.visit-preparation h2 {
  font-size: var(--text-base);
  font-weight: 700;
  word-break: keep-all;
  overflow-wrap: normal;
}

.visit-preparation__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-accent-deep);
}

.decision-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  text-align: left;
}

.decision-list__title {
  color: var(--color-ink);
  font-weight: 700;
}

.decision-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--card-padding);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: inherit;
  text-decoration: none;
}

.decision-row__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-yellow-light);
  color: var(--color-accent-deep);
}

.decision-row__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.decision-row__body strong {
  color: var(--color-ink);
  font-weight: 700;
}

.decision-row__body small {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}
</style>
