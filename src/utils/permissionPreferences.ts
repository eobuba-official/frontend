const LOCATION_PREF_KEY = 'eobuba.locationPermission'
const VOICE_PREF_KEY = 'eobuba.voicePermission'

export function isLocationPermissionEnabled() {
  return window.localStorage.getItem(LOCATION_PREF_KEY) !== 'false'
}

export function isVoicePermissionEnabled() {
  return window.localStorage.getItem(VOICE_PREF_KEY) !== 'false'
}

export function setLocationPermissionEnabled(enabled: boolean) {
  window.localStorage.setItem(LOCATION_PREF_KEY, String(enabled))
}

export function setVoicePermissionEnabled(enabled: boolean) {
  window.localStorage.setItem(VOICE_PREF_KEY, String(enabled))
}

export async function isBrowserPermissionBlocked(name: 'microphone' | 'geolocation'): Promise<boolean> {
  try {
    if (!navigator.permissions?.query) return false
    const status = await navigator.permissions.query({ name: name as PermissionName })
    return status.state === 'denied'
  } catch {
    return false
  }
}
