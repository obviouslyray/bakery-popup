import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import './QrSheet.css'

// Bottom sheet showing a QR code for `url`, with a title and a short explanation.
// With no url, only the explanation is shown.
export default function QrSheet({ title, url, alt, children, onClose }) {
  const [qr, setQr] = useState({ src: null, failed: false })

  useEffect(() => {
    if (!url) return
    let cancelled = false
    QRCode.toDataURL(url, { errorCorrectionLevel: 'L', margin: 2, width: 560 })
      .then((src) => !cancelled && setQr({ src, failed: false }))
      .catch(() => !cancelled && setQr({ src: null, failed: true }))
    return () => { cancelled = true }
  }, [url])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="qr-sheet" role="dialog" aria-modal="true" aria-labelledby="qr-sheet-title" onClick={onClose}>
      <div className="qr-sheet__sheet" onClick={(e) => e.stopPropagation()}>
        <h2 id="qr-sheet-title" className="qr-sheet__title">{title}</h2>

        {url && (
          <div className="qr-sheet__code">
            {qr.src && <img src={qr.src} alt={alt} />}
            {qr.failed && <p className="qr-sheet__text">Could not make the code. Please try again.</p>}
          </div>
        )}
        <p className="qr-sheet__text">{children}</p>

        <button type="button" className="qr-sheet__close" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
