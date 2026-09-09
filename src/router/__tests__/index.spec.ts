import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearAccessToken, setAccessToken } from '@/api/client'
import router from '../index'
import { routePaths } from '../routePaths'

describe('router auth guard (integration)', () => {
  beforeEach(async () => {
    clearAccessToken()
    await router.replace('/')
  })

  afterEach(() => {
    clearAccessToken()
  })

  it('redirects an unauthenticated visitor from a protected route to /login', async () => {
    await router.push(routePaths.checklist)

    expect(router.currentRoute.value.path).toBe(routePaths.login)
  })

  it('lets an authenticated user reach a protected route', async () => {
    setAccessToken('mock-access-token')

    await router.push(routePaths.checklist)

    expect(router.currentRoute.value.path).toBe(routePaths.checklist)
  })

  it('lets an unauthenticated visitor reach the guardian decline route', async () => {
    await router.push({ path: routePaths.guardianDecline, query: { token: 'decline-token' } })

    expect(router.currentRoute.value.path).toBe(routePaths.guardianDecline)
  })

  it('lets an authenticated visitor reach the guardian decline route', async () => {
    setAccessToken('mock-access-token')

    await router.push({ path: routePaths.guardianDecline, query: { token: 'decline-token' } })

    expect(router.currentRoute.value.path).toBe(routePaths.guardianDecline)
  })

  it('redirects an already-authenticated user away from the login screen', async () => {
    setAccessToken('mock-access-token')
    await router.push(routePaths.checklist)

    await router.push(routePaths.login)

    expect(router.currentRoute.value.path).toBe(routePaths.home)
  })
})
