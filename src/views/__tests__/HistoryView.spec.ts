import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ConsultationHistoryItem } from '@/api/types'
import { consultationService } from '@/services/consultationService'
import HistoryView from '../HistoryView.vue'

const currentYear = new Date().getFullYear()

const confirmedItem: ConsultationHistoryItem = {
  consultationId: 'consultation-1',
  correctedUtterance: '통장을 잃어버려서 다시 만들고 싶어요',
  status: 'TASK_CONFIRMED',
  taskTypeCode: 'PASSBOOK_REISSUE',
  confidence: 0.96,
  createdAt: `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-09T14:30:00`,
}

const needsCheckItem: ConsultationHistoryItem = {
  consultationId: 'consultation-2',
  correctedUtterance: '돈 보내는 거 물어보려고',
  status: 'UNCLASSIFIED',
  taskTypeCode: null,
  confidence: null,
  createdAt: `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-08T10:20:00`,
}

describe('HistoryView', () => {
  afterEach(() => vi.restoreAllMocks())

  it('opens a detail dialog when a confirmed history item is selected', async () => {
    vi.spyOn(consultationService, 'getConsultationHistory').mockResolvedValue({
      consultations: [confirmedItem],
    })
    vi.spyOn(consultationService, 'getTaskTypes').mockResolvedValue([
      {
        taskTypeCode: 'PASSBOOK_REISSUE',
        name: '통장 재발급',
        easyDescription: '통장을 새로 만드는 일',
      },
    ])

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('통장을 잃어버려서 다시 만들고 싶어요')
    await wrapper
      .get('[aria-label="통장을 잃어버려서 다시 만들고 싶어요 상세 보기"]')
      .trigger('click')

    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.text()).toContain('이용 내역 상세')
    expect(dialog.text()).toContain('통장 재발급')
    expect(dialog.text()).toContain('통장을 잃어버려서 다시 만들고 싶어요')
    expect(dialog.text()).toContain('기록 일시')
  })

  it('closes the detail dialog with the confirmation button', async () => {
    vi.spyOn(consultationService, 'getConsultationHistory').mockResolvedValue({
      consultations: [confirmedItem],
    })
    vi.spyOn(consultationService, 'getTaskTypes').mockResolvedValue([])

    const wrapper = mountView()
    await flushPromises()
    await wrapper
      .get('[aria-label="통장을 잃어버려서 다시 만들고 싶어요 상세 보기"]')
      .trigger('click')
    await wrapper.get('[role="dialog"] button').trigger('click')

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows an unclassified request in its card and detail dialog', async () => {
    vi.spyOn(consultationService, 'getConsultationHistory').mockResolvedValue({
      consultations: [needsCheckItem],
    })
    vi.spyOn(consultationService, 'getTaskTypes').mockResolvedValue([])

    const wrapper = mountView()
    await flushPromises()
    await wrapper.get('[role="tab"][aria-selected="false"]').trigger('click')

    expect(wrapper.text()).toContain('돈 보내는 거 물어보려고')
    await wrapper
      .get('[aria-label="돈 보내는 거 물어보려고 상세 보기"]')
      .trigger('click')

    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.text()).toContain('말씀을 정확히 이해하지 못했어요')
    expect(dialog.text()).toContain('돈 보내는 거 물어보려고')
  })
})

function mountView() {
  return mount(HistoryView, {
    global: {
      stubs: {
        AppScreen: {
          template: '<main><slot/><slot name="footer"/></main>',
        },
        BottomTabBar: true,
      },
    },
  })
}
