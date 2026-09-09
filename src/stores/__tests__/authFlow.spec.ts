import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthFlowStore } from '../authFlow'

describe('authFlow store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('stores the phone number entered at login', () => {
    const store = useAuthFlowStore()

    store.setUserName('김부바')
    store.setPhoneNumber('01012345678')

    expect(store.userName).toBe('김부바')
    expect(store.phoneNumber).toBe('01012345678')
  })

  it('normalizes a missing mock code or signup token to null', () => {
    const store = useAuthFlowStore()

    store.setMockCode(undefined)
    store.setSignupToken(undefined)

    expect(store.mockCode).toBeNull()
    expect(store.signupToken).toBeNull()
  })

  it('resets every field back to its initial value', () => {
    const store = useAuthFlowStore()
    store.setUserName('김부바')
    store.setPhoneNumber('01012345678')
    store.setMockCode('123456')
    store.setSignupToken('mock-signup-token')

    store.reset()

    expect(store.userName).toBe('')
    expect(store.phoneNumber).toBe('')
    expect(store.mockCode).toBeNull()
    expect(store.signupToken).toBeNull()
  })
})
