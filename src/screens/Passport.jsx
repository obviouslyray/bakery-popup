import './Passport.css'

// Sample stamps to show the look. Real stamps will come from scanning the
// truck's QR code and be saved on the phone.
const SAMPLE_STAMPS = [
  { city: 'Denver', date: 'NOV 06 2026', ink: 'red', tilt: -8 },
  { city: 'Boulder', date: 'NOV 08 2026', ink: 'blue', tilt: 6 },
  { city: 'Golden', date: 'NOV 11 2026', ink: 'green', tilt: -3 },
]

const SLOTS = 9

export default function Passport() {
  const slots = Array.from({ length: SLOTS }, (_, i) => SAMPLE_STAMPS[i] ?? null)

  return (
    <section className="passport">
      <div className="passport__page">
        <header className="passport__header">
          <p className="passport__eyebrow">Bakery &amp; Coffee Pop-Up</p>
          <h1 className="passport__title">Passport</h1>
          <p className="passport__subtitle">Visas &middot; Stamps</p>
        </header>

        <ol className="passport__grid">
          {slots.map((stamp, i) => (
            <li key={i} className="passport__slot">
              {stamp ? (
                <div
                  className={`stamp stamp--${stamp.ink}`}
                  style={{ '--tilt': `${stamp.tilt}deg` }}
                >
                  <span className="stamp__city">{stamp.city}</span>
                  <span className="stamp__date">{stamp.date}</span>
                  <span className="stamp__hours">6 &ndash; 11</span>
                </div>
              ) : (
                <span className="passport__empty">{String(i + 1).padStart(2, '0')}</span>
              )}
            </li>
          ))}
        </ol>

        <footer className="passport__footer">
          <span>Sample stamps shown</span>
          <span>Page 1</span>
        </footer>
      </div>
    </section>
  )
}
