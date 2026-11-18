// #logo - makes the logo icons in public/logo/ from branding/crumb-and-go-logo.png
// run it with: node branding/make-logo-icons.mjs
// not used yet, see the commented out lines in vite.config.js and index.html
import sharp from 'sharp'

const SRC = 'branding/crumb-and-go-logo.png' // the original logo pic
const OUT = 'public/logo' // where the icons go
const BG = { r: 17, g: 8, b: 1, alpha: 1 } // dark brown from the logo's background
const FULL = { left: 25, top: 9, width: 571, height: 436 } // crop for the whole logo
const MARK = { left: 180, top: 9, width: 300, height: 162 } // crop for just the croissant

// crop it, shrink it, and put it in the middle of a square. fill = how much of the width it takes up
async function icon(area, size, fill, file) {
  const inner = Math.round(size * fill)
  // darken the background of the photo so you can't see the edge of the crop on the square
  const art = await sharp(SRC).extract(area).linear(1.2, -34)
    .resize({ width: inner, height: inner, fit: 'inside' }).toBuffer()
  // square of the background color with the logo on top
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: art, gravity: 'center', blend: 'lighten' }]).png().toFile(`${OUT}/${file}`)
}

// normal app icons
await icon(FULL, 512, 0.86, 'pwa-512x512.png')
await icon(FULL, 192, 0.86, 'pwa-192x192.png')
await icon(FULL, 512, 0.68, 'maskable-icon-512x512.png') // smaller since android crops icons into a circle
await icon(FULL, 180, 0.80, 'apple-touch-icon-180x180.png') // iphone
await icon(MARK, 64, 0.90, 'favicon-64x64.png') // browser tab, too small for the words so just the croissant
