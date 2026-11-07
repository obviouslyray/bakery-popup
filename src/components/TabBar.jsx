import { useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import './TabBar.css'

// Hidden owner shortcut: tapping the Passport tab 5 times within 3 seconds
// opens the owner login. The installed app has no address bar to type /owner.
const SECRET_TAB = '/passport'
const SECRET_TAPS = 5
const SECRET_WINDOW_MS = 3000

const icon = (path) => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
)

const TABS = [
  {
    to: '/',
    label: 'Home',
    icon: icon(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>),
  },
  {
    to: '/calendar',
    label: 'Calendar',
    icon: icon(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  },
  {
    to: '/menu',
    label: 'Menu',
    icon: icon(<><path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z" /><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" /><path d="M8 3v2M12 3v2" /></>),
  },
  {
    to: '/passport',
    label: 'Passport',
    icon: icon(<><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M9 16h6" /></>),
  },
]

export default function TabBar() {
  const navigate = useNavigate()
  const taps = useRef([])

  const onSecretTap = (e) => {
    const now = Date.now()
    taps.current = [...taps.current, now].filter((t) => now - t < SECRET_WINDOW_MS)
    if (taps.current.length >= SECRET_TAPS) {
      taps.current = []
      e.preventDefault()
      navigate('/owner')
    }
  }

  return (
    <nav className="tab-bar" aria-label="Main">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end className="tab-bar__link"
          onClick={tab.to === SECRET_TAB ? onSecretTap : undefined}>
          {tab.icon}
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
