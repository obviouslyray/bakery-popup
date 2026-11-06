import { useSyncExternalStore } from 'react'

// Chrome on Android fires beforeinstallprompt once it decides the app can be
// installed, often before the install page is open. We keep the event so the
// page's Install button can show Chrome's install dialog later.

let deferredPrompt = null
let snapshot = { canPrompt: false, installed: false }
const listeners = new Set()

function update(next) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((listener) => listener())
}

export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    update({ canPrompt: true })
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    update({ canPrompt: false, installed: true })
  })
}

export function useInstallPrompt() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => snapshot,
  )
}

// Shows Chrome's install dialog. Resolves to 'accepted', 'dismissed' or 'unavailable'.
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable'
  const prompt = deferredPrompt
  deferredPrompt = null // each event can only be used once
  update({ canPrompt: false })
  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  return outcome
}

export function detectPlatform() {
  const ua = navigator.userAgent
  // iPadOS reports itself as a Mac, so also check for a touch screen.
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (ios) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

export function isRunningInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
}
