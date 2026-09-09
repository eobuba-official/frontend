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
          originalUtterance: '통장을 잃어버렸어요',
          correctedUtterance: '통장을 잃어버렸어요',
          correctionApplied: false,
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

  it('getChecklistQuestions requests the consultation-scoped questions endpoint', async () => {
    mock.onGet('/consultations/c1/checklist/questions').reply(200, {
      success: true,
      data: {
        questions: [
          { conditionCode: 'IS_PROXY', question: '다른 사람이 대신 방문하나요?', answerType: 'BOOLEAN', answered: false, answer: null },
        ],
      },
      error: null,
    })

    const result = await consultationService.getChecklistQuestions('c1')

    expect(result.questions).toHaveLength(1)
    expect(result.questions[0].conditionCode).toBe('IS_PROXY')
  })

  it('saveChecklistAnswers puts the answers to the consultation-scoped endpoint', async () => {
    mock.onPut('/consultations/c1/checklist/answers').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ answers: [{ conditionCode: 'IS_PROXY', value: true }] })
      return [200, { success: true, data: { savedCount: 1 }, error: null }]
    })

    const result = await consultationService.saveChecklistAnswers('c1', {
      answers: [{ conditionCode: 'IS_PROXY', value: true }],
    })

    expect(result.savedCount).toBe(1)
  })

  it('getResolvedChecklist requests the consultation-scoped resolved checklist', async () => {
    mock.onGet('/consultations/c1/checklist').reply(200, {
      success: true,
      data: {
        taskTypeCode: 'PASSBOOK_REISSUE',
        taskTypeName: '통장 재발급',
        resolved: true,
        items: [
          {
            itemCode: 'ID_CARD',
            name: '신분증',
            easyDescription: '',
            required: true,
            status: 'INCLUDED',
            reason: '항상 필요한 준비물이에요.',
            displayOrder: 1,
          },
        ],
      },
      error: null,
    })

    const result = await consultationService.getResolvedChecklist('c1')

    expect(result.resolved).toBe(true)
    expect(result.items).toHaveLength(1)
  })

  it('getBranchRecommendations forwards the query as request params', async () => {
    mock.onGet('/branches/recommendations').reply((config) => {
      expect(config.params).toEqual({ consultationId: 'c1', taskTypeCode: 'PASSBOOK_REISSUE', lat: 37.5, lng: 127 })
      return [
        200,
        {
          success: true,
          data: { recommendations: [], walkingSpeedKmh: 4 },
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

    expect(result.walkingSpeedKmh).toBe(4)
  })

  it('getBranchRecommendationsWithFallback returns the GPS result directly when it has recommendations', async () => {
    mock.onGet('/branches/recommendations').reply((config) => {
      expect(config.params).toEqual({ consultationId: 'c1', taskTypeCode: 'PASSBOOK_REISSUE', lat: 33.4, lng: 126.5 })
      return [
        200,
        {
          success: true,
          data: {
            recommendations: [{ rank: 1, branch: { branchId: 1, name: '제주지점', address: '', phone: '', distanceKm: 1 } }],
            weights: { wait: 0.6, distance: 0.4 },
          },
          error: null,
        },
      ]
    })

    const result = await consultationService.getBranchRecommendationsWithFallback(
      { consultationId: 'c1', taskTypeCode: 'PASSBOOK_REISSUE', lat: 33.4, lng: 126.5 },
      { lat: 37.5665, lng: 126.978 },
    )

    expect(result.recommendations).toHaveLength(1)
    expect(mock.history.get).toHaveLength(1)
  })

  it('getBranchRecommendationsWithFallback retries with the fallback location when the GPS result is empty', async () => {
    mock.onGet('/branches/recommendations').reply((config) => {
      if (config.params.lat === 33.4) {
        return [200, { success: true, data: { recommendations: [], weights: { wait: 0.6, distance: 0.4 } }, error: null }]
      }
      expect(config.params).toEqual({ consultationId: 'c1', taskTypeCode: 'PASSBOOK_REISSUE', lat: 37.5665, lng: 126.978 })
      return [
        200,
        {
          success: true,
          data: {
            recommendations: [{ rank: 1, branch: { branchId: 87, name: '광화문지점', address: '', phone: '', distanceKm: 1 } }],
            weights: { wait: 0.6, distance: 0.4 },
          },
          error: null,
        },
      ]
    })

    const result = await consultationService.getBranchRecommendationsWithFallback(
      { consultationId: 'c1', taskTypeCode: 'PASSBOOK_REISSUE', lat: 33.4, lng: 126.5 },
      { lat: 37.5665, lng: 126.978 },
    )

    expect(result.recommendations).toHaveLength(1)
    expect(result.recommendations[0].branch.name).toBe('광화문지점')
    expect(mock.history.get).toHaveLength(2)
  })

  it('getBranchRecommendationsWithFallback does not retry when the GPS query already used the fallback location', async () => {
    mock.onGet('/branches/recommendations').reply(200, {
      success: true,
      data: { recommendations: [], weights: { wait: 0.6, distance: 0.4 } },
      error: null,
    })

    const result = await consultationService.getBranchRecommendationsWithFallback(
      { consultationId: 'c1', taskTypeCode: 'PASSBOOK_REISSUE', lat: 37.5665, lng: 126.978 },
      { lat: 37.5665, lng: 126.978 },
    )

    expect(result.recommendations).toHaveLength(0)
    expect(mock.history.get).toHaveLength(1)
  })

  it('getTaskTypes maps the backend "code" field to taskTypeCode', async () => {
    mock.onGet('/task-types').reply(200, {
      success: true,
      data: {
        taskTypes: [{ code: 'PASSBOOK_REISSUE', name: '통장 재발급', easyDescription: '통장을 새로 만드는 일' }],
      },
      error: null,
    })

    const result = await consultationService.getTaskTypes()

    expect(result).toEqual([
      { taskTypeCode: 'PASSBOOK_REISSUE', name: '통장 재발급', easyDescription: '통장을 새로 만드는 일' },
    ])
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
