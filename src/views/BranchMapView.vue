<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Clock, Phone, X } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import MapLoadingOverlay from '@/components/common/MapLoadingOverlay.vue'
import MapLocateButton from '@/components/common/MapLocateButton.vue'
import kbLogo from '@/assets/img/kb.png'
import { routePaths } from '@/router/routePaths'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import { useBranchSheet } from '@/composables/useBranchSheet'
import { branchMarkerImage, centerAboveSheet, myLocationMarkerImage } from '@/utils/branchMarkers'
import { loadKakaoMaps } from '@/utils/kakaoMaps'
import type { KakaoMap, KakaoMarker } from '@/utils/kakaoMaps'
import { isLocationPermissionEnabled } from '@/utils/permissionPreferences'

const BUTTON_SHEET_GAP = 16

const router = useRouter()
const consultationFlow = useConsultationFlowStore()

if (consultationFlow.recommendations.length === 0) {
  router.replace(routePaths.branches)
}

const mapContainer = ref<HTMLDivElement | null>(null)
const isLoadingMap = ref(true)
const mapError = ref('')
const hasMyLocation = ref(false)

// same branch can appear more than once in the recommendation list (different
// visit time slots) — the map should still only show one pin per physical branch
const uniqueBranches = computed(() => {
  const seenBranchIds = new Set<number>()
  return consultationFlow.recommendations.filter((item) => {
    if (seenBranchIds.has(item.branch.branchId)) return false
    seenBranchIds.add(item.branch.branchId)
    return true
  })
})

const selectedRank = ref<number | null>(
  consultationFlow.selectedBranch?.rank ?? uniqueBranches.value[0]?.rank ?? null,
)

const selected = computed(
  () => consultationFlow.recommendations.find((item) => item.rank === selectedRank.value) ?? null,
)

let map: KakaoMap | null = null
let myLocationMarker: KakaoMarker | null = null
const markers: { rank: number; marker: KakaoMarker }[] = []

async function initMap() {
  isLoadingMap.value = true
  mapError.value = ''

  try {
    await loadKakaoMaps()
    const maps = window.kakao!.maps

    const first = uniqueBranches.value[0]
    if (!first || !mapContainer.value) {
      mapError.value = '지점 위치를 지도에 표시하지 못했어요.'
      return
    }

    const mapInstance = new maps.Map(mapContainer.value, {
      center: new maps.LatLng(first.branch.lat, first.branch.lng),
      level: 5,
    })
    map = mapInstance

    uniqueBranches.value.forEach((item) => {
      const marker = new maps.Marker({
        position: new maps.LatLng(item.branch.lat, item.branch.lng),
        image: branchMarkerImage(maps, item.rank === selectedRank.value),
      })
      marker.setMap(mapInstance)
      maps.event.addListener(marker, 'click', () => {
        selectedRank.value = item.rank
      })
      markers.push({ rank: item.rank, marker })
    })

    maps.event.addListener(mapInstance, 'click', () => {
      selectedRank.value = null
    })

    if (isLocationPermissionEnabled() && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const myPosition = new maps.LatLng(position.coords.latitude, position.coords.longitude)
          const marker = new maps.Marker({ position: myPosition, image: myLocationMarkerImage(maps) })
          marker.setMap(mapInstance)
          myLocationMarker = marker
          hasMyLocation.value = true
        },
        () => {},
        { timeout: 4000 },
      )
    }
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : '지도를 불러오지 못했어요.'
  } finally {
    isLoadingMap.value = false
  }
}

watch(selectedRank, () => {
  const maps = window.kakao?.maps
  if (!maps) return
  markers.forEach(({ rank, marker }) => {
    marker.setImage(branchMarkerImage(maps, rank === selectedRank.value))
  })
})

const { sheetEl, sheetHeight } = useBranchSheet(
  () => selected.value,
  (item, heightPx) => {
    if (!map) return
    const maps = window.kakao?.maps
    if (!maps) return
    centerAboveSheet(map, maps, new maps.LatLng(item.branch.lat, item.branch.lng), heightPx)
  },
)

const locateBtnOffset = computed(() => (selected.value ? sheetHeight.value + BUTTON_SHEET_GAP : 0))

