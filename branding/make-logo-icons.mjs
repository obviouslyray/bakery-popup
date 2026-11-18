// Builds the Crumb & Go logo icons in public/logo/ from branding/crumb-and-go-logo.png.
// Run: node branding/make-logo-icons.mjs
// The icons are not used yet; see the commented-out lines in vite.config.js and index.html.
import sharp from 'sharp'

const SRC = 'branding/crumb-and-go-logo.png'
const OUT = 'public/logo'
const BG = { r: 17, g: 8, b: 1, alpha: 1 } // the sign's dark background
const FULL = { left: 25, top: 9, width: 571, height: 436 } // whole logo
const MARK = { left: 180, top: 9, width: 300, height: 162 } // croissant and rays only

// Center the cropped area on a square of the background color, filling `fill` of its width.
async function icon(area, size, fill, file) {
  const inner = Math.round(size * fill)
  // Levels pull the photo's bokeh down to black, so no box edge shows on the square.
  const art = await sharp(SRC).extract(area).linear(1.2, -34)
    .resize({ width: inner, height: inner, fit: 'inside' }).toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: art, gravity: 'center', blend: 'lighten' }]).png().toFile(`${OUT}/${file}`)
}

await icon(FULL, 512, 0.86, 'pwa-512x512.png')
await icon(FULL, 192, 0.86, 'pwa-192x192.png')
await icon(FULL, 512, 0.68, 'maskable-icon-512x512.png') // stays inside the circle Android crops to
await icon(FULL, 180, 0.80, 'apple-touch-icon-180x180.png')
await icon(MARK, 64, 0.90, 'favicon-64x64.png') // text is unreadable this small
