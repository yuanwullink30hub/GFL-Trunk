import React, { memo, useState, useEffect } from 'react';
import { getCard } from '@gfl/api-client';
import { C, FONT, SciFiButton } from '@gfl/ui';
import ProfileCard from './ProfileCard';

/* ════════════════════════════════════════════════════════════════════════
   PublicProfile — a shareable, READ-ONLY view of any user's profile card,
   addressed by their unique visual name (handle) via ?u=<handle>.
   Renders the SAME ProfileCard from the SAME cardPayload.v1 the owner's
   Openbaar tab renders (SR-5 owner symmetry) — GET /api/auth/card/:handle.
   No PII beyond the declared channel, no edit controls; works logged-out.
   ════════════════════════════════════════════════════════════════════════ */

const PublicProfile = memo(({ handle, active = true, onClose }) => {
  const [state, setState] = useState({ loading: true, error: '', card: null });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: '', card: null });
    getCard(handle)
      .then((card) => { if (alive) setState({ loading: false, error: '', card }); })
      .catch((e) => { if (alive) setState({ loading: false, error: e.message || 'Profiel niet gevonden.', card: null }); });
    return () => { alive = false; };
  }, [handle]);

  const { loading, error, card } = state;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'radial-gradient(ellipse at center, rgba(8,2,14,0.92), rgba(2,0,4,0.97))', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, color: C.text, padding: 'clamp(1rem, 4vh, 3rem)', overflowY: 'auto' }}>
      <div style={{ position: 'absolute', top: 'clamp(14px,3vh,34px)', right: 'clamp(16px,3vw,44px)', zIndex: 2 }}>
        <SciFiButton onClick={onClose} size="sm" padding="0.4rem 1rem" fontSize="max(10px,0.5vw)">✕ Sluiten</SciFiButton>
      </div>

      {loading && (
        <div style={{ fontFamily: FONT, fontSize: 'max(12px,0.7vw)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,181,253,0.7)' }}>Kristal laden…</div>
      )}

      {!loading && error && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'max(16px,1vw)', color: '#f87171', marginBottom: '0.6rem' }}>Profiel niet gevonden</div>
          <div style={{ fontSize: 'max(11px,0.6vw)', color: 'rgba(255,255,255,0.45)' }}>{error}</div>
        </div>
      )}

      {/* verbondHandle → the "+ Verbond" invite renders inside the card's sync line */}
      {!loading && card && <ProfileCard payload={card} active={active} verbondHandle={handle} />}
    </div>
  );
});

PublicProfile.displayName = 'PublicProfile';
export default PublicProfile;
