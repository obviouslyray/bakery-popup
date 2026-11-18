// #owner bar - the dashed "Owner mode" box at the top of the screens
import { useLocation } from 'react-router-dom'
import OwnerOnly from './OwnerOnly.jsx'
import ShiftControls from './ShiftControls.jsx'
import { signOut } from '../lib/supabase.js'
import './OwnerBar.css'

// buttons for stuff we haven't built yet (schedule editing).
// home has open/close, menu has its own edit buttons
const TOOLS = {
  '/calendar': ['Edit the 7-day schedule'],
}

export default function OwnerBar() {
  const { pathname } = useLocation()
  const tools = TOOLS[pathname] ?? [] // tools for this page, or none

  return (
    // only owners see any of this
    <OwnerOnly>
      <div className="owner-bar">
        <div className="owner-bar__top">
          <span className="owner-bar__label">Owner mode</span>
          <button type="button" className="owner-bar__signout" onClick={signOut}>Sign out</button>
        </div>
        {/* #open truck / #close truck - only on the home page */}
        {pathname === '/' && <ShiftControls />}
        {/* greyed out "coming soon" buttons */}
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
