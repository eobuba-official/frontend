import { describe, expect, it } from 'vitest'
import type { AxiosResponse } from 'axios'
import { AxiosError, AxiosHeaders } from 'axios'
import { normalizeApiError, unwrapApiResponse } from '../client'
import type { ApiResponse } from '../types'

function makeResponse<T>(body: ApiResponse<T>): AxiosResponse<ApiResponse<T>> {
  return {
    data: body,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: new AxiosHeaders() },
  }
}

describe('unwrapApiResponse', () => {
  it('replaces response.data with the inner payload on success', () => {
    const response = makeResponse({ success: true, data: { expiresInSeconds: 180 }, error: null })

    const result = unwrapApiResponse(response)

    expect(result.data).toEqual({ expiresInSeconds: 180 })
  })
})

describe('normalizeApiError', () => {
  it('rejects with an Error carrying the backend message for a business error', async () => {
    const axiosError = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      ...makeResponse({ success: false, data: null, error: { code: 'INVALID_SMS_CODE', message: '인증번호가 올바르지 않습니다.' } }),
      status: 401,
    })

    await expect(normalizeApiError(axiosError)).rejects.toThrow('인증번호가 올바르지 않습니다.')
  })

  it('passes through errors that are not a recognizable API error response', async () => {
    const networkError = new Error('Network Error')

    await expect(normalizeApiError(networkError)).rejects.toBe(networkError)
  })
})
