import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// #app coloring - npm run icons makes all the app icons in public/ from favicon.svg (the coffee cup)
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#5a3a22' } }, // brown behind the android icon
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#5a3a22' } }, // brown behind the iphone icon
  },
  images: ['public/favicon.svg'],
})
