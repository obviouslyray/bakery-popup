import { useState } from 'react'
import { signIn } from '../lib/supabase.js'
import './OwnerLoginForm.css'

// Email and password form for the two owner accounts. Used by the /owner page
// and the lock popup.
export default function OwnerLoginForm({ autoFocus = false }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await signIn(email.trim(), password)
    setBusy(false)
    if (result.error) setError(result.error)
    else setPassword('')
  }

  return (
    <form className="owner-form" onSubmit={onSubmit}>
      <label>
        Email
        <input type="email" autoComplete="username" required autoFocus={autoFocus} value={email}
          onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Password
        <input type="password" autoComplete="current-password" required value={password}
          onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="owner-form__error" role="alert">{error}</p>}
      <button type="submit" className="button owner-form__submit" disabled={busy}>
        {busy ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
