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
    | 'SMS_REQUEST_COOLDOWN'
    | 'CONSULTATION_NOT_FOUND'
    | 'TASK_TYPE_NOT_FOUND'
    | 'INVALID_STATE'
    | 'ALREADY_REGISTERED'
    | 'NO_WARNING_TO_DISMISS'
    | 'NOT_FOUND'
    | 'METHOD_NOT_ALLOWED'
    | 'INVALID_AUDIO'
    | 'AUDIO_TOO_LARGE'
    | 'STT_ERROR'
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
  | 'CORRECTION_CONFIRMATION_REQUIRED'
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

export type GuardianRelation = '아들' | '딸' | '배우자' | '기타'
export type GuardianStatus = 'ACTIVE' | 'DECLINED'

export interface Guardian {
  guardianId?: number
  name: string
  phoneNumber: string
  relation: GuardianRelation
  status?: GuardianStatus
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
  signupToken: string | null
}

export interface SignupRequest {
  signupToken: string
  name: string
  guardians: Guardian[]
}

export interface SignupResult {
  userId: number
  accessToken: string
}

export interface MeResult extends User {
  guardians: Guardian[]
}

export interface GuardianAddRequest {
  name: string
  phoneNumber: string
  relation: GuardianRelation
}

export interface GuardianAddResult {
  guardian: Guardian
  guardianCount: number
  mockNotification: string | null
}

export interface GuardianDeclineInfoResult {
  userName: string
  guardianName: string
  relation: string
  status: GuardianStatus
}

export interface GuardianDeclineRequest {
  token: string
}

export interface GuardianDeclineResult {
  status: GuardianStatus
}

export interface GuardianDeleteResult {
  guardianCount: number
  fraudAlertDisabled: boolean
}

export interface AnalyzeRequest {
  utterance: string
  inputMethod: InputMethod
  sttConfidence?: number | null
}

export interface CorrectionConfirmationRequest {
  // the Gemini-corrected sentence the user approved, or their own edit of it
  confirmedUtterance: string
  // omit to let the backend re-classify the confirmed sentence
  taskTypeCode?: string
}

export interface AnalyzeResult {
  consultationId: string
  status: ConsultationStatus
  fraudCheck: FraudCheck
  classification: Classification
  visitDecision: VisitDecision | null
  guidance?: string | null
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
  originalUtterance: string
  correctedUtterance: string
  correctionApplied: boolean
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

export type ChecklistConditionCode = 'IS_PROXY' | 'USES_SEAL' | 'HAS_PASSBOOK' | 'IS_PASSBOOK_PASSWORD_CHANGE'

export interface ChecklistQuestion {
  conditionCode: ChecklistConditionCode
  question: string
  answerType: 'BOOLEAN'
  answered: boolean
  answer: boolean | null
}

export interface ChecklistQuestionsResult {
  questions: ChecklistQuestion[]
}

export interface ChecklistAnswerRequest {
  answers: { conditionCode: ChecklistConditionCode; value: boolean }[]
}

export interface ChecklistAnswerResult {
  savedCount: number
}

export type ChecklistItemStatus = 'INCLUDED' | 'EXCLUDED' | 'UNRESOLVED'

export interface ResolvedChecklistItem {
  itemCode: string
  name: string
  easyDescription: string
  required: boolean
  status: ChecklistItemStatus
  reason: string | null
  displayOrder: number
}

export interface ResolvedChecklistResult {
  taskTypeCode: string
  taskTypeName: string
  resolved: boolean
  items: ResolvedChecklistItem[]
}

export interface BranchRecommendationQuery {
  consultationId: string
  taskTypeCode: string
  lat?: number
  lng?: number
  regionCode?: string
  limit?: number
}

export type CongestionSource = 'MOCK' | 'FALLBACK'

export interface BranchRecommendationResult {
  recommendations: BranchRecommendation[]
  walkingSpeedKmh: number
}

export interface BranchRecommendation {
  rank: number
  branch: Branch
  visitTime: VisitTime
  expectedWaitMinutes: number
  congestionSource: CongestionSource
  walkMinutes: number | null
  totalMinutes: number
  sentence: string
}

export interface Branch {
  branchId: number
  name: string
  address: string
  phone: string
  lat: number
  lng: number
  distanceKm: number | null
}

export interface VisitTime {
  date: string
  dayLabel: string
  timeSlot: string
  timeLabel: string
}

// GET /branches/nearby — no consultationId needed, unlike /branches/recommendations.
// Server applies its own radius (piggyback.recommendation.search-radius-km, 10km
// default) and result cap (limit param, 1-20, default 5) — there's no radiusKm param.
// Does NOT include wait time: the congestion lookup only runs inside the
// consultationId-gated recommendation flow, so walkMinutes is the only timing field
// here. See src/mocks/branches.ts for the client-side fallback used if this call fails.
export interface NearbyBranchQuery {
  lat?: number
  lng?: number
  regionCode?: string
  taskTypeCode?: string
  limit?: number
}

export interface NearbyBranch extends Branch {
  walkMinutes: number | null
}

export interface NearbyBranchResult {
  branches: NearbyBranch[]
  walkingSpeedKmh: number
}

export interface ConsultationHistoryResult {
  consultations: ConsultationHistoryItem[]
}

export interface ConsultationHistoryItem {
  consultationId: string
  correctedUtterance: string
  status: ConsultationStatus
  taskTypeCode: string | null
  confidence: number | null
  createdAt: string
}

export interface TaskTypeListResult {
  taskTypes: TaskTypeListItem[]
}

export interface TaskTypeListItem {
  code: string
  name: string
  easyDescription: string
}

export interface SpeechTranscriptionResult {
  transcript: string
  source: 'CLOVA_CSR' | 'WEB_SPEECH_FALLBACK'
  browserTranscript: string | null
  sttConfidence: number | null
  recheckNeeded: boolean
}
