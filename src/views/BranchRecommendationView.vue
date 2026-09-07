<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Clock, MapPin } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import { routePaths } from '@/router/routePaths'
import { consultationService } from '@/services/consultationService'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import type { BranchRecommendation } from '@/api/types'

// 서울시청 좌표 — 위치 정보를 못 받을 때의 기본값
const FALLBACK_LOCATION = { lat: 37.5665, lng: 126.978 }
const GEOLOCATION_TIMEOUT_MS = 5000

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

if (!consultationFlow.consultationId || !consultationFlow.task) {
  router.replace(routePaths.home)
}

const recommendations = ref<BranchRecommendation[]>([])
const selectedRank = ref<number | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const selected = computed(() => recommendations.value.find((item) => item.rank === selectedRank.value) ?? null)

function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(FALLBACK_LOCATION)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(FALLBACK_LOCATION),
      { timeout: GEOLOCATION_TIMEOUT_MS },
    )
  })
}

onMounted(async () => {
  if (!consultationFlow.consultationId || !consultationFlow.task) return

  try {
    const { lat, lng } = await getCurrentLocation()
    const result = await consultationService.getBranchRecommendations({
      consultationId: consultationFlow.consultationId,
      taskTypeCode: consultationFlow.task.taskTypeCode,
      lat,
      lng,
    })
    recommendations.value = result.recommendations
    selectedRank.value = result.recommendations[0]?.rank ?? null
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '지점을 불러오지 못했어요.'
  } finally {
    isLoading.value = false
  }
})

function handleConfirm() {
  if (!selected.value) return

  consultationFlow.setSelectedBranch(selected.value)
  void router.push(routePaths.visitSummary)
}
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="5" :total="6" :back-to="routePaths.checklist" />
    </template>

    <section class="branches">
      <h1>이렇게 가시는 걸<br />추천드려요</h1>
      <p v-if="!errorMessage">가까운 시간과 적은 대기 시간을 순서로 보여드려요.</p>
      <p v-else class="branches__error">{{ errorMessage }}</p>

      <div class="branches__list">
        <button
          v-for="item in recommendations"
          :key="`${item.branch.branchId}-${item.visitTime.timeSlot}`"
          class="branch-card"
          :class="{ 'branch-card--best': selectedRank === item.rank }"
          type="button"
          @click="selectedRank = item.rank"
        >
          <span class="branch-card__rank">{{ item.rank }}</span>
          <span class="branch-card__body">
            <strong>{{ item.branch.name }}</strong>
            <small>
              <Clock :size="15" :stroke-width="2.2" />
              {{ item.visitTime.dayLabel }} {{ item.visitTime.timeLabel }} · 대기 {{ item.expectedWaitMinutes }}분
            </small>
            <small>
              <MapPin :size="15" :stroke-width="2.2" />
              {{ item.branch.distanceKm != null ? `${item.branch.distanceKm}km` : item.branch.address }}
            </small>
          </span>
          <em v-if="selectedRank === item.rank">선택됨</em>
        </button>
      </div>
    </section>

    <template #footer>
      <div class="branches__footer">
        <BaseButton variant="ghost" block>지도에서 보기</BaseButton>
        <BaseButton block :disabled="!selected" @click="handleConfirm">이 시간으로 정하기</BaseButton>
      </div>
    </template>
  </AppScreen>
</template>

<style scoped>
.branches {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.branches h1 {
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 800;
  line-height: 1.3;
}

.branches > p {
  color: var(--color-ink-soft);
}

.branches__error {
  color: var(--color-alert);
}

.branches__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.branch-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
}

.branch-card--best {
  border-color: var(--color-accent);
}

.branch-card__rank {
  display: grid;
  place-items: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-accent-ink);
  font-weight: 800;
}

.branch-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.branch-card strong {
  font-size: var(--text-base);
  font-weight: 800;
}

.branch-card small {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.branch-card em {
  position: absolute;
  right: var(--space-4);
  top: var(--space-4);
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-accent-ink);
  font-size: var(--text-xs);
  font-style: normal;
  font-weight: 800;
}

.branches__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
