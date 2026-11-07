import { useEffect, useRef, useState } from 'react'
import OwnerLoginForm from './OwnerLoginForm.jsx'
import { useAuth } from '../lib/auth.jsx'
import { signOut } from '../lib/supabase.js'
import './OwnerLock.css'

// Hidden owner entry: a small lock bubble (shown after 5 taps on the Passport
// tab). Tapping it opens a login popup over the current screen.
const BUBBLE_TIMEOUT_MS = 6000

const LockIcon = ({ open }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d={open ? 'M8 11V7a4 4 0 0 1 7.5-2' : 'M8 11V7a4 4 0 0 1 8 0v4'} />
  </svg>
)

export default function OwnerLock({ onClose }) {
  const { session } = useAuth()
  const [popupOpen, setPopupOpen] = useState(false)
  const signedInAtOpen = useRef(null)

  // The bubble disappears on its own if it is not tapped.
  useEffect(() => {
    if (popupOpen) return
    const timer = setTimeout(onClose, BUBBLE_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [popupOpen, onClose])

  // Close everything once a sign-in from this popup succeeds.
  useEffect(() => {
    if (popupOpen && signedInAtOpen.current === false && session) onClose()
  }, [popupOpen, session, onClose])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const openPopup = () => {
    signedInAtOpen.current = Boolean(session)
    setPopupOpen(true)
  }

  if (!popupOpen) {
    return (
      <button type="button" className="owner-lock__bubble" onClick={openPopup} aria-label="Owner sign in">
        <LockIcon open={Boolean(session)} />
      </button>
    )
  }

  return (
    <div className="owner-lock__backdrop" onClick={onClose}>
      <div className="owner-lock__popup" role="dialog" aria-modal="true" aria-labelledby="owner-lock-title"
        onClick={(e) => e.stopPropagation()}>
        <button type="button" className="owner-lock__x" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div className="owner-lock__icon"><LockIcon open={Boolean(session)} /></div>

        {session ? (
          <>
            <h2 id="owner-lock-title" className="owner-lock__title">Owner mode</h2>
            <p className="owner-lock__text">Signed in as {session.user.email}.</p>
            <button type="button" className="button owner-lock__action" onClick={async () => { await signOut(); onClose() }}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <h2 id="owner-lock-title" className="owner-lock__title">Owner login</h2>
            <OwnerLoginForm autoFocus />
          </>
        )}
      </div>
    </div>
  )
}
