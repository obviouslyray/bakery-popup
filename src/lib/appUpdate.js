// Keeps an open app on the latest published version. The service worker
// (src/sw.js) activates a new version as soon as it is downloaded, but the page
// already on screen keeps running the old code until it reloads.

const CHECK_EVERY_MS = 5 * 60 * 1000
const RETRY_EVERY_MS = 1500

// Never reload over a popup (menu editor, owner login, QR codes) or typing.
function isBusy() {
  const active = document.activeElement
  return Boolean(document.querySelector('[role="dialog"]')) || Boolean(active?.matches('input, textarea, select'))
}

function reloadWhenSafe() {
  if (!isBusy()) {
    window.location.reload()
    return
  }
  setTimeout(reloadWhenSafe, RETRY_EVERY_MS)
}

export function initAppUpdates() {
  if (!('serviceWorker' in navigator)) return

  const checkForUpdate = () => {
    navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {})
  }

  // A first-time install also takes control of the page, but that isn't an update.
  let controlled = Boolean(navigator.serviceWorker.controller)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controlled) reloadWhenSafe()
    controlled = true
  })

  setInterval(checkForUpdate, CHECK_EVERY_MS)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkForUpdate()
  })
}
