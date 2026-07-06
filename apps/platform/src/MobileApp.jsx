import React, { Suspense, lazy } from 'react';
import { getMe, logout } from '@gfl/api-client';
import { clearClientMode } from './clientMode';

// ============================================================================
// MOBILE APP — fully separate code path from the desktop App.
// main.jsx mounts THIS (not App.jsx) when the viewport is mobile-sized, so the
// desktop tree never runs on mobile and vice-versa. Edit mobile here; it can
// never touch the desktop side.
// ============================================================================

// Retry wrapper: if a chunk fails (stale deploy), reload the page once.
const lazyRetry = (fn) => lazy(() =>
  fn().catch(() => {
    const reloaded = sessionStorage.getItem('chunk_reload');
    if (!reloaded) {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
      return new Promise(() => {}); // hang until reload
    }
    sessionStorage.removeItem('chunk_reload');
    return fn(); // second attempt — surface the real error
  })
);

const AdminDashboardModal = lazyRetry(() => import('@gfl/admin-ui'));

// Shared nebula background. On mobile (<768px) this component self-selects its
// lightweight, NON-INTERACTIVE video-loop path — no WebGL, no mouse/pointer
// listeners — so it's just an ambient backdrop. Sits at zIndex 0, pointerEvents
// none; all foreground content renders above it.
const NebulaBackground = lazyRetry(() => import('./components/NebulaBackground'));

