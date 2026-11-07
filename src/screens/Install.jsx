import { useState } from 'react'
import { Link } from 'react-router-dom'
import { detectPlatform, isRunningInstalled, promptInstall, useInstallPrompt } from '../lib/install.js'
import './Install.css'

// Landing page for the "Share the app" QR code.
// Android: one-tap Install button. iPhone: page menu > Share > Add to Home Screen steps.

// Simple drawing of Safari's address bar with the page-menu button at its left
// end circled. The button's icon varies by phone (it can be a puzzle piece), so
// it is drawn as a blank key instead of a specific symbol.
function AddressBarDrawing() {
  return (
    <div className="address-bar" role="img"
      aria-label="Drawing of the Safari address bar, with the button at its left end circled">
      <span className="address-bar__button">
        <span className="address-bar__ring" />
      </span>
      <span className="address-bar__url">obviouslyray.github.io</span>
      <span className="address-bar__arrow">Tap here</span>
    </div>
  )
}

function IosSteps() {
  return (
    <>
      <ol className="install__steps">
        <li>Open this page in <strong>Safari</strong>.</li>
        <li>
          Tap the button on the <strong>left side of the address bar</strong>.
          <AddressBarDrawing />
        </li>
        <li>Tap <strong>Share</strong>, then <strong>View More</strong>.</li>
        <li>Tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
      </ol>
      <p className="install__note">
        On older iPhones, tap the Share button in the toolbar at the bottom of Safari, then Add to Home Screen.
      </p>
    </>
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
