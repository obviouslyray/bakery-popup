// #app updates - makes the app update itself when we push a new version.
// the service worker (sw.js) grabs the new version right away, but the page
// that's already open keeps running the old code until it reloads

const CHECK_EVERY_MS = 5 * 60 * 1000 // check every 5 min
const RETRY_EVERY_MS = 1500 // if busy, try again in 1.5 sec

// don't reload while a popup is open (menu editor, login, qr) or while someone is typing
function isBusy() {
  const active = document.activeElement
  return Boolean(document.querySelector('[role="dialog"]')) || Boolean(active?.matches('input, textarea, select'))
}

// reload now, or wait until they're done
function reloadWhenSafe() {
  if (!isBusy()) {
    window.location.reload()
    return
  }
  setTimeout(reloadWhenSafe, RETRY_EVERY_MS)
}

export function initAppUpdates() {
  if (!('serviceWorker' in navigator)) return

  // ask the server if there's a new version
  const checkForUpdate = () => {
    navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {})
  }

  // the very first install also does this but that's not an update, so skip that one
  let controlled = Boolean(navigator.serviceWorker.controller)
  // new version took over -> reload
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controlled) reloadWhenSafe()
    controlled = true
  })

  setInterval(checkForUpdate, CHECK_EVERY_MS)
  // also check when they come back to the app
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkForUpdate()
  })
}
