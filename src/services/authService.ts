import type {
  ApiResponse,
  Guardian,
  SignupRequest,
  SignupResult,
  SmsRequest,
  SmsRequestResult,
  SmsVerifyRequest,
  SmsVerifyResult,
  User,
} from '@/api/types'
import axios from 'axios'
import { apiClient, setAccessToken } from '@/api/client'

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

const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'

async function unwrapApiResponse<T>(request: Promise<{ data: ApiResponse<T> }>) {
  const response = (await request).data

  if (response.success) {
    return response.data
  }

  throw new Error(response.error.message)
}

async function withMockFallback<T>(request: () => Promise<T>, fallback: () => Promise<T>) {
  if (useMockApi) {
    return fallback()
  }

  try {
    return await request()
  } catch (error) {
    if (axios.isAxiosError(error) && error.response && error.response.status < 500 && error.response.status !== 404) {
      throw error
    }

    console.warn('[mock fallback] API request failed, using mock data.', error)
    return fallback()
  }
}

export const authService = {
  requestSms(_request: SmsRequest): Promise<SmsRequestResult> {
    return withMockFallback(
      () => unwrapApiResponse(apiClient.post<ApiResponse<SmsRequestResult>>('/auth/sms/request', _request)),
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
        const result = await unwrapApiResponse(
          apiClient.post<ApiResponse<SmsVerifyResult>>('/auth/sms/verify', request),
        )

        if (result.accessToken) {
          setAccessToken(result.accessToken)
        }

        return result
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
        })
      },
    )
  },

  signup(_request: SignupRequest): Promise<SignupResult> {
    return withMockFallback(
      async () => {
        const result = await unwrapApiResponse(
          apiClient.post<ApiResponse<SignupResult>>('/auth/signup', _request),
        )
        setAccessToken(result.accessToken)

        return result
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

  getMe(): Promise<User & { guardians: Guardian[] }> {
    return withMockFallback(
      () => unwrapApiResponse(apiClient.get<ApiResponse<User & { guardians: Guardian[] }>>('/users/me')),
      () =>
        delay({
          ...mockUser,
          guardians: mockGuardians,
        }),
    )
  },
}
