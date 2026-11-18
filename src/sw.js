// #offline - service worker, this is what makes the app work offline + installable.
// vite-plugin-pwa builds it and swaps self.__WB_MANIFEST for the list of files to save
import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'

// #app updates - new version takes over right away instead of waiting
self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches() // delete old saved files from previous versions
precacheAndRoute(self.__WB_MANIFEST) // save all the app files on the phone

// any page load gets index.html, so the app still opens with no internet
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// TODO: save the truck photos from supabase too, something like
// registerRoute(
//   ({ url }) => url.pathname.includes('/storage/v1/object/public/'),
//   new CacheFirst({ cacheName: 'truck-images', plugins: [new ExpirationPlugin({ maxEntries: 30 })] }),
// )

// TODO (sprint 2): push notifications
// self.addEventListener('push', (event) => { ... self.registration.showNotification(...) })
// self.addEventListener('notificationclick', (event) => { ... clients.openWindow(...) })
