export type ApiResponse<T> =
  | {
      success: true
      data: T
      error: null
    }
  | {
      success: false
      data: null
      error: ApiError
    }

export interface ApiError {
  code:
    | 'INVALID_INPUT'
    | 'UNAUTHORIZED'
    | 'INVALID_SMS_CODE'
    | 'CONSULTATION_NOT_FOUND'
    | 'TASK_TYPE_NOT_FOUND'
    | 'INVALID_STATE'
    | 'ALREADY_REGISTERED'
    | 'NO_WARNING_TO_DISMISS'
    | 'LLM_ERROR'
    | 'INTERNAL_ERROR'
  message: string
}

export type InputMethod = 'VOICE' | 'TEXT'
export type ConsultationStatus =
  | 'FRAUD_WARNING'
  | 'TASK_CONFIRMED'
  | 'CANDIDATES_SUGGESTED'
  | 'UNCLASSIFIED'
  | 'WARNING_DISMISSED'
export type ClassificationStatus = 'CONFIRMED' | 'CANDIDATES' | 'UNCLASSIFIED' | 'SUSPENDED'
export type VisitDecisionType = 'NO_VISIT' | 'CHECK_NEEDED' | 'VISIT_REQUIRED'
export type FraudPatternType =
  | 'IMPERSONATION'
  | 'SAFE_ACCOUNT'
  | 'SECRECY'
  | 'REMOTE_CONTROL'
  | 'URGENCY'

export interface User {
  userId: number
  name: string
  phoneNumber: string
}

export interface Guardian {
  guardianId?: number
  name: string
  phoneNumber: string
  relation: '아들' | '딸' | '배우자' | '기타'
}

export interface SmsRequest {
  phoneNumber: string
}

export interface SmsRequestResult {
  expiresInSeconds: number
  mockCode?: string
}

export interface SmsVerifyRequest {
  phoneNumber: string
  code: string
}

export interface SmsVerifyResult {
  registered: boolean
  accessToken: string | null
  signupToken?: string
  user?: User
}

export interface SignupRequest {
  signupToken: string
  name: string
  guardians: Guardian[]
}

export interface SignupResult {
  accessToken: string
  user: User
}

export interface AnalyzeRequest {
  utterance: string
  inputMethod: InputMethod
  sttConfidence?: number | null
}

export interface AnalyzeResult {
  consultationId: string
  status: ConsultationStatus
  fraudCheck: FraudCheck
  classification: Classification
  visitDecision: VisitDecision | null
  guidance?: string
}

export interface FraudCheck {
  detected: boolean
  dismissible: boolean
  patterns: FraudPattern[]
  safetyActions: SafetyAction[]
  guardianNotification: GuardianNotification | null
}

export interface FraudPattern {
  type: FraudPatternType
  label: string
  evidence: string
  explanation: string
}

export interface SafetyAction {
  order: number
  action: string
}

export interface GuardianNotification {
  sent: boolean
  notifiedGuardians: NotifiedGuardian[]
  message: string
}

export interface NotifiedGuardian {
  name: string
  relation: string
  maskedPhone: string
}

export interface Classification {
  status: ClassificationStatus
  correctedUtterance: string
  confidence: number | null
  task: TaskType | null
  candidates: TaskType[]
  sttRecheckNeeded: boolean
}

export interface TaskType {
  taskTypeCode: string
  name: string
  easyDescription: string
  defaultVisitDecision?: VisitDecisionType
}

export interface VisitDecision {
  decision: VisitDecisionType
  reason: string
  remoteMethods: RemoteMethod[]
  officialChannels: OfficialChannel[]
}

export interface RemoteMethod {
  channel: 'MOBILE_APP' | 'ATM' | 'CALL_CENTER' | 'WEB'
  description: string
  easyDescription: string
}

export interface OfficialChannel {
  name: string
  phone: string
  description: string
}

export interface TaskSelectionRequest {
  taskTypeCode: string
}

export interface TaskSelectionResult {
  consultationId: string
  status: 'TASK_CONFIRMED'
  task: TaskType
  visitDecision: VisitDecision
}

export interface DismissWarningRequest {
  confirmed: boolean
}

export interface DismissWarningResult {
  consultationId: string
  status: ConsultationStatus
  warningDismissed: true
  classification: Classification
  visitDecision: VisitDecision | null
}

export interface ChecklistResult {
  taskTypeCode: string
  taskName: string
  items: ChecklistItem[]
}

export interface ChecklistItem {
  itemCode: string
  name: string
  easyDescription: string
  required: boolean
  condition: string | null
}

export interface BranchRecommendationQuery {
  consultationId: string
  taskTypeCode: string
  lat?: number
  lng?: number
  regionCode?: string
  limit?: number
}

export interface BranchRecommendationResult {
  recommendations: BranchRecommendation[]
  weights: {
    wait: number
    distance: number
  }
  congestionSource: 'MOCK' | 'SEOUL_RTD'
}

export interface BranchRecommendation {
  rank: number
  branch: Branch
  visitTime: VisitTime
  expectedWaitMinutes: number
  score: number
  sentence: string
}

export interface Branch {
  branchId: number
  name: string
  address: string
  phone: string
  distanceKm: number
}

export interface VisitTime {
  date: string
  dayLabel: string
  timeSlot: string
  timeLabel: string
}

export interface ConsultationHistoryResult {
  consultations: ConsultationHistoryItem[]
}

export interface ConsultationHistoryItem {
  consultationId: string
  utterance: string
  correctedUtterance: string
  status: ConsultationStatus
  taskName: string | null
  createdAt: string
}
