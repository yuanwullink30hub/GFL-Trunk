import React, { Suspense, lazy } from 'react';
import { useLanguage } from '@gfl/i18n';

// ============================================================================
// MOBILE APP — fully separate code path from the desktop App.
// main.jsx mounts THIS (not App.jsx) when the viewport is mobile-sized, so the
// desktop tree never runs on mobile and vice-versa. Edit mobile here; it can
// never touch the desktop side.
//
// The platform runs on a computer (website + desktop app). A phone gets one card that says so.
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

// Shared nebula background. On mobile (<768px) this component self-selects its
// lightweight, NON-INTERACTIVE video-loop path — no WebGL, no mouse/pointer
// listeners — so it's just an ambient backdrop. Sits at zIndex 0, pointerEvents
// none; all foreground content renders above it.
const NebulaBackground = lazyRetry(() => import('./components/NebulaBackground'));

// Corner brackets per the design tokens (borders.cornerBrackets.sectorFrame).
const corner = (pos) => {
  const base = { position: 'absolute', width: '1rem', height: '1rem', border: '1.5px solid #ffae00', pointerEvents: 'none' };
  if (pos === 'tl') return { ...base, top: '-0.125rem', left: '-0.125rem', borderRight: 'none', borderBottom: 'none', borderTopLeftRadius: '10px' };
  if (pos === 'tr') return { ...base, top: '-0.125rem', right: '-0.125rem', borderLeft: 'none', borderBottom: 'none', borderTopRightRadius: '10px' };
  if (pos === 'bl') return { ...base, bottom: '-0.125rem', left: '-0.125rem', borderRight: 'none', borderTop: 'none', borderBottomLeftRadius: '10px' };
  return { ...base, bottom: '-0.125rem', right: '-0.125rem', borderLeft: 'none', borderTop: 'none', borderBottomRightRadius: '10px' };
};

const MobileApp = () => {
  const { t } = useLanguage();

  // Static map position — mobile has no map navigation, the nebula just sits still.
  const mapPositionRef = React.useRef({ x: 0, y: 0 });

  return (
    <>
      <Suspense fallback={null}>
        <NebulaBackground mapPositionRef={mapPositionRef} isVisible />
      </Suspense>
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem', overflow: 'auto', background: 'transparent' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '24rem' }}>
          <div style={corner('tl')} />
          <div style={corner('tr')} />
          <div style={corner('bl')} />
          <div style={corner('br')} />
          <div style={{
            padding: '1.75rem 1.5rem',
            borderRadius: '0.5rem',
            background: 'rgba(2, 0, 3, 0.3)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(255, 174, 0, 0.06), inset 0 0 30px rgba(255, 174, 0, 0.03)',
          }}>
            <div style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 'max(10px, 0.5vw)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255, 174, 0, 0.7)', marginBottom: '0.6rem' }}>
              {t('shell.mobile.brand')}
            </div>
            <div style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 'max(16px, 0.9vw)', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ffae00', marginBottom: '0.9rem' }}>
              {t('shell.mobile.title')}
            </div>
            <p style={{ margin: 0, fontFamily: "'Figtree', sans-serif", fontSize: 'max(13px, 0.7vw)', lineHeight: 1.6, color: '#FFFEF0' }}>
              {t('shell.mobile.body')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileApp;
