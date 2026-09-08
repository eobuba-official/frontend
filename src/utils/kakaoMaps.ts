export interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

export interface KakaoMap {
  setCenter(position: KakaoLatLng): void
}

export interface KakaoMarkerImage {
  readonly __kakaoMarkerImageBrand?: never
}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void
  setImage(image: KakaoMarkerImage): void
  getPosition(): KakaoLatLng
}

export interface KakaoMapsNamespace {
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  Point: new (x: number, y: number) => unknown
  Size: new (width: number, height: number) => unknown
  MarkerImage: new (src: string, size: unknown, options?: { offset?: unknown }) => KakaoMarkerImage
  Marker: new (options: { position: KakaoLatLng; image?: KakaoMarkerImage }) => KakaoMarker
  event: {
    addListener(target: KakaoMarker, type: string, handler: () => void): void
  }
  load(callback: () => void): void
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMapsNamespace }
  }
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
