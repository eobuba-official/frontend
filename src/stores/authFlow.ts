import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthFlowStore = defineStore('authFlow', () => {
  const userName = ref('')
  const phoneNumber = ref('')
  const signupToken = ref<string | null>(null)
  const mockCode = ref<string | null>(null)

  function setUserName(value: string) {
    userName.value = value
  }

  function setPhoneNumber(value: string) {
    phoneNumber.value = value
  }

  function setMockCode(value: string | null | undefined) {
    mockCode.value = value ?? null
  }

  function setSignupToken(value: string | null | undefined) {
    signupToken.value = value ?? null
  }

  function reset() {
    userName.value = ''
    phoneNumber.value = ''
    signupToken.value = null
    mockCode.value = null
  }

  return {
    userName,
    phoneNumber,
    signupToken,
    mockCode,
    setUserName,
    setPhoneNumber,
    setMockCode,
    setSignupToken,
    reset,
  }
})
