import type {
  AnalyzeRequest,
  AnalyzeResult,
  BranchRecommendationQuery,
  BranchRecommendationResult,
  ChecklistAnswerRequest,
  ChecklistAnswerResult,
  ChecklistQuestionsResult,
  ConsultationHistoryResult,
  CorrectionConfirmationRequest,
  NearbyBranchQuery,
  NearbyBranchResult,
  ResolvedChecklistResult,
  TaskSelectionRequest,
  TaskSelectionResult,
  TaskType,
  TaskTypeListResult,
} from '@/api/types'
import { apiClient } from '@/api/client'

export const consultationService = {
  async analyze(request: AnalyzeRequest): Promise<AnalyzeResult> {
    const response = await apiClient.post<AnalyzeResult>('/analyze', request)
    return response.data
  },

  // re-analyzes the same consultation with the sentence the user confirmed, so the
  // response carries a fresh status to route on
  async confirmCorrection(
    consultationId: string,
    request: CorrectionConfirmationRequest,
  ): Promise<AnalyzeResult> {
    const response = await apiClient.post<AnalyzeResult>(
      `/consultations/${consultationId}/correction-confirmation`,
      request,
    )
    return response.data
  },

  async selectTask(consultationId: string, request: TaskSelectionRequest): Promise<TaskSelectionResult> {
    const response = await apiClient.post<TaskSelectionResult>(
      `/consultations/${consultationId}/task-selection`,
      request,
    )
    return response.data
  },

  async getChecklistQuestions(consultationId: string): Promise<ChecklistQuestionsResult> {
    const response = await apiClient.get<ChecklistQuestionsResult>(
      `/consultations/${consultationId}/checklist/questions`,
    )
    return response.data
  },

  async saveChecklistAnswers(consultationId: string, request: ChecklistAnswerRequest): Promise<ChecklistAnswerResult> {
    const response = await apiClient.put<ChecklistAnswerResult>(
      `/consultations/${consultationId}/checklist/answers`,
      request,
    )
    return response.data
  },

  async getResolvedChecklist(consultationId: string): Promise<ResolvedChecklistResult> {
    const response = await apiClient.get<ResolvedChecklistResult>(`/consultations/${consultationId}/checklist`)
    return response.data
  },

  async getBranchRecommendations(query: BranchRecommendationQuery): Promise<BranchRecommendationResult> {
    const response = await apiClient.get<BranchRecommendationResult>('/branches/recommendations', {
      params: query,
    })
    return response.data
  },

  // The seeded branch data only covers a handful of central-Seoul locations, so a
  // GPS-based query from anywhere else legitimately comes back empty. Retry once
  // against the fallback location before surfacing "no branches nearby" to the user.
  async getBranchRecommendationsWithFallback(
    query: BranchRecommendationQuery,
    fallbackLocation: { lat: number; lng: number },
  ): Promise<BranchRecommendationResult> {
    const result = await consultationService.getBranchRecommendations(query)
    if (result.recommendations.length > 0) return result
    if (query.lat === fallbackLocation.lat && query.lng === fallbackLocation.lng) return result

    return consultationService.getBranchRecommendations({
      ...query,
      lat: fallbackLocation.lat,
      lng: fallbackLocation.lng,
    })
  },

  // No consultationId needed — response has no wait-time data though, only
  // distance/walkMinutes (see NearbyBranchQuery/NearbyBranchResult in api/types.ts).
  async getNearbyBranches(query: NearbyBranchQuery): Promise<NearbyBranchResult> {
    const response = await apiClient.get<NearbyBranchResult>('/branches/nearby', { params: query })
    return response.data
  },

  async getTaskTypes(): Promise<TaskType[]> {
    const response = await apiClient.get<TaskTypeListResult>('/task-types')
    return response.data.taskTypes.map((item) => ({
      taskTypeCode: item.code,
      name: item.name,
      easyDescription: item.easyDescription,
    }))
  },

  async getConsultationHistory(): Promise<ConsultationHistoryResult> {
    const response = await apiClient.get<ConsultationHistoryResult>('/users/me/consultations')
    return response.data
  },
}
