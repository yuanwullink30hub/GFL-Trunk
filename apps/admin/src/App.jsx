import React, { useCallback, useEffect, useState } from 'react';
import { LanguageProvider, useLanguage } from '@gfl/i18n';
import AdminDashboardModal from '@gfl/admin-ui';
import { login, getMe, getToken, logout } from '@gfl/api-client';
import { SciFiButton, INPUT, FIELD_LABEL, CornerAccents, FONT, inputFocus, inputBlur } from '@gfl/ui';

/** Installed app only (window.gflAdmin): "new version ready — restart". The update comes from the private feed. */
function UpdateBar() {
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);
  useEffect(() => {
    const api = window.gflAdmin && window.gflAdmin.update;
    if (!api) return undefined;
    api.status().then(setStatus).catch(() => {});
    return api.onStatus(setStatus);
  }, []);
  if (!status || status.state !== 'ready') return null;
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: '1.25rem', transform: 'translateX(-50%)', zIndex: 2147483000, display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.7rem 1.1rem', borderRadius: '0.5rem', background: 'rgba(2, 0, 3, 0.3)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'max(12px, 0.65vw)', color: '#FFFEF0' }}>{t('admin.app.updateReady')} {status.version}</span>
      <SciFiButton size="sm" onClick={() => window.gflAdmin.update.install()}>{t('admin.app.restart')}</SciFiButton>
    </div>
  );
}

/**
 * The management app. Runs ONLY on the management computer — installed as Admin GFL
 * (apps/admin-desktop) or from the repo with `pnpm --filter @gfl/admin live` — never deployed: the
 * website and the desktop app ship no management UI at all. It logs in like any account; the server's
 * management API answers only a valid management token and looks nonexistent to anything else
 * (apps/backend/routes/admin.js).
 */
function Shell() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) { setChecking(false); return; }
    getMe()
      .then((u) => { if (u && u.role === 'admin') setUser(u); else logout(); })
      .catch(() => logout())
      .finally(() => setChecking(false));
  }, []);

  const submit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await login({ email: email.trim(), password });
      if (data.user?.role !== 'admin') {
        logout();
        setError(t('admin.login.notAllowed'));
        return;
      }
      setPassword('');
      setUser(data.user);
    } catch (err) {
      setError(err.message || t('admin.login.failed'));
    } finally {
      setBusy(false);
    }
  }, [email, password, t]);

  const signOut = useCallback(() => { logout(); setUser(null); }, []);

  // Installed app: the updater's private feed only answers a management session.
  useEffect(() => {
    if (window.gflAdmin) window.gflAdmin.setSession(user ? getToken() : null).catch(() => {});
  }, [user]);

  if (checking) return null;
  if (user) return (<><AdminDashboardModal user={user} onLogout={signOut} onClose={signOut} /><UpdateBar /></>);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem', background: '#0a0510' }}>
      <form onSubmit={submit} style={{
        position: 'relative', width: '100%', maxWidth: '26rem', padding: '1.5rem', borderRadius: '0.5rem',
        background: 'rgba(2, 0, 3, 0.3)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03)',
        display: 'flex', flexDirection: 'column', gap: '0.9rem',
      }}>
        <CornerAccents color="#f97316" />
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 'max(16px, 0.9vw)', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#f97316' }}>
          {t('admin.login.title')}
        </div>
        <label>
          <div style={FIELD_LABEL}>{t('admin.login.email')}</div>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={inputFocus} onBlur={inputBlur} style={INPUT} required />
        </label>
        <label>
          <div style={FIELD_LABEL}>{t('admin.login.password')}</div>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={inputFocus} onBlur={inputBlur} style={INPUT} required />
        </label>
        {error && <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'max(11px, 0.58vw)', color: '#fca5a5' }}>{error}</div>}
        <div>
          <SciFiButton type="submit" disabled={busy || !email || !password} size="md">
            {busy ? t('admin.login.busy') : t('admin.login.submit')}
          </SciFiButton>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  );
}
