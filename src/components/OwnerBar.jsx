import { useLocation } from 'react-router-dom'
import OwnerOnly from './OwnerOnly.jsx'
import { signOut } from '../lib/supabase.js'
import './OwnerBar.css'

// The owner tools for each screen. They are placeholders until the matching
// features (shifts, schedule, menu tables) are built.
const TOOLS = {
  '/': ['Open the truck'],
  '/calendar': ['Edit the 7-day schedule'],
  '/menu': ['Edit the menu', 'Mark items sold out'],
}

export default function OwnerBar() {
  const { pathname } = useLocation()
  const tools = TOOLS[pathname] ?? []

  return (
    <OwnerOnly>
      <div className="owner-bar">
        <div className="owner-bar__top">
          <span className="owner-bar__label">Owner mode</span>
          <button type="button" className="owner-bar__signout" onClick={signOut}>Sign out</button>
        </div>
        {tools.length > 0 && (
          <div className="owner-bar__tools">
            {tools.map((tool) => (
              <button key={tool} type="button" className="owner-bar__tool" disabled>
                {tool} <span className="owner-bar__soon">coming soon</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </OwnerOnly>
  )
}
