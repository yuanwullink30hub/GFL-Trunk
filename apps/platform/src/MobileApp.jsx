import React, { Suspense, lazy } from 'react';
import { getMe, logout } from '@gfl/api-client';
import { useLanguage } from '@gfl/i18n';
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

// ── Mobile portal: ADMIN ONLY. The beta gate is gone; the admin passkey is all
// that remains, and it is the only way to reach the dashboard on mobile.
const MobileApp = () => {
  const { t } = useLanguage();
  const [user, setUser] = React.useState(null);
  const [phase, setPhase] = React.useState('loading'); // 'loading' | 'passkey' | 'dashboard'
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
        : 'https://api.gardenforlife.nl/api';
      const res = await fetch(apiBase + '/beta/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: key }),
      });
      const data = await res.json();
      // Only the admin passkey survives — anything else is rejected outright.
      if (!data.valid || !data.adminMode) {
        setPasskeyError(t('shell.mobile.invalidPasskey'));
        setVerifying(false);
        return;
      }
      if (data.token && data.user) {
        localStorage.setItem('gfl_admin_mode', '1');
        localStorage.setItem('gfl_token', data.token);
        setUser(data.user);
        setPhase('dashboard');
      } else {
        // Admin passkey but backend couldn't issue token
        setPasskeyError(t('shell.mobile.adminNotFound'));
      }
    } catch (e) {
      setPasskeyError(t('shell.mobile.connectionError'));
    } finally {
      setVerifying(false);
    }
  }, [passkeyValue, t]);

  if (phase === 'loading') return nebula;

  if (phase === 'dashboard' && user) {
    return (
      <Suspense fallback={null}>
        <AdminDashboardModal user={user} onLogout={handleLogout} onClose={handleLogout} embedded />
      </Suspense>
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
        <p style={{ color: '#a855f7', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px', fontFamily: "'Figtree', sans-serif" }}>{t('shell.mobile.brand')}</p>
        <p style={{ color: '#666', fontSize: 11, margin: '0 0 16px', fontFamily: "'Figtree', sans-serif" }}>
          {t('shell.mobile.passkeyPrompt')}
        </p>
        <input
          type="text"
          value={passkeyValue}
          onChange={e => setPasskeyValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
          placeholder={t('shell.mobile.passkeyPlaceholder')}
          autoComplete="off"
          style={S.input}
        />
        {passkeyError && <p style={{ color: '#f87171', fontSize: 11, margin: '0 0 8px', fontFamily: "'Figtree', sans-serif" }}>{passkeyError}</p>}
        <button onClick={handleVerify} disabled={verifying} style={S.btn}>{verifying ? '...' : t('shell.mobile.unlock')}</button>
      </div>
    </div>
    </>
  );
};

export default MobileApp;
