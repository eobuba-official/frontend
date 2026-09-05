import axios from 'axios'

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

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(accessToken: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}
