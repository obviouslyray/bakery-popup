// #stamps - passport stamps are saved on the phone (localStorage). no customer accounts,
// so the qr code is how you move them to a new phone

const STORAGE_KEY = 'passport-stamps-v2' // v2 because the first version had fake sample stamps

// old version saved 12 sample stamps on every phone that opened passport.
// they weren't real so we delete them
const LEGACY_SAMPLE_KEY = 'passport-stamps'

const sortByDate = (stamps) => [...stamps].sort((a, b) => a.date.localeCompare(b.date)) // oldest first
const keyOf = (stamp) => `${stamp.date}|${stamp.city}` // date + city, used to spot duplicates

// checks a stamp has a city and a YYYY-MM-DD date
const isStamp = (s) =>
  s && typeof s.city === 'string' && s.city.trim() !== '' && /^\d{4}-\d{2}-\d{2}$/.test(s.date)

// #stamps - load stamps from the phone
export function loadStamps() {
  try {
    localStorage.removeItem(LEGACY_SAMPLE_KEY) // get rid of the old fake ones
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return [] // nothing saved yet
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? sortByDate(parsed.filter(isStamp)) : [] // throw out anything broken
  } catch {
    // storage blocked (private mode) or messed up
    return []
  }
}

// #stamps - save stamps, false if the phone won't let us
export function saveStamps(stamps) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sortByDate(stamps)))
    return true
  } catch {
    return false
  }
}

// #passport qr code - squishes the stamps into short text for the qr code.
// looks like "1." then YYYYMMDDCity for each stamp, separated by ~. the 1 is a version number
export function encodeStamps(stamps) {
  return '1.' + stamps.map((s) => s.date.replaceAll('-', '') + encodeURIComponent(s.city)).join('~')
}

// #passport qr code - opposite of encode, turns the text back into stamps (null if it's bad)
export function decodeStamps(text) {
  if (typeof text !== 'string' || !text.startsWith('1.')) return null
  try {
    const stamps = text
      .slice(2) // cut off the "1."
      .split('~')
      .filter(Boolean)
      .map((entry) => ({
        date: `${entry.slice(0, 4)}-${entry.slice(4, 6)}-${entry.slice(6, 8)}`, // first 8 chars are the date
        city: decodeURIComponent(entry.slice(8)), // the rest is the city
      }))
    return stamps.every(isStamp) ? stamps : null // if any of them are bad, reject the whole thing
  } catch {
    return null
  }
}

// #passport qr code - the link inside the qr. scanning it with the camera opens the import page
export function transferUrl(stamps) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/import?d=${encodeStamps(stamps)}`
}

// #import stamps - adds the new stamps to the ones already here, skips duplicates. doesn't save anything
export function mergeStamps(existing, incoming) {
  const seen = new Set(existing.map(keyOf))
  const added = incoming.filter((s) => {
    const key = keyOf(s)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return { merged: sortByDate([...existing, ...added]), addedCount: added.length } // addedCount is for the "added 3 stamps" message
}

// #stamps - ink color and tilt are based on the stamp's position so they look
// the same every time you open the passport
const INKS = ['red', 'blue', 'green']
const TILTS = [-8, 6, -3, 9, -6, 4, -10, 2, 7, -4]
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

// picks a color/tilt by cycling through the lists
export function stampStyle(index) {
  return { ink: INKS[index % INKS.length], tilt: TILTS[index % TILTS.length] }
}

// 2026-11-18 -> NOV 18 2026
export function formatStampDate(date) {
  const [year, month, day] = date.split('-')
  return `${MONTHS[Number(month) - 1]} ${day} ${year}`
}
