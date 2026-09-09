export interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

export interface KakaoPoint {
  x: number
  y: number
}

export interface KakaoProjection {
  pointFromCoords(latlng: KakaoLatLng): KakaoPoint
  coordsFromPoint(point: KakaoPoint): KakaoLatLng
}

export interface KakaoMap {
  setCenter(position: KakaoLatLng): void
  // animates to the new center, unlike setCenter's instant jump
  panTo(position: KakaoLatLng): void
  getProjection(): KakaoProjection
  // re-measures the container, keeping the current center
  relayout(): void
}

export interface KakaoMarkerImage {
  readonly __kakaoMarkerImageBrand?: never
}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void
  setImage(image: KakaoMarkerImage): void
  getPosition(): KakaoLatLng
}

export interface KakaoCircle {
  setMap(map: KakaoMap | null): void
}

export interface KakaoMapsNamespace {
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  Point: new (x: number, y: number) => KakaoPoint
  Size: new (width: number, height: number) => unknown
  MarkerImage: new (src: string, size: unknown, options?: { offset?: unknown }) => KakaoMarkerImage
  Marker: new (options: { position: KakaoLatLng; image?: KakaoMarkerImage }) => KakaoMarker
  Circle: new (options: {
    center: KakaoLatLng
    radius: number
    strokeWeight?: number
    strokeColor?: string
    strokeOpacity?: number
    fillColor?: string
    fillOpacity?: number
  }) => KakaoCircle
  event: {
    addListener(target: KakaoMarker | KakaoMap, type: string, handler: () => void): void
  }
  load(callback: () => void): void
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMapsNamespace }
  }
}

/**
 * Kakao measures the container once, when the map is created. If that happens while the
 * element still has no size — a route transition that hasn't settled, a parent that lays
 * out a frame later — the map renders blank and stays that way until something forces a
 * re-measure, which is why re-entering the screen "fixes" it. Watch the container and
 * relayout whenever it reports a real size. Returns a cleanup function.
 */
export function relayoutWhenResized(map: KakaoMap, container: HTMLElement) {
  if (typeof ResizeObserver === 'undefined') return () => {}

  const observer = new ResizeObserver(() => {
    if (container.clientWidth > 0 && container.clientHeight > 0) {
      map.relayout()
    }
  })
  observer.observe(container)

  return () => observer.disconnect()
}

let loadPromise: Promise<void> | null = null

export function loadKakaoMaps(): Promise<void> {
  if (window.kakao?.maps) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const appKey = import.meta.env.VITE_KAKAO_MAP_KEY
    if (!appKey) {
      reject(new Error('카카오맵 키가 설정되지 않았어요.'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
    script.onload = () => window.kakao?.maps.load(() => resolve())
    script.onerror = () => reject(new Error('카카오맵을 불러오지 못했어요.'))
    document.head.appendChild(script)
  })

  return loadPromise
}
