// #install page - the page the share qr code opens
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { detectPlatform, isRunningInstalled, promptInstall, useInstallPrompt } from '../lib/install.js'
import './Install.css'

// #install page - android gets an install button, iphone gets the steps (share > add to home screen)

// drawing of safari's address bar with the button on the left circled. that button's icon
// is different on different iphones (sometimes a puzzle piece) so it's just drawn blank
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

// iphone steps
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

// android: install button if chrome lets us, otherwise manual steps
function AndroidInstall() {
  const { canPrompt, installed } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false) // they said no to chrome's popup

  if (installed) {
    return <p className="install__done">Installed. Look for the Crumb &amp; Go icon on your home screen.</p>
  }

  // chrome gave us the install event, show the button
  if (canPrompt) {
    const onInstall = async () => setDismissed((await promptInstall()) === 'dismissed')
    return (
      <>
        <button type="button" className="button install__button" onClick={onInstall}>Install the app</button>
        <p className="install__hint">Free, no app store needed, and it takes almost no space.</p>
      </>
    )
  }

  // chrome didn't offer it (already installed, different browser, or they said no before)
  // so show the manual way
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
  const [platform] = useState(detectPlatform) // what phone
  const [installed] = useState(isRunningInstalled) // already opened from home screen?

  return (
    <section className="install">
      <img className="install__icon" src="pwa-192x192.png" alt="" width="96" height="96" />
      {/* #logo - new logo, not live yet. swap this with the line above to turn it on */}
      {/* <img className="install__icon" src="logo/pwa-192x192.png" alt="" width="96" height="96" /> */}
      <h1>Get the Crumb &amp; Go app</h1>
      <p className="placeholder">See where the truck is today, the week ahead, and the menu, right from your home screen.</p>

      {/* pick what to show */}
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
