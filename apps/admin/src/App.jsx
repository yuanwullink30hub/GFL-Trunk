import React, { useCallback, useEffect, useState } from 'react';
import { LanguageProvider, useLanguage } from '@gfl/i18n';
import AdminDashboardModal from '@gfl/admin-ui';
import { login, getMe, getToken, logout, checkServerHealth } from '@gfl/api-client';
import { SciFiButton, INPUT, FIELD_LABEL, CornerAccents, FONT, inputFocus, inputBlur } from '@gfl/ui';
import { installOnly, isIos, isPhoneApp, useInstall } from './install';

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

/** Phone browser, logged in: only the install of the app (the dashboard opens in the installed app). */
function InstallScreen({ onLogout }) {
  const { t } = useLanguage();
  const { canPrompt, installed, prompt } = useInstall();
  const body = { fontFamily: "'Figtree', sans-serif", fontSize: 'max(14px, 0.75vw)', lineHeight: 1.6, color: '#FFFEF0' };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem', background: '#0a0510' }}>
      <div style={{
        position: 'relative', width: '100%', maxWidth: '26rem', padding: '1.5rem', borderRadius: '0.5rem',
        background: 'rgba(2, 0, 3, 0.3)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), inset 0 0 12px rgba(168,85,247,0.06)',
        display: 'flex', flexDirection: 'column', gap: '1rem',
      }}>
        <CornerAccents color="#f97316" />
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 'max(16px, 0.9vw)', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#f97316' }}>
          {t('admin.install.title')}
        </div>
        {installed ? (
          <div style={body}>{t('admin.install.installed')}</div>
        ) : (
          <>
            <div style={body}>{t('admin.install.text')}</div>
            {canPrompt ? (
              <div><SciFiButton size="md" onClick={prompt}>{t('admin.install.button')}</SciFiButton></div>
            ) : (
              <div style={{ ...body, color: 'rgba(255, 254, 240, 0.7)' }}>{t(isIos() ? 'admin.install.manualIos' : 'admin.install.manual')}</div>
            )}
          </>
        )}
        <div><SciFiButton size="sm" variant="white" onClick={onLogout}>{t('admin.install.logout')}</SciFiButton></div>
      </div>
    </div>
  );
}

/**
 * The management app. Installed as Admin GFL (apps/admin-desktop), run from the repo with
 * `pnpm --filter @gfl/admin live`, and since 23 Oct 2026 also at gardenforlife.nl/beheer (the phone app) so it
 * works on a phone (apps/platform/scripts/build-admin.mjs, one-time install links). The desktop app ships no management UI.
 * It logs in like any account; the server's
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
  // The server did not answer at start (asleep, restarting, deploying): the session is kept, not ended.
  const [offline, setOffline] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [waking, setWaking] = useState(false);

  // Resume the saved session. Only the server saying the session is invalid (a 401, on which getMe clears the
  // token) or an account without management rights ends it. Any other failure — no answer, a 502 while the host
  // restarts — keeps the token and shows the start screen below, which wakes the server and asks again
  // (owner, 19 Oct: a restart used to log you out).
  const resume = useCallback(async () => {
    if (!getToken()) { setOffline(false); setChecking(false); return; }
    try {
      const u = await getMe();
      if (u && u.role === 'admin') setUser(u); else logout();
      setOffline(false);
    } catch {
      if (getToken()) { setOffline(true); setAttempt((n) => n + 1); } else setOffline(false);
    } finally {
      setChecking(false);
    }
  }, []);
  useEffect(() => { resume(); }, [resume]);

  // While the server does not answer: wake it and ask again, every 10 s.
  useEffect(() => {
    if (!offline) return undefined;
    let alive = true;
    const timer = setTimeout(async () => { await checkServerHealth(); if (alive) resume(); }, 10000);
    return () => { alive = false; clearTimeout(timer); };
  }, [offline, attempt, resume]);

  const retryNow = useCallback(async () => {
    setWaking(true);
    await checkServerHealth();
    await resume();
    setWaking(false);
  }, [resume]);

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

  const signOut = useCallback(() => { logout(); setUser(null); setOffline(false); }, []);

  // Installed app: the updater's private feed only answers a management session.
  useEffect(() => {
    if (window.gflAdmin) window.gflAdmin.setSession(user ? getToken() : null).catch(() => {});
  }, [user]);

  if (checking) return null;
  if (user && installOnly()) return <InstallScreen onLogout={signOut} />;
  if (user) return (<><AdminDashboardModal user={user} onLogout={signOut} onClose={signOut} phoneApp={isPhoneApp()} /><UpdateBar /></>);

  if (offline) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem', background: '#0a0510' }}>
        <div role="status" style={{
          position: 'relative', width: '100%', maxWidth: '28rem', padding: '1.5rem', borderRadius: '0.5rem',
          background: 'rgba(2, 0, 3, 0.3)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), inset 0 0 12px rgba(168,85,247,0.06)',
          display: 'flex', flexDirection: 'column', gap: '0.9rem',
        }}>
          <CornerAccents color="#a855f7" />
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 'max(16px, 0.9vw)', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#a855f7' }}>
            {t('admin.server.startTitle')}
          </div>
          <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'max(12px, 0.65vw)', lineHeight: 1.6, color: '#FFFEF0' }}>
            {t('admin.server.startText')}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <SciFiButton size="sm" variant="purple" disabled={waking} onClick={retryNow}>
              {waking ? t('admin.server.waking') : t('admin.server.retry')}
            </SciFiButton>
            <SciFiButton size="sm" variant="white" onClick={signOut}>{t('admin.server.logout')}</SciFiButton>
          </div>
        </div>
      </div>
    );
  }

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
