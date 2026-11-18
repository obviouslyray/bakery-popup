// #menu photos / #open truck - shrinks a photo before uploading it.
// max 1000px on the long side, webp if the browser can make it (safari can't, so jpeg),
// and under the 500 KB limit on the storage bucket

const MAX_SIDE = 1000
const MAX_BYTES = 480 * 1024 // a little under 500 KB to be safe

// canvas.toBlob uses a callback, this makes it a promise so we can await it
const toBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality))

export async function preparePhoto(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height)) // never make it bigger
  // draw it smaller on a canvas
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close() // free the memory

  // try lower quality until it fits under the limit
  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    let blob = await toBlob(canvas, 'image/webp', quality)
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality) // no webp support
    if (blob && blob.size <= MAX_BYTES) return blob
  }
  throw new Error('That photo is too large. Try a different one.')
}
