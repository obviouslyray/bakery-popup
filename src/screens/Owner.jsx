import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OwnerLoginForm from '../components/OwnerLoginForm.jsx'
import { useAuth } from '../lib/auth.jsx'
import { signOut, supabase } from '../lib/supabase.js'
import { useTruckStatus } from '../lib/useTruckStatus.js'
import './Owner.css'

function TruckStatusControls({ userId }) {
  const { status, row, error, refresh } = useTruckStatus()
  const [allowed, setAllowed] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const { data, error: checkError } = await supabase.rpc('can_manage_truck_status')
        if (!cancelled) setAllowed(!checkError && data === true)
      } catch { if (!cancelled) setAllowed(false) }
    }
    void check()
    return () => { cancelled = true }
  }, [userId])

  async function change(isOpen) {
    if (!row || allowed !== true || busy || !['open', 'closed'].includes(status)) return
    setBusy(true)
    setMessage('Saving truck status…')
    try {
      const { error: saveError } = await supabase.rpc('set_truck_status', {
        new_is_open: isOpen, expected_version: row.version,
      })
      if (saveError) throw saveError
      await refresh()
      setMessage('Saved. Customer signs follow the confirmed database status.')
    } catch (saveError) {
      await refresh()
      setMessage(saveError?.code === '40001'
        ? 'Another owner changed the status. Review the refreshed status and retry.'
        : 'Could not confirm the change. Review the refreshed status before retrying.')
    } finally { setBusy(false) }
  }

  const disabled = allowed !== true || busy || !['open', 'closed'].includes(status)
  return (
    <section aria-labelledby="truck-status-heading">
      <h2 id="truck-status-heading">Truck status</h2>
      <p>Current status: {status === 'loading' ? 'Checking…' : status === 'error' ? 'Unavailable' : status === 'open' ? 'Open' : 'Closed'}</p>
      {allowed === null && <p>Checking status permissions…</p>}
      {allowed === false && <p>Your account is not approved for status changes, or database setup is incomplete.</p>}
      {error && <p role="alert">{error}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <button type="button" className="button" style={{ minHeight: 44 }}
          disabled={disabled || status === 'open'} onClick={() => change(true)}>Open truck</button>
        <button type="button" className="button" style={{ minHeight: 44 }}
          disabled={disabled || status === 'closed'} onClick={() => change(false)}>Close truck</button>
        <button type="button" className="button" style={{ minHeight: 44 }}
          disabled={busy} onClick={() => { void refresh() }}>Refresh status</button>
      </div>
      <p role="status" aria-live="polite">{message}</p>
    </section>
  )
}

export default function Owner() {
  const { ready, session } = useAuth()
  if (!ready) return null
  if (session) {
    return (
      <section className="owner">
        <h1>Owner mode</h1>
        <p className="placeholder">Signed in as {session.user.email}. Edit controls now appear on the app screens.</p>
        <TruckStatusControls key={session.user.id} userId={session.user.id} />
        <Link to="/" className="button">Go to the app</Link>
        <button type="button" className="owner__signout" onClick={signOut}>Sign out</button>
      </section>
    )
  }
  return (
    <section className="owner">
      <h1>Owner login</h1>
      <OwnerLoginForm />
      <Link to="/" className="owner__back">Back to the app</Link>
    </section>
  )
}
