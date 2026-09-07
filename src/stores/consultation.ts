import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AnalyzeResult, InputMethod, TaskType } from '@/api/types'
import { consultationService } from '@/services'

const VOICE_MOCK_UTTERANCE = '통장을 잃어버렸는데 다시 만들고 싶어'

export const useConsultationStore = defineStore('consultation', () => {
  const utterance = ref('')
  const inputMethod = ref<InputMethod>('VOICE')
  const analyzeResult = ref<AnalyzeResult | null>(null)
  const isAnalyzing = ref(false)
  const errorMessage = ref('')

  const correctedUtterance = computed(
    () => analyzeResult.value?.classification.correctedUtterance || utterance.value,
  )
  const currentTask = computed(() => analyzeResult.value?.classification.task ?? null)
  const candidateTasks = computed(() => analyzeResult.value?.classification.candidates ?? [])

  function reset() {
    utterance.value = ''
    inputMethod.value = 'VOICE'
    analyzeResult.value = null
    isAnalyzing.value = false
    errorMessage.value = ''
  }

  function setUtterance(nextUtterance: string, nextInputMethod: InputMethod) {
    utterance.value = nextUtterance.trim()
    inputMethod.value = nextInputMethod
    analyzeResult.value = null
    errorMessage.value = ''
  }

  async function analyzeCurrentUtterance() {
    const requestUtterance = utterance.value.trim() || VOICE_MOCK_UTTERANCE
    utterance.value = requestUtterance
    isAnalyzing.value = true
    errorMessage.value = ''

    try {
      analyzeResult.value = await consultationService.analyze({
        utterance: requestUtterance,
        inputMethod: inputMethod.value,
        sttConfidence: null,
      })

      return analyzeResult.value
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '분석 중 문제가 발생했어요.'
      throw error
    } finally {
      isAnalyzing.value = false
    }
  }

  async function startMockVoiceConsultation() {
    setUtterance(VOICE_MOCK_UTTERANCE, 'VOICE')
    return analyzeCurrentUtterance()
  }

  async function selectCandidate(task: TaskType) {
    const previousAnalyzeResult = analyzeResult.value
    const consultationId = previousAnalyzeResult?.consultationId

    if (!consultationId) {
      return null
    }

    const selectedResult = await consultationService.selectTask(consultationId, {
      taskTypeCode: task.taskTypeCode,
    })

    analyzeResult.value = {
      consultationId: selectedResult.consultationId,
      status: selectedResult.status,
      fraudCheck: previousAnalyzeResult.fraudCheck,
      classification: {
        status: 'CONFIRMED',
        correctedUtterance: correctedUtterance.value,
        confidence: null,
        task: selectedResult.task,
        candidates: [],
        sttRecheckNeeded: inputMethod.value === 'VOICE',
      },
      visitDecision: selectedResult.visitDecision,
    }

    return selectedResult
  }

  return {
    utterance,
    inputMethod,
    analyzeResult,
    isAnalyzing,
    errorMessage,
    correctedUtterance,
    currentTask,
    candidateTasks,
    reset,
    setUtterance,
    analyzeCurrentUtterance,
    startMockVoiceConsultation,
    selectCandidate,
  }
})
