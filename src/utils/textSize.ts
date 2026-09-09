export const textSizeOptions = [
  { value: 'normal', label: '보통', scale: '100%' },
  { value: 'large', label: '크게', scale: '125%' },
  { value: 'extra-large', label: '아주 크게', scale: '150%' },
] as const

export type TextSize = (typeof textSizeOptions)[number]['value']
const storageKey = 'eobuba.textSize'

export function getTextSize(): TextSize {
  try {
    const saved = localStorage.getItem(storageKey)
    return textSizeOptions.find((option) => option.value === saved)?.value ?? 'large'
  } catch {
    return 'large'
  }
}

export function applyTextSize(value: TextSize) {
  document.documentElement.style.fontSize = textSizeOptions.find(
    (option) => option.value === value,
  )!.scale
}

export function saveTextSize(value: TextSize) {
  applyTextSize(value)
  try {
    localStorage.setItem(storageKey, value)
  } catch {
    // Keep the chosen size for this session when browser storage is unavailable.
  }
}
