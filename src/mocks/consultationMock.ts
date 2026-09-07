import type { AnalyzeResult, ConsultationHistoryResult } from '@/api/types'

// consultationService.dismissWarning()의 mock 구현에서만 쓰입니다 —
// 백엔드에 경고 해제 API가 아직 없어서 그 자리표시자로 남아있습니다.
export const mockAnalyzeConfirmed: AnalyzeResult = {
  consultationId: 'mock-consultation-001',
  status: 'TASK_CONFIRMED',
  fraudCheck: {
    detected: false,
    dismissible: false,
    patterns: [],
    safetyActions: [],
    guardianNotification: null,
  },
  classification: {
    status: 'CONFIRMED',
    correctedUtterance: '통장을 잃어버렸는데 다시 만들고 싶어',
    confidence: 0.93,
    task: {
      taskTypeCode: 'PASSBOOK_REISSUE',
      name: '통장 재발급',
      easyDescription: '통장을 잃어버렸을 때 새로 만드는 일',
    },
    candidates: [],
    sttRecheckNeeded: true,
  },
  visitDecision: {
    decision: 'VISIT_REQUIRED',
    reason: '통장 재발급은 본인 확인이 필요해 지점 방문이 필요합니다.',
    remoteMethods: [],
    officialChannels: [],
  },
}

export const mockAnalyzeFraud: AnalyzeResult = {
  consultationId: 'mock-consultation-003',
  status: 'FRAUD_WARNING',
  fraudCheck: {
    detected: true,
    dismissible: true,
    patterns: [
      {
        type: 'SAFE_ACCOUNT',
        label: '안전계좌 요구',
        evidence: '안전한 계좌로 돈을 옮기래',
        explanation: '은행이나 정부 기관은 안전계좌로 돈을 옮기라고 하지 않습니다.',
      },
    ],
    safetyActions: [
      { order: 1, action: '지금 통화 중이라면 전화를 끊으세요' },
      { order: 2, action: '은행 대표번호로 직접 전화해 확인하세요' },
      { order: 3, action: '가족에게 지금 상황을 알리세요' },
    ],
    guardianNotification: {
      sent: true,
      notifiedGuardians: [{ name: '김철수', relation: '아들', maskedPhone: '010****5432' }],
      message: '[어부바] 금융사기 의심 표현이 감지되었습니다.',
    },
  },
  classification: {
    status: 'SUSPENDED',
    correctedUtterance: '은행에서 전화가 왔는데 안전한 계좌로 돈을 옮기래',
    confidence: null,
    task: null,
    candidates: [],
    sttRecheckNeeded: true,
  },
  visitDecision: null,
}

export const mockConsultationHistory: ConsultationHistoryResult = {
  consultations: [
    {
      consultationId: 'mock-consultation-001',
      correctedUtterance: '통장을 잃어버렸어',
      status: 'TASK_CONFIRMED',
      taskTypeCode: 'PASSBOOK_REISSUE',
      confidence: 0.93,
      createdAt: '2026-09-05T10:30:00',
    },
  ],
}
