import { Link } from 'react-router-dom'
import OwnerLoginForm from '../components/OwnerLoginForm.jsx'
import { useAuth } from '../lib/auth.jsx'
import { signOut } from '../lib/supabase.js'
import './Owner.css'

// Owner sign-in page. Not linked from any customer screen; in the installed app
// owners use the hidden lock (5 taps on the Passport tab) instead.
export default function Owner() {
  const { ready, session } = useAuth()

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

  return (
    <section className="owner">
      <h1>Owner login</h1>
      <OwnerLoginForm />
      <Link to="/" className="owner__back">Back to the app</Link>
    </section>
  )
}
