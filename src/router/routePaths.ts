export const routePaths = {
  login: '/login',
  smsVerify: '/login/verify',
  guardianRegister: '/login/guardian',
  home: '/',
  input: '/input',
  utteranceConfirm: '/utterance/confirm',
  taskConfirm: '/task/confirm',
  visitDecision: '/visit-decision',
  checklist: '/checklist',
  branches: '/branches',
  branchMap: '/branches/map',
  visitSummary: '/visit-summary',
  fraudWarning: '/fraud-warning',
  fraudDismissConfirm: '/fraud-warning/dismiss-confirm',
  remoteGuidance: '/remote-guidance',
  consultationEnd: '/consultation/end',
  history: '/history',
  settings: '/settings',
} as const

export type RouteKey = keyof typeof routePaths
export type RoutePath = (typeof routePaths)[RouteKey]
