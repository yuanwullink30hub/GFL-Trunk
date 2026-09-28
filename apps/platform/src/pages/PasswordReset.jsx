import React, { useState } from 'react';
import { resetPassword } from '@gfl/api-client';
import { useLanguage } from '@gfl/i18n';
import { C, FONT, MODAL_CONTAINER, INPUT, FIELD_LABEL, ERROR_STYLE, SciFiButton, CornerAccents, inputFocus, inputBlur } from '@gfl/ui';

/**
 * PasswordReset — landing page for the "forgot password" email (?pwreset=<token>).
 * The reader chooses a new password here; POST /api/auth/password/reset sets it, ends every session and
 * spends the link. Mounted standalone from main.jsx (no 3D app), so it works logged out on any device.
 * The token is read once and taken out of the address bar, so it does not linger in the history.
 */
const readToken = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('pwreset') || '';
  params.delete('pwreset');
  const rest = params.toString();
  try { window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}`); } catch { /* not fatal */ }
  return token;
};

const TITLE = { fontFamily: FONT, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 'max(16px, 0.9vw)', margin: '0 0 0.9rem' };
const BODY = { fontFamily: "'Figtree', sans-serif", color: C.text, lineHeight: 1.6, fontSize: 'max(13px, 0.7vw)', margin: '0 0 1.2rem' };

export default function PasswordReset() {
  const { t } = useLanguage();
  const [token] = useState(readToken);
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(token ? '' : t('auth.reset.invalidLink'));
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 10) { setError(t('auth.reset.tooShort')); return; }
    if (password !== repeat) { setError(t('auth.reset.mismatch')); return; }
    setError(''); setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0510', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
      {/* A short form: no inner scrolling (the page scrolls if it must), so the corner brackets can sit
          on the edge without the panel growing scrollbars. */}
      <div style={{ ...MODAL_CONTAINER, width: 'min(26rem, 100%)', padding: '1.6rem', maxHeight: 'none', overflowY: 'visible' }}>
        <CornerAccents color={C.gold} />
        <h1 style={{ ...TITLE, color: done ? '#22c55e' : C.gold }}>{done ? t('auth.reset.doneTitle') : t('auth.reset.title')}</h1>
        {done ? (
          <>
            <p style={BODY}>{t('auth.reset.done')}</p>
            <SciFiButton onClick={() => { window.location.href = '/'; }} size="md">{t('auth.reset.home')}</SciFiButton>
          </>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <p style={{ ...BODY, margin: 0 }}>{t('auth.reset.intro')}</p>
            {error && (
              <div style={ERROR_STYLE}><span style={{ fontSize: '0.8rem' }}>⚠</span> {error}</div>
            )}
            {/* A hidden username field lets a password manager file the new password under the right account. */}
            <input type="text" name="username" autoComplete="username" hidden readOnly value="" />
            <div>
              <div style={FIELD_LABEL}><span>🔑</span> {t('auth.reset.newPassword')}</div>
              <input type="password" name="new-password" autoComplete="new-password" minLength={10} required disabled={!token || busy}
                value={password} onChange={(e) => setPassword(e.target.value)}
                style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
            </div>
            <div>
              <div style={FIELD_LABEL}><span>🔑</span> {t('auth.reset.repeat')}</div>
              <input type="password" name="repeat-password" autoComplete="new-password" minLength={10} required disabled={!token || busy}
                value={repeat} onChange={(e) => setRepeat(e.target.value)}
                style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
              <SciFiButton type="submit" disabled={!token || busy} size="md">{busy ? t('auth.reset.busy') : t('auth.reset.submit')}</SciFiButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
