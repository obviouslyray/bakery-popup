import { useAuth } from '../lib/auth.jsx'

// Renders its children only while an owner is signed in. Signed out, nothing is
// rendered at all. Supabase row level security is what actually protects the data.
export default function OwnerOnly({ children }) {
  const { isOwner } = useAuth()
  return isOwner ? children : null
}
