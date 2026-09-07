import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import OtpInput from '../OtpInput.vue'

describe('OtpInput', () => {
  it('joins per-box input into the model value and advances focus to the next box', async () => {
    const wrapper = mount(OtpInput, {
      attachTo: document.body,
      props: { modelValue: '' },
    })
    const inputs = wrapper.findAll('input')

    await inputs[0]!.setValue('1')
    await inputs[1]!.setValue('2')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['12'])
    expect(document.activeElement).toBe(inputs[2]!.element)

    wrapper.unmount()
  })

  it('moves focus back and clears the previous box on backspace from an empty box', async () => {
    const wrapper = mount(OtpInput, {
      attachTo: document.body,
      props: { modelValue: '12' },
    })
    const inputs = wrapper.findAll('input')
    ;(inputs[2]!.element as HTMLInputElement).focus()

    await inputs[2]!.trigger('keydown', { key: 'Backspace' })

    expect(document.activeElement).toBe(inputs[1]!.element)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['1'])

    wrapper.unmount()
  })

  it('fills every box from a pasted 6-digit code', async () => {
    const wrapper = mount(OtpInput, {
      attachTo: document.body,
      props: { modelValue: '' },
    })

    const clipboardData = { getData: () => '123456' }
    await wrapper.find('input').trigger('paste', { clipboardData })

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['123456'])

    wrapper.unmount()
  })
})
