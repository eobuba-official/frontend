import type {
  AnalyzeResult,
  BranchRecommendationResult,
  ChecklistResult,
  ConsultationHistoryResult,
  TaskSelectionResult,
  TaskType,
} from '@/api/types'

export const mockTaskTypes: TaskType[] = [
  {
    taskTypeCode: 'PASSBOOK_REISSUE',
    name: '통장 재발급',
    easyDescription: '통장을 잃어버렸을 때 새로 만드는 일',
    defaultVisitDecision: 'VISIT_REQUIRED',
  },
  {
    taskTypeCode: 'DEPOSIT_EARLY_CLOSE',
    name: '예금 중도해지',
    easyDescription: '만기 전에 돈을 찾는 것',
    defaultVisitDecision: 'CHECK_NEEDED',
  },
  {
    taskTypeCode: 'AUTO_TRANSFER_CHANGE',
    name: '자동이체 변경',
    easyDescription: '매달 자동으로 나가는 돈을 바꾸는 것',
    defaultVisitDecision: 'NO_VISIT',
  },
]

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
    task: mockTaskTypes[0] ?? null,
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

export const mockAnalyzeCandidates: AnalyzeResult = {
  consultationId: 'mock-consultation-002',
  status: 'CANDIDATES_SUGGESTED',
  fraudCheck: {
    detected: false,
    dismissible: false,
    patterns: [],
    safetyActions: [],
    guardianNotification: null,
  },
  classification: {
    status: 'CANDIDATES',
    correctedUtterance: '아들 이름으로 뭘 좀 해야 하는데',
    confidence: 0.48,
    task: null,
    candidates: mockTaskTypes,
    sttRecheckNeeded: true,
  },
  visitDecision: null,
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

export const mockChecklist: ChecklistResult = {
  taskTypeCode: 'PASSBOOK_REISSUE',
  taskName: '통장 재발급',
  items: [
    {
      itemCode: 'ID_CARD',
      name: '신분증',
      easyDescription: '주민등록증이나 운전면허증',
      required: true,
      condition: null,
    },
    {
      itemCode: 'SEAL',
      name: '도장',
      easyDescription: '통장 만들 때 쓴 도장',
      required: false,
      condition: '서명으로 만든 통장이면 필요 없어요',
    },
    {
      itemCode: 'POA',
      name: '위임장',
      easyDescription: '다른 사람이 대신 갈 때 필요한 종이',
      required: false,
      condition: '가족이 대신 방문하는 경우',
    },
  ],
}

export const mockBranchRecommendations: BranchRecommendationResult = {
  recommendations: [
    {
      rank: 1,
      branch: {
        branchId: 103,
        name: 'KB국민은행 종로지점',
        address: '서울 종로구 종로 1',
        phone: '02-000-0000',
        distanceKm: 1.2,
      },
      visitTime: {
        date: '2026-09-06',
        dayLabel: '내일',
        timeSlot: '10:00-11:00',
        timeLabel: '오전 10시',
      },
      expectedWaitMinutes: 5,
      score: 91.5,
      sentence: '내일 오전 10시에 종로지점 방문을 추천해요. 대기가 가장 적은 시간이에요.',
    },
  ],
  weights: { wait: 0.7, distance: 0.3 },
  congestionSource: 'MOCK',
}

export const mockTaskSelectionResult: TaskSelectionResult = {
  consultationId: 'mock-consultation-002',
  status: 'TASK_CONFIRMED',
  task: mockTaskTypes[1] ?? {
    taskTypeCode: 'DEPOSIT_EARLY_CLOSE',
    name: '예금 중도해지',
    easyDescription: '만기 전에 돈을 찾는 것',
  },
  visitDecision: {
    decision: 'CHECK_NEEDED',
    reason: '상품에 따라 앱에서 해지가 가능할 수 있어요. 먼저 확인해 보세요.',
    remoteMethods: [],
    officialChannels: [
      {
        name: 'KB국민은행 고객센터',
        phone: '1588-9999',
        description: '해지 가능 여부를 전화로 확인',
      },
    ],
  },
}

export const mockConsultationHistory: ConsultationHistoryResult = {
  consultations: [
    {
      consultationId: 'mock-consultation-001',
      utterance: '통장을 잃어버렸어',
      correctedUtterance: '통장을 잃어버렸어',
      status: 'TASK_CONFIRMED',
      taskName: '통장 재발급',
      createdAt: '2026-09-05T10:30:00',
    },
  ],
}
