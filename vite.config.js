import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// The site is served from https://<user>.github.io/bakery-popup/
const base = '/bakery-popup/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      // We write our own service worker (src/sw.js) so we can add push
      // notification handlers later. The plugin injects the precache list.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
      },
      manifest: {
        name: 'Bakery & Coffee Pop-Up',
        short_name: 'Pop-Up',
        description: 'Find the bakery and coffee truck: today\'s spot, the week ahead, and the menu.',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6efe6',
        theme_color: '#5a3a22',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
