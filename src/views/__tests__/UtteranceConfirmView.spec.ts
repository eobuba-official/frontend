import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnalyzeResult } from '@/api/types'
import { consultationService } from '@/services/consultationService'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import UtteranceConfirmView from '../UtteranceConfirmView.vue'

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => router,
}))

const correctedResult: AnalyzeResult = {
  consultationId: 'c1',
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
    originalUtterance: '통장을 일어버려서 다시 만들고 시퍼',
    correctedUtterance: '통장을 잃어버려서 다시 만들고 싶어',
    correctionApplied: true,
    confidence: 0.93,
    task: {
      taskTypeCode: 'PASSBOOK_REISSUE',
      name: '통장 재발급',
      easyDescription: '통장을 새로 만드는 일',
    },
    candidates: [],
    sttRecheckNeeded: true,
  },
  visitDecision: null,
  guidance: null,
}

const unchangedResult: AnalyzeResult = {
  ...correctedResult,
  classification: {
    ...correctedResult.classification,
    originalUtterance: '통장을 잃어버렸어요',
    correctedUtterance: '통장을 잃어버렸어요',
    correctionApplied: false,
  },
}

describe('UtteranceConfirmView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    router.push.mockReset()
    router.replace.mockReset()
    vi.restoreAllMocks()
  })

  it('shows the Gemini card above a muted CLOVA result only when correction was applied', () => {
    const store = useConsultationFlowStore()
    store.setUtterance({
      utterance: correctedResult.classification.originalUtterance,
      inputMethod: 'VOICE',
      sttConfidence: null,
    })
    store.setAnalyzeResult(correctedResult)

    const wrapper = mountView()
    const cards = wrapper.findAll('article')

    expect(wrapper.find('.gemini-result').exists()).toBe(true)
    expect(cards[0].text()).toContain('통장을 잃어버려서 다시 만들고 싶어')
    expect(cards[1].classes()).toContain('recognized-card--source')
    expect(cards[1].text()).toContain('통장을 일어버려서 다시 만들고 시퍼')
  })

  it('shows only the recognized result when Gemini did not change the utterance', () => {
    const store = useConsultationFlowStore()
    store.setUtterance({
      utterance: unchangedResult.classification.originalUtterance,
      inputMethod: 'VOICE',
      sttConfidence: null,
    })
    store.setAnalyzeResult(unchangedResult)

    const wrapper = mountView()

    expect(wrapper.find('.gemini-result').exists()).toBe(false)
    expect(wrapper.find('.recognized-card').classes()).not.toContain('recognized-card--source')
    expect(wrapper.find('.recognized-card').text()).toContain('통장을 잃어버렸어요')
  })

  it('uses the stored analysis when the user confirms without calling Gemini again', async () => {
    const analyze = vi.spyOn(consultationService, 'analyze')
    const store = useConsultationFlowStore()
    store.setUtterance({
      utterance: correctedResult.classification.originalUtterance,
      inputMethod: 'VOICE',
      sttConfidence: null,
    })
    store.setAnalyzeResult(correctedResult)
    const wrapper = mountView()

    await wrapper.get('[data-test="confirm-analysis"]').trigger('click')

    expect(analyze).not.toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith('/visit-decision')
  })
})

function mountView() {
  return mount(UtteranceConfirmView, {
    global: {
      stubs: {
        AppScreen: {
          template: '<main><slot name="header"/><slot/><slot name="footer"/></main>',
        },
        FlowHeader: true,
        BaseButton: {
          props: ['disabled'],
          emits: ['click'],
          template: `
            <button
              :disabled="disabled"
              @click="$emit('click')"
            ><slot name="icon"/><slot/></button>
          `,
        },
      },
    },
  })
}
