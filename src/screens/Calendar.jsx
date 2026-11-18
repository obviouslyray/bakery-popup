import { shiftPhotoUrl, useOpenShift } from '../lib/shifts.js'
import './Calendar.css'

// Shown only while the truck is open: the owner's photo and where to find the truck.
function Currently({ shift }) {
  const photo = shiftPhotoUrl(shift.photo_path)
  return (
    <section className="currently" aria-labelledby="currently-title">
      <h2 id="currently-title" className="currently__label">Currently</h2>
      {photo && <img className="currently__photo" src={photo} alt="The truck at today's spot" />}
      <div className="currently__body">
        <p className="currently__spot">{shift.spot_name || 'Open now'}</p>
        <p className="currently__hours">Open now until 11 a.m.</p>
      </div>
    </section>
  )
}

export default function Calendar() {
  const { status, shift } = useOpenShift()
  return (
    <section>
      {status === 'open' && shift && <Currently shift={shift} />}
      <h1>This week</h1>
      <p className="placeholder">Placeholder: the next 7 days, each showing the city or Resting up.</p>
    </section>
  )
}
