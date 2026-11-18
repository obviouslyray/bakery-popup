import './PhoneFrame.css'

// #phone frame - on a phone this is just the full screen. on a computer the app
// stays phone sized in the middle with a blurry background on the sides
export default function PhoneFrame({ children }) {
  return (
    <div className="phone-frame">
      {/* blurry sides */}
      <div className="phone-frame__backdrop" aria-hidden="true" />
      {/* the actual app */}
      <div className="phone-frame__device">{children}</div>
    </div>
  )
}
