// #open truck / #close truck - owner controls on the home page
import { useEffect, useState } from 'react'
import { closeShift, formatShiftTime, getPhoneLocation, openShift, refreshShift, useOpenShift } from '../lib/shifts.js'
import './ShiftControls.css'

// #open truck - popup for opening. where to find us is required, location + photo are optional
function OpenTruckSheet({ onClose, openedMeanwhile }) {
  const [spotName, setSpotName] = useState('') // where to find us text
  const [location, setLocation] = useState({ state: 'none', value: null, message: '' }) // none/finding/found/failed
  const [photo, setPhoto] = useState({ file: null, preview: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // clean up the preview url when the photo changes or the popup closes
  useEffect(() => () => { if (photo.preview) URL.revokeObjectURL(photo.preview) }, [photo])

  // escape key closes it (unless it's in the middle of opening)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  // #open truck - "use my location" button
  const findLocation = async () => {
    setLocation({ state: 'finding', value: null, message: '' })
    try {
      const value = await getPhoneLocation()
      setLocation({ state: 'found', value, message: '' })
    } catch (err) {
      setLocation({ state: 'failed', value: null, message: err.message })
    }
  }

  // #open truck - picked/took a photo, make a preview of it
  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (file) setPhoto({ file, preview: URL.createObjectURL(file) })
    e.target.value = '' // reset so picking the same photo again still works
  }

  // #open truck - "Open truck" button
  const onSubmit = async (e) => {
    e.preventDefault()
    const name = spotName.trim()
    if (!name) return setError('Add where to find you, like "Wash Park, east lot, by the boathouse".')
    setBusy(true)
    setError(null)
    try {
      await openShift({ spotName: name, location: location.value, photoFile: photo.file })
      onClose() // worked, close the popup
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    // tapping the dark background closes it
    <div className="shift-sheet" onClick={() => !busy && onClose()}>
      {/* stopPropagation so taps inside the panel don't close it */}
      <form className="shift-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="shift-sheet-title"
        onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} noValidate>
        <h2 id="shift-sheet-title" className="shift-sheet__title">Open the truck</h2>

        {/* if the other owner opened it while this popup was up */}
        {openedMeanwhile && (
          <p className="shift-sheet__error" role="alert">
            The truck was just opened{openedMeanwhile.spot_name ? ` at ${openedMeanwhile.spot_name}` : ''}, probably
            by the other owner. Cancel to see it.
          </p>
        )}

        <label className="shift-sheet__field">
          Where to find us
          <input value={spotName} onChange={(e) => setSpotName(e.target.value)} maxLength={80} autoFocus
            placeholder="Wash Park, east lot, by the boathouse" required />
        </label>

        {/* location button, or a checkmark message once it's found */}
        <div className="shift-sheet__field">
          <span>Location</span>
          {location.state === 'found' ? (
            <p className="shift-sheet__ok">Location added (within about {location.value.accuracy} m).</p>
          ) : (
            <button type="button" className="shift-sheet__secondary" onClick={findLocation}
              disabled={busy || location.state === 'finding'}>
              {location.state === 'finding' ? 'Finding your location...' : 'Use my location'}
            </button>
          )}
          {location.state === 'failed' && <p className="shift-sheet__hint">{location.message}</p>}
        </div>

        {/* photo picker, opens the camera on phones */}
        <div className="shift-sheet__field">
          <span>Photo of the truck</span>
          <div className="shift-sheet__photo">
            {photo.preview
              ? <img src={photo.preview} alt="" width="72" height="72" />
              : <span className="shift-sheet__photo-empty">Optional</span>}
            <label className="shift-sheet__secondary">
              {photo.preview ? 'Replace' : 'Take or choose photo'}
              <input type="file" accept="image/*" onChange={pickPhoto} hidden />
            </label>
          </div>
        </div>

        {error && <p className="shift-sheet__error" role="alert">{error}</p>}

        <div className="shift-sheet__actions">
          <button type="submit" className="shift-sheet__primary" disabled={busy}>
            {busy ? 'Opening...' : 'Open truck'}
          </button>
          <button type="button" className="shift-sheet__secondary" onClick={onClose} disabled={busy}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

// owner panel on home: open the truck or close it
export default function ShiftControls() {
  const { status, shift } = useOpenShift()
  const [sheetOpen, setSheetOpen] = useState(false) // open truck popup showing?
  const [confirmClose, setConfirmClose] = useState(false) // "close the truck now?" showing?
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // #close truck - runs when they confirm
  const onClose = async () => {
    setBusy(true)
    setError(null)
    try {
      await closeShift(shift.id)
      setConfirmClose(false)
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  // what to show depends on the status
  let body
  if (status === 'loading') {
    body = <p className="shift-controls__status">Checking the truck...</p>
  } else if (status === 'error') {
    // couldn't reach the database
    body = (
      <>
        <p className="shift-controls__status">Can't confirm whether the truck is open.</p>
        <button type="button" className="shift-controls__button" onClick={refreshShift}>Try again</button>
      </>
    )
  } else if (status === 'closed') {
    // #open truck - closed, show the open button
    body = (
      <>
        <p className="shift-controls__status">The truck is closed.</p>
        <button type="button" className="shift-controls__button" onClick={() => setSheetOpen(true)}>
          Open the truck
        </button>
      </>
    )
  } else {
    // #close truck - open, show when it opened + close button
    body = (
      <>
        <p className="shift-controls__status">
          <strong>Open</strong> since {formatShiftTime(shift.opened_at)}
          {shift.spot_name && <> at {shift.spot_name}</>}
        </p>
        {error && <p className="shift-controls__error" role="alert">{error}</p>}
        {/* asks first so it doesn't get closed by accident */}
        {confirmClose ? (
          <div className="shift-controls__confirm">
            <p>Close the truck now?</p>
            <button type="button" className="shift-controls__button shift-controls__button--danger"
              onClick={onClose} disabled={busy}>
              {busy ? 'Closing...' : 'Close'}
            </button>
            <button type="button" className="shift-controls__button shift-controls__button--plain"
              onClick={() => setConfirmClose(false)} disabled={busy}>
              Keep open
            </button>
          </div>
        ) : (
          <button type="button" className="shift-controls__button" onClick={() => setConfirmClose(true)}>
            Close the truck
          </button>
        )}
      </>
    )
  }

  // the popup is outside the if/else above so it doesn't reset what the owner typed
  // if the status changes while it's open (like the other owner opening first)
  return (
    <div className="shift-controls">
      {body}
      {sheetOpen && (
        <OpenTruckSheet onClose={() => setSheetOpen(false)} openedMeanwhile={status === 'open' ? shift : null} />
      )}
    </div>
  )
}
