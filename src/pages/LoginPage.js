import React, { memo, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { login, register, getMe, logout, getToken } from '../utils/apiClient';
import ClientProfileModal from '../components/assessment/ClientProfileModal';
import AdminDashboardModal from '../components/assessment/AdminDashboardModal';
import {
  C, BTN_LG, INPUT, FIELD_LABEL, ERROR_STYLE,
  PAGE_WRAPPER, SEPARATOR, hover, inputFocus, inputBlur, FONT,
} from '../components/assessment/dashboardStyles';

/* ═══════════════════════════════════════════════════════════════════════
   LoginFrame — bespoke translucent container for the login modal.
   Reproduces the EXACT SectorFrame DOM structure used on the Gardens
   landing page (src/pages/GeneralBrandPage/SciFiUI.js).

   The SectorFrame Tailwind classes translate to:
     backdrop-blur-xl  =  backdrop-filter: blur(24px)
     rounded-lg        =  border-radius: 0.5rem
     overflow-hidden    (on inner panel only — corners live outside)
     bg rgba(2,0,3,0.3)
     -top-0.5 / -left-0.5 etc = -0.125rem offsets on corner divs
     w-4 h-4           =  1rem  for corner brackets
     p-5               =  1.25rem content padding

   Structure mirrors SectorFrame exactly:
   ┌ outer (position ctx, NO bg, NO overflow — corners rendered here)
   │  ├ 4 × corner L-brackets (absolute, unclipped)
   │  └ inner panel (bg + blur + shadow + overflow:hidden)
   │       ├ holoSheen overlay
   │       ├ holoScanline overlay
   │       ├ noise overlay
   │       ├ title bar
   │       └ content (z-10 relative, p-5)
   └
   ═══════════════════════════════════════════════════════════════════════ */

const SF_SHADOW =
  '0 6px 30px rgba(0,0,0,0.7), ' +
  '0 0 80px rgba(0,0,0,0.35)';

const CORNER = (pos) => ({
  position: 'absolute',
  width: '1rem', height: '1rem',
  border: '1.5px solid #ffae00',
  pointerEvents: 'none', zIndex: 3,
  ...(pos === 'tl' && { top: '-0.125rem', left: '-0.125rem', borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' }),
  ...(pos === 'tr' && { top: '-0.125rem', right: '-0.125rem', borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' }),
  ...(pos === 'bl' && { bottom: '-0.125rem', left: '-0.125rem', borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' }),
  ...(pos === 'br' && { bottom: '-0.125rem', right: '-0.125rem', borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' }),
});

const LoginFrame = ({ title, children }) => {
  const mob = typeof window !== 'undefined' && window.innerWidth < 768;
  return (
  <div style={{ position: 'relative', minWidth: mob ? '90vw' : '35vw', maxWidth: '450px' }}>
    {/* Corner brackets — outside overflow:hidden so they're never clipped */}
    <div style={CORNER('tl')} />
    <div style={CORNER('tr')} />
    <div style={CORNER('bl')} />
    <div style={CORNER('br')} />

    {/* Inner panel — SectorFrame exact */}
    <div style={{
      position: 'relative',
      backgroundColor: 'rgba(2, 0, 3, 0.9)',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      boxShadow: SF_SHADOW,
      color: C.text,
      fontFamily: FONT,
      fontSize: 'max(12px, 0.65vw)',
    }}>
      {/* Decorative overlays removed for performance */}

      {/* Title bar */}
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.55rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(42, 10, 56, 0.35)',
          position: 'relative', zIndex: 2,
        }}>
          <span style={{
            fontFamily: FONT, fontSize: 'max(10px, 0.55vw)',
            textTransform: 'uppercase', letterSpacing: '0.2em',
            fontWeight: 'bold', color: C.gold,
          }}>{title}</span>
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: C.gold }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: C.purple }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </div>
        </div>
      )}

      {/* Content — SectorFrame uses z-10 relative p-5 flex-col */}
      <div style={{
        position: 'relative', zIndex: 10,
        padding: '1.25rem',
        display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  </div>
  );
};

/* ═══════════════════════════════════════════════════ */

const LoginPage = memo(({ isVisible, onBack }) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    getMe().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await login({ email, password })
        : await register({ email, password, displayName });
      setUser(data.user);
      setEmail(''); setPassword(''); setDisplayName('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [mode, email, password, displayName]);

  const handleLogout = useCallback(() => { logout(); setUser(null); }, []);

  // ── Authenticated ──
  if (user) {
    return (
      <div style={PAGE_WRAPPER(isVisible)}>
        {user.role === 'admin'
          ? <AdminDashboardModal user={user} onLogout={handleLogout} onClose={onBack} />
          : <ClientProfileModal user={user} onLogout={handleLogout} onClose={onBack} />}
      </div>
    );
  }

  // ── Login / Register ──
  return (
    <div style={PAGE_WRAPPER(isVisible)}>
      <LoginFrame title={mode === 'login' ? 'Toegangscontrole' : 'Registratie'}>

        {/* Header */}
        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{ fontSize: 'max(16px, 0.9vw)', fontWeight: 'bold', letterSpacing: '0.15em', color: C.gold }}>
            {mode === 'login' ? 'NEURALE VERBINDING' : t('pages.loginPage.register')}
          </div>
          <div style={{ fontSize: 'max(9px, 0.45vw)', color: C.textDim, marginTop: '0.15rem', letterSpacing: '0.1em' }}>
            GARDEN FOR LIFE · BEWUSTZIJNSPLATFORM
          </div>
        </div>

        <div style={{ ...SEPARATOR, marginBottom: '1.2rem' }} />

        {error && (
          <div style={{ ...ERROR_STYLE, marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.8rem' }}>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div>
            <div style={FIELD_LABEL}><span>✉</span> {t('pages.loginPage.email') || 'E-mail'}</div>
            <input type="email" required autoComplete="email"
              placeholder={t('pages.loginPage.email')}
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
          </div>

          <div>
            <div style={FIELD_LABEL}><span>🔑</span> {t('pages.loginPage.password') || 'Wachtwoord'}</div>
            <input type="password" required minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={t('pages.loginPage.password')}
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
          </div>

          {mode === 'register' && (
            <div>
              <div style={FIELD_LABEL}><span>👤</span> {t('pages.loginPage.displayName') || 'Naam'}</div>
              <input type="text" autoComplete="name"
                placeholder={t('pages.loginPage.displayName')}
                value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
            </div>
          )}

          <div style={{ ...SEPARATOR, marginTop: '0.3rem' }} />

          <button type="submit" disabled={loading} style={{
            ...BTN_LG, opacity: loading ? 0.5 : 1,
            boxShadow: loading ? 'none' : '0 0 15px rgba(255, 174, 0, 0.08)',
          }}
            onMouseEnter={(e) => { if (!loading) hover(e, true); }}
            onMouseLeave={(e) => { if (!loading) hover(e, false); }}>
            {loading ? t('pages.loginPage.loading') : mode === 'login' ? 'IDENTIFICEER' : t('pages.loginPage.registerButton')}
          </button>
        </form>

        {/* Switch mode */}
        <div style={{ textAlign: 'center', marginTop: '0.8rem' }}>
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{
              background: 'none', border: 'none', color: 'rgba(255, 174, 0, 0.4)',
              cursor: 'pointer', fontSize: 'max(10px, 0.5vw)', fontFamily: FONT,
              textDecoration: 'underline', textUnderlineOffset: '3px', transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.color = 'rgba(255, 174, 0, 0.7)'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255, 174, 0, 0.4)'}
          >
            {mode === 'login' ? t('pages.loginPage.switchToRegister') : t('pages.loginPage.switchToLogin')}
          </button>
        </div>

        {/* Footer */}
        <div style={{ ...SEPARATOR, marginTop: '1rem' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.65rem', opacity: 0.3 }}>🛡</span>
            <span style={{ fontSize: 'max(8px, 0.4vw)', opacity: 0.25, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Versleutelde Verbinding
            </span>
          </div>
          <button onClick={onBack} style={{ ...BTN_LG, width: 'auto', padding: '0.35rem 1rem', fontSize: 'max(9px, 0.48vw)' }}
            onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            {t('pages.loginPage.back')}
          </button>
        </div>

      </LoginFrame>
    </div>
  );
});

LoginPage.displayName = 'LoginPage';

export default LoginPage;
