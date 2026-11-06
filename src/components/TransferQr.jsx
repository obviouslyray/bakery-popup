import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { transferUrl } from '../lib/stamps.js'
import './TransferQr.css'

// Full-screen sheet with a QR code that carries the stamps to another phone.
export default function TransferQr({ stamps, onClose }) {
  const [qr, setQr] = useState({ src: null, failed: false })

  useEffect(() => {
    if (stamps.length === 0) return
    let cancelled = false
    QRCode.toDataURL(transferUrl(stamps), { errorCorrectionLevel: 'L', margin: 2, width: 560 })
      .then((src) => !cancelled && setQr({ src, failed: false }))
      .catch(() => !cancelled && setQr({ src: null, failed: true }))
    return () => { cancelled = true }
  }, [stamps])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="transfer" role="dialog" aria-modal="true" aria-labelledby="transfer-title" onClick={onClose}>
      <div className="transfer__sheet" onClick={(e) => e.stopPropagation()}>
        <h2 id="transfer-title" className="transfer__title">Move stamps to a new phone</h2>

        {stamps.length === 0 ? (
          <p className="transfer__text">There are no stamps to move yet.</p>
        ) : (
          <>
            <div className="transfer__code">
              {qr.src && <img src={qr.src} alt={`QR code holding ${stamps.length} stamps`} />}
              {qr.failed && <p className="transfer__text">Could not make the code. Please try again.</p>}
            </div>
            <p className="transfer__text">
              On the new phone, open the camera and scan this code. Your {stamps.length} stamps will be
              added to the passport there.
            </p>
          </>
        )}

        <button type="button" className="transfer__close" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
