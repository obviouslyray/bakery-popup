import React from 'react';
import SignFlip from './SignFlip.jsx';
import { getSignState } from './signState.js';
import defaultWindowImage from './truck-window.svg';
import './HomeScreen.css';
export default function HomeScreen({ status = 'closed', hours = '6–11', brand = 'Bakery & Coffee', imageSrc = defaultWindowImage, animate = true }) {
  const view = getSignState(status, hours);
  const note = view.isOpen ? 'Fresh bakes. Good coffee. See you at the window.' : view.status === 'closed' ? 'Check back for our next opening.' : 'We cannot confirm the current opening status.';
  return <section className="hf-home" data-state={view.status} aria-label={`${brand} home`}>
    <div className="hf-home__backdrop" aria-hidden="true"><img className="hf-home__image" src={imageSrc || defaultWindowImage} alt="" decoding="async" onError={event => { const img=event.currentTarget; const fallback=new URL(defaultWindowImage,img.ownerDocument.baseURI).href; if(img.src!==fallback) img.src=fallback; }} /></div>
    <div className="hf-home__shade" aria-hidden="true" />
    <header className="hf-home__brand"><h1 className="hf-home__brand-name">{brand}</h1><small>FRESH BAKES · GOOD COFFEE</small></header>
    <div className="hf-home__assembly"><SignFlip status={view.status} hours={hours} animate={animate} /></div>
    <footer className="hf-home__footer"><p className="hf-home__note">{note}</p></footer>
  </section>;
}
