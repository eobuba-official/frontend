import type {
  GuardianAddRequest,
  GuardianAddResult,
  GuardianDeclineInfoResult,
  GuardianDeclineRequest,
  GuardianDeclineResult,
  GuardianDeleteResult,
  MeResult,
  SignupRequest,
  SignupResult,
  SmsRequest,
  SmsRequestResult,
  SmsVerifyRequest,
  SmsVerifyResult,
} from '@/api/types'
import { apiClient, publicApiClient, setAccessToken } from '@/api/client'

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

  async addGuardian(request: GuardianAddRequest): Promise<GuardianAddResult> {
    const response = await apiClient.post<GuardianAddResult>('/users/me/guardians', request)
    return response.data
  },

  async deleteGuardian(guardianId: number): Promise<GuardianDeleteResult> {
    const response = await apiClient.delete<GuardianDeleteResult>(`/users/me/guardians/${guardianId}`)
    return response.data
  },

  async getGuardianDeclineInfo(token: string): Promise<GuardianDeclineInfoResult> {
    const response = await publicApiClient.get<GuardianDeclineInfoResult>('/guardians/decline-info', {
      params: { token },
    })
    return response.data
  },

  async declineGuardian(request: GuardianDeclineRequest): Promise<GuardianDeclineResult> {
    const response = await publicApiClient.post<GuardianDeclineResult>('/guardians/decline', request)
    return response.data
  },
}
