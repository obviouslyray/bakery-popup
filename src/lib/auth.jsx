import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// Owner sign-in state. Public sign-ups are disabled in Supabase, so anyone
// signed in is one of the two owners.

const AuthContext = createContext({ ready: true, session: null, isOwner: false })

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ready: !supabase, session: null })

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setState({ ready: true, session: data.session }))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setState({ ready: true, session }))
    return () => data.subscription.unsubscribe()
  }, [])

  const value = { ...state, isOwner: Boolean(state.session) }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
