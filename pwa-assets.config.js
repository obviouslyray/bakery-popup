import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// `npm run icons` regenerates the PWA icons in public/ from favicon.svg.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#5a3a22' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#5a3a22' } },
  },
  images: ['public/favicon.svg'],
})
