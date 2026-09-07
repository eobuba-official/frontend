import type {
  AnalyzeRequest,
  AnalyzeResult,
  BranchRecommendationQuery,
  BranchRecommendationResult,
  ChecklistAnswerRequest,
  ChecklistAnswerResult,
  ChecklistQuestionsResult,
  ConsultationHistoryResult,
  DismissWarningRequest,
  DismissWarningResult,
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

  async selectTask(consultationId: string, request: TaskSelectionRequest): Promise<TaskSelectionResult> {
    const response = await apiClient.post<TaskSelectionResult>(
      `/consultations/${consultationId}/task-selection`,
      request,
    )
    return response.data
  },

  async dismissWarning(consultationId: string, request: DismissWarningRequest): Promise<DismissWarningResult> {
    if (!request.confirmed) {
      return Promise.reject(new Error('confirmed must be true'))
    }

    const response = await apiClient.post<DismissWarningResult>(
      `/consultations/${consultationId}/dismiss-warning`,
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
