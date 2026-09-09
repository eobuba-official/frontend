const CACHE_VERSION = 'eobuba-pwa-v1'
const APP_SHELL_URL = '/'
const PRECACHE_URLS = [
  APP_SHELL_URL,
  '/manifest.webmanifest',
  '/favicon.ico',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const requestUrl = new URL(request.url)
  if (requestUrl.origin !== self.location.origin) return
  if (requestUrl.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstAppShell(request))
    return
  }

  event.respondWith(cacheFirst(request))
})

async function networkFirstAppShell(request) {
  const cache = await caches.open(CACHE_VERSION)

  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(APP_SHELL_URL, response.clone())
    }
    return response
  } catch {
    return (await cache.match(APP_SHELL_URL)) ?? Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) return cachedResponse

  const response = await fetch(request)
  if (response.ok) {
    await cache.put(request, response.clone())
  }

  return response
}
