import { isLocationPermissionEnabled } from './permissionPreferences'

// the seeded branch data only covers a handful of central-Seoul locations, so this is
// also what callers retry against when a real GPS query comes back empty
export const FALLBACK_LOCATION = { lat: 37.5665, lng: 126.978 }

const GEOLOCATION_TIMEOUT_MS = 5000

export interface LocationResult {
  lat: number
  lng: number
  // true when this is FALLBACK_LOCATION because a real GPS fix wasn't available —
  // callers that show the location on screen should surface this, not stay silent
  isFallback: boolean
}

export function getCurrentLocation(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation || !isLocationPermissionEnabled()) {
      resolve({ ...FALLBACK_LOCATION, isFallback: true })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude, isFallback: false }),
      () => resolve({ ...FALLBACK_LOCATION, isFallback: true }),
      { timeout: GEOLOCATION_TIMEOUT_MS },
    )
  })
}
