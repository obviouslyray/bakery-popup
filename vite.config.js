// #app shell - build settings (vite) + the pwa setup
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// site lives at https://<user>.github.io/bakery-popup/ so everything needs this in front
const base = '/bakery-popup/'

export default defineConfig({
  base,
  plugins: [
    react(), // react support
    // #offline / #install page - makes the app installable + work offline
    VitePWA({
      // we write our own service worker (src/sw.js) so we can add push notifications later.
      // the plugin just adds the list of files to save
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate', // #app updates
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'], // what files get saved on the phone
        // #logo - new logo icons in public/logo aren't used yet so phones don't need to download them.
        // take this line out when we switch to the logo
        globIgnores: ['logo/**'],
      },
      // #install page - the app info phones read when installing (name, colors, icons)
      manifest: {
        name: 'Crumb & Go Bakery & Coffee',
        short_name: 'Crumb & Go', // name under the icon, phones cut off long names
        description: 'Find the Crumb & Go truck: today\'s spot, the week ahead, and the menu.',
        start_url: base,
        scope: base,
        display: 'standalone', // opens like a real app, no browser bar
        orientation: 'portrait',
        background_color: '#f6efe6', // #app coloring - splash screen color
        theme_color: '#5a3a22', // #app coloring - phone status bar color
        // current icons (the coffee cup)
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // #logo - new logo icons, not live yet. to switch: use these instead of the ones above,
        // take out globIgnores, and swap the commented lines in index.html and Install.jsx
        // icons: [
        //   { src: 'logo/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        //   { src: 'logo/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        //   { src: 'logo/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        // ],
      },
      // no service worker while running npm run dev
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
