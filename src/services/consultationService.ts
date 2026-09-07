import axios from 'axios'
import type {
  AnalyzeRequest,
  AnalyzeResult,
  BranchRecommendationQuery,
  BranchRecommendationResult,
  ChecklistResult,
  ConsultationHistoryResult,
  DismissWarningRequest,
  DismissWarningResult,
  SpeechTranscriptionResult,
  TaskSelectionRequest,
  TaskSelectionResult,
  TaskType,
  VisitDecision,
} from '@/api/types'
import { apiClient } from '@/api/client'
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

interface TaskTypeListResponse {
  taskTypes: { code: string; name: string; easyDescription: string }[]
}

const forceMockApi = import.meta.env.VITE_USE_MOCK_API === 'true'

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), ms))
}

async function withMockFallback<T>(request: () => Promise<T>, fallback: () => Promise<T>) {
  if (forceMockApi) {
    return fallback()
  }

  try {
    return await request()
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      console.warn('[mock fallback] API request failed, using mock data.', error)
      return fallback()
    }

    throw error
  }
}

function getMockAnalyzeResult(request: AnalyzeRequest) {
  const utterance = request.utterance.trim()

  if (utterance.includes('안전계좌') || utterance.includes('돈을 옮기')) {
    return delay({
      ...mockAnalyzeFraud,
      classification: {
        ...mockAnalyzeFraud.classification,
        correctedUtterance: utterance,
      },
    })
  }

  if (utterance.includes('아들') || utterance.includes('대신')) {
    return delay({
      ...mockAnalyzeCandidates,
      classification: {
        ...mockAnalyzeCandidates.classification,
        correctedUtterance: utterance,
      },
    })
  }

  const matchedTask = findMockTaskByUtterance(utterance)

  return delay({
    ...mockAnalyzeConfirmed,
    classification: {
      ...mockAnalyzeConfirmed.classification,
      correctedUtterance: utterance || mockAnalyzeConfirmed.classification.correctedUtterance,
      task: matchedTask,
      candidates: [],
      sttRecheckNeeded: request.inputMethod === 'VOICE',
    },
    visitDecision: getMockVisitDecision(matchedTask),
  })
}

function findMockTaskByUtterance(utterance: string): TaskType | null {
  const normalized = utterance.replace(/\s/g, '')
  let matchedCode = 'PASSBOOK_REISSUE'

  if (normalized.includes('카드') || normalized.includes('체크카드') || normalized.includes('신용카드')) {
    matchedCode = 'CARD_REISSUE'
  } else if (normalized.includes('통장') || normalized.includes('분실') || normalized.includes('잃어')) {
    matchedCode = 'PASSBOOK_REISSUE'
  } else if (
    normalized.includes('예금') ||
    normalized.includes('적금') ||
    normalized.includes('해지') ||
    normalized.includes('만기')
  ) {
    matchedCode = 'DEPOSIT_EARLY_CLOSE'
  } else if (normalized.includes('자동이체') || normalized.includes('자동이제')) {
    matchedCode = 'AUTO_TRANSFER_CHANGE'
  } else if (normalized.includes('비밀번호') || normalized.includes('비번')) {
    matchedCode = 'PASSWORD_CHANGE'
  } else if (normalized.includes('잔액') || normalized.includes('거래내역') || normalized.includes('조회')) {
    matchedCode = 'BALANCE_INQUIRY'
  } else if (normalized.includes('이체') || normalized.includes('송금') || normalized.includes('보내')) {
    matchedCode = 'ACCOUNT_TRANSFER'
  } else if (normalized.includes('위임장') || normalized.includes('대리') || normalized.includes('대신')) {
    matchedCode = 'PROXY_TASK'
  }

  return (
    mockTaskTypes.find((taskType) => taskType.taskTypeCode === matchedCode) ??
    mockAnalyzeConfirmed.classification.task ??
    null
  )
}

