// #passport - passport tab
import { useState } from 'react'
import QrSheet from '../components/QrSheet.jsx'
import { formatStampDate, loadStamps, stampStyle, transferUrl } from '../lib/stamps.js'
import './Passport.css'

const STAMPS_PER_PAGE = 10 // 10 stamps per page

// #stamps - where each of the 10 stamps goes on a page (x%, y%). always the same spots,
// and every other page is flipped so they don't all look the same
const STAMP_SPOTS = [
  [16, 12], [54, 12], [84, 13],
  [27, 37], [72, 41],
  [15, 62], [46, 66], [84, 60],
  [31, 87], [73, 85],
]

// arrow icon for the page buttons
const Arrow = ({ direction }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    {direction === 'next' ? <path d="M5 12h14M13 6l6 6-6 6" /> : <path d="M19 12H5M11 6l-6 6 6 6" />}
  </svg>
)

export default function Passport() {
  const [stamps] = useState(loadStamps) // #stamps - load from the phone once
  // always at least 1 page, a new one starts when the last is full
  const pageCount = Math.max(1, Math.ceil(stamps.length / STAMPS_PER_PAGE))
  const [page, setPage] = useState(0) // which page we're on (0 = first)
  const [sheet, setSheet] = useState(null) // null | 'transfer' | 'share' // which qr popup is open
  const closeSheet = () => setSheet(null)

  const first = page * STAMPS_PER_PAGE // index of the first stamp on this page
  const pageStamps = stamps.slice(first, first + STAMPS_PER_PAGE) // stamps on this page
  const pageFull = pageStamps.length === STAMPS_PER_PAGE
  const hasNext = pageFull && page < pageCount - 1 // can only go forward if this page is full

  return (
    <section className="passport">
      <div className="passport__page">
        <header className="passport__header">
          <p className="passport__eyebrow">Crumb &amp; Go Bakery &amp; Coffee</p>
          <h1 className="passport__title">Passport</h1>
          <p className="passport__subtitle">Visas &middot; Stamps</p>
        </header>

        <div className="passport__field">
          {/* #stamps - empty passport message, or the stamps */}
          {pageStamps.length === 0 ? (
            <p className="passport__blank">Catch the truck and scan its code to collect your first stamp.</p>
          ) : (
            <ol className="passport__stamps">
              {pageStamps.map((stamp, i) => {
                const { ink, tilt } = stampStyle(first + i) // color + tilt
                const [x, y] = STAMP_SPOTS[i] // where it goes on the page
                // flip the x on odd pages
                return (
                  <li key={i} className="passport__spot"
                    style={{ left: `${page % 2 ? 100 - x : x}%`, top: `${y}%` }}>
                    <div className={`stamp stamp--${ink}`} style={{ '--tilt': `${tilt}deg` }}>
                      <span className="stamp__city">{stamp.city}</span>
                      <span className="stamp__date">{formatStampDate(stamp.date)}</span>
                      <span className="stamp__hours">6 &ndash; 11</span>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        {/* page arrows */}
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
          {/* green when this page is full and there's a next page, grey otherwise */}
          <button type="button"
            className={`passport__arrow ${hasNext ? 'passport__arrow--ready' : ''}`}
            onClick={() => setPage(page + 1)} disabled={!hasNext}
            aria-label={hasNext ? 'Next page' : 'Next page (fill this page first)'}>
            <Arrow direction="next" />
          </button>
        </footer>
      </div>

      {/* #passport qr code - button to move stamps to a new phone */}
      <button type="button" className="passport__action" onClick={() => setSheet('transfer')}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.01M17 21h4v-4M14 18v3" />
        </svg>
        Move stamps to a new phone
      </button>
      {/* #passport qr code - share the app button */}
      <button type="button" className="passport__action passport__action--secondary" onClick={() => setSheet('share')}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" />
        </svg>
        Share the app
      </button>

      {/* #passport qr code - qr with all the stamps in the link */}
      {sheet === 'transfer' && (
        <QrSheet
          title="Move stamps to a new phone"
          url={stamps.length > 0 ? transferUrl(stamps) : null}
          alt={`QR code holding ${stamps.length} stamps`}
          onClose={closeSheet}
        >
          {stamps.length > 0
            ? `On the new phone, open the camera and scan this code. Your ${stamps.length} stamps will be added to the passport there.`
            : 'There are no stamps to move yet.'}
        </QrSheet>
      )}
      {/* #passport qr code - qr that goes to the install page */}
      {sheet === 'share' && (
        <QrSheet
          title="Share the app"
          url={`${window.location.origin}${window.location.pathname}#/install`}
          alt="QR code linking to the app's install page"
          onClose={closeSheet}
        >
          Have a friend scan this with their phone camera. It opens a page that helps them add the app to
          their home screen.
        </QrSheet>
      )}
    </section>
  )
}
