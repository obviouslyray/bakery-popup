// Shrinks a photo from the camera or library before upload: at most 1000 px on
// the long side, WebP where the browser can encode it (JPEG otherwise, e.g.
// Safari), and under the menu-photos bucket's 500 KB limit.

const MAX_SIDE = 1000
const MAX_BYTES = 480 * 1024

const toBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality))

export async function preparePhoto(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    let blob = await toBlob(canvas, 'image/webp', quality)
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality)
    if (blob && blob.size <= MAX_BYTES) return blob
  }
  throw new Error('That photo is too large. Try a different one.')
}
