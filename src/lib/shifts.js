// #shifts - everything for opening/closing the truck
import { useSyncExternalStore } from 'react'
import { preparePhoto } from './image.js'
import { supabase } from './supabase.js'

// truck is open = there's an open shift in the database.
// all the screens share one copy of this so home changes right away when you open/close.
// other phones get it through realtime, and we re-check every 30 sec just in case
// (customers don't get a realtime event when a shift closes)

// #security - columns customers are allowed to read (stamp_code, opened_by, closed_at are hidden)
const PUBLIC_COLUMNS = 'id, schedule_date, is_open, opened_at, spot_name, lat, lng, photo_path'
const BUCKET = 'shift-photos' // storage bucket for the owner's photos
const RECHECK_MS = 30 * 1000 // 30 sec

let snapshot = { status: 'loading', shift: null } // current state everyone reads
const listeners = new Set() // components that want updates
let stopWatching = null
let request = 0 // counts requests so an old slow one can't overwrite a newer one

// save the new state and tell every component
function publish(next) {
  snapshot = next
  listeners.forEach((listener) => listener())
}

// #shifts - ask supabase if there's an open shift right now
export async function refreshShift() {
  const ticket = ++request
  try {
    if (!supabase) throw new Error('Supabase is not set up')
    if (!navigator.onLine) throw new Error('Offline')
    const { data, error } = await supabase.from('shifts').select(PUBLIC_COLUMNS).eq('is_open', true).limit(1)
    if (error) throw error
    if (ticket !== request) return // a newer request already started, ignore this one
    const shift = data[0] ?? null
    publish({ status: shift ? 'open' : 'closed', shift })
  } catch {
    // if we can't tell, show error instead of guessing open or closed
    if (ticket === request) publish({ status: 'error', shift: null })
  }
}

// start checking: realtime + timer + when the app comes back on screen / internet comes back
function startWatching() {
  refreshShift()
  // realtime - supabase tells us when the shifts table changes
  const channel = supabase
    ?.channel('shifts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => refreshShift())
    .subscribe()
  const recheck = () => {
    if (!document.hidden) refreshShift() // skip if the app is in the background
  }
  const timer = setInterval(recheck, RECHECK_MS)
  document.addEventListener('visibilitychange', recheck)
  window.addEventListener('online', refreshShift)
  window.addEventListener('offline', refreshShift)
  // cleanup function, undoes everything above
  return () => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', recheck)
    window.removeEventListener('online', refreshShift)
    window.removeEventListener('offline', refreshShift)
    if (channel) supabase.removeChannel(channel)
  }
}

// this has to be out here and not inside the hook. if it's inside, react makes a new
// one every render and it re-subscribes every time
function subscribe(listener) {
  listeners.add(listener)
  if (listeners.size === 1) stopWatching = startWatching() // first one starts it
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) { // last one gone, stop checking
      stopWatching?.()
      stopWatching = null
    }
  }
}

const getSnapshot = () => snapshot

// #shifts - screens call this. gives { status: 'loading' | 'open' | 'closed' | 'error', shift }
export function useOpenShift() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

// today's date in colorado as YYYY-MM-DD (en-CA formats it that way)
function coloradoToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver' }).format(new Date())
}

// turns a timestamp into like "6:05 a.m." in colorado time
export function formatShiftTime(iso) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit' })
    .format(new Date(iso))
    .replace('AM', 'a.m.')
    .replace('PM', 'p.m.')
}

// #open truck - get the phone's GPS. gives { lat, lng, accuracy } or an error message
export function getPhoneLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This phone cannot share its location.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      // round to 6 decimals, that's what the database column holds
      ({ coords }) => resolve({
        lat: Math.round(coords.latitude * 1e6) / 1e6,
        lng: Math.round(coords.longitude * 1e6) / 1e6,
        accuracy: Math.round(coords.accuracy), // in meters
      }),
      // blocked vs just couldn't find it
      (err) => reject(new Error(err.code === err.PERMISSION_DENIED
        ? 'Location is blocked for this app. You can still open without it.'
        : 'Could not get a location fix. Try again, or open without it.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }, // 15 sec max, no old cached spot
    )
  })
}

// #open truck - shrink the photo and upload it to the shift-photos bucket
async function uploadShiftPhoto(shiftId, file) {
  const blob = await preparePhoto(file)
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${shiftId}/${Date.now()}.${ext}` // folder per shift
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type })
  if (error) throw new Error('Could not upload the photo. Try again, or open without it.')
  return path
}

// storage path -> public url for an <img>
export function shiftPhotoUrl(path) {
  return path && supabase ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null
}

// deletes a photo if opening failed so we don't leave junk in storage
const removeShiftPhoto = async (path) => {
  if (path) await supabase.storage.from(BUCKET).remove([path]).catch(() => {})
}

// #open truck - creates the shift. owners only, database only allows one open at a time
export async function openShift({ spotName, location, photoFile }) {
  const id = crypto.randomUUID() // make the id here so the photo folder can use it
  let photoPath = null
  try {
    if (photoFile) photoPath = await uploadShiftPhoto(id, photoFile)

    // link it to today's schedule day if there is one
    const today = coloradoToday()
    const { data: day } = await supabase.from('schedule').select('date').eq('date', today).limit(1)

    // add the row
    const { error } = await supabase.from('shifts').insert({
      id,
      spot_name: spotName,
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
      photo_path: photoPath,
      schedule_date: day?.[0]?.date ?? null,
    })
    if (error) {
      // 23505 = unique error, means a shift is already open
      throw new Error(error.code === '23505'
        ? 'The truck is already open. The other owner may have just opened it.'
        : 'Could not open the truck. Check your connection, or sign in again.')
    }
  } catch (err) {
    await removeShiftPhoto(photoPath) // undo the upload
    throw err
  } finally {
    await refreshShift() // update the screen either way
  }
}

// #close truck - ends the open shift
export async function closeShift(shiftId) {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .update({ is_open: false, closed_at: new Date().toISOString() })
      .eq('id', shiftId)
      .eq('is_open', true) // only if it's still open
      .select('id')
    if (error) throw new Error('Could not close the truck. Check your connection, or sign in again.')
    if (data.length === 0) throw new Error('The truck was already closed.') // nothing updated
  } finally {
    await refreshShift()
  }
}
