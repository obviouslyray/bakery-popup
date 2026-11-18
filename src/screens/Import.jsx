// #import stamps - page that opens when you scan the transfer qr from your old phone
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { decodeStamps, loadStamps, mergeStamps, saveStamps } from '../lib/stamps.js'

// decode the stamps from the link and figure out which ones are new
function planImport(data) {
  const incoming = decodeStamps(data)
  if (!incoming) return { ok: false } // bad code
  return { ok: true, ...mergeStamps(loadStamps(), incoming) }
}

export default function Import() {
  const [params] = useSearchParams() // the ?d= part of the link
  const [result] = useState(() => planImport(params.get('d'))) // only runs once
  const [saved, setSaved] = useState(true) // false if the phone wouldn't let us save

  // save them if there's anything new
  useEffect(() => {
    if (result.ok && result.addedCount > 0 && !saveStamps(result.merged)) {
      // storage blocked (like private browsing), nothing got saved
      queueMicrotask(() => setSaved(false))
    }
  }, [result])

  // pick the message to show
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
      {/* replace so the back button doesn't come back here */}
      <Link to="/passport" replace className="button">Open my passport</Link>
    </section>
  )
}