function getMockVisitDecision(task: TaskType | null): VisitDecision {
  const taskName = task?.name ?? '은행 업무'
  const decision = task?.defaultVisitDecision ?? 'VISIT_REQUIRED'

  if (decision === 'NO_VISIT') {
    return {
      decision,
      reason: `${taskName}는 앱이나 ATM으로 처리하실 수 있어요.`,
      remoteMethods: [
        {
          channel: 'MOBILE_APP',
          description: 'KB스타뱅킹에서 처리',
          easyDescription: '휴대폰 앱으로 하기',
        },
        {
          channel: 'ATM',
          description: 'ATM에서 처리',
          easyDescription: '은행 기계로 하기',
        },
      ],
      officialChannels: [],
    }
  }

  if (decision === 'CHECK_NEEDED') {
    return {
      decision,
      reason: `${taskName}는 상황에 따라 비대면 처리가 가능할 수 있어요. 먼저 확인해 보세요.`,
      remoteMethods: [],
      officialChannels: [
        {
          name: 'KB국민은행 고객센터',
          phone: '1588-9999',
          description: '처리 가능 여부를 전화로 확인',
        },
      ],
    }
  }

  return {
    decision,
    reason: `${taskName}은 본인 확인이 필요해 지점 방문이 필요합니다.`,
    remoteMethods: [],
    officialChannels: [],
  }
}

export const consultationService = {
  analyze(request: AnalyzeRequest): Promise<AnalyzeResult> {
    return withMockFallback(
      async () => {
        const response = await apiClient.post<AnalyzeResult>('/analyze', request)
        return response.data
      },
      () => getMockAnalyzeResult(request),
    )
  },

  selectTask(consultationId: string, request: TaskSelectionRequest): Promise<TaskSelectionResult> {
    return withMockFallback(
      async () => {
        const response = await apiClient.post<TaskSelectionResult>(
          `/consultations/${consultationId}/task-selection`,
          request,
        )
        return response.data
      },
      () => {
        const selectedTask =
          mockTaskTypes.find((taskType) => taskType.taskTypeCode === request.taskTypeCode) ??
          mockTaskSelectionResult.task

        return delay({
          ...mockTaskSelectionResult,
          task: selectedTask,
          visitDecision: getMockVisitDecision(selectedTask),
        })
      },
    )
  },

  dismissWarning(consultationId: string, request: DismissWarningRequest): Promise<DismissWarningResult> {
    if (!request.confirmed) {
      return Promise.reject(new Error('confirmed must be true'))
    }

    return withMockFallback(
      async () => {
        const response = await apiClient.post<DismissWarningResult>(
          `/consultations/${consultationId}/dismiss-warning`,
          request,
        )
        return response.data
      },
      () =>
        delay({
          consultationId: mockAnalyzeFraud.consultationId,
          status: mockAnalyzeConfirmed.status,
          warningDismissed: true,
          classification: mockAnalyzeConfirmed.classification,
          visitDecision: mockAnalyzeConfirmed.visitDecision,
        }),
    )
  },

  getChecklist(taskTypeCode: string): Promise<ChecklistResult> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<ChecklistResult>(`/task-types/${taskTypeCode}/checklist`)
        return response.data
      },
      () => delay(mockChecklist),
    )
  },

  getBranchRecommendations(query: BranchRecommendationQuery): Promise<BranchRecommendationResult> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<BranchRecommendationResult>('/branches/recommendations', {
          params: query,
        })
        return response.data
      },
      () => delay(mockBranchRecommendations),
    )
  },

  getTaskTypes(): Promise<TaskType[]> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<TaskTypeListResponse>('/task-types')
        return response.data.taskTypes.map((item) => ({
          taskTypeCode: item.code,
          name: item.name,
          easyDescription: item.easyDescription,
        }))
      },
      () =>
        delay(
          mockTaskTypes.map((taskType) => ({
            taskTypeCode: taskType.taskTypeCode,
            name: taskType.name,
            easyDescription: taskType.easyDescription,
            defaultVisitDecision: taskType.defaultVisitDecision,
          })),
        ),
    )
  },

  getConsultationHistory(): Promise<ConsultationHistoryResult> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<ConsultationHistoryResult>('/users/me/consultations')
        return response.data
      },
      () => delay(mockConsultationHistory),
    )
  },

  transcribeSpeech(audio: File, browserTranscript?: string): Promise<SpeechTranscriptionResult> {
    const formData = new FormData()
    formData.append('audio', audio)

    if (browserTranscript?.trim()) {
      formData.append('browserTranscript', browserTranscript.trim())
    }

    return withMockFallback(
      async () => {
        const response = await apiClient.post<SpeechTranscriptionResult>('/speech/transcriptions', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data
      },
      () =>
        delay({
          transcript: browserTranscript?.trim() || mockAnalyzeConfirmed.classification.correctedUtterance,
          source: 'WEB_SPEECH_FALLBACK',
          browserTranscript: browserTranscript?.trim() || null,
          sttConfidence: null,
          recheckNeeded: true,
        }),
    )
  },
}
