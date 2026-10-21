// Service worker for the Bakery & Coffee Pop-Up.
// Built by vite-plugin-pwa (injectManifest strategy): the plugin replaces
// self.__WB_MANIFEST with the list of files from the build to precache.
import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Serve the app shell for any navigation, so the app opens offline.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// TODO (truck photos): cache Supabase storage images, e.g.
// registerRoute(
//   ({ url }) => url.pathname.includes('/storage/v1/object/public/'),
//   new CacheFirst({ cacheName: 'truck-images', plugins: [new ExpirationPlugin({ maxEntries: 30 })] }),
// )

// TODO (Sprint 2): push notifications.
// self.addEventListener('push', (event) => { ... self.registration.showNotification(...) })
// self.addEventListener('notificationclick', (event) => { ... clients.openWindow(...) })
