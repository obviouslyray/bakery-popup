import { useLocation } from 'react-router-dom'
import OwnerOnly from './OwnerOnly.jsx'
import ShiftControls from './ShiftControls.jsx'
import { signOut } from '../lib/supabase.js'
import './OwnerBar.css'

// Placeholder owner tools for screens whose features are not built yet
// (schedule). Home has the open/close controls; Menu has its own inline controls.
const TOOLS = {
  '/calendar': ['Edit the 7-day schedule'],
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
        {pathname === '/' && <ShiftControls />}
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
