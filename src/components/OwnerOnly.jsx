import { useAuth } from '../lib/auth.jsx'

// #security - wrap owner buttons in this so customers don't see them.
// this only hides stuff, the real protection is the RLS rules in supabase
export default function OwnerOnly({ children }) {
  const { isOwner } = useAuth()
  return isOwner ? children : null // not logged in = render nothing
}
