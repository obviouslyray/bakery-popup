import { useEffect, useState } from 'react'
import { closeShift, formatShiftTime, getPhoneLocation, openShift, refreshShift, useOpenShift } from '../lib/shifts.js'
import './ShiftControls.css'

// Owner sheet for starting a shift: spot name (required), phone location and a photo (optional).
function OpenTruckSheet({ onClose, openedMeanwhile }) {
  const [spotName, setSpotName] = useState('')
  const [location, setLocation] = useState({ state: 'none', value: null, message: '' })
  const [photo, setPhoto] = useState({ file: null, preview: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => () => { if (photo.preview) URL.revokeObjectURL(photo.preview) }, [photo])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const findLocation = async () => {
    setLocation({ state: 'finding', value: null, message: '' })
    try {
      const value = await getPhoneLocation()
      setLocation({ state: 'found', value, message: '' })
    } catch (err) {
      setLocation({ state: 'failed', value: null, message: err.message })
    }
  }

  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (file) setPhoto({ file, preview: URL.createObjectURL(file) })
    e.target.value = ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const name = spotName.trim()
    if (!name) return setError('Add the spot name, like "Wash Park, east lot".')
    setBusy(true)
    setError(null)
    try {
      await openShift({ spotName: name, location: location.value, photoFile: photo.file })
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="shift-sheet" onClick={() => !busy && onClose()}>
      <form className="shift-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="shift-sheet-title"
        onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} noValidate>
        <h2 id="shift-sheet-title" className="shift-sheet__title">Open the truck</h2>

        {openedMeanwhile && (
          <p className="shift-sheet__error" role="alert">
            The truck was just opened{openedMeanwhile.spot_name ? ` at ${openedMeanwhile.spot_name}` : ''}, probably
            by the other owner. Cancel to see it.
          </p>
        )}

        <label className="shift-sheet__field">
          Spot name
          <input value={spotName} onChange={(e) => setSpotName(e.target.value)} maxLength={80} autoFocus
            placeholder="Wash Park, east lot" required />
        </label>

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

// Owner-only panel on Home: open the truck (start a shift) or close it (end the shift).
export default function ShiftControls() {
  const { status, shift } = useOpenShift()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

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

  let body
  if (status === 'loading') {
    body = <p className="shift-controls__status">Checking the truck...</p>
  } else if (status === 'error') {
    body = (
      <>
        <p className="shift-controls__status">Can't confirm whether the truck is open.</p>
        <button type="button" className="shift-controls__button" onClick={refreshShift}>Try again</button>
      </>
    )
  } else if (status === 'closed') {
    body = (
      <>
        <p className="shift-controls__status">The truck is closed.</p>
        <button type="button" className="shift-controls__button" onClick={() => setSheetOpen(true)}>
          Open the truck
        </button>
      </>
    )
  } else {
    body = (
      <>
        <p className="shift-controls__status">
          <strong>Open</strong> since {formatShiftTime(shift.opened_at)}
          {shift.spot_name && <> at {shift.spot_name}</>}
        </p>
        {error && <p className="shift-controls__error" role="alert">{error}</p>}
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

  // The sheet sits in the same place whatever the status, so it keeps what the
  // owner typed even if the truck opens meanwhile (say, the other owner opened it).
  return (
    <div className="shift-controls">
      {body}
      {sheetOpen && (
        <OpenTruckSheet onClose={() => setSheetOpen(false)} openedMeanwhile={status === 'open' ? shift : null} />
      )}
    </div>
  )
}
