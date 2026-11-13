const CACHE_NAME = 'promesses-fantomes-shell-v2'
const STATIC_FILES = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg']

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME)
  const response = await fetch('/index.html', { cache: 'no-store' })
  const html = await response.clone().text()
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)]
    .map((match) => match[1])
  await cache.put('/index.html', response)
  await cache.addAll([...new Set([...STATIC_FILES, ...assets])])
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAppShell())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  event.respondWith((async () => {
    try {
      const response = await fetch(request)
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME)
        await cache.put(request, response.clone())
      }
      return response
    } catch {
      const cached = await caches.match(request)
      if (cached) return cached
      if (request.mode === 'navigate') {
        return (await caches.match('/index.html')) ?? Response.error()
      }
      return Response.error()
    }
  })())
})
