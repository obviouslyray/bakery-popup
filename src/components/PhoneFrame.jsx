import './PhoneFrame.css'

// On phones the frame is the whole screen. On wider screens the app sits in a
// phone-width column, with a blurred copy of the background filling the sides.
export default function PhoneFrame({ children }) {
  return (
    <div className="phone-frame">
      <div className="phone-frame__backdrop" aria-hidden="true" />
      <div className="phone-frame__device">{children}</div>
    </div>
  )
}
