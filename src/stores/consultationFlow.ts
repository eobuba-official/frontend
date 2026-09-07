import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { InputMethod } from '@/api/types'

export const useConsultationFlowStore = defineStore('consultationFlow', () => {
  const utterance = ref('')
  const inputMethod = ref<InputMethod>('TEXT')
  const sttConfidence = ref<number | null>(null)

  function setUtterance(payload: { utterance: string; inputMethod: InputMethod; sttConfidence?: number | null }) {
    utterance.value = payload.utterance
    inputMethod.value = payload.inputMethod
    sttConfidence.value = payload.sttConfidence ?? null
  }

  function reset() {
    utterance.value = ''
    inputMethod.value = 'TEXT'
    sttConfidence.value = null
  }

  return { utterance, inputMethod, sttConfidence, setUtterance, reset }
})
