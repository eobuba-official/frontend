<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Clock, Phone } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import MapBottomSheet from '@/components/common/MapBottomSheet.vue'
import MapLoadingOverlay from '@/components/common/MapLoadingOverlay.vue'
import MapLocateButton from '@/components/common/MapLocateButton.vue'
import { routePaths } from '@/router/routePaths'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import { branchMarkerImage, centerAboveSheet, myLocationMarkerImage } from '@/utils/branchMarkers'
import { loadKakaoMaps, relayoutWhenResized } from '@/utils/kakaoMaps'
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
let stopRelayout: (() => void) | null = null
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
    stopRelayout = relayoutWhenResized(mapInstance, mapContainer.value)

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

    // the sheet is already open for the preselected branch, so its height was measured
    // before the map existed — apply the offset now that there is a map to pan
    if (selected.value && sheetHeight.value > 0) {
      centerMapAboveSheet(sheetHeight.value)
    }

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

const sheetHeight = ref(0)

const locateBtnOffset = computed(() => (selected.value ? sheetHeight.value + BUTTON_SHEET_GAP : 0))

const sheetMetaLines = computed(() => {
  const item = selected.value
  if (!item) return []
  const distance = item.branch.distanceKm != null ? `${item.branch.distanceKm}km · ` : ''
  return [`${distance}${item.branch.address}`]
})

function centerMapAboveSheet(heightPx: number) {
  const item = selected.value
  if (!item || !map) return
  const maps = window.kakao?.maps
  if (!maps) return
  centerAboveSheet(map, maps, new maps.LatLng(item.branch.lat, item.branch.lng), heightPx)
}

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

onBeforeUnmount(() => stopRelayout?.())
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

      <MapBottomSheet
        :sheet-key="selected?.rank ?? null"
        :title="selected?.branch.name ?? ''"
        :meta-lines="sheetMetaLines"
        @close="closeSheet"
        @measure="sheetHeight = $event"
        @opened="centerMapAboveSheet"
      >
        <p v-if="selected" class="selected-branch__wait">
          <Clock :size="16" :stroke-width="2.2" />
          {{ selected.visitTime.dayLabel }} {{ selected.visitTime.timeLabel }} · 대기
          {{ selected.expectedWaitMinutes }}분
        </p>

        <template #actions>
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
        </template>
      </MapBottomSheet>
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
</style>