function recenterOnMe() {
  if (!map || !myLocationMarker) return
  map.setCenter(myLocationMarker.getPosition())
}

function closeSheet() {
  selectedRank.value = null
}

function selectBranch() {
  if (!selected.value) return
  consultationFlow.setSelectedBranch(selected.value)
  void router.push(routePaths.visitSummary)
}

function callBranch() {
  if (!selected.value) return
  window.location.href = `tel:${selected.value.branch.phone}`
}

onMounted(initMap)
</script>

<template>
  <AppScreen no-padding>
    <template #header>
      <FlowHeader :current="5" :total="6" :back-to="routePaths.branches" label="지점 선택" hide-home />
    </template>

    <div class="branch-map">
      <div ref="mapContainer" class="branch-map__kakao"></div>

      <MapLoadingOverlay v-if="isLoadingMap" />
      <p v-else-if="mapError" class="branch-map__status branch-map__status--error">{{ mapError }}</p>

      <MapLocateButton :disabled="!hasMyLocation" :offset="locateBtnOffset" @click="recenterOnMe" />

      <Transition name="branch-sheet">
        <article v-if="selected" ref="sheetEl" class="selected-branch">
          <button type="button" class="selected-branch__close" aria-label="닫기" @click="closeSheet">
            <X :size="18" :stroke-width="2.4" />
          </button>

          <div class="selected-branch__header">
            <span class="selected-branch__icon">
              <img :src="kbLogo" alt="" />
            </span>
            <div class="selected-branch__info">
              <h2>{{ selected.branch.name }}</h2>
              <p class="selected-branch__meta">
                <template v-if="selected.branch.distanceKm != null">{{ selected.branch.distanceKm }}km · </template>
                {{ selected.branch.address }}
              </p>
            </div>
          </div>

          <p class="selected-branch__wait">
            <Clock :size="16" :stroke-width="2.2" />
            {{ selected.visitTime.dayLabel }} {{ selected.visitTime.timeLabel }} · 대기
            {{ selected.expectedWaitMinutes }}분
          </p>

          <div class="selected-branch__actions">
            <button
              class="selected-branch__call"
              type="button"
              aria-label="지점에 전화하기"
              @click="callBranch"
            >
              <Phone :size="22" :stroke-width="2.1" />
            </button>
            <BaseButton @click="selectBranch">이 지점 선택</BaseButton>
          </div>
        </article>
      </Transition>
    </div>
  </AppScreen>
</template>

<style scoped>
.branch-map {
  position: relative;
  flex: 1;
  min-height: 0;
}

.branch-map__kakao {
  position: absolute;
  inset: 0;
  background: var(--color-surface-alt);
}

.branch-map__status {
  position: absolute;
  top: var(--space-5);
  left: var(--space-5);
  z-index: 2;
  max-width: 62%;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 700;
  box-shadow: var(--shadow-card);
}

.branch-map__status--error {
  color: var(--color-alert);
}

.selected-branch {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 3;
  padding: var(--space-5) var(--screen-padding-x) calc(var(--space-5) + env(safe-area-inset-bottom, 0px));
  border-radius: 24px 24px 0 0;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-bottom: 0;
}

.selected-branch__close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
  cursor: pointer;
}

.selected-branch__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.selected-branch__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-yellow-light);
}

.selected-branch__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selected-branch__info {
  flex: 1;
  min-width: 0;
}

.selected-branch h2 {
  padding-right: var(--space-8);
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: var(--text-xl);
  font-weight: 900;
}

.selected-branch__meta {
  margin-top: var(--space-1);
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  font-weight: 600;
}

.selected-branch__wait {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  color: var(--color-accent-deep);
  font-size: var(--text-base);
  font-weight: 700;
}

.selected-branch__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.selected-branch__call {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-faint);
  color: var(--color-accent-deep);
  cursor: pointer;
}

.selected-branch__actions .base-button {
  flex: 1;
}

.branch-sheet-enter-active,
.branch-sheet-leave-active {
  transition: transform 220ms cubic-bezier(0.65, 0, 0.35, 1);
}

.branch-sheet-enter-from,
.branch-sheet-leave-to {
  transform: translateY(100%);
}
</style>
