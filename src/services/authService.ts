import type { MeResult, SignupRequest, SignupResult, SmsRequest, SmsRequestResult, SmsVerifyRequest, SmsVerifyResult } from '@/api/types'
import { apiClient, setAccessToken } from '@/api/client'

export const authService = {
  async requestSms(request: SmsRequest): Promise<SmsRequestResult> {
    const response = await apiClient.post<SmsRequestResult>('/auth/sms/request', request)
    return response.data
  },

  async verifySms(request: SmsVerifyRequest): Promise<SmsVerifyResult> {
    const response = await apiClient.post<SmsVerifyResult>('/auth/sms/verify', request)

    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken)
    }

    return response.data
  },

  async signup(request: SignupRequest): Promise<SignupResult> {
    const response = await apiClient.post<SignupResult>('/auth/signup', request)
    setAccessToken(response.data.accessToken)
    return response.data
  },

  async getMe(): Promise<MeResult> {
    const response = await apiClient.get<MeResult>('/users/me')
    return response.data
  },
}
