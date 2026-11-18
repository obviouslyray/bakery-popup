import { useEffect, useState } from 'react';
// Flip sign is switched off for now in favor of the open/closed photos below. Kept for later use.
// import SignFlip from './SignFlip.jsx';
import { getSignState } from './signState.js';
import defaultWindowImage from './truck-window.svg';
import openPhoto from './home-open.webp';
import closedPhoto from './home-closed.webp';
import './HomeScreen.css';

// Time for the photo to fade to black, and again to fade the next one in.
const FADE_MS = 450;
const PHOTOS = {
  open: { src: openPhoto, alt: 'Wooden sign carved with "Open" on the bakery counter' },
  closed: { src: closedPhoto, alt: 'Wooden sign carved with "Sorry you missed us!" at the truck window' },
};

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function HomeScreen({ status = 'closed', hours = '6–11', brand = 'Bakery & Coffee', imageSrc = defaultWindowImage, animate = true }) {
  const view = getSignState(status, hours);
  const note = view.isOpen ? 'Fresh bakes. Good coffee. See you at the window.' : view.status === 'closed' ? 'Check back for our next opening.' : 'We cannot confirm the current opening status.';

  // When open/closed changes, the current photo fades to black, then the other fades in.
  const [shown, setShown] = useState(view.status);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (view.status === shown) return undefined;
    const instant = !animate || prefersReducedMotion();
    const fadeOut = setTimeout(() => setVisible(false), 0);
    const swap = setTimeout(() => { setShown(view.status); setVisible(true); }, instant ? 0 : FADE_MS + 120);
    return () => { clearTimeout(fadeOut); clearTimeout(swap); };
  }, [view.status, shown, animate]);

  // Load both photos up front so the fade-in never waits on the network.
  useEffect(() => { Object.values(PHOTOS).forEach(({ src }) => { new Image().src = src; }); }, []);

  const photo = PHOTOS[shown];
  return <section className="hf-home" data-state={view.status} aria-label={`${brand} home`} style={{ '--hf-fade': `${FADE_MS}ms` }}>
    <p className="hf-home__sr-only" role="status" aria-live="polite" aria-atomic="true">{view.title}{view.subtitle ? ` ${view.subtitle}` : ''}</p>
    <div className="hf-home__backdrop" aria-hidden="true"><img className="hf-home__image" src={imageSrc || defaultWindowImage} alt="" decoding="async" onError={event => { const img=event.currentTarget; const fallback=new URL(defaultWindowImage,img.ownerDocument.baseURI).href; if(img.src!==fallback) img.src=fallback; }} /></div>
    <div className="hf-home__shade" aria-hidden="true" />
    <header className="hf-home__brand"><h1 className="hf-home__brand-name">{brand}</h1><small>FRESH BAKES · GOOD COFFEE</small></header>
    {/* <div className="hf-home__assembly"><SignFlip status={view.status} hours={hours} animate={animate} /></div> */}
    <div className="hf-home__status" aria-hidden="true"><p className="hf-home__status-title">{view.title}</p><p className="hf-home__status-subtitle">{view.subtitle}</p></div>
    <footer className="hf-home__footer"><p className="hf-home__note">{note}</p></footer>
    <div className={`hf-home__photo-layer${photo ? ' hf-home__photo-layer--on' : ''}`}>
      {photo && <img className={`hf-home__photo${visible ? ' hf-home__photo--visible' : ''}`} src={photo.src} alt={photo.alt} decoding="async" />}
    </div>
  </section>;
}
