import React, { memo, useEffect, useRef, useState } from 'react';
import { SciFiButton } from '@gfl/ui';

/**
 * KookPage — the map destination for the Kook-eiland container (client-only feature;
 * visitors see the container locked). Lives at the far top-right of the grid map
 * (GRID_POSITIONS.kook), mirroring Gardens and sharing the top row with Winkel.
 *
 * The ENTITY on this page is NOT rendered here — it's the real assessment HoloEarth
 * instance App mounts in this same map cell (pinned at the post-journey state). This
 * component only owns the MENU card that floats out of that entity.
 *
 * Flow (mirrors the visitor assessment intro):
 *  1. During the pan to kook-eiland only the entity is visible.
 *  2. Once the pan stops, the menu card floats OUT of the entity, on top of it —
 *     exact intro-card size/structure.
 *  3. Picking the test: the card floats BACK INTO the entity, then the assessment runs
 *     IN PLACE (no pan, no reload — same entity, same intro card as the visitor flow).
 *  4. When the assessment ends (DELTAWERKEN), the menu card floats back out.
 */

// Entity screen anchor — matches App's intro-card transformOrigin ('50% 23vh').
const ENTITY_ANCHOR = '23vh';

const KookPage = memo(({ isVisible, mapAnimating = false, assessmentActive = false, onStartAssessment = null }) => {
  // Menu-card pop progress: 0 = inside the entity, 1 = fully open. Expand mirrors App's
  // intro-card float-out (700ms ease-out cubic from the entity anchor); collapse mirrors
  // its float-back-in (500ms ease-in quadratic).
  const [pop, setPop] = useState(0);
  const [closing, setClosing] = useState(false);
  const rafRef = useRef(0);
  const openedRef = useRef(false);

  // 1→2: expand only AFTER the pan has stopped — during the pan the entity stands alone.
  // Hidden for the whole assessment run; when it ends the card floats back out (4).
  useEffect(() => {
    if (!isVisible || assessmentActive) {
      openedRef.current = false;
      setClosing(false);
      setPop(0);
      return undefined;
    }
    if (mapAnimating || openedRef.current) return undefined;
    openedRef.current = true;
    // Breather after the pan stops: starting the tween on the pan's last frame drops the
    // opening frames (thread still busy) and the time-based easing skips ahead — the card
    // read as smushed/hasted. 350ms lets the frame rate settle so the full 700ms ease-out
    // cubic (identical to the visitor intro card) actually plays out.
    let timer = null;
    timer = setTimeout(() => {
      const start = performance.now();
      const DURATION = 700;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / DURATION);
        setPop(1 - Math.pow(1 - t, 3)); // ease-out cubic
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, 350);
    return () => { clearTimeout(timer); cancelAnimationFrame(rafRef.current); };
  }, [isVisible, mapAnimating, assessmentActive]);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // 3: card floats back into the entity, THEN the assessment starts in place.
  const startTest = () => {
    if (closing || typeof onStartAssessment !== 'function') return;
    setClosing(true);
    const start = performance.now();
    const DURATION = 500;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      setPop(1 - t * t); // ease-in quadratic, back into the entity
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else onStartAssessment();
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Intro-card sizing (AssessmentIntro `s`) — the menu card is the SAME size.
  const [vw, setVw] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const modalMaxWidth = vw >= 1800 ? '64.4vw' : vw >= 1079 ? '77vw' : vw >= 768 ? '39.6rem' : '97vw';
  const modalMinHeight = vw >= 768 ? 'calc(73.8vh - 0.5rem)' : 'calc(72vh - 0.5rem)'; // intro-card height − 10%
  const modalPadding = vw >= 1800 ? '1.8vh 2rem' : vw >= 1079 ? '1.4vh 1.05vw' : vw >= 768 ? '1.4vh 1.2rem' : '1.2vh 0.85rem';

  // NO unmount on !isVisible — the DataPage pattern. Staying mounted means the lazy
  // chunk loads at boot and nothing mounts mid-pan (the mount work during the fly-to
  // was the Kook-eiland stutter). Hidden state costs nothing: visibility:hidden +
  // the pane wrapper's content-visibility skip all paint work while off-screen.

  const bracket = (pos) => ({
    position: 'absolute', width: '1rem', height: '1rem', zIndex: 10,
    border: '1.5px solid #a855f7', pointerEvents: 'none', ...pos,
  });

  const MENU = [
    {
      key: 'individuatie',
      label: 'Individuatie',
      desc: 'Doe de test — de entiteit begeleidt je door de volledige lezing. Je nieuwe kristal schuift door naar je individuatiepad.',
      cta: 'Start de test',
      onClick: startTest,
      enabled: typeof onStartAssessment === 'function',
    },
    {
      key: 'recepten',
      label: 'Recepten',
      desc: 'Maaltijden en recepten op basis van je configuratie — binnenkort beschikbaar.',
      cta: 'Binnenkort',
      onClick: null,
      enabled: false,
    },
    {
      key: 'keuken',
      label: 'Keukenplanning',
      desc: 'Plan je week rond je eigen ritme — binnenkort beschikbaar.',
      cta: 'Binnenkort',
      onClick: null,
      enabled: false,
    },
  ];

  return (
    <div className="w-full h-full" style={{ position: 'relative', overflow: 'hidden', visibility: isVisible ? 'visible' : 'hidden', pointerEvents: isVisible ? 'auto' : 'none' }}>

      {/* ── Menu card — floats out of the entity (App's kook HoloEarth behind this page),
          intro-card structure & size, on top of it exactly like the intro card ── */}
      <div
        className="absolute inset-0 flex items-center justify-center p-3"
        style={{
          transform: pop < 1 ? `scale(${0.05 + pop * 0.95})` : undefined,
          opacity: pop < 1 ? pop : 1,
          transformOrigin: `50% ${ENTITY_ANCHOR}`,
          pointerEvents: pop > 0.6 && !closing ? 'auto' : 'none',
          visibility: pop > 0.01 ? 'visible' : 'hidden',
          zIndex: 30,
        }}
      >
        <div className="relative w-full" style={{ maxWidth: modalMaxWidth, top: '1rem' }}>
          {/* Corner brackets — identical to the intro card's */}
          <div style={bracket({ top: '-0.125rem', left: '-0.125rem', borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' })} />
          <div style={bracket({ top: '-0.125rem', right: '-0.125rem', borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' })} />
          <div style={bracket({ bottom: '-0.125rem', left: '-0.125rem', borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' })} />
          <div style={bracket({ bottom: '-0.125rem', right: '-0.125rem', borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' })} />

          {/* Inner glass panel — same skin as the intro card */}
          <div className="relative w-full rounded-lg" style={{
            backgroundColor: 'rgba(2, 0, 3, 0.55)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            minHeight: modalMinHeight, maxHeight: '99vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03)',
          }}>
            <div className="relative z-10 w-full flex flex-col" style={{ padding: modalPadding, flex: '1 1 auto', gap: '2.2vh', overflowY: 'auto' }}>

              {/* Header */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6vh', paddingTop: '1vh' }}>
                <h2 style={{ margin: 0, fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ffae00', fontSize: 'max(18px, 1vw)', lineHeight: 1.1 }}>
                  Kook-eiland
                </h2>
                <div style={{ fontFamily: "'Figtree', sans-serif", color: 'rgba(255, 254, 240, 0.7)', fontSize: 'max(12px, 0.65vw)', lineHeight: 1.5, maxWidth: '52ch' }}>
                  Jouw individuatie-eiland. Alles hier draait om je eigen pad — te beginnen met de test.
                </div>
              </div>

              {/* Menu — first card's paths */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4vh', flex: 1, justifyContent: 'center' }}>
                {MENU.map((item) => (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
                    padding: '1.8vh 1.4vw', borderRadius: '0.5rem',
                    background: 'rgba(2, 0, 3, 0.3)',
                    border: `1px solid ${item.enabled ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    opacity: item.enabled ? 1 : 0.55,
                  }}>
                    <div style={{ flex: '1 1 16rem', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4vh' }}>
                      <span style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: item.enabled ? '#d8b4fe' : 'rgba(255, 254, 240, 0.5)', fontSize: 'max(11px, 0.6vw)' }}>
                        {item.label}
                      </span>
                      <span style={{ fontFamily: "'Figtree', sans-serif", color: '#FFFEF0', fontSize: 'max(12px, 0.65vw)', lineHeight: 1.5 }}>
                        {item.desc}
                      </span>
                    </div>
                    <SciFiButton variant="purple" size="sm" disabled={!item.enabled} onClick={item.onClick || (() => {})}>
                      {item.cta}
                    </SciFiButton>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

KookPage.displayName = 'KookPage';

export default KookPage;
