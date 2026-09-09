import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

// the sheet's height depends on its content (name/address length can wrap differently
// per item), so measure it rather than assume a fixed height — callers use sheetHeight
// to keep a floating locate button riding right above it, and onMeasured to re-center
// the map around the newly selected item once its real height is known
export function useBranchSheet<T>(getSelected: () => T | null, onMeasured?: (item: T, heightPx: number) => void) {
  const sheetEl = ref<HTMLElement | null>(null)
  const sheetHeight = ref(0)
  let observer: ResizeObserver | null = null

  watch(getSelected, async (item) => {
    await nextTick()

    observer?.disconnect()
    observer = null

    if (item && sheetEl.value) {
      sheetHeight.value = sheetEl.value.offsetHeight
      onMeasured?.(item, sheetHeight.value)
      observer = new ResizeObserver(() => {
        if (sheetEl.value) sheetHeight.value = sheetEl.value.offsetHeight
      })
      observer.observe(sheetEl.value)
    }
  })

  onBeforeUnmount(() => observer?.disconnect())

  return { sheetEl, sheetHeight }
}
