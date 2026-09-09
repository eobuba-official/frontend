import axios from 'axios'
import type { AxiosResponse } from 'axios'
import type { ApiResponse } from './types'

const ACCESS_TOKEN_KEY = 'eobuba.accessToken'

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
  },
  timeout: 10_000,
})

export const publicApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
  },
  timeout: 10_000,
})

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

export function unwrapApiResponse(response: AxiosResponse<ApiResponse<unknown>>): AxiosResponse<unknown> {
  return { ...response, data: response.data.data }
}

export function normalizeApiError(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error) && error.response?.data?.error) {
    return Promise.reject(
      new ApiClientError(
        error.response.data.error.message,
        error.response.status,
        error.response.data.error.code,
      ),
    )
  }

  return Promise.reject(error)
}

// Backend wraps every response in ApiResponse<T> ({ success, data, error }).
// Unwrap it here so callers work with the plain payload type, like the
// mock services they replace.
apiClient.interceptors.response.use(unwrapApiResponse, normalizeApiError)
publicApiClient.interceptors.response.use(unwrapApiResponse, normalizeApiError)

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(accessToken: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}
