// #owner login - the /owner page
import { Link } from 'react-router-dom'
import OwnerLoginForm from '../components/OwnerLoginForm.jsx'
import { useAuth } from '../lib/auth.jsx'
import { signOut } from '../lib/supabase.js'
import './Owner.css'

// not linked anywhere customers can see. in the installed app owners use the
// secret lock instead (tap passport 5x)
export default function Owner() {
  const { ready, session } = useAuth()

  if (!ready) return null // still checking if logged in

  // already logged in
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

  // not logged in, show the form
  return (
    <section className="owner">
      <h1>Owner login</h1>
      <OwnerLoginForm />
      <Link to="/" className="owner__back">Back to the app</Link>
    </section>
  )
}
