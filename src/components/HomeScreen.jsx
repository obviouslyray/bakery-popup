// #home pic - the home screen (open/closed photo + text)
import { useEffect, useState } from 'react';
// flip sign is turned off for now, using the photos instead. leaving it here in case we want it back
// import SignFlip from './SignFlip.jsx';
import { getSignState } from './signState.js';
import defaultWindowImage from './truck-window.svg';
import openPhoto from './home-open.webp';
import closedPhoto from './home-closed.webp';
import './HomeScreen.css';

// #home pic - how long the fade to black takes (each way)
const FADE_MS = 450;
// the two photos + alt text for screen readers
const PHOTOS = {
  open: { src: openPhoto, alt: 'Wooden sign carved with "Open" on the bakery counter' },
  closed: { src: closedPhoto, alt: 'Wooden sign carved with "Sorry you missed us!" at the truck window' },
};

// true if the phone has "reduce motion" on, then we skip the fade
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function HomeScreen({ status = 'closed', hours = '6–11', brand = 'Crumb & Go Bakery & Coffee', imageSrc = defaultWindowImage, animate = true }) {
  const view = getSignState(status, hours); // #open/closed - title/subtitle for the current state
  // little line at the bottom of the screen
  const note = view.isOpen ? 'Fresh bakes. Good coffee. See you at the window.' : view.status === 'closed' ? 'Check back for our next opening.' : 'We cannot confirm the current opening status.';

  // #home pic - fade: current photo fades out to black, then we swap and fade the other one in
  const [shown, setShown] = useState(view.status); // which photo is on screen right now
  const [visible, setVisible] = useState(true); // false while it's faded out
  useEffect(() => {
    if (view.status === shown) return undefined; // nothing changed
    const instant = !animate || prefersReducedMotion();
    const fadeOut = setTimeout(() => setVisible(false), 0); // start fading out
    // after the fade out finishes, switch photos and fade back in
    const swap = setTimeout(() => { setShown(view.status); setVisible(true); }, instant ? 0 : FADE_MS + 120);
    return () => { clearTimeout(fadeOut); clearTimeout(swap); }; // cleanup if it changes again mid fade
  }, [view.status, shown, animate]);

  // load both photos right away so the fade doesn't wait on the download
  useEffect(() => { Object.values(PHOTOS).forEach(({ src }) => { new Image().src = src; }); }, []);

  const photo = PHOTOS[shown]; // undefined for loading/error, then just the text shows
  return <section className="hf-home" data-state={view.status} aria-label={`${brand} home`} style={{ '--hf-fade': `${FADE_MS}ms` }}>
    {/* hidden text so screen readers announce open/closed */}
    <p className="hf-home__sr-only" role="status" aria-live="polite" aria-atomic="true">{view.title}{view.subtitle ? ` ${view.subtitle}` : ''}</p>
    {/* background picture behind everything, falls back to the svg if it doesn't load */}
    <div className="hf-home__backdrop" aria-hidden="true"><img className="hf-home__image" src={imageSrc || defaultWindowImage} alt="" decoding="async" onError={event => { const img=event.currentTarget; const fallback=new URL(defaultWindowImage,img.ownerDocument.baseURI).href; if(img.src!==fallback) img.src=fallback; }} /></div>
    <div className="hf-home__shade" aria-hidden="true" />
    <header className="hf-home__brand"><h1 className="hf-home__brand-name">{brand}</h1><small>FRESH BAKES · GOOD COFFEE</small></header>
    {/* old flip sign, turned off */}
    {/* <div className="hf-home__assembly"><SignFlip status={view.status} hours={hours} animate={animate} /></div> */}
    {/* text for "checking..." / "status unavailable" (gets covered by the photo otherwise) */}
    <div className="hf-home__status" aria-hidden="true"><p className="hf-home__status-title">{view.title}</p><p className="hf-home__status-subtitle">{view.subtitle}</p></div>
    <footer className="hf-home__footer"><p className="hf-home__note">{note}</p></footer>
    {/* #home pic - black layer with the open or closed photo on top */}
    <div className={`hf-home__photo-layer${photo ? ' hf-home__photo-layer--on' : ''}`}>
      {photo && <img className={`hf-home__photo${visible ? ' hf-home__photo--visible' : ''}`} src={photo.src} alt={photo.alt} decoding="async" />}
    </div>
  </section>;
}
