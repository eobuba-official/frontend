import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { apiClient } from '@/api/client'
import { consultationService } from '../consultationService'

describe('consultationService (integration: client interceptors + service)', () => {
  const mock = new MockAdapter(apiClient)

  beforeEach(() => mock.reset())
  afterEach(() => mock.reset())

  it('analyze posts the utterance and returns the unwrapped result', async () => {
    mock.onPost('/analyze').reply(200, {
      success: true,
      data: {
        consultationId: 'c1',
        status: 'TASK_CONFIRMED',
        fraudCheck: { detected: false, dismissible: false, patterns: [], safetyActions: [], guardianNotification: null },
        classification: {
          status: 'CONFIRMED',
          correctedUtterance: '통장을 잃어버렸어요',
          confidence: 0.9,
          task: { taskTypeCode: 'PASSBOOK_REISSUE', name: '통장 재발급', easyDescription: '통장을 새로 만드는 일' },
          candidates: [],
          sttRecheckNeeded: false,
        },
        visitDecision: null,
        guidance: null,
      },
      error: null,
    })

    const result = await consultationService.analyze({ utterance: '통장을 잃어버렸어요', inputMethod: 'TEXT' })

    expect(result.status).toBe('TASK_CONFIRMED')
    expect(result.classification.task?.taskTypeCode).toBe('PASSBOOK_REISSUE')
  })

  it('analyze rejects with the backend message when classification fails', async () => {
    mock.onPost('/analyze').reply(502, {
      success: false,
      data: null,
      error: { code: 'LLM_ERROR', message: 'LLM request failed' },
    })

    await expect(consultationService.analyze({ utterance: '...', inputMethod: 'TEXT' })).rejects.toThrow(
      'LLM request failed',
    )
  })

  it('selectTask posts to the consultation-scoped endpoint', async () => {
    mock.onPost('/consultations/c1/task-selection').reply(200, {
      success: true,
      data: {
        consultationId: 'c1',
        status: 'TASK_CONFIRMED',
        task: { taskTypeCode: 'CARD_REISSUE', name: '카드 재발급', easyDescription: '카드를 새로 받는 일' },
        visitDecision: { decision: 'VISIT_REQUIRED', reason: '본인 확인 필요', remoteMethods: [], officialChannels: [] },
      },
      error: null,
    })

    const result = await consultationService.selectTask('c1', { taskTypeCode: 'CARD_REISSUE' })

    expect(result.task.taskTypeCode).toBe('CARD_REISSUE')
  })

  it('getChecklist requests the task-type-scoped endpoint', async () => {
    mock.onGet('/task-types/PASSBOOK_REISSUE/checklist').reply(200, {
      success: true,
      data: {
        taskTypeCode: 'PASSBOOK_REISSUE',
        taskTypeName: '통장 재발급',
        items: [{ itemCode: 'ID_CARD', name: '신분증', easyDescription: '', required: true, condition: null, displayOrder: 1 }],
      },
      error: null,
    })

    const result = await consultationService.getChecklist('PASSBOOK_REISSUE')

    expect(result.taskTypeName).toBe('통장 재발급')
    expect(result.items).toHaveLength(1)
  })

  it('getBranchRecommendations forwards the query as request params', async () => {
    mock.onGet('/branches/recommendations').reply((config) => {
      expect(config.params).toEqual({ consultationId: 'c1', taskTypeCode: 'PASSBOOK_REISSUE', lat: 37.5, lng: 127 })
      return [
        200,
        {
          success: true,
          data: { recommendations: [], weights: { wait: 0.6, distance: 0.4 } },
          error: null,
        },
      ]
    })

    const result = await consultationService.getBranchRecommendations({
      consultationId: 'c1',
      taskTypeCode: 'PASSBOOK_REISSUE',
      lat: 37.5,
      lng: 127,
    })

    expect(result.weights).toEqual({ wait: 0.6, distance: 0.4 })
  })

  it('getConsultationHistory returns the unwrapped list', async () => {
    mock.onGet('/users/me/consultations').reply(200, {
      success: true,
      data: { consultations: [] },
      error: null,
    })

    const result = await consultationService.getConsultationHistory()

    expect(result.consultations).toEqual([])
  })
})
