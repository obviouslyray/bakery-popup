import { useSyncExternalStore } from 'react'
import { preparePhoto } from './image.js'
import { supabase } from './supabase.js'

// The truck is open while a shift is open. Every screen shares one copy of that
// state, so the Home sign flips the moment an owner opens or closes on the same
// phone. Other phones hear it through Realtime, with a 30-second re-check as a
// backup (customers get no Realtime event when the open shift is closed).

// Columns customers may read; stamp_code, opened_by and closed_at stay hidden.
const PUBLIC_COLUMNS = 'id, schedule_date, is_open, opened_at, spot_name, lat, lng, photo_path'
const BUCKET = 'shift-photos'
const RECHECK_MS = 30 * 1000

let snapshot = { status: 'loading', shift: null }
const listeners = new Set()
let stopWatching = null
let request = 0

function publish(next) {
  snapshot = next
  listeners.forEach((listener) => listener())
}

export async function refreshShift() {
  const ticket = ++request
  try {
    if (!supabase) throw new Error('Supabase is not set up')
    if (!navigator.onLine) throw new Error('Offline')
    const { data, error } = await supabase.from('shifts').select(PUBLIC_COLUMNS).eq('is_open', true).limit(1)
    if (error) throw error
    if (ticket !== request) return
    const shift = data[0] ?? null
    publish({ status: shift ? 'open' : 'closed', shift })
  } catch {
    // Never claim the truck is open or closed when it can't be confirmed.
    if (ticket === request) publish({ status: 'error', shift: null })
  }
}

function startWatching() {
  refreshShift()
  const channel = supabase
    ?.channel('shifts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => refreshShift())
    .subscribe()
  const recheck = () => {
    if (!document.hidden) refreshShift()
  }
  const timer = setInterval(recheck, RECHECK_MS)
  document.addEventListener('visibilitychange', recheck)
  window.addEventListener('online', refreshShift)
  window.addEventListener('offline', refreshShift)
  return () => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', recheck)
    window.removeEventListener('online', refreshShift)
    window.removeEventListener('offline', refreshShift)
    if (channel) supabase.removeChannel(channel)
  }
}

// Defined once, outside the hook: React re-subscribes whenever this function
// changes, and each fresh subscription would start another round of checks.
function subscribe(listener) {
  listeners.add(listener)
  if (listeners.size === 1) stopWatching = startWatching()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      stopWatching?.()
      stopWatching = null
    }
  }
}

const getSnapshot = () => snapshot

// { status: 'loading' | 'open' | 'closed' | 'error', shift }
export function useOpenShift() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

// Today's date in Colorado, as YYYY-MM-DD.
function coloradoToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver' }).format(new Date())
}

export function formatShiftTime(iso) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit' })
    .format(new Date(iso))
    .replace('AM', 'a.m.')
    .replace('PM', 'p.m.')
}

// Phone GPS; resolves to { lat, lng, accuracy } or rejects with a readable message.
export function getPhoneLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This phone cannot share its location.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        lat: Math.round(coords.latitude * 1e6) / 1e6,
        lng: Math.round(coords.longitude * 1e6) / 1e6,
        accuracy: Math.round(coords.accuracy),
      }),
      (err) => reject(new Error(err.code === err.PERMISSION_DENIED
        ? 'Location is blocked for this app. You can still open without it.'
        : 'Could not get a location fix. Try again, or open without it.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  })
}

async function uploadShiftPhoto(shiftId, file) {
  const blob = await preparePhoto(file)
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${shiftId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type })
  if (error) throw new Error('Could not upload the photo. Try again, or open without it.')
  return path
}

export function shiftPhotoUrl(path) {
  return path && supabase ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null
}

const removeShiftPhoto = async (path) => {
  if (path) await supabase.storage.from(BUCKET).remove([path]).catch(() => {})
}

// Starts a shift (opens the truck). Owners only; the database allows one open shift.
export async function openShift({ spotName, location, photoFile }) {
  const id = crypto.randomUUID()
  let photoPath = null
  try {
    if (photoFile) photoPath = await uploadShiftPhoto(id, photoFile)

    // Attach today's schedule day when there is one.
    const today = coloradoToday()
    const { data: day } = await supabase.from('schedule').select('date').eq('date', today).limit(1)

    const { error } = await supabase.from('shifts').insert({
      id,
      spot_name: spotName,
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
      photo_path: photoPath,
      schedule_date: day?.[0]?.date ?? null,
    })
    if (error) {
      throw new Error(error.code === '23505'
        ? 'The truck is already open. The other owner may have just opened it.'
        : 'Could not open the truck. Check your connection, or sign in again.')
    }
  } catch (err) {
    await removeShiftPhoto(photoPath)
    throw err
  } finally {
    await refreshShift()
  }
}

// Ends the open shift (closes the truck).
export async function closeShift(shiftId) {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .update({ is_open: false, closed_at: new Date().toISOString() })
      .eq('id', shiftId)
      .eq('is_open', true)
      .select('id')
    if (error) throw new Error('Could not close the truck. Check your connection, or sign in again.')
    if (data.length === 0) throw new Error('The truck was already closed.')
  } finally {
    await refreshShift()
  }
}
