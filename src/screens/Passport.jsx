import { useState } from 'react'
import './Passport.css'

// Sample stamps to show the look. Real stamps will come from scanning the
// truck's QR code and be saved on the phone.
const SAMPLE_CITIES = [
  'Denver', 'Boulder', 'Golden', 'Fort Collins', 'Lakewood', 'Arvada',
  'Longmont', 'Littleton', 'Castle Rock', 'Louisville', 'Aurora', 'Englewood',
]
const INKS = ['red', 'blue', 'green']
const TILTS = [-8, 6, -3, 9, -6, 4, -10, 2, 7, -4]
const SAMPLE_STAMPS = SAMPLE_CITIES.map((city, i) => ({
  city,
  date: `NOV ${String(i + 2).padStart(2, '0')} 2026`,
  ink: INKS[i % INKS.length],
  tilt: TILTS[i % TILTS.length],
}))

const STAMPS_PER_PAGE = 10

const Arrow = ({ direction }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    {direction === 'next' ? <path d="M5 12h14M13 6l6 6-6 6" /> : <path d="M19 12H5M11 6l-6 6 6 6" />}
  </svg>
)

export default function Passport() {
  const stamps = SAMPLE_STAMPS
  // Always at least one page; a new page opens once the last one is full.
  const pageCount = Math.max(1, Math.ceil(stamps.length / STAMPS_PER_PAGE))
  const [page, setPage] = useState(0)

  const pageStamps = stamps.slice(page * STAMPS_PER_PAGE, (page + 1) * STAMPS_PER_PAGE)
  const slots = Array.from({ length: STAMPS_PER_PAGE }, (_, i) => pageStamps[i] ?? null)
  const pageFull = pageStamps.length === STAMPS_PER_PAGE
  const hasNext = pageFull && page < pageCount - 1

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
                <span className="passport__empty">
                  {String(page * STAMPS_PER_PAGE + i + 1).padStart(2, '0')}
                </span>
              )}
            </li>
          ))}
        </ol>

        <footer className="passport__footer">
          {page > 0 ? (
            <button type="button" className="passport__arrow passport__arrow--back"
              onClick={() => setPage(page - 1)} aria-label="Previous page">
              <Arrow direction="back" />
            </button>
          ) : (
            <span />
          )}
          <span>Page {page + 1}</span>
          {/* Green when this page is full and the next one has stamps, gray otherwise. */}
          <button type="button"
            className={`passport__arrow ${hasNext ? 'passport__arrow--ready' : ''}`}
            onClick={() => setPage(page + 1)} disabled={!hasNext}
            aria-label={hasNext ? 'Next page' : 'Next page (fill this page first)'}>
            <Arrow direction="next" />
          </button>
        </footer>
      </div>
      <p className="placeholder passport__note">Sample stamps shown.</p>
    </section>
  )
}
