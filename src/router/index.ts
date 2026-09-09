import { createRouter, createWebHistory } from 'vue-router'
import { getAccessToken } from '@/api/client'
import HomeView from '@/views/HomeView.vue'
import { routePaths } from './routePaths'

const CHUNK_RELOAD_KEY = 'eobuba.chunkReload'
const CHUNK_RELOAD_COOLDOWN_MS = 10_000

const publicPaths: string[] = [
  routePaths.login,
  routePaths.smsVerify,
  routePaths.guardianRegister,
  routePaths.guardianDecline,
]
const authEntryPaths: string[] = [routePaths.login, routePaths.smsVerify, routePaths.guardianRegister]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: routePaths.login,
      name: 'login',
      component: () => import('@/views/login/LoginView.vue'),
    },
    {
      path: routePaths.smsVerify,
      name: 'sms-verify',
      component: () => import('@/views/login/SmsVerifyView.vue'),
    },
    {
      path: routePaths.guardianRegister,
      name: 'guardian-register',
      component: () => import('@/views/login/GuardianRegisterView.vue'),
    },
    {
      path: routePaths.guardianDecline,
      name: 'guardian-decline',
      component: () => import('@/views/GuardianDeclineView.vue'),
    },
    {
      path: routePaths.home,
      name: 'home',
      meta: { step: 0 },
      // The home screen is the destination immediately after authentication.
      // Keeping it in the entry bundle prevents an already-open login page from
      // requesting a removed lazy chunk after a new Vercel deployment.
      component: HomeView,
    },
    {
      path: routePaths.input,
      name: 'input',
      meta: { step: 1 },
      component: () => import('@/views/InputView.vue'),
    },
    {
      path: routePaths.utteranceConfirm,
      name: 'utterance-confirm',
      meta: { step: 1 },
      component: () => import('@/views/UtteranceConfirmView.vue'),
    },
    {
      path: routePaths.taskConfirm,
      name: 'task-confirm',
      meta: { step: 2 },
      component: () => import('@/views/TaskConfirmView.vue'),
    },
    {
      path: routePaths.visitDecision,
      name: 'visit-decision',
      meta: { step: 3 },
      component: () => import('@/views/VisitDecisionView.vue'),
    },
    {
      path: routePaths.checklist,
      name: 'checklist',
      meta: { step: 4 },
      component: () => import('@/views/ChecklistView.vue'),
    },
    {
      path: routePaths.branches,
      name: 'branches',
      meta: { step: 5 },
      component: () => import('@/views/BranchRecommendationView.vue'),
    },
    {
      path: routePaths.branchMap,
      name: 'branch-map',
      meta: { step: 5 },
      component: () => import('@/views/BranchMapView.vue'),
    },
    {
      path: routePaths.branchExplore,
      name: 'branch-explore',
      component: () => import('@/views/BranchExploreView.vue'),
    },
    {
      path: routePaths.visitSummary,
      name: 'visit-summary',
      meta: { step: 6 },
      component: () => import('@/views/VisitSummaryView.vue'),
    },
    {
      path: routePaths.consultationEnd,
      name: 'consultation-end',
      meta: { step: 7 },
      component: () => import('@/views/ConsultationEndView.vue'),
    },
    {
      path: routePaths.fraudWarning,
      name: 'fraud-warning',
      meta: { step: 1 },
      component: () => import('@/views/FraudWarningView.vue'),
    },
    {
      path: routePaths.history,
      name: 'history',
      meta: { step: 1 },
      component: () => import('@/views/HistoryView.vue'),
    },
    {
      path: routePaths.settings,
      name: 'settings',
      meta: { step: 1 },
      component: () => import('@/views/SettingsView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const isAuthenticated = Boolean(getAccessToken())
  const isPublicPath = publicPaths.includes(to.path)

  if (!isAuthenticated && !isPublicPath) {
    return { path: routePaths.login }
  }

  if (isAuthenticated && authEntryPaths.includes(to.path)) {
    return { path: routePaths.home }
  }
})

router.onError((error, to) => {
  const message = error instanceof Error ? error.message : String(error)
  const isChunkLoadError = /dynamically imported module|module script failed|load failed/i.test(message)

  if (!isChunkLoadError) return

  const now = Date.now()
  let lastReload = 0

  try {
    lastReload = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0)
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now))
  } catch {
    // Continue with recovery when session storage is unavailable.
  }

  if (now - lastReload < CHUNK_RELOAD_COOLDOWN_MS) return

  // A fresh document receives the current deployment's index and chunk URLs.
  window.location.replace(to.fullPath)
})

export default router
