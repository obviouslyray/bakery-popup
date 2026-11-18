// #calendar section - calendar tab
import { shiftPhotoUrl, useOpenShift } from '../lib/shifts.js'
import './Calendar.css'

// #currently card - only shows while the truck is open. owner's photo + where to find us
function Currently({ shift }) {
  const photo = shiftPhotoUrl(shift.photo_path) // turn the storage path into a real url
  return (
    <section className="currently" aria-labelledby="currently-title">
      <h2 id="currently-title" className="currently__label">Currently</h2>
      {/* no photo = just skip the image */}
      {photo && <img className="currently__photo" src={photo} alt="The truck at today's spot" />}
      <div className="currently__body">
        {/* spot_name is the "where to find us" the owner typed */}
        <p className="currently__spot">{shift.spot_name || 'Open now'}</p>
        <p className="currently__hours">Open now until 11 a.m.</p>
      </div>
    </section>
  )
}

export default function Calendar() {
  const { status, shift } = useOpenShift() // same open/closed info the home page uses
  return (
    <section>
      {/* #currently card - only when open */}
      {status === 'open' && shift && <Currently shift={shift} />}
      <h1>This week</h1>
      {/* #calendar section - the 7 day list isn't built yet */}
      <p className="placeholder">Placeholder: the next 7 days, each showing the city or Resting up.</p>
    </section>
  )
}
