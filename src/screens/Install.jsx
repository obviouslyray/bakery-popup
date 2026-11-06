import { useState } from 'react'
import { Link } from 'react-router-dom'
import { detectPlatform, isRunningInstalled, promptInstall, useInstallPrompt } from '../lib/install.js'
import './Install.css'

// Landing page for the "Share the app" QR code.
// Android: one-tap Install button. iPhone: Share > Add to Home Screen steps.

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="install__inline-icon">
    <path d="M12 3v12M8 7l4-4 4 4" /><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
  </svg>
)

const AddIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="install__inline-icon">
    <rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 8v8M8 12h8" />
  </svg>
)

function IosSteps() {
  return (
    <ol className="install__steps">
      <li>Open this page in <strong>Safari</strong>.</li>
      <li>Tap the Share button <ShareIcon /> at the bottom of the screen.</li>
      <li>Scroll down and tap <strong>Add to Home Screen</strong> <AddIcon />.</li>
      <li>Tap <strong>Add</strong> in the top right corner.</li>
    </ol>
  )
}

function AndroidInstall() {
  const { canPrompt, installed } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)

  if (installed) {
    return <p className="install__done">Installed. Look for the Pop-Up icon on your home screen.</p>
  }

  if (canPrompt) {
    const onInstall = async () => setDismissed((await promptInstall()) === 'dismissed')
    return (
      <>
        <button type="button" className="button install__button" onClick={onInstall}>Install the app</button>
        <p className="install__hint">Free, no app store needed, and it takes almost no space.</p>
      </>
    )
  }

  // Chrome has not offered the install dialog (already installed, another browser,
  // or the dialog was turned down), so give the manual route.
  return (
    <>
      {dismissed && <p className="install__hint">No problem. You can still install it this way:</p>}
      <ol className="install__steps">
        <li>Open this page in <strong>Chrome</strong>.</li>
        <li>Tap the menu button (three dots) in the top right corner.</li>
        <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
      </ol>
    </>
  )
}

export default function Install() {
  const [platform] = useState(detectPlatform)
  const [installed] = useState(isRunningInstalled)

  return (
    <section className="install">
      <img className="install__icon" src="pwa-192x192.png" alt="" width="96" height="96" />
      <h1>Get the Pop-Up app</h1>
      <p className="placeholder">See where the truck is today, the week ahead, and the menu, right from your home screen.</p>

      <div className="install__body">
        {installed ? (
          <p className="install__done">You already have the app. Enjoy!</p>
        ) : platform === 'ios' ? (
          <IosSteps />
        ) : platform === 'android' ? (
          <AndroidInstall />
        ) : (
          <p className="install__hint">Open this page on your phone to add the app to your home screen.</p>
        )}
      </div>

      <Link to="/" className="install__skip">Just show me the truck</Link>
    </section>
  )
}
