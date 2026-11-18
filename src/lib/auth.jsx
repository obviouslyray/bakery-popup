// #owner login - keeps track of whether an owner is logged in
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// sign ups are turned off in supabase, so if someone is logged in
// they have to be one of the two owners

const AuthContext = createContext({ ready: true, session: null, isOwner: false })

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ready: !supabase, session: null })

  useEffect(() => {
    if (!supabase) return
    // check if already logged in from last time
    supabase.auth.getSession().then(({ data }) => setState({ ready: true, session: data.session }))
    // update whenever someone logs in or out
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setState({ ready: true, session }))
    return () => data.subscription.unsubscribe() // stop listening when unmounted
  }, [])

  const value = { ...state, isOwner: Boolean(state.session) } // has a session = owner
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// any component can call useAuth() to get isOwner
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
