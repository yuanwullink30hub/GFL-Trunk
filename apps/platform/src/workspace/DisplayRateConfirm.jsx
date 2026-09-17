import React, { useEffect, useState } from 'react';
import { useLanguage } from '@gfl/i18n';
import { SciFiButton, CornerAccents, FONT } from '@gfl/ui';

/**
 * Desktop app: "keep this refresh rate?" — shown whenever the app has just switched the screen's refresh
 * rate, on first start (highest rate, once per machine) or from Instellingen → App.
 *
 * The revert timer runs in the app's main process (apps/desktop/src/display.js), not here: if the new
 * mode leaves the screen black or this page is broken, the old rate still comes back after 15 seconds.
 * This dialog only shows the countdown and sends keep / revert.
 */
export default function DisplayRateConfirm() {
  const { t, tFunc } = useLanguage();
  const [pending, setPending] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const display = window.gfl && window.gfl.display;
    if (!display) return undefined;
    let alive = true;
    const offPending = display.onPending((p) => { if (alive) setPending(p); });
    const offSettled = display.onSettled(() => { if (alive) setPending(null); });
    display.pending().then((p) => { if (alive && p) setPending(p); }).catch(() => {});

    // First start on this machine: once the loading screen is gone (so this dialog can be seen), ask the
    // app to move the screen to its highest rate. The app remembers it did this and never asks again.
    let timer;
    const afterBoot = () => {
      if (!alive) return;
      if (document.getElementById('gfl-loading-overlay')) { timer = setTimeout(afterBoot, 400); return; }
      timer = setTimeout(() => { if (alive) display.firstRunCheck().catch(() => {}); }, 1200);
    };
    afterBoot();

    return () => { alive = false; offPending(); offSettled(); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!pending) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [pending]);

  if (!pending) return null;
  const seconds = Math.max(0, Math.ceil((pending.deadline - now) / 1000));
  const question = pending.reason === 'first-run'
    ? tFunc('shell.displayConfirm.firstRun')(pending.to, pending.from)
    : tFunc('shell.displayConfirm.changed')(pending.to, pending.from);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gfl-display-confirm-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 1rem',
        background: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 'min(34rem, 100%)',
          padding: '1.25rem 1.5rem',
          borderRadius: '0.5rem',
          background: 'rgba(2, 0, 3, 0.3)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(255, 174, 0, 0.06), inset 0 0 30px rgba(255, 174, 0, 0.03)',
        }}
      >
        <CornerAccents color="#ffae00" />
        <div
          id="gfl-display-confirm-title"
          style={{ fontFamily: FONT, fontWeight: 700, fontSize: 'max(16px, 0.9vw)', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#ffae00', marginBottom: '0.9rem' }}
        >
          {t('shell.displayConfirm.title')}
        </div>
        <p style={{ margin: 0, fontFamily: "'Figtree', sans-serif", fontSize: 'max(13px, 0.7vw)', lineHeight: 1.55, color: '#FFFEF0' }}>
          {question}
        </p>
        <p style={{ margin: '0.7rem 0 0', fontFamily: "'Figtree', sans-serif", fontSize: 'max(12px, 0.65vw)', lineHeight: 1.5, color: 'rgba(255, 174, 0, 0.8)' }}>
          {tFunc('shell.displayConfirm.countdown')(pending.from, seconds)}
        </p>
        {pending.reason === 'first-run' && (
          <p style={{ margin: '0.5rem 0 0', fontFamily: "'Figtree', sans-serif", fontSize: 'max(12px, 0.65vw)', lineHeight: 1.5, color: 'rgba(255, 254, 240, 0.5)' }}>
            {t('shell.displayConfirm.where')}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.9rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
          <SciFiButton variant="white" size="md" onClick={() => window.gfl.display.revert()}>
            {t('shell.displayConfirm.revert')}
          </SciFiButton>
          <SciFiButton color="#ffae00" rgb="255, 174, 0" size="md" active onClick={() => window.gfl.display.keep()}>
            {t('shell.displayConfirm.keep')}
          </SciFiButton>
        </div>
      </div>
    </div>
  );
}
