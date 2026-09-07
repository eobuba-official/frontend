import type {
  Guardian,
  SignupRequest,
  SignupResult,
  SmsRequest,
  SmsRequestResult,
  SmsVerifyRequest,
  SmsVerifyResult,
} from '@/api/types'
import { setAccessToken } from '@/api/client'

const mockUser = {
  userId: 1,
  name: '김순자',
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

// 이미 가입된 것으로 취급할 번호. 그 외 번호는 미가입 처리되어
// 가족 등록 화면(회원가입 플로우)으로 이어집니다.
const registeredPhoneNumbers = new Set<string>([mockUser.phoneNumber])

export const authService = {
  requestSms(_request: SmsRequest): Promise<SmsRequestResult> {
    return delay({
      expiresInSeconds: 180,
      mockCode: '123456',
    })
  },

  verifySms(request: SmsVerifyRequest): Promise<SmsVerifyResult> {
    if (request.code !== '123456') {
      return Promise.reject(new Error('인증번호가 맞지 않습니다.'))
    }

    if (!registeredPhoneNumbers.has(request.phoneNumber)) {
      return delay({
        registered: false,
        accessToken: null,
        signupToken: 'mock-signup-token',
      })
    }

    const accessToken = 'mock-access-token'
    setAccessToken(accessToken)

    return delay({
      registered: true,
      accessToken,
      user: mockUser,
    })
  },

  signup(_request: SignupRequest): Promise<SignupResult> {
    const accessToken = 'mock-access-token'
    setAccessToken(accessToken)

    return delay({
      accessToken,
      user: mockUser,
    })
  },

  getMe() {
    return delay({
      ...mockUser,
      guardians: mockGuardians,
    })
  },
}
