// #owner login - email/password form, used on /owner and in the lock popup
import { useState } from 'react'
import { signIn } from '../lib/supabase.js'
import './OwnerLoginForm.css'

export default function OwnerLoginForm({ autoFocus = false }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false) // true while waiting on supabase

  const onSubmit = async (e) => {
    e.preventDefault() // stop the page from reloading
    setBusy(true)
    setError(null)
    const result = await signIn(email.trim(), password)
    setBusy(false)
    if (result.error) setError(result.error) // wrong email/password
    else setPassword('') // worked, clear the password box
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
      {/* button is disabled while it's signing in so you can't double tap */}
      <button type="submit" className="button owner-form__submit" disabled={busy}>
        {busy ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
