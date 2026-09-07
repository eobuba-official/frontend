import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PhoneNumberField from '../PhoneNumberField.vue'

describe('PhoneNumberField', () => {
  it('emits the raw digits and displays them with a dash after the 4th digit', async () => {
    const wrapper = mount(PhoneNumberField, {
      props: { id: 'phone', modelValue: '' },
    })
    const input = wrapper.find('input')

    await input.setValue('12345678')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['12345678'])
    expect((input.element as HTMLInputElement).value).toBe('1234-5678')
  })

  it('strips non-digit characters and caps the value at 8 digits', async () => {
    const wrapper = mount(PhoneNumberField, {
      props: { id: 'phone', modelValue: '' },
    })
    const input = wrapper.find('input')

    await input.setValue('12a34-56789999')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['12345678'])
  })

  it('shows the error message when errorMessage is set', () => {
    const wrapper = mount(PhoneNumberField, {
      props: { id: 'phone', modelValue: '', errorMessage: '번호를 다시 확인해 주세요' },
    })

    expect(wrapper.text()).toContain('번호를 다시 확인해 주세요')
  })
})
