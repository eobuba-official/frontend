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
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: routePaths.input,
      name: 'input',
      component: () => import('@/views/InputView.vue'),
    },
    {
      path: routePaths.utteranceConfirm,
      name: 'utterance-confirm',
      component: () => import('@/views/UtteranceConfirmView.vue'),
    },
    {
      path: routePaths.taskConfirm,
      name: 'task-confirm',
      component: () => import('@/views/TaskConfirmView.vue'),
    },
    {
      path: routePaths.visitDecision,
      name: 'visit-decision',
      component: () => import('@/views/VisitDecisionView.vue'),
    },
    {
      path: routePaths.checklist,
      name: 'checklist',
      component: () => import('@/views/ChecklistView.vue'),
    },
    {
      path: routePaths.branches,
      name: 'branches',
      component: () => import('@/views/BranchRecommendationView.vue'),
    },
    {
      path: routePaths.visitSummary,
      name: 'visit-summary',
      component: () => import('@/views/VisitSummaryView.vue'),
    },
    {
      path: routePaths.consultationEnd,
      name: 'consultation-end',
      component: () => import('@/views/ConsultationEndView.vue'),
    },
    {
      path: routePaths.fraudWarning,
      name: 'fraud-warning',
      component: () => import('@/views/FraudWarningView.vue'),
    },
    {
      path: routePaths.history,
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
    },
    {
      path: routePaths.settings,
      name: 'settings',
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
