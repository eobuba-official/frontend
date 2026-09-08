<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { LocateFixed, MapPin, Phone } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppScreen from '@/components/common/AppScreen.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FlowHeader from '@/components/common/FlowHeader.vue'
import { routePaths } from '@/router/routePaths'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import { loadKakaoMaps } from '@/utils/kakaoMaps'
import type { KakaoMap, KakaoMarker } from '@/utils/kakaoMaps'
import { isLocationPermissionEnabled } from '@/utils/permissionPreferences'

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

function pinImageSrc() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38"><path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.7 23.3 0 15 0z" fill="#e8443f"/><circle cx="15" cy="15" r="6.2" fill="#ffffff"/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function pinImage(isSelected: boolean) {
  const maps = window.kakao!.maps
  const scale = isSelected ? 1.35 : 1
  const width = Math.round(30 * scale)
  const height = Math.round(38 * scale)
  return new maps.MarkerImage(pinImageSrc(), new maps.Size(width, height), {
    offset: new maps.Point(Math.round(width / 2), height),
  })
}

function myLocationImage() {
  const maps = window.kakao!.maps
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="8" fill="#2f6fed" stroke="#ffffff" stroke-width="3"/></svg>`
  return new maps.MarkerImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, new maps.Size(24, 24), {
    offset: new maps.Point(12, 12),
  })
}

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
        image: pinImage(item.rank === selectedRank.value),
      })
      marker.setMap(mapInstance)
      maps.event.addListener(marker, 'click', () => {
        selectedRank.value = item.rank
      })
      markers.push({ rank: item.rank, marker })
    })

    if (isLocationPermissionEnabled() && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const myPosition = new maps.LatLng(position.coords.latitude, position.coords.longitude)
          const marker = new maps.Marker({ position: myPosition, image: myLocationImage() })
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
  markers.forEach(({ rank, marker }) => {
    marker.setImage(pinImage(rank === selectedRank.value))
  })
})

function recenterOnMe() {
  if (!map || !myLocationMarker) return
  map.setCenter(myLocationMarker.getPosition())
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

      <p v-if="isLoadingMap" class="branch-map__status">지도를 불러오고 있어요...</p>
      <p v-else-if="mapError" class="branch-map__status branch-map__status--error">{{ mapError }}</p>

      <button class="branch-map__locate" type="button" :disabled="!hasMyLocation" @click="recenterOnMe">
        <LocateFixed :size="22" :stroke-width="2.4" />
        내 위치
      </button>

      <article v-if="selected" class="selected-branch">
        <div>
          <h2>{{ selected.branch.name }}</h2>
          <p>
            <MapPin :size="20" :stroke-width="2.2" />
            <template v-if="selected.branch.distanceKm != null">{{ selected.branch.distanceKm }}km</template>
            <span></span>
            {{ selected.branch.address }}
          </p>
        </div>
        <button class="selected-branch__call" type="button" aria-label="지점에 전화하기" @click="callBranch">
          <Phone :size="26" :stroke-width="2.1" />
        </button>

        <div class="selected-branch__actions">
          <BaseButton block @click="selectBranch">이 지점 선택</BaseButton>
        </div>
      </article>
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

.branch-map__locate:disabled {
  color: var(--color-ink-faint);
  cursor: not-allowed;
}

.selected-branch {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-4);
  padding: var(--space-5) var(--screen-padding-x) calc(var(--space-5) + env(safe-area-inset-bottom, 0px));
  border-radius: 28px 28px 0 0;
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

.selected-branch__call {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-yellow-faint);
  color: var(--color-accent-deep);
  cursor: pointer;
}

.selected-branch__actions {
  display: grid;
  grid-column: 1 / -1;
}
</style>
