import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useConsultationFlowStore } from '../consultationFlow'

describe('consultationFlow store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('stores the utterance captured from voice input along with its confidence', () => {
    const store = useConsultationFlowStore()

    store.setUtterance({ utterance: '통장을 잃어버렸어요', inputMethod: 'VOICE', sttConfidence: 0.87 })

    expect(store.utterance).toBe('통장을 잃어버렸어요')
    expect(store.inputMethod).toBe('VOICE')
    expect(store.sttConfidence).toBe(0.87)
  })

  it('normalizes a missing sttConfidence to null for text input', () => {
    const store = useConsultationFlowStore()

    store.setUtterance({ utterance: '통장을 잃어버렸어요', inputMethod: 'TEXT' })

    expect(store.sttConfidence).toBeNull()
  })

  it('resets every field back to its initial value', () => {
    const store = useConsultationFlowStore()
    store.setUtterance({ utterance: '통장을 잃어버렸어요', inputMethod: 'VOICE', sttConfidence: 0.87 })

    store.reset()

    expect(store.utterance).toBe('')
    expect(store.inputMethod).toBe('TEXT')
    expect(store.sttConfidence).toBeNull()
  })
})
