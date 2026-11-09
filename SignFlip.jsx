import React from 'react';
import { getSignState, FLIP_DURATION_MS } from './signState.js';
import './SignFlip.css';

/** Pass confirmed business status from the host app. No backend calls or owner actions here. */
export default function SignFlip({ status = 'closed', hours = '6–11', animate = true }) {
  const view = getSignState(status, hours);
  const front = getSignState(view.isOpen ? 'closed' : view.status, hours);
  const open = getSignState('open', hours);
  return (
    <div className="sf-sign" data-status={view.status} data-animate={String(Boolean(animate))}
      style={{ '--sf-duration': `${FLIP_DURATION_MS}ms` }}>
      <div className="sf-sign__sr-only" role="status" aria-live="polite" aria-atomic="true">
        {view.title}{view.subtitle ? ` ${view.subtitle}` : ''}
      </div>
      <div className="sf-sign__cord" aria-hidden="true" />
      <div className="sf-sign__perspective" aria-hidden="true">
        <div className="sf-sign__rotor">
          <div className="sf-sign__face sf-sign__face--front">
            <p className="sf-sign__eyebrow">At the truck window</p>
            <p className="sf-sign__title">{front.title}</p>
            <p className="sf-sign__subtitle">{front.subtitle}</p>
          </div>
          <div className="sf-sign__face sf-sign__face--back">
            <p className="sf-sign__eyebrow">At the truck window</p>
            <p className="sf-sign__title">{open.title}</p>
            <p className="sf-sign__subtitle sf-sign__hours">{open.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
