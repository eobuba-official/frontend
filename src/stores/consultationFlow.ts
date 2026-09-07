import { ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  AnalyzeResult,
  BranchRecommendation,
  ChecklistResult,
  ConsultationStatus,
  FraudCheck,
  InputMethod,
  TaskSelectionResult,
  TaskType,
  VisitDecision,
} from '@/api/types'

export const useConsultationFlowStore = defineStore('consultationFlow', () => {
  const utterance = ref('')
  const inputMethod = ref<InputMethod>('TEXT')
  const sttConfidence = ref<number | null>(null)

  const consultationId = ref<string | null>(null)
  const status = ref<ConsultationStatus | null>(null)
  const task = ref<TaskType | null>(null)
  const candidates = ref<TaskType[]>([])
  const visitDecision = ref<VisitDecision | null>(null)
  const fraudCheck = ref<FraudCheck | null>(null)
  const guidance = ref<string | null>(null)
  const checklist = ref<ChecklistResult | null>(null)
  const selectedBranch = ref<BranchRecommendation | null>(null)

  function setUtterance(payload: { utterance: string; inputMethod: InputMethod; sttConfidence?: number | null }) {
    utterance.value = payload.utterance
    inputMethod.value = payload.inputMethod
    sttConfidence.value = payload.sttConfidence ?? null
  }

  function setAnalyzeResult(result: AnalyzeResult) {
    consultationId.value = result.consultationId
    status.value = result.status
    task.value = result.classification.task
    candidates.value = result.classification.candidates
    visitDecision.value = result.visitDecision
    fraudCheck.value = result.fraudCheck
    guidance.value = result.guidance ?? null
  }

  function setTaskSelection(result: TaskSelectionResult) {
    status.value = result.status
    task.value = result.task
    candidates.value = []
    visitDecision.value = result.visitDecision
  }

  function setChecklist(result: ChecklistResult) {
    checklist.value = result
  }

  function setSelectedBranch(branch: BranchRecommendation) {
    selectedBranch.value = branch
  }

  function reset() {
    utterance.value = ''
    inputMethod.value = 'TEXT'
    sttConfidence.value = null
    consultationId.value = null
    status.value = null
    task.value = null
    candidates.value = []
    visitDecision.value = null
    fraudCheck.value = null
    guidance.value = null
    checklist.value = null
    selectedBranch.value = null
  }

  return {
    utterance,
    inputMethod,
    sttConfidence,
    consultationId,
    status,
    task,
    candidates,
    visitDecision,
    fraudCheck,
    guidance,
    checklist,
    selectedBranch,
    setUtterance,
    setAnalyzeResult,
    setTaskSelection,
    setChecklist,
    setSelectedBranch,
    reset,
  }
})
