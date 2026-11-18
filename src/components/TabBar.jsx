// #tab bar - the 4 buttons at the bottom
import { useCallback, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import OwnerLock from './OwnerLock.jsx'
import './TabBar.css'

// #owner lock - secret way in for owners: tap Passport 5 times in 3 seconds and
// a lock pops up for logging in. needed because the installed app has no url bar to type /owner
const SECRET_TAB = '/passport'
const SECRET_TAPS = 5
const SECRET_WINDOW_MS = 3000

// wraps an svg path so all the icons are the same size/style
const icon = (path) => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
)

// each tab: where it goes, its label, and its icon
const TABS = [
  {
    to: '/',
    label: 'Home',
    icon: icon(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>), // house
  },
  {
    to: '/calendar',
    label: 'Calendar',
    icon: icon(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  },
  {
    to: '/menu',
    label: 'Menu',
    icon: icon(<><path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z" /><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" /><path d="M8 3v2M12 3v2" /></>), // coffee cup
  },
  {
    to: '/passport',
    label: 'Passport',
    icon: icon(<><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M9 16h6" /></>),
  },
]

export default function TabBar() {
  const taps = useRef([]) // #owner lock - times of the recent passport taps
  const [showLock, setShowLock] = useState(false)
  const closeLock = useCallback(() => setShowLock(false), [])

  // #owner lock - count taps, only keep the ones from the last 3 sec
  const onSecretTap = () => {
    const now = Date.now()
    taps.current = [...taps.current, now].filter((t) => now - t < SECRET_WINDOW_MS)
    if (taps.current.length >= SECRET_TAPS) {
      taps.current = [] // reset
      setShowLock(true) // show the lock
    }
  }

  return (
    <>
      <nav className="tab-bar" aria-label="Main">
        {/* NavLink adds the "active" class to the tab you're on */}
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end className="tab-bar__link"
            onClick={tab.to === SECRET_TAB ? onSecretTap : undefined}>
            {tab.icon}
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
      {showLock && <OwnerLock onClose={closeLock} />}
    </>
  )
}
