// Passport stamps live on the phone (localStorage). There are no customer
// accounts, so a QR code is how stamps move to a new phone.

const STORAGE_KEY = 'passport-stamps'

// Until scanning the truck's QR code is built, a phone with no saved stamps
// starts with these so the book and the transfer QR can be tried out.
const STARTER_STAMPS = [
  ['2026-11-02', 'Denver'], ['2026-11-03', 'Boulder'], ['2026-11-04', 'Golden'],
  ['2026-11-05', 'Fort Collins'], ['2026-11-06', 'Lakewood'], ['2026-11-07', 'Arvada'],
  ['2026-11-08', 'Longmont'], ['2026-11-09', 'Littleton'], ['2026-11-10', 'Castle Rock'],
  ['2026-11-11', 'Louisville'], ['2026-11-12', 'Aurora'], ['2026-11-13', 'Englewood'],
].map(([date, city]) => ({ date, city }))

const sortByDate = (stamps) => [...stamps].sort((a, b) => a.date.localeCompare(b.date))
const keyOf = (stamp) => `${stamp.date}|${stamp.city}`

const isStamp = (s) =>
  s && typeof s.city === 'string' && s.city.trim() !== '' && /^\d{4}-\d{2}-\d{2}$/.test(s.date)

// withStarters: on a phone that has never saved stamps, save and return the starter set.
export function loadStamps({ withStarters = false } = {}) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      if (!withStarters) return []
      saveStamps(STARTER_STAMPS)
      return STARTER_STAMPS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? sortByDate(parsed.filter(isStamp)) : []
  } catch {
    // Storage blocked (private mode) or corrupted.
    return withStarters ? STARTER_STAMPS : []
  }
}

export function saveStamps(stamps) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sortByDate(stamps)))
    return true
  } catch {
    return false
  }
}

// Compact text for the QR code: "1." then "YYYYMMDDCity" entries joined by "~".
export function encodeStamps(stamps) {
  return '1.' + stamps.map((s) => s.date.replaceAll('-', '') + encodeURIComponent(s.city)).join('~')
}

export function decodeStamps(text) {
  if (typeof text !== 'string' || !text.startsWith('1.')) return null
  try {
    const stamps = text
      .slice(2)
      .split('~')
      .filter(Boolean)
      .map((entry) => ({
        date: `${entry.slice(0, 4)}-${entry.slice(4, 6)}-${entry.slice(6, 8)}`,
        city: decodeURIComponent(entry.slice(8)),
      }))
    return stamps.every(isStamp) ? stamps : null
  } catch {
    return null
  }
}

// The link inside the transfer QR. Scanning it with the camera opens the app's import screen.
export function transferUrl(stamps) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/import?d=${encodeStamps(stamps)}`
}

// Adds incoming stamps to the existing ones, skipping duplicates. Pure: nothing is saved.
export function mergeStamps(existing, incoming) {
  const seen = new Set(existing.map(keyOf))
  const added = incoming.filter((s) => {
    const key = keyOf(s)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return { merged: sortByDate([...existing, ...added]), addedCount: added.length }
}

// How a stamp looks: ink and tilt are picked from its position so they stay
// the same every time the book is opened.
const INKS = ['red', 'blue', 'green']
const TILTS = [-8, 6, -3, 9, -6, 4, -10, 2, 7, -4]
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function stampStyle(index) {
  return { ink: INKS[index % INKS.length], tilt: TILTS[index % TILTS.length] }
}

export function formatStampDate(date) {
  const [year, month, day] = date.split('-')
  return `${MONTHS[Number(month) - 1]} ${day} ${year}`
}
