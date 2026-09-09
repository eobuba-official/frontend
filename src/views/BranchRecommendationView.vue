<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Clock, MapPin, Timer } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BottomActionBar from '@/components/common/BottomActionBar.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import { routePaths } from '@/router/routePaths'
import { consultationService } from '@/services/consultationService'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import { FALLBACK_LOCATION, getCurrentLocation } from '@/utils/geolocation'
import type { BranchRecommendation } from '@/api/types'

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

onMounted(async () => {
  if (!consultationFlow.consultationId || !consultationFlow.task) return

  try {
    const { lat, lng } = await getCurrentLocation()
    const result = await consultationService.getBranchRecommendationsWithFallback(
      {
        consultationId: consultationFlow.consultationId,
        taskTypeCode: consultationFlow.task.taskTypeCode,
        lat,
        lng,
      },
      FALLBACK_LOCATION,
    )
    recommendations.value = result.recommendations
    selectedRank.value = result.recommendations[0]?.rank ?? null
    consultationFlow.setRecommendations(result.recommendations)
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

function viewOnMap() {
  if (selected.value) {
    consultationFlow.setSelectedBranch(selected.value)
  }
  void router.push(routePaths.branchMap)
}
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="5" :total="6" :back-to="routePaths.checklist" label="지점 선택" />
    </template>

    <section class="branches">
      <h1>방문하기 좋은 지점이에요</h1>
      <p v-if="isLoading">가까운 지점과 시간을 찾고 있어요.</p>
      <p v-else-if="!errorMessage">거리와 예상 대기 시간을 비교해 보세요.</p>
      <p v-else class="branches__error">{{ errorMessage }}</p>

      <div class="branches__list">
        <button
          v-for="item in recommendations"
          :key="`${item.branch.branchId}-${item.visitTime.timeSlot}`"
          class="branch-card"
          :class="{ 'branch-card--best': selectedRank === item.rank }"
          type="button"
          :aria-pressed="selectedRank === item.rank"
          @click="selectedRank = item.rank"
        >
          <span class="branch-card__rank">{{ item.rank }}</span>
          <span class="branch-card__body">
            <span class="branch-card__header">
              <strong>{{ item.branch.name }}</strong>
              <em v-if="selectedRank === item.rank">선택</em>
            </span>
            <span class="branch-card__details">
              <span class="branch-card__time">
                <Clock :size="16" :stroke-width="2.2" />
                <b>{{ item.visitTime.dayLabel }} {{ item.visitTime.timeLabel }}</b>
              </span>
              <span class="branch-card__wait">
                <Timer :size="16" :stroke-width="2.2" />
                <span>대기</span>
                <b>{{ item.expectedWaitMinutes }}분</b>
              </span>
            </span>
            <small class="branch-card__distance">
              <MapPin :size="16" :stroke-width="2.2" />
              {{ item.branch.distanceKm != null ? `${item.branch.distanceKm}km` : item.branch.address }}
            </small>
          </span>
        </button>
      </div>
    </section>

    <template #footer>
      <BottomActionBar stacked>
        <BaseButton variant="ghost" block @click="viewOnMap">지도에서 보기</BaseButton>
        <BaseButton block :disabled="!selected" @click="handleConfirm">방문 일정 확인하기</BaseButton>
      </BottomActionBar>
    </template>
  </AppScreen>
</template>

<style scoped>
.branches {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    transform 160ms ease;
}

.branch-card--best {
  border-color: var(--color-accent);
  background: var(--color-yellow-faint);
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

.branch-card:not(.branch-card--best) .branch-card__rank {
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
}

.branch-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.branch-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.branch-card strong {
  font-size: var(--text-base);
  font-weight: 800;
}

.branch-card__details {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-1);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.branch-card__time,
.branch-card__wait {
  display: flex;
  align-items: center;
  gap: 6px;
}

.branch-card__wait {
  padding-left: var(--space-2);
  border-left: 1px solid var(--color-line);
}

.branch-card__time b,
.branch-card__wait b {
  color: var(--color-ink);
  font-weight: 700;
}

.branch-card__distance {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.branch-card__details svg,
.branch-card__distance svg {
  flex: 0 0 16px;
}

.branch-card em {
  flex-shrink: 0;
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-accent-ink);
  font-size: var(--text-2xs);
  font-style: normal;
  font-weight: 800;
}

</style>
