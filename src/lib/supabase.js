// #database - connects the app to supabase
import { createClient } from '@supabase/supabase-js'

// #security - this is the public key, it's fine for it to be in the code
// (every browser gets it anyway). .env can override it for local testing.
// NEVER put the secret/service role key in here
const url = import.meta.env.VITE_SUPABASE_URL || 'https://vnzcucyxpixjeujabeua.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_w9T0Mzb2gT4TXJqoaTMR4w_gML779x_'

// if the url/key are missing this is null and the customer pages still load
export const supabase = url && key ? createClient(url, key) : null

// #owner login - email + password sign in, returns an error message if it fails
export async function signIn(email, password) {
  if (!supabase) return { error: 'Sign-in is not set up yet.' }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error ? 'That email and password did not match.' : null }
}

// #owner login - log out
export async function signOut() {
  await supabase?.auth.signOut()
}
