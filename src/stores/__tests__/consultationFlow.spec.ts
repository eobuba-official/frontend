import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useConsultationFlowStore } from '../consultationFlow'
import type {
  AnalyzeResult,
  BranchRecommendation,
  ChecklistResult,
  DismissWarningResult,
  TaskSelectionResult,
} from '@/api/types'

const analyzeResult: AnalyzeResult = {
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
  visitDecision: { decision: 'VISIT_REQUIRED', reason: '본인 확인 필요', remoteMethods: [], officialChannels: [] },
}

const candidatesResult: AnalyzeResult = {
  consultationId: 'c2',
  status: 'CANDIDATES_SUGGESTED',
  fraudCheck: { detected: false, dismissible: false, patterns: [], safetyActions: [], guardianNotification: null },
  classification: {
    status: 'CANDIDATES',
    correctedUtterance: '아들 이름으로 뭘 좀 해야 하는데',
    confidence: 0.5,
    task: null,
    candidates: [
      { taskTypeCode: 'PROXY_TASK', name: '대리 업무', easyDescription: '가족 일을 대신 처리하는 것' },
      { taskTypeCode: 'ACCOUNT_TRANSFER', name: '계좌이체', easyDescription: '다른 사람에게 돈을 보내는 일' },
    ],
    sttRecheckNeeded: true,
  },
  visitDecision: null,
}

const fraudResult: AnalyzeResult = {
  consultationId: 'c3',
  status: 'FRAUD_WARNING',
  fraudCheck: {
    detected: true,
    dismissible: true,
    patterns: [{ type: 'SAFE_ACCOUNT', label: '안전계좌 요구', evidence: '안전계좌로 옮기래', explanation: '위험해요' }],
    safetyActions: [{ order: 1, action: '전화를 끊으세요' }],
    guardianNotification: null,
  },
  classification: {
    status: 'SUSPENDED',
    correctedUtterance: '안전계좌로 옮기래요',
    confidence: null,
    task: null,
    candidates: [],
    sttRecheckNeeded: true,
  },
  visitDecision: null,
  guidance: null,
}

const taskSelectionResult: TaskSelectionResult = {
  consultationId: 'c1',
  status: 'TASK_CONFIRMED',
  task: { taskTypeCode: 'CARD_REISSUE', name: '카드 재발급', easyDescription: '카드를 새로 받는 일' },
  visitDecision: { decision: 'CHECK_NEEDED', reason: '전화로 먼저 확인하세요', remoteMethods: [], officialChannels: [] },
}

describe('consultationFlow store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('stores the utterance captured from voice input along with its confidence', () => {
    const store = useConsultationFlowStore()

    store.setUtterance({ utterance: '통장을 잃어버렸어요', inputMethod: 'VOICE', sttConfidence: 0.87 })

    expect(store.utterance).toBe('통장을 잃어버렸어요')
    expect(store.inputMethod).toBe('VOICE')
    expect(store.sttConfidence).toBe(0.87)
  })

  it('normalizes a missing sttConfidence to null for text input', () => {
    const store = useConsultationFlowStore()

    store.setUtterance({ utterance: '통장을 잃어버렸어요', inputMethod: 'TEXT' })

    expect(store.sttConfidence).toBeNull()
  })

  it('populates consultation state from an analyze result', () => {
    const store = useConsultationFlowStore()

    store.setAnalyzeResult(analyzeResult)

    expect(store.consultationId).toBe('c1')
    expect(store.status).toBe('TASK_CONFIRMED')
    expect(store.task?.taskTypeCode).toBe('PASSBOOK_REISSUE')
    expect(store.visitDecision?.decision).toBe('VISIT_REQUIRED')
  })

  it('captures fraud check details and guidance from an analyze result', () => {
    const store = useConsultationFlowStore()

    store.setAnalyzeResult(fraudResult)

    expect(store.fraudCheck?.detected).toBe(true)
    expect(store.fraudCheck?.patterns).toHaveLength(1)
    expect(store.guidance).toBeNull()
  })

  it('overwrites the task and visit decision after a candidate is selected, and clears the candidate list', () => {
    const store = useConsultationFlowStore()
    store.setAnalyzeResult(candidatesResult)
    expect(store.candidates).toHaveLength(2)
    expect(store.confidence).toBe(0.5)

    store.setTaskSelection(taskSelectionResult)

    expect(store.task?.taskTypeCode).toBe('CARD_REISSUE')
    expect(store.visitDecision?.decision).toBe('CHECK_NEEDED')
    expect(store.candidates).toEqual([])
    expect(store.confidence).toBeNull()
  })

  it('clears the fraud warning and applies the classification after a warning is dismissed', () => {
    const store = useConsultationFlowStore()
    store.setAnalyzeResult(fraudResult)
    expect(store.fraudCheck?.detected).toBe(true)

    const dismissResult: DismissWarningResult = {
      consultationId: 'c3',
      status: 'TASK_CONFIRMED',
      warningDismissed: true,
      classification: {
        status: 'CONFIRMED',
        correctedUtterance: '안전계좌로 옮기래요',
        confidence: 0.8,
        task: { taskTypeCode: 'ACCOUNT_TRANSFER', name: '계좌이체', easyDescription: '다른 사람에게 돈을 보내는 일' },
        candidates: [],
        sttRecheckNeeded: false,
      },
      visitDecision: { decision: 'VISIT_REQUIRED', reason: '본인 확인 필요', remoteMethods: [], officialChannels: [] },
    }

    store.setDismissWarningResult(dismissResult)

    expect(store.status).toBe('TASK_CONFIRMED')
    expect(store.task?.taskTypeCode).toBe('ACCOUNT_TRANSFER')
    expect(store.fraudCheck).toBeNull()
    expect(store.guidance).toBeNull()
  })

  it('stores the checklist and the branch the user picked', () => {
    const store = useConsultationFlowStore()
    const checklist: ChecklistResult = { taskTypeCode: 'PASSBOOK_REISSUE', taskTypeName: '통장 재발급', items: [] }
    const branch: BranchRecommendation = {
      rank: 1,
      branch: { branchId: 1, name: 'KB국민은행 종로지점', address: '서울', phone: '02-000-0000', distanceKm: 1 },
      visitTime: { date: '2026-09-08', dayLabel: '내일', timeSlot: '10:00-11:00', timeLabel: '오전 10시' },
      expectedWaitMinutes: 5,
      congestionSource: 'MOCK',
      score: 90,
      sentence: '내일 오전 10시가 좋아요',
    }

    store.setChecklist(checklist)
    store.setSelectedBranch(branch)

    expect(store.checklist?.taskTypeName).toBe('통장 재발급')
    expect(store.selectedBranch?.branch.name).toBe('KB국민은행 종로지점')
  })

  it('resets every field back to its initial value', () => {
    const store = useConsultationFlowStore()
    store.setUtterance({ utterance: '통장을 잃어버렸어요', inputMethod: 'VOICE', sttConfidence: 0.87 })
    store.setAnalyzeResult(analyzeResult)

    store.reset()

    expect(store.utterance).toBe('')
    expect(store.inputMethod).toBe('TEXT')
    expect(store.sttConfidence).toBeNull()
    expect(store.consultationId).toBeNull()
    expect(store.status).toBeNull()
    expect(store.task).toBeNull()
    expect(store.candidates).toEqual([])
    expect(store.confidence).toBeNull()
    expect(store.visitDecision).toBeNull()
    expect(store.fraudCheck).toBeNull()
    expect(store.guidance).toBeNull()
    expect(store.checklist).toBeNull()
    expect(store.selectedBranch).toBeNull()
  })
})
