<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Phone } from '@lucide/vue'
import AppScreen from '@/components/common/AppScreen.vue'
import BottomTabBar from '@/components/common/BottomTabBar.vue'
import MapBottomSheet from '@/components/common/MapBottomSheet.vue'
import MapLoadingOverlay from '@/components/common/MapLoadingOverlay.vue'
import MapLocateButton from '@/components/common/MapLocateButton.vue'
import { buildMockBranchesNear } from '@/mocks/branches'
import { consultationService } from '@/services/consultationService'
import { branchMarkerImage, centerAboveSheet, myLocationMarkerImage } from '@/utils/branchMarkers'
import { FALLBACK_LOCATION, getCurrentLocation } from '@/utils/geolocation'
import { loadKakaoMaps, relayoutWhenResized } from '@/utils/kakaoMaps'
import type { KakaoCircle, KakaoMap, KakaoMarker } from '@/utils/kakaoMaps'
import type { NearbyBranch } from '@/api/types'

const SEARCH_RADIUS_KM = 1
const EARTH_RADIUS_KM = 6371.0088
const BUTTON_SHEET_GAP = 16
// mirrors the backend's default piggyback.recommendation.walking-speed-kmh, used only
// to estimate walk time for the mock fallback (the real API returns its own walkMinutes)
const WALKING_SPEED_KMH = 4

const mapContainer = ref<HTMLDivElement | null>(null)
const isLoadingMap = ref(true)
const mapError = ref('')
const locationNotice = ref('')
const hasMyLocation = ref(false)
const selectedBranchId = ref<number | null>(null)
const rawBranches = ref<NearbyBranch[]>([])

let map: KakaoMap | null = null
let myLocationMarker: KakaoMarker | null = null
let stopRelayout: (() => void) | null = null
let branchMarkers: { branch: NearbyBranch; marker: KakaoMarker }[] = []

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

// same Haversine formula the backend's DistanceCalculator uses, so distances here
// line up once this screen switches to the real "nearby branches" endpoint's own
// distance figures too
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function useMockBranches(origin: { lat: number; lng: number }) {
  rawBranches.value = buildMockBranchesNear(origin).map((branch) => {
    const km = distanceKm(origin.lat, origin.lng, branch.lat, branch.lng)
    return {
      ...branch,
      distanceKm: Number(km.toFixed(2)),
      walkMinutes: Math.round((km / WALKING_SPEED_KMH) * 60),
    }
  })
}

async function loadNearbyBranches(origin: { lat: number; lng: number }) {
  try {
    const result = await consultationService.getNearbyBranches({ lat: origin.lat, lng: origin.lng, limit: 20 })
    rawBranches.value = result.branches
  } catch {
    // /branches/nearby unreachable — fall back to mock branches near the viewer,
    // with walk time estimated the same way the backend would (distance ÷ 4km/h)
    useMockBranches(origin)
  }
}

const nearbyBranches = computed(() =>
  rawBranches.value.filter((branch) => (branch.distanceKm ?? 0) <= SEARCH_RADIUS_KM),
)

async function initMap() {
  if (!mapContainer.value) return
  isLoadingMap.value = true
  mapError.value = ''
  locationNotice.value = ''

  try {
    await loadKakaoMaps()
    const maps = window.kakao!.maps
    if (!mapContainer.value) return

    // paint the map right away at a fallback center instead of blocking the first
    // render on the GPS fix (up to 5s) or the nearby-branches fetch — both refine
    // the view in the background once they resolve, so this is what made the map
    // feel slow to load before
    const fallbackCenter = new maps.LatLng(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng)
    const mapInstance = new maps.Map(mapContainer.value, { center: fallbackCenter, level: 5 })
    map = mapInstance
    stopRelayout = relayoutWhenResized(mapInstance, mapContainer.value)
    maps.event.addListener(mapInstance, 'click', () => {
      selectedBranchId.value = null
    })
    isLoadingMap.value = false

    const location = await getCurrentLocation()
    hasMyLocation.value = !location.isFallback
    if (location.isFallback) {
      locationNotice.value = '위치 확인이 안 돼서 서울시청 기준으로 보여드려요. 위치 권한을 확인해 주세요.'
    }

    const center = new maps.LatLng(location.lat, location.lng)
    mapInstance.setCenter(center)

    myLocationMarker = new maps.Marker({ position: center, image: myLocationMarkerImage(maps) })
    myLocationMarker.setMap(mapInstance)

    const circle: KakaoCircle = new maps.Circle({
      center,
      radius: SEARCH_RADIUS_KM * 1000,
      strokeWeight: 1,
      strokeColor: '#ef6a67',
      strokeOpacity: 0.5,
      fillColor: '#ef6a67',
      fillOpacity: 0.12,
    })
    circle.setMap(mapInstance)

    await loadNearbyBranches(location)

    branchMarkers = nearbyBranches.value.map((branch) => {
      const marker = new maps.Marker({
        position: new maps.LatLng(branch.lat, branch.lng),
        image: branchMarkerImage(maps, false),
      })
      marker.setMap(mapInstance)
      maps.event.addListener(marker, 'click', () => {
        selectedBranchId.value = branch.branchId
      })
      return { branch, marker }
    })
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : '지도를 불러오지 못했어요.'
  } finally {
    isLoadingMap.value = false
  }
}

