import type {
  AnalyzeRequest,
  BranchRecommendationQuery,
  DismissWarningRequest,
  TaskSelectionRequest,
} from '@/api/types'
import {
  mockAnalyzeCandidates,
  mockAnalyzeConfirmed,
  mockAnalyzeFraud,
  mockBranchRecommendations,
  mockChecklist,
  mockConsultationHistory,
  mockTaskSelectionResult,
  mockTaskTypes,
} from '@/mocks/consultationMock'

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), ms))
}

export const consultationService = {
  analyze(request: AnalyzeRequest) {
    const utterance = request.utterance.trim()

    if (utterance.includes('안전계좌') || utterance.includes('돈을 옮기')) {
      return delay(mockAnalyzeFraud)
    }

    if (utterance.includes('아들') || utterance.includes('대신')) {
      return delay(mockAnalyzeCandidates)
    }

    return delay({
      ...mockAnalyzeConfirmed,
      classification: {
        ...mockAnalyzeConfirmed.classification,
        correctedUtterance: utterance || mockAnalyzeConfirmed.classification.correctedUtterance,
        sttRecheckNeeded: request.inputMethod === 'VOICE',
      },
    })
  },

  selectTask(_consultationId: string, _request: TaskSelectionRequest) {
    return delay(mockTaskSelectionResult)
  },

  dismissWarning(_consultationId: string, request: DismissWarningRequest) {
    if (!request.confirmed) {
      return Promise.reject(new Error('confirmed must be true'))
    }

    return delay({
      consultationId: mockAnalyzeFraud.consultationId,
      status: mockAnalyzeConfirmed.status,
      warningDismissed: true as const,
      classification: mockAnalyzeConfirmed.classification,
      visitDecision: mockAnalyzeConfirmed.visitDecision,
    })
  },

  getChecklist(_taskTypeCode: string, _consultationId?: string) {
    return delay(mockChecklist)
  },

  getBranchRecommendations(_query: BranchRecommendationQuery) {
    return delay(mockBranchRecommendations)
  },

  getTaskTypes() {
    return delay(mockTaskTypes)
  },

  getConsultationHistory() {
    return delay(mockConsultationHistory)
  },
}
