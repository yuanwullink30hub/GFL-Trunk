import React, { useEffect, useState } from 'react';
import { getToken, getVerbondWith, requestVerbond } from '@gfl/api-client';

/**
 * "+ Verbond" — connection-request button shown on every public profile.
 * States: none → clickable request · pending (out) → aangevraagd · pending (in) →
 * points to Berichten · accepted → Verbonden ✓ · self/visitor → renders nothing.
 */
export default function VerbondButton({ handle, style, terminal = false }) {
  const [state, setState] = useState('loading'); // loading|none|pending-out|pending-in|accepted|self|hidden
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!handle || !getToken()) { setState('hidden'); return undefined; }
    let alive = true;
    setState('loading');
    getVerbondWith(handle)
      .then((r) => {
        if (!alive) return;
        if (r.status === 'self') setState('self');
        else if (r.status === 'accepted') setState('accepted');
        else if (r.status === 'pending') setState(r.direction === 'out' ? 'pending-out' : 'pending-in');
        else setState('none');
      })
      .catch(() => { if (alive) setState('none'); });
    return () => { alive = false; };
  }, [handle]);

  if (state === 'hidden' || state === 'self') return null;

  const send = async () => {
    if (busy || state !== 'none') return;
    setBusy(true);
    setErr('');
    try {
      await requestVerbond(handle);
      setState('pending-out');
    } catch (e) {
      if (e.status === 'accepted') setState('accepted');
      else if (e.status === 'pending') setState('pending-out');
      else setErr(e.message || 'Verzoek mislukt');
    } finally {
      setBusy(false);
    }
  };

  const label = state === 'loading' ? '…'
    : state === 'accepted' ? 'Verbonden ✓'
    : state === 'pending-out' ? 'Verbond aangevraagd'
    : state === 'pending-in' ? 'Verzoek ontvangen — zie Berichten'
    : '+ Verbond';
  const actionable = state === 'none' && !busy;

  // Terminal variant: the green pill grammar of the card's sync line (link pill family).
  const btnStyle = terminal ? {
    background: 'linear-gradient(135deg, rgba(21,179,21,0.04), rgba(21,179,21,0.09))',
    border: `1px solid ${state === 'accepted' ? 'rgba(21, 179, 21, 0.65)' : actionable ? 'rgba(21, 179, 21, 0.65)' : 'rgba(21, 179, 21, 0.25)'}`,
    color: state === 'accepted' || actionable ? '#15b315' : 'rgba(21, 179, 21, 0.45)',
    boxShadow: actionable ? '0 0 6px rgba(21, 179, 21, 0.25)' : 'none',
    borderRadius: '0.15rem',
    padding: '0.3rem 0.7rem',
    fontFamily: "'Lexend Mega', sans-serif",
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: 'max(9px, 0.45vw)',
    cursor: actionable ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  } : {
    background: '#000',
    border: `1px solid ${state === 'accepted' ? '#15b315' : 'rgba(168, 85, 247, 0.6)'}`,
    color: state === 'accepted' ? '#15b315' : actionable ? '#d8befe' : 'rgba(216, 190, 254, 0.5)',
    boxShadow: actionable ? '0 0 12px rgba(168, 85, 247, 0.2)' : 'none',
    borderRadius: '0.15rem',
    padding: '0.4rem 1.1rem',
    fontFamily: "'Lexend Mega', sans-serif",
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: 'max(9px, 0.5vw)',
    cursor: actionable ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  };
  const hoverIn = (e) => {
    if (!actionable) return;
    if (terminal) { e.currentTarget.style.background = '#15b315'; e.currentTarget.style.color = '#000'; }
    else { e.currentTarget.style.background = '#a855f7'; e.currentTarget.style.color = '#000'; }
  };
  const hoverOut = (e) => {
    if (!actionable) return;
    if (terminal) { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(21,179,21,0.04), rgba(21,179,21,0.09))'; e.currentTarget.style.color = '#15b315'; }
    else { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#d8befe'; }
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', ...style }}>
      <button
        type="button"
        onClick={send}
        disabled={!actionable}
        style={btnStyle}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
      >
        {label}
      </button>
      {err && <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'max(9px, 0.5vw)', color: '#f87171' }}>{err}</span>}
    </span>
  );
}
