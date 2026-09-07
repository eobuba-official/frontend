import type {
  AnalyzeRequest,
  AnalyzeResult,
  BranchRecommendationQuery,
  BranchRecommendationResult,
  ChecklistResult,
  ConsultationHistoryResult,
  DismissWarningRequest,
  TaskSelectionRequest,
  TaskSelectionResult,
} from '@/api/types'
import { apiClient } from '@/api/client'
import { mockAnalyzeConfirmed, mockAnalyzeFraud, mockTaskTypes } from '@/mocks/consultationMock'

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), ms))
}

export const consultationService = {
  async analyze(request: AnalyzeRequest): Promise<AnalyzeResult> {
    const response = await apiClient.post<AnalyzeResult>('/analyze', request)
    return response.data
  },

  async selectTask(consultationId: string, request: TaskSelectionRequest): Promise<TaskSelectionResult> {
    const response = await apiClient.post<TaskSelectionResult>(
      `/consultations/${consultationId}/task-selection`,
      request,
    )
    return response.data
  },

  async getChecklist(taskTypeCode: string): Promise<ChecklistResult> {
    const response = await apiClient.get<ChecklistResult>(`/task-types/${taskTypeCode}/checklist`)
    return response.data
  },

  async getBranchRecommendations(query: BranchRecommendationQuery): Promise<BranchRecommendationResult> {
    const response = await apiClient.get<BranchRecommendationResult>('/branches/recommendations', {
      params: query,
    })
    return response.data
  },

  async getConsultationHistory(): Promise<ConsultationHistoryResult> {
    const response = await apiClient.get<ConsultationHistoryResult>('/users/me/consultations')
    return response.data
  },

  // No backend endpoint exists yet for these two — kept as mocks until the
  // corresponding API is built (경고 해제, 업무 유형 전체 목록).
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

  getTaskTypes() {
    return delay(mockTaskTypes)
  },
}
