import React, { memo } from 'react';
import { ShoppingBag } from 'lucide-react';
import { SciFiButton } from '@gfl/ui';
import TechContainer from '../components/orbital/TechContainer';

/**
 * WinkelPage — the map destination reached from the Winkel container's button.
 *
 * Its own empty map location (above the orb); shows no other HUD content. For now
 * it holds a SINGLE product template — a placeholder image + template copy inside
 * the parent TechContainer — so the shop layout can be built out from here later.
 */
const WinkelPage = memo(({ isVisible }) => {
  // NO unmount on !isVisible — the DataPage pattern: staying mounted loads the lazy
  // chunk at boot and avoids mount work mid-pan (the fly-to stutter).
  const PURPLE = 'rgb(192, 132, 252)';

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ padding: '4vh 4vw', visibility: isVisible ? 'visible' : 'hidden', pointerEvents: isVisible ? 'auto' : 'none' }}>
      {/* Parent container — fixed to the VIEWPORT (vw×vh), so it holds its shape even when the
          template is empty instead of collapsing to its content. */}
      <div style={{ width: '26vw', height: '64vh', maxWidth: '520px', maxHeight: '680px' }}>
        <TechContainer title="PRODUCT" variant="purple" className="w-full h-full" style={{ backgroundColor: 'rgba(1, 0, 2, 0.35)' }}>
          <div className="w-full h-full flex flex-col" style={{ gap: '1.4vh', padding: '1vw', minHeight: 0 }}>

            {/* Template image — placeholder box; flexes to fill the fixed container */}
            <div style={{
              width: '100%',
              flex: 1,
              minHeight: 0,
              borderRadius: '0.4rem',
              border: '1px dashed rgba(192, 132, 252, 0.35)',
              background: 'linear-gradient(135deg, rgba(88,28,135,0.35), rgba(1,0,2,0.5))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8vh',
            }}>
              <ShoppingBag style={{ width: '3vw', height: '3vw', color: PURPLE }} strokeWidth={1.2} />
              <span style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontSize: 'max(9px, 0.55vw)', letterSpacing: '0.15em', color: 'rgba(192, 132, 252, 0.6)' }}>PRODUCTAFBEELDING</span>
            </div>

            {/* Template copy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6vh' }}>
              <span style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontSize: 'max(8px, 0.45vw)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(192, 132, 252, 0.7)' }}>Categorie</span>
              <h2 style={{ margin: 0, fontFamily: "'Figtree', sans-serif", fontWeight: 600, color: '#FFFEF0', fontSize: 'max(16px, 1.1vw)', lineHeight: 1.1 }}>Productnaam</h2>
              <p style={{ margin: 0, fontFamily: "'Figtree', sans-serif", color: 'rgba(255, 254, 240, 0.7)', fontSize: 'max(11px, 0.62vw)', lineHeight: 1.45 }}>
                Korte productomschrijving — een paar regels sjabloontekst die later
                wordt vervangen door de echte copy van dit product.
              </p>
              <span style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 700, color: PURPLE, fontSize: 'max(15px, 1vw)', marginTop: '0.4vh' }}>€ 00,00</span>
            </div>

            <SciFiButton variant="purple" size="sm" onClick={() => {}}>
              In winkelmand
            </SciFiButton>
          </div>
        </TechContainer>
      </div>
    </div>
  );
});

WinkelPage.displayName = 'WinkelPage';

export default WinkelPage;
