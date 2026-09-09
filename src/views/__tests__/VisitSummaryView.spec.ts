import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useConsultationFlowStore } from '@/stores/consultationFlow'
import VisitSummaryView from '../VisitSummaryView.vue'

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => router,
}))

describe('VisitSummaryView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    router.push.mockReset()
    router.replace.mockReset()
  })

  it('shows every checklist item that was visible on the preparation screen', () => {
    const store = useConsultationFlowStore()
    store.selectedBranch = {
      rank: 1,
      branch: {
        branchId: 1,
        name: 'KB국민은행 종로지점',
        address: '서울 종로구 종로 1',
        phone: '02-0000-0000',
        lat: 37.57,
        lng: 126.98,
        distanceKm: 0.5,
      },
      visitTime: {
        date: '2026-09-10',
        dayLabel: '내일',
        timeSlot: '10:00',
        timeLabel: '오전 10시',
      },
      expectedWaitMinutes: 5,
      congestionSource: 'MOCK',
      walkMinutes: 8,
      totalMinutes: 13,
      sentence: '',
    }
    store.checklist = {
      taskTypeCode: 'PASSBOOK_REISSUE',
      taskTypeName: '통장 재발급',
      resolved: false,
      items: [
        {
          itemCode: 'ID_CARD',
          name: '신분증',
          easyDescription: '',
          required: true,
          status: 'INCLUDED',
          reason: null,
          displayOrder: 1,
        },
        {
          itemCode: 'SEAL',
          name: '도장',
          easyDescription: '',
          required: false,
          status: 'UNRESOLVED',
          reason: null,
          displayOrder: 2,
        },
        {
          itemCode: 'PASSBOOK',
          name: '기존 통장',
          easyDescription: '',
          required: false,
          status: 'EXCLUDED',
          reason: null,
          displayOrder: 3,
        },
      ],
    }

    const wrapper = mount(VisitSummaryView, {
      global: {
        stubs: {
          AppScreen: {
            template: '<main><slot name="header"/><slot/><slot name="footer"/></main>',
          },
          FlowHeader: true,
        },
      },
    })

    expect(wrapper.text()).toContain('방문 정보를 확인해 주세요')
    expect(wrapper.text()).toContain('통장 재발급 준비물')
    expect(wrapper.text()).toContain('신분증 · 도장')
    expect(wrapper.text()).not.toContain('기존 통장')
    expect(wrapper.text()).toContain('확인하고 홈으로 가기')
  })
})