function recenterOnMe() {
  if (!map || !myLocationMarker) return
  map.setCenter(myLocationMarker.getPosition())
}

const selectedBranch = computed(
  () => nearbyBranches.value.find((branch) => branch.branchId === selectedBranchId.value) ?? null,
)

const sheetHeight = ref(0)

const locateBtnOffset = computed(() => (selectedBranch.value ? sheetHeight.value + BUTTON_SHEET_GAP : 0))

function centerMapAboveSheet(heightPx: number) {
  const branch = selectedBranch.value
  if (!branch || !map) return
  const maps = window.kakao?.maps
  if (!maps) return
  centerAboveSheet(map, maps, new maps.LatLng(branch.lat, branch.lng), heightPx)
}

function closeSheet() {
  selectedBranchId.value = null
}

function callBranch(branch: NearbyBranch) {
  window.location.href = `tel:${branch.phone}`
}

function formatDistance(km: number | null) {
  if (km == null) return ''
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

const sheetMetaLines = computed(() => {
  const branch = selectedBranch.value
  if (!branch) return []
  const walk = branch.walkMinutes != null ? ` · 도보 약 ${branch.walkMinutes}분` : ''
  return [`현재 위치에서 약 ${formatDistance(branch.distanceKm)}${walk}`, branch.address]
})

watch(selectedBranchId, () => {
  const maps = window.kakao?.maps
  if (!maps) return
  branchMarkers.forEach(({ branch, marker }) => {
    marker.setImage(branchMarkerImage(maps, branch.branchId === selectedBranchId.value))
  })
})

onMounted(initMap)

onBeforeUnmount(() => stopRelayout?.())
</script>

<template>
  <AppScreen no-padding flush-footer>
    <div class="explore">
      <div class="explore__topbar">
        <span class="explore__title">가까운 은행 찾기</span>
      </div>

      <div class="explore__content">
        <div ref="mapContainer" class="explore__map"></div>

        <MapLoadingOverlay v-if="isLoadingMap" />
        <p v-else-if="mapError" class="explore__status explore__status--error">{{ mapError }}</p>
        <p v-else-if="locationNotice" class="explore__status">{{ locationNotice }}</p>

        <MapLocateButton :disabled="!hasMyLocation" :offset="locateBtnOffset" @click="recenterOnMe" />

        <MapBottomSheet
          :sheet-key="selectedBranch?.branchId ?? null"
          :title="selectedBranch?.name ?? ''"
          :meta-lines="sheetMetaLines"
          @close="closeSheet"
          @measure="sheetHeight = $event"
          @opened="centerMapAboveSheet"
        >
          <template #actions>
            <button
              v-if="selectedBranch"
              type="button"
              class="explore__sheet-call"
              @click="callBranch(selectedBranch)"
            >
              <Phone :size="18" :stroke-width="2.2" />
              전화하기
            </button>
          </template>
        </MapBottomSheet>
      </div>
    </div>

    <template #footer>
      <BottomTabBar />
    </template>
  </AppScreen>
</template>

<style scoped>
.explore {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.explore__content {
  position: relative;
  flex: 1;
  min-height: 0;
}

.explore__map {
  position: absolute;
  inset: 0;
  background: var(--color-surface-alt);
}

.explore__topbar {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  padding: var(--space-3) var(--screen-padding-x);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

.explore__title {
  display: block;
  color: var(--color-ink);
  font-size: var(--text-base);
  font-weight: 800;
  text-align: center;
}

.explore__status {
  position: absolute;
  top: var(--space-4);
  left: var(--screen-padding-x);
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

.explore__status--error {
  color: var(--color-alert);
}

.explore__sheet-call {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  min-height: 52px;
  margin-top: var(--space-4);
  border: 0;
  border-radius: var(--radius-lg);
  background: var(--color-yellow-faint);
  color: var(--color-accent-deep);
  font-size: var(--text-base);
  font-weight: 800;
  cursor: pointer;
}
</style>
