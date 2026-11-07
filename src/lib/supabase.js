import { createClient } from '@supabase/supabase-js'

// Only the public (publishable / anon) key belongs in the front end. Both values
// come from .env locally and from GitHub repository variables in the deploy.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// null when the settings are missing, so the customer screens still work.
export const supabase = url && key ? createClient(url, key) : null

export async function signIn(email, password) {
  if (!supabase) return { error: 'Sign-in is not set up yet.' }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error ? 'That email and password did not match.' : null }
}

export async function signOut() {
  await supabase?.auth.signOut()
}
