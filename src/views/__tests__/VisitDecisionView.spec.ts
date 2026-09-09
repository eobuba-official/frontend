import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VisitDecisionType } from '@/api/types'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import VisitDecisionView from '../VisitDecisionView.vue'

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => router,
}))

const decisionCases: Array<{
  decision: VisitDecisionType
  mascot: string
  heading: string
  guide: string
}> = [
  {
    decision: 'NO_VISIT',
    mascot: 'good.png',
    heading: '은행에 방문하지 않아도 돼요',
    guide: '편한 방법을 선택해 보세요',
  },
  {
    decision: 'CHECK_NEEDED',
    mascot: 'hmm.png',
    heading: '처리 방법을 먼저 확인해 주세요',
    guide: '고객센터에 문의해 보세요',
  },
  {
    decision: 'VISIT_REQUIRED',
    mascot: 'what.png',
    heading: '은행에서 직접 처리해야 해요',
    guide: '방문 전에 준비물을 확인해 주세요',
  },
]

describe('VisitDecisionView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    router.push.mockReset()
    router.replace.mockReset()
  })

  it.each(decisionCases)('shows the matching mascot and copy for $decision', ({ decision, mascot, heading, guide }) => {
    const store = useConsultationFlowStore()
    store.visitDecision = {
      decision,
      reason: decision === 'VISIT_REQUIRED' ? '본인 확인이 필요합니다.' : '처리 방법을 안내합니다.',
      remoteMethods: [],
      officialChannels: [],
    }

    const wrapper = mount(VisitDecisionView, {
      global: {
        stubs: {
          AppScreen: {
            template: '<main><slot name="header"/><slot/><slot name="footer"/></main>',
          },
          FlowHeader: true,
          BottomActionBar: {
            template: '<div><slot/></div>',
          },
        },
      },
    })

    expect(wrapper.get('.visit-decision__icon img').attributes('src')).toContain(mascot)
    expect(wrapper.text()).toContain(heading)
    expect(wrapper.text()).toContain(guide)
  })
})
