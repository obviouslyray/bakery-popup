// #passport qr code - popup that shows a qr code (used for moving stamps + sharing the app)
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import './QrSheet.css'

// shows a qr code for url with a title and a little explanation.
// if there's no url it just shows the text
export default function QrSheet({ title, url, alt, children, onClose }) {
  const [qr, setQr] = useState({ src: null, failed: false }) // the qr image

  // #passport qr code - make the qr image whenever the url changes
  useEffect(() => {
    if (!url) return
    let cancelled = false
    QRCode.toDataURL(url, { errorCorrectionLevel: 'L', margin: 2, width: 560 }) // L = lowest error correction so it fits more data
      .then((src) => !cancelled && setQr({ src, failed: false }))
      .catch(() => !cancelled && setQr({ src: null, failed: true }))
    return () => { cancelled = true } // don't update if the popup already closed
  }, [url])

  // escape closes it
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    // tap outside to close
    <div className="qr-sheet" role="dialog" aria-modal="true" aria-labelledby="qr-sheet-title" onClick={onClose}>
      <div className="qr-sheet__sheet" onClick={(e) => e.stopPropagation()}>
        <h2 id="qr-sheet-title" className="qr-sheet__title">{title}</h2>

        {/* the qr code (or an error if it couldn't make one) */}
        {url && (
          <div className="qr-sheet__code">
            {qr.src && <img src={qr.src} alt={alt} />}
            {qr.failed && <p className="qr-sheet__text">Could not make the code. Please try again.</p>}
          </div>
        )}
        <p className="qr-sheet__text">{children}</p>

        {/* done button */}
        <button type="button" className="qr-sheet__close" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
