import { ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  AnalyzeResult,
  BranchRecommendation,
  ConsultationStatus,
  FraudCheck,
  InputMethod,
  ResolvedChecklistResult,
  TaskSelectionResult,
  TaskType,
  VisitDecision,
} from '@/api/types'

export const useConsultationFlowStore = defineStore('consultationFlow', () => {
  const utterance = ref('')
  const inputMethod = ref<InputMethod>('TEXT')
  const sttConfidence = ref<number | null>(null)
  const originalUtterance = ref('')
  const correctedUtterance = ref('')
  const correctionApplied = ref(false)

  const consultationId = ref<string | null>(null)
  const status = ref<ConsultationStatus | null>(null)
  const task = ref<TaskType | null>(null)
  const candidates = ref<TaskType[]>([])
  const confidence = ref<number | null>(null)
  const visitDecision = ref<VisitDecision | null>(null)
  const fraudCheck = ref<FraudCheck | null>(null)
  const guidance = ref<string | null>(null)
  const checklist = ref<ResolvedChecklistResult | null>(null)
  const recommendations = ref<BranchRecommendation[]>([])
  const selectedBranch = ref<BranchRecommendation | null>(null)

  function setUtterance(payload: {
    utterance: string
    inputMethod: InputMethod
    sttConfidence?: number | null
  }) {
    utterance.value = payload.utterance
    inputMethod.value = payload.inputMethod
    sttConfidence.value = payload.sttConfidence ?? null
    clearAnalysis()
  }

  function setAnalyzeResult(result: AnalyzeResult) {
    consultationId.value = result.consultationId
    status.value = result.status
    task.value = result.classification.task
    candidates.value = result.classification.candidates
    confidence.value = result.classification.confidence
    visitDecision.value = result.visitDecision
    fraudCheck.value = result.fraudCheck
    guidance.value = result.guidance ?? null
    originalUtterance.value = result.classification.originalUtterance
    correctedUtterance.value = result.classification.correctedUtterance
    correctionApplied.value = result.classification.correctionApplied
  }

  function setTaskSelection(result: TaskSelectionResult) {
    status.value = result.status
    task.value = result.task
    candidates.value = []
    confidence.value = null
    visitDecision.value = result.visitDecision
  }

  function setChecklist(result: ResolvedChecklistResult) {
    checklist.value = result
  }

  function setRecommendations(list: BranchRecommendation[]) {
    recommendations.value = list
  }

  function setSelectedBranch(branch: BranchRecommendation) {
    selectedBranch.value = branch
  }

  function reset() {
    utterance.value = ''
    inputMethod.value = 'TEXT'
    sttConfidence.value = null
    clearAnalysis()
    checklist.value = null
    recommendations.value = []
    selectedBranch.value = null
  }

  function clearAnalysis() {
    originalUtterance.value = ''
    correctedUtterance.value = ''
    correctionApplied.value = false
    consultationId.value = null
    status.value = null
    task.value = null
    candidates.value = []
    confidence.value = null
    visitDecision.value = null
    fraudCheck.value = null
    guidance.value = null
  }

  return {
    utterance,
    inputMethod,
    sttConfidence,
    originalUtterance,
    correctedUtterance,
    correctionApplied,
    consultationId,
    status,
    task,
    candidates,
    confidence,
    visitDecision,
    fraudCheck,
    guidance,
    checklist,
    recommendations,
    selectedBranch,
    setUtterance,
    setAnalyzeResult,
    setTaskSelection,
    setChecklist,
    setRecommendations,
    setSelectedBranch,
    reset,
  }
})
