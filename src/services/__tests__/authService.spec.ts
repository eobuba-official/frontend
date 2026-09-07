import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { apiClient, clearAccessToken, getAccessToken } from '@/api/client'
import { authService } from '../authService'

describe('authService (integration: client interceptors + service)', () => {
  const mock = new MockAdapter(apiClient)

  beforeEach(() => {
    mock.reset()
    clearAccessToken()
  })

  afterEach(() => {
    mock.reset()
    clearAccessToken()
  })

  it('requestSms returns the unwrapped payload', async () => {
    mock.onPost('/auth/sms/request').reply(200, {
      success: true,
      data: { expiresInSeconds: 180, mockCode: '123456' },
      error: null,
    })

    const result = await authService.requestSms({ phoneNumber: '01012345678' })

    expect(result).toEqual({ expiresInSeconds: 180, mockCode: '123456' })
  })

  it('verifySms stores the access token for an already-registered user', async () => {
    mock.onPost('/auth/sms/verify').reply(200, {
      success: true,
      data: { registered: true, accessToken: 'existing-user-token', signupToken: null },
      error: null,
    })

    const result = await authService.verifySms({ phoneNumber: '01012345678', code: '123456' })

    expect(result.registered).toBe(true)
    expect(getAccessToken()).toBe('existing-user-token')
  })

  it('verifySms leaves no access token for a new user and returns a signup token', async () => {
    mock.onPost('/auth/sms/verify').reply(200, {
      success: true,
      data: { registered: false, accessToken: null, signupToken: 'signup-token' },
      error: null,
    })

    const result = await authService.verifySms({ phoneNumber: '01099998888', code: '123456' })

    expect(result.signupToken).toBe('signup-token')
    expect(getAccessToken()).toBeNull()
  })

  it('verifySms rejects with the backend message on an invalid code', async () => {
    mock.onPost('/auth/sms/verify').reply(401, {
      success: false,
      data: null,
      error: { code: 'INVALID_SMS_CODE', message: '인증번호가 올바르지 않습니다.' },
    })

    await expect(authService.verifySms({ phoneNumber: '01012345678', code: '000000' })).rejects.toThrow(
      '인증번호가 올바르지 않습니다.',
    )
  })

  it('signup stores the access token returned for the new account', async () => {
    mock.onPost('/auth/signup').reply(200, {
      success: true,
      data: { userId: 1, accessToken: 'new-user-token' },
      error: null,
    })

    const result = await authService.signup({
      signupToken: 'signup-token',
      name: '김순자',
      guardians: [{ name: '김철수', phoneNumber: '01098765432', relation: '아들' }],
    })

    expect(result.userId).toBe(1)
    expect(getAccessToken()).toBe('new-user-token')
  })

  it('getMe returns the unwrapped profile', async () => {
    mock.onGet('/users/me').reply(200, {
      success: true,
      data: { userId: 1, name: '김순자', phoneNumber: '01012345678', guardians: [] },
      error: null,
    })

    const result = await authService.getMe()

    expect(result.name).toBe('김순자')
  })

  it('addGuardian returns the new guardian and updated count', async () => {
    mock.onPost('/users/me/guardians').reply(200, {
      success: true,
      data: {
        guardian: { guardianId: 2, name: '김철수', phoneNumber: '01098765432', relation: '아들' },
        guardianCount: 2,
      },
      error: null,
    })

    const result = await authService.addGuardian({
      name: '김철수',
      phoneNumber: '01098765432',
      relation: '아들',
    })

    expect(result.guardian.guardianId).toBe(2)
    expect(result.guardianCount).toBe(2)
  })

  it('deleteGuardian returns the updated count and fraud alert status', async () => {
    mock.onDelete('/users/me/guardians/2').reply(200, {
      success: true,
      data: { guardianCount: 0, fraudAlertDisabled: true },
      error: null,
    })

    const result = await authService.deleteGuardian(2)

    expect(result.guardianCount).toBe(0)
    expect(result.fraudAlertDisabled).toBe(true)
  })
})
