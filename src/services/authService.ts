import axios from 'axios'
import type {
  Guardian,
  MeResult,
  SignupRequest,
  SignupResult,
  SmsRequest,
  SmsRequestResult,
  SmsVerifyRequest,
  SmsVerifyResult,
} from '@/api/types'
import { apiClient, setAccessToken } from '@/api/client'

const forceMockApi = import.meta.env.VITE_USE_MOCK_API === 'true'

const mockUser = {
  userId: 1,
  name: '김부바',
  phoneNumber: '01012345678',
}

const mockGuardians: Guardian[] = [
  {
    guardianId: 1,
    name: '김철수',
    phoneNumber: '01098765432',
    relation: '아들',
  },
]

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), ms))
}

async function withMockFallback<T>(request: () => Promise<T>, fallback: () => Promise<T>) {
  if (forceMockApi) {
    return fallback()
  }

  try {
    return await request()
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      console.warn('[mock fallback] API request failed, using mock data.', error)
      return fallback()
    }

    throw error
  }
}

export const authService = {
  requestSms(request: SmsRequest): Promise<SmsRequestResult> {
    return withMockFallback(
      async () => {
        const response = await apiClient.post<SmsRequestResult>('/auth/sms/request', request)
        return response.data
      },
      () =>
        delay({
          expiresInSeconds: 180,
          mockCode: '123456',
        }),
    )
  },

  verifySms(request: SmsVerifyRequest): Promise<SmsVerifyResult> {
    return withMockFallback(
      async () => {
        const response = await apiClient.post<SmsVerifyResult>('/auth/sms/verify', request)

        if (response.data.accessToken) {
          setAccessToken(response.data.accessToken)
        }

        return response.data
      },
      () => {
        if (request.code !== '123456') {
          return Promise.reject(new Error('인증번호가 맞지 않습니다.'))
        }

        const accessToken = 'mock-access-token'
        setAccessToken(accessToken)

        return delay({
          registered: true,
          accessToken,
          signupToken: null,
        })
      },
    )
  },

  signup(request: SignupRequest): Promise<SignupResult> {
    return withMockFallback(
      async () => {
        const response = await apiClient.post<SignupResult>('/auth/signup', request)
        setAccessToken(response.data.accessToken)

        return response.data
      },
      () => {
        const accessToken = 'mock-access-token'
        setAccessToken(accessToken)

        return delay({
          userId: mockUser.userId,
          accessToken,
        })
      },
    )
  },

  getMe(): Promise<MeResult> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<MeResult>('/users/me')
        return response.data
      },
      () =>
        delay({
          ...mockUser,
          guardians: mockGuardians,
        }),
    )
  },
}
