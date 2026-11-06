import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { decodeStamps, loadStamps, mergeStamps, saveStamps } from '../lib/stamps.js'

// Opened by scanning the transfer QR code from another phone.
function planImport(data) {
  const incoming = decodeStamps(data)
  if (!incoming) return { ok: false }
  return { ok: true, ...mergeStamps(loadStamps(), incoming) }
}

export default function Import() {
  const [params] = useSearchParams()
  const [result] = useState(() => planImport(params.get('d')))
  const [saved, setSaved] = useState(true)

  useEffect(() => {
    if (result.ok && result.addedCount > 0 && !saveStamps(result.merged)) {
      // Storage blocked (for example, private browsing): nothing was kept.
      queueMicrotask(() => setSaved(false))
    }
  }, [result])

  let heading
  let message
  if (!result.ok) {
    heading = 'That code did not work'
    message = 'Try scanning the code from your old phone again.'
  } else if (!saved) {
    heading = 'Stamps not saved'
    message = 'This browser is not allowing the app to save. Turn off private browsing and scan again.'
  } else if (result.addedCount === 0) {
    heading = 'Already here'
    message = 'Every stamp from that code is already in this passport.'
  } else {
    heading = 'Stamps moved'
    message = `Added ${result.addedCount} ${result.addedCount === 1 ? 'stamp' : 'stamps'} to this passport.`
  }

  return (
    <section>
      <h1>{heading}</h1>
      <p className="placeholder">{message}</p>
      <Link to="/passport" replace className="button">Open my passport</Link>
    </section>
  )
}