// ── Mobile portal: passkey → admin dashboard, or basic client assessment view
const MobileApp = () => {
  const [user, setUser] = React.useState(null);
  const [phase, setPhase] = React.useState('loading'); // 'loading' | 'passkey' | 'dashboard' | 'client'
  const [passkeyValue, setPasskeyValue] = React.useState('');
  const [passkeyError, setPasskeyError] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);

  // Static map position — mobile has no map navigation, the nebula just sits still.
  const mapPositionRef = React.useRef({ x: 0, y: 0 });
  const nebula = (
    <Suspense fallback={null}>
      <NebulaBackground mapPositionRef={mapPositionRef} isVisible />
    </Suspense>
  );

  React.useEffect(() => {
    getMe()
      .then(u => { setUser(u); setPhase('dashboard'); })
      .catch(() => setPhase('passkey'));
  }, []);

  const handleLogout = React.useCallback(() => {
    logout();
    clearClientMode();
    localStorage.removeItem('gfl_admin_mode');
    window.location.reload();
  }, []);

  const handleVerify = React.useCallback(async () => {
    const key = passkeyValue.trim();
    if (!key) return;
    setVerifying(true);
    setPasskeyError('');
    try {
      const host = window.location.hostname;
      const isPrivateHost = /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
      const isLocalHost = host === 'localhost' || host === '127.0.0.1';
      const apiBase = (isLocalHost || isPrivateHost)
        ? `http://${host}:8080/api`
        : 'https://gfl-api.onrender.com/api';
      const res = await fetch(apiBase + '/beta/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: key }),
      });
      const data = await res.json();
      if (!data.valid) { setPasskeyError('Ongeldige passkey'); setVerifying(false); return; }
      localStorage.setItem('gfl_beta_access', key);
      localStorage.setItem('gfl_beta_access_time', Date.now().toString());
      if (data.adminMode && data.token && data.user) {
        localStorage.setItem('gfl_admin_mode', '1');
        localStorage.setItem('gfl_token', data.token);
        setUser(data.user);
        setPhase('dashboard');
      } else if (data.valid && !data.adminMode) {
        // Valid non-admin (client) passkey — basic mobile assessment view
        setPhase('client');
      } else {
        // Admin passkey but backend couldn't issue token
        setPasskeyError('Admin account niet gevonden — neem contact op');
      }
    } catch (e) {
      setPasskeyError('Verbindingsfout — probeer opnieuw');
    } finally {
      setVerifying(false);
    }
  }, [passkeyValue]);

  if (phase === 'loading') return nebula;

  if (phase === 'dashboard' && user) {
    return (
      <Suspense fallback={null}>
        <AdminDashboardModal user={user} onLogout={handleLogout} onClose={handleLogout} embedded />
      </Suspense>
    );
  }

  // Valid non-admin passkey: minimal mobile assessment view — DELTAWERKEN header + logo, pinned to top
  if (phase === 'client') {
    return (
      <>
      {nebula}
      <div style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 'clamp(1.5rem, 2vw, 2rem)' }}>
        {/* Logo + header — same relative layout/sizing as the desktop build, pinned to top */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 'clamp(0.75rem, 1.5vw, 1.5rem)' }}>
          <img
            src="/images/landingpage/logo.png"
            alt="Garden for Life"
            style={{
              width: 'clamp(4rem, 7vw, 12.5rem)',
              height: 'clamp(4rem, 7vw, 12.5rem)',
              flexShrink: 0,
            }}
          />
          <div style={{ marginLeft: 'clamp(-1rem, -1vw, -1.5rem)' }}>
            <h1 style={{
              color: '#FFFEF0',
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              fontSize: 'clamp(1.7rem, 6vw, 2.2rem)',
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: '0.1em',
              margin: 0,
              animation: 'headerBreathe 6s ease-in-out infinite',
            }}>
              DELTA<span style={{ color: '#f97316' }}>WERKEN</span>
            </h1>
            <div style={{
              width: '100%',
              height: '1px',
              marginTop: 'clamp(0.2rem, 1vw, 0.4rem)',
              background: 'linear-gradient(90deg, rgba(255,254,240,0.4) 0%, rgba(245,158,11,0.5) 50%, transparent 100%)',
            }} />
            {/* Subtitle — "SCHADUW WERK // V.4.9", same as the desktop header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'clamp(0.25rem, 1vw, 0.5rem)' }}>
              <span style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '9999px',
                background: '#22c55e',
                flexShrink: 0,
                animation: 'dotBreathe 4s ease-in-out infinite',
              }} />
              <span style={{
                color: '#9ca3af',
                fontFamily: "'Figtree', sans-serif",
                fontSize: 'clamp(0.7rem, 2.6vw, 0.9rem)',
                letterSpacing: '0.1em',
              }}>SCHADUW WERK {'/'}{'/'} V.4.9</span>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  const S = {
    input: { width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(168,85,247,0.3)', color: '#fff', fontSize: 16, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 },
    btn: { width: '100%', padding: '10px 0', borderRadius: 8, background: verifying ? 'rgba(168,85,247,0.4)' : 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: verifying ? 'default' : 'pointer', letterSpacing: '0.05em', fontFamily: 'inherit' },
  };

  return (
    <>
    {nebula}
    <div style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
      <div style={{ width: '85vw', maxWidth: 380, padding: '2rem 1.75rem', background: 'rgba(8,2,12,0.85)', backdropFilter: 'blur(4px)', border: '1px solid rgba(147,51,234,0.3)', borderRadius: 8 }}>
        <p style={{ color: '#a855f7', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px', fontFamily: "'Figtree', sans-serif" }}>Garden For Life</p>
        <p style={{ color: '#666', fontSize: 11, margin: '0 0 16px', fontFamily: "'Figtree', sans-serif" }}>
          Voer je passkey in om toegang te krijgen.
        </p>
        <input
          type="text"
          value={passkeyValue}
          onChange={e => setPasskeyValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
          placeholder="Passkey..."
          autoComplete="off"
          style={S.input}
        />
        {passkeyError && <p style={{ color: '#f87171', fontSize: 11, margin: '0 0 8px', fontFamily: "'Figtree', sans-serif" }}>{passkeyError}</p>}
        <button onClick={handleVerify} disabled={verifying} style={S.btn}>{verifying ? '...' : 'Unlock'}</button>
      </div>
    </div>
    </>
  );
};

export default MobileApp;
