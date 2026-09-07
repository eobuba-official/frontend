import axios from 'axios'
import type { ApiResponse } from './types'

const ACCESS_TOKEN_KEY = 'eobuba.accessToken'

export const apiClient = axios.create({
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

// Backend wraps every response in ApiResponse<T> ({ success, data, error }).
// Unwrap it here so callers work with the plain payload type, like the
// mock services they replace.
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>
    return { ...response, data: body.data }
  },
  (error: unknown) => {
    if (axios.isAxiosError<ApiResponse<unknown>>(error) && error.response?.data?.error) {
      return Promise.reject(new Error(error.response.data.error.message))
    }

    return Promise.reject(error)
  },
)

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(accessToken: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}
