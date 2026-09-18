import React, { memo } from 'react';
import { useLanguage } from '@gfl/i18n';
import { SciFiButton } from '@gfl/ui';
import TechContainer from '../components/orbital/TechContainer';

/**
 * WinkelPage — the map destination reached from the Winkel container's button.
 *
 * Its own empty map location (above the orb); shows no other HUD content. For now
 * it holds a SINGLE product — the T³ Archetype kaarten image and name, with template
 * copy and price still to come — inside the parent TechContainer, so the shop layout
 * can be built out from here later.
 */
const WinkelPage = memo(({ isVisible }) => {
  const { t } = useLanguage();
  // NO unmount on !isVisible — the DataPage pattern: staying mounted loads the lazy
  // chunk at boot and avoids mount work mid-pan (the fly-to stutter).
  const PURPLE = 'rgb(192, 132, 252)';

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ padding: '4vh 4vw', visibility: isVisible ? 'visible' : 'hidden', pointerEvents: isVisible ? 'auto' : 'none' }}>
      {/* Parent container — fixed to the VIEWPORT (vw×vh), so it holds its shape even when the
          template is empty instead of collapsing to its content. */}
      <div style={{ width: '26vw', height: '64vh', maxWidth: '520px', maxHeight: '680px' }}>
        <TechContainer title={t('misc.winkel.panelTitle')} variant="purple" className="w-full h-full" style={{ backgroundColor: 'rgba(1, 0, 2, 0.35)' }}>
          <div className="w-full h-full flex flex-col" style={{ gap: '1.4vh', padding: '1vw', minHeight: 0 }}>

            {/* Product image — flexes to fill the fixed container. Lazy: the page stays mounted
                off-screen from boot, so the image loads only when the shop comes into view. */}
            <div style={{
              width: '100%',
              flex: 1,
              minHeight: 0,
              borderRadius: '0.4rem',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              // No fill: the product shot has its own transparency, and the container's glass shows through.
              overflow: 'hidden',
            }}>
              <img
                src="/images/winkel/t3-archetype-kaarten.webp"
                alt={t('misc.winkel.productName')}
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </div>

            {/* Template copy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6vh' }}>
              <span style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontSize: 'max(8px, 0.45vw)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(192, 132, 252, 0.7)' }}>{t('misc.winkel.category')}</span>
              <h2 style={{ margin: 0, fontFamily: "'Figtree', sans-serif", fontWeight: 600, color: '#FFFEF0', fontSize: 'max(16px, 1.1vw)', lineHeight: 1.1 }}>{t('misc.winkel.productName')}</h2>
              <p style={{ margin: 0, fontFamily: "'Figtree', sans-serif", color: 'rgba(255, 254, 240, 0.7)', fontSize: 'max(11px, 0.62vw)', lineHeight: 1.45 }}>
                {t('misc.winkel.productDesc')}
              </p>
              <span style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 700, color: PURPLE, fontSize: 'max(15px, 1vw)', marginTop: '0.4vh' }}>€ 00,00</span>
            </div>

            <SciFiButton variant="purple" size="sm" onClick={() => {}}>
              {t('misc.winkel.addToCart')}
            </SciFiButton>
          </div>
        </TechContainer>
      </div>
    </div>
  );
});

WinkelPage.displayName = 'WinkelPage';

export default WinkelPage;
