import { NavLink } from 'react-router-dom'
import './TabBar.css'

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
    to: '/location',
    label: 'Location',
    icon: icon(<><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>),
  },
  {
    to: '/menu',
    label: 'Menu',
    icon: icon(<><path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z" /><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" /><path d="M8 3v2M12 3v2" /></>),
  },
]

export default function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Main">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end className="tab-bar__link">
          {tab.icon}
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
