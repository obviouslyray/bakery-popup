// #install page - android install popup stuff + figuring out what phone it is
import { useSyncExternalStore } from 'react'

// chrome on android fires beforeinstallprompt when it decides the app can be installed,
// usually before you're even on the install page. we hang on to it so the
// install button can show chrome's install popup later

let deferredPrompt = null // the saved event
let snapshot = { canPrompt: false, installed: false } // what the install page reads
const listeners = new Set()

// update + tell the install page
function update(next) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((listener) => listener())
}

// called once in main.jsx
export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault() // stop chrome's own little banner
    deferredPrompt = event
    update({ canPrompt: true })
  })
  // they installed it
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    update({ canPrompt: false, installed: true })
  })
}

// install page uses this to know if it can show the button
export function useInstallPrompt() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => snapshot,
  )
}

// shows chrome's install popup. gives back 'accepted', 'dismissed' or 'unavailable'
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable'
  const prompt = deferredPrompt
  deferredPrompt = null // can only use it once
  update({ canPrompt: false })
  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  return outcome
}

// iphone, android, or other
export function detectPlatform() {
  const ua = navigator.userAgent
  // ipads say they're a mac, so also check for a touch screen
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (ios) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

// true if they opened it from the home screen icon
export function isRunningInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
}
