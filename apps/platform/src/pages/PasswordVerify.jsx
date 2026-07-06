import React, { useState, useEffect } from 'react';
import { verifyPasswordChange, verifyEmailChange } from '@gfl/api-client';

/**
 * PasswordVerify — landing page for the confirmation emails (password OR email change).
 * The email links to the deployed site (config.siteUrl) with ?pwverify=<token> (password) or
 * ?emailverify=<token> (email). This reads whichever token is present, calls the matching backend
 * endpoint to apply the pending change, and shows the result. Mounted standalone from main.jsx
 * (no heavy 3D app), so it works for logged-out users on any device.
 */
export default function PasswordVerify() {
  const [state, setState] = useState({ loading: true, ok: false, msg: '' });

  // Which flow: an ?emailverify token → email change; otherwise ?pwverify → password change.
  const params = new URLSearchParams(window.location.search);
  const emailToken = params.get('emailverify');
  const isEmail = !!emailToken;
  const token = emailToken || params.get('pwverify');

  useEffect(() => {
    if (!token) { setState({ loading: false, ok: false, msg: 'Ongeldige of ontbrekende link.' }); return; }
    let alive = true;
    const verify = isEmail ? verifyEmailChange : verifyPasswordChange;
    const okMsg = isEmail
      ? 'Je nieuwe e-mailadres is bevestigd. Je kunt nu inloggen met je nieuwe e-mailadres.'
      : 'Je nieuwe wachtwoord is geactiveerd. Je kunt nu inloggen met je nieuwe wachtwoord.';
    verify(token)
      .then(() => { if (alive) setState({ loading: false, ok: true, msg: okMsg }); })
      .catch((e) => { if (alive) setState({ loading: false, ok: false, msg: e.message || 'Bevestiging mislukt.' }); });
    return () => { alive = false; };
  }, [token, isEmail]);

  const { loading, ok, msg } = state;
  const accent = ok ? '#22c55e' : '#f87171';
  const okTitle = isEmail ? 'E-mailadres bevestigd ✓' : 'Wachtwoord bevestigd ✓';

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0510', color: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, "Segoe UI", sans-serif', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '27rem', padding: '2.6rem', border: `1px solid ${ok ? 'rgba(34,197,94,0.4)' : 'rgba(168,85,247,0.4)'}`, borderRadius: '1rem', background: 'rgba(20,8,32,0.6)' }}>
        {loading ? (
          <>
            <div className="pwv-spin" style={{ width: '2.6rem', height: '2.6rem', margin: '0 auto 1.3rem', border: '2px solid #a855f7', borderTopColor: 'transparent', borderRadius: '50%' }} />
            <div style={{ letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(196,181,253,0.8)', fontSize: '0.85rem' }}>Bevestigen…</div>
          </>
        ) : (
          <>
            <h1 style={{ margin: '0 0 0.9rem', fontSize: '1.35rem', color: accent }}>{ok ? okTitle : 'Bevestiging mislukt'}</h1>
            <p style={{ margin: '0 0 1.7rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem' }}>{msg}</p>
            <a href="/" style={{ display: 'inline-block', padding: '0.7rem 1.6rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Naar Garden For Life</a>
          </>
        )}
      </div>
      <style>{`@keyframes pwvspin{to{transform:rotate(360deg)}} .pwv-spin{animation:pwvspin 1s linear infinite}`}</style>
    </div>
  );
}
