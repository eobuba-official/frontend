import { createRouter, createWebHistory } from 'vue-router'
import { getAccessToken } from '@/api/client'
import { routePaths } from './routePaths'

const publicPaths: string[] = [routePaths.login, routePaths.smsVerify, routePaths.guardianRegister]

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
      path: routePaths.home,
      name: 'home',
      meta: { step: 0 },
      component: () => import('@/views/HomeView.vue'),
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

  if (isAuthenticated && isPublicPath) {
    return { path: routePaths.home }
  }
})

export default router
