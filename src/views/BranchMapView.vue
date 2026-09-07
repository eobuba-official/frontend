<script setup lang="ts">
import { Building2, LocateFixed, MapPin, Star } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import { mockBranchRecommendations } from '@/mocks'
import { routePaths } from '@/router/routePaths'

const router = useRouter()
const selectedBranch = mockBranchRecommendations.recommendations[0]

const mapBranches = [
  { name: 'KB국민은행 강남지점', x: 26, y: 46, selected: true },
  { name: 'KB국민은행 신논현지점', x: 55, y: 28, selected: false },
  { name: 'KB국민은행 역삼지점', x: 36, y: 72, selected: false },
  { name: 'KB국민은행 삼성지점', x: 78, y: 66, selected: false },
]
</script>

<template>
  <AppScreen>
    <template #header>
      <FlowHeader :current="5" :total="6" :back-to="routePaths.branches" label="지점 선택" hide-home />
    </template>

    <section class="branch-map">
      <div class="branch-map__heading">
        <h1>지도에서 지점 찾기</h1>
        <p>가까운 KB국민은행 지점을 지도에서 확인하고 선택해 주세요.</p>
      </div>

      <div class="branch-map__canvas" aria-label="mock 지도">
        <div class="branch-map__roads" aria-hidden="true"></div>
        <button class="branch-map__locate" type="button">
          <LocateFixed :size="22" :stroke-width="2.4" />
          내 위치
        </button>
        <span class="branch-map__current" aria-label="내 위치">
          <span></span>
          내 위치
        </span>
        <button
          v-for="branch in mapBranches"
          :key="branch.name"
          class="branch-marker"
          :class="{ 'branch-marker--selected': branch.selected }"
          type="button"
          :style="{ left: `${branch.x}%`, top: `${branch.y}%` }"
          @click="router.push(routePaths.branchDetail)"
        >
          <span>KB</span>
          <strong>{{ branch.name.replace('KB국민은행 ', '') }}</strong>
        </button>
      </div>

      <article v-if="selectedBranch" class="selected-branch">
        <div>
          <h2>{{ selectedBranch.branch.name.replace('종로', '강남') }}</h2>
          <p>
            <MapPin :size="20" :stroke-width="2.2" />
            {{ selectedBranch.branch.distanceKm.toFixed(1).replace('1.2', '0.7') }}km
            <span></span>
            서울특별시 강남구 강남대로 372
          </p>
        </div>
        <button class="selected-branch__favorite" type="button" aria-label="즐겨찾기">
          <Star :size="30" :stroke-width="2" />
        </button>

        <div class="selected-branch__actions">
          <BaseButton variant="ghost" block @click="router.push(routePaths.branchDetail)">
            상세보기
          </BaseButton>
          <BaseButton block @click="router.push(routePaths.visitSummary)">이 지점 선택</BaseButton>
        </div>
      </article>
    </section>
  </AppScreen>
</template>

<style scoped>
.branch-map {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-5);
}

.branch-map__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.branch-map h1 {
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 900;
  line-height: 1.25;
}

.branch-map__heading p {
  color: var(--color-ink-soft);
  font-size: var(--text-xl);
  font-weight: 600;
  line-height: 1.45;
}

.branch-map__canvas {
  position: relative;
  flex: 1;
  min-height: 430px;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background:
    linear-gradient(62deg, transparent 0 47%, rgba(255, 255, 255, 0.92) 48% 53%, transparent 54%),
    linear-gradient(120deg, transparent 0 38%, rgba(255, 255, 255, 0.9) 39% 45%, transparent 46%),
    linear-gradient(16deg, transparent 0 55%, rgba(255, 255, 255, 0.95) 56% 60%, transparent 61%),
    radial-gradient(circle at 20% 54%, rgba(255, 248, 222, 0.92) 0 12%, transparent 27%),
    radial-gradient(circle at 78% 72%, rgba(215, 238, 209, 0.74) 0 12%, transparent 20%),
    #eef0f3;
  box-shadow: inset 0 0 0 1px var(--color-line);
}

.branch-map__roads {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(92deg, transparent 0 14%, rgba(255, 255, 255, 0.76) 15% 16%, transparent 17% 38%, rgba(255, 255, 255, 0.76) 39% 40%, transparent 41% 100%),
    linear-gradient(0deg, transparent 0 22%, rgba(255, 255, 255, 0.76) 23% 24%, transparent 25% 58%, rgba(255, 255, 255, 0.76) 59% 60%, transparent 61% 100%);
  opacity: 0.86;
}

.branch-map__locate {
  position: absolute;
  top: var(--space-5);
  right: var(--space-5);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 52px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: 800;
  box-shadow: var(--shadow-card);
  cursor: pointer;
}

.branch-map__current {
  position: absolute;
  left: 56%;
  top: 54%;
  z-index: 2;
  display: grid;
  justify-items: center;
  gap: var(--space-1);
  color: #2f6fed;
  font-size: var(--text-sm);
  font-weight: 800;
}

.branch-map__current span {
  width: 34px;
  height: 34px;
  border: 7px solid rgba(255, 255, 255, 0.86);
  border-radius: var(--radius-pill);
  background: #2f6fed;
  box-shadow: 0 0 0 22px rgba(47, 111, 237, 0.16);
}

.branch-marker {
  position: absolute;
  z-index: 2;
  display: grid;
  justify-items: center;
  gap: var(--space-1);
  width: 116px;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  transform: translate(-50%, -50%);
}

.branch-marker span {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 3px solid var(--color-surface);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-accent-ink);
  font-size: var(--text-xs);
  font-weight: 900;
  box-shadow: 0 10px 18px rgba(216, 170, 32, 0.22);
}

.branch-marker strong {
  font-size: var(--text-sm);
  font-weight: 900;
  line-height: 1.2;
}

.branch-marker--selected span {
  box-shadow:
    0 0 0 18px rgba(255, 188, 0, 0.16),
    0 10px 18px rgba(216, 170, 32, 0.22);
}

.selected-branch {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: 28px 28px var(--radius-lg) var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 -8px 28px rgba(31, 35, 41, 0.08);
}

.selected-branch h2 {
  margin-bottom: var(--space-3);
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-2xl);
  font-weight: 900;
}

.selected-branch p {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  color: var(--color-ink-soft);
  font-size: var(--text-lg);
  font-weight: 600;
}

.selected-branch p span {
  width: 1px;
  height: 18px;
  background: var(--color-line);
}

.selected-branch__favorite {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-faint);
  color: var(--color-ink-soft);
  cursor: pointer;
}

.selected-branch__actions {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
</style>
