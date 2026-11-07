import { createClient } from '@supabase/supabase-js'

// Only the public (publishable / anon) key belongs in the front end. These two
// values are public by design (every visitor's browser receives them), so the
// project's own are the defaults here; .env can override them locally.
// Never put the secret / service-role key in this file or anywhere in the app.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://vnzcucyxpixjeujabeua.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_w9T0Mzb2gT4TXJqoaTMR4w_gML779x_'

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
