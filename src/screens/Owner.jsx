import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { signIn, signOut } from '../lib/supabase.js'
import './Owner.css'

// Owner sign-in. Not linked from any customer screen; owners open /#/owner directly.
export default function Owner() {
  const { ready, session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!ready) return null

  if (session) {
    return (
      <section className="owner">
        <h1>Owner mode</h1>
        <p className="placeholder">Signed in as {session.user.email}. Edit controls now appear on the app screens.</p>
        <Link to="/" className="button">Go to the app</Link>
        <button type="button" className="owner__signout" onClick={signOut}>Sign out</button>
      </section>
    )
  }

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
    <section className="owner">
      <h1>Owner login</h1>
      <form className="owner__form" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" autoComplete="username" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="owner__error" role="alert">{error}</p>}
        <button type="submit" className="button owner__submit" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <Link to="/" className="owner__back">Back to the app</Link>
    </section>
  )
}
