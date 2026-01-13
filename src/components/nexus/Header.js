import React, { useState, useEffect } from 'react';
import '../../styles/text.css';

export const Header = ({ timestamp }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 1200);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isModalOpen) handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  return (
    <>
      <header className="relative z-30 uppercase tracking-widest text-cyan-500/80 flex flex-col justify-center" style={{
        fontSize: 'clamp(0.795rem, 3.634vw, 1.704rem)',
        width: '100%',
        height: 'clamp(8rem, 12vw, 12rem)',
        position: 'relative',
        paddingLeft: 0
      }}>
        {/* Main Title - left aligned */}
        <div className="flex flex-col pointer-events-none" style={{
          gap: 'clamp(0.25rem, 0.5vw, 0.5rem)',
          marginBottom: 'clamp(0.5rem, 1vw, 1rem)',
          marginLeft: '0.5rem',
          marginTop: '-3.1rem'
        }}>
          <h1 className="font-bold tracking-[0.5em] text-white" style={{
            fontSize: 'clamp(0.75rem, 1.5vw, 1.25rem)'
          }}>DELTA</h1>
          <div className="h-px bg-gradient-to-r from-cyan-500/40 to-cyan-500/40" style={{
            width: 'clamp(2rem, 4vw, 4rem)'
          }} />
          <h1 className="font-bold tracking-[0.5em] text-white" style={{
            fontSize: 'clamp(0.75rem, 1.5vw, 1.25rem)'
          }}>WERKEN 4.9</h1>
        </div>

        {/* System Status Container - left aligned */}
        <div className="flex flex-col" style={{
          gap: 'clamp(0.25rem, 0.5vw, 0.5rem)',
          marginLeft: '0.45rem',
          pointerEvents: 'auto'
        }}>
          <div className="flex items-center" style={{
            gap: 'clamp(0.5rem, 1vw, 1.5rem)'
          }}>
            <span 
              onClick={() => setIsModalOpen(true)}
              className="bg-cyan-500/20 border border-cyan-500/40 cursor-pointer hover:bg-cyan-500/30 hover:border-cyan-500/60 transition-all duration-200" 
              style={{
                padding: 'clamp(0.125rem, 0.5vw, 0.375rem) clamp(0.25rem, 1vw, 0.75rem)',
                fontSize: 'clamp(0.5rem, 1vw, 0.75rem)'
              }}
            >
              LEES INSTRUCTIE
            </span>
            <div className="border-b border-r border-cyan-500/50 transform rotate-45 pointer-events-none" style={{
              width: 'clamp(1rem, 2vw, 1.5rem)',
              height: 'clamp(1rem, 2vw, 1.5rem)',
              transform: 'translate(0, -0.25rem) rotate(45deg)'
            }} />
          </div>
          <div className="h-[1px] bg-gradient-to-r from-cyan-500/40 to-transparent pointer-events-none" style={{
            width: 'clamp(4rem, 15vw, 12rem)'
          }} />
        </div>

        {/* Right: Time & Encryption - absolutely positioned at top right */}
        <div className="absolute flex flex-col items-end pointer-events-none" style={{
          position: 'absolute',
          top: 0,
          right: 0,
          gap: 'clamp(0.25rem, 0.5vw, 0.5rem)',
          fontSize: 'clamp(0.5rem, 0.75vw, 0.7rem)'
        }}>
          <div className="text-right">
            <div>TIME_SYNC: {timestamp}</div>
            <div className="text-amber-500/80 flicker">ENCRYPT: RSA_4096</div>
          </div>
        </div>
      </header>

      {/* Modal Overlay - Zoom effect like triangles */}
      {isModalOpen && (
        <div 
          onClick={handleClose}
          className="fixed inset-0 flex items-center justify-center"
          style={{
            perspective: '1200px',
            perspectiveOrigin: '0.45rem 4rem',
            animation: isClosing 
              ? 'zoomBackdropOut 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
              : 'zoomBackdrop 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            zIndex: 9999
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="border border-cyan-500/40 bg-black/60 p-8 max-w-2xl max-h-[80vh] overflow-y-auto"
            style={{
              animation: isClosing 
              ? 'zoomOut 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
              : 'zoomIn 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              transformStyle: 'preserve-3d',
              transformOrigin: '0.45rem 4rem',
              zIndex: 10000
            }}
          >
            <div className="text-cyan-400 font-mono space-y-4 text-sm leading-relaxed">
              <h2 className="text-cyan-300 font-bold text-lg mb-4">INSTRUCTIES</h2>
              <p>
                Welkom bij het GFL Nexus systeem. Dit is uw interface naar geavanceerde gegevensvisualisatie en systeemcontrole.
              </p>
              <p>
                Gebruik de interactieve elementen om door de verschillende gegevenstreams te navigeren. Elk component biedt real-time telemetrie en systeemstatus.
              </p>
              <p>
                De centrale piramide visualisatie geeft een grafische weergave van de gegevenshiërarchie weer. Labels geven aanvullende context voor kritieke metrische gegevens.
              </p>
              <p>
                Het rechterpaneel bevat golfanalyse en systeemmetrieken. Monitor deze waarden voor optimale systeemprestaties.
              </p>
              <div className="text-cyan-500/60 text-xs mt-6 pt-4 border-t border-cyan-500/20">
                Druk ESC om dit venster te sluiten of klik erbuiten.
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes zoomBackdrop {
          from { 
            background-color: rgba(0, 0, 0, 0);
            backdrop-filter: blur(0px);
          }
          to { 
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
          }
        }
        @keyframes zoomBackdropOut {
          from { 
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
          }
          to { 
            background-color: rgba(0, 0, 0, 0);
            backdrop-filter: blur(0px);
          }
        }
        @keyframes zoomIn {
          from { 
            opacity: 0;
            transform: scale(0.05) rotateX(25deg) translateZ(-1000px);
          }
          to { 
            opacity: 1;
            transform: scale(1) rotateX(0deg) translateZ(0px);
          }
        }
        @keyframes zoomOut {
          from { 
            opacity: 1;
            transform: scale(1) rotateX(0deg) translateZ(0px);
          }
          to { 
            opacity: 0;
            transform: scale(0.05) rotateX(25deg) translateZ(-1000px);
          }
        }
      `}</style>
    </>
  );
};;

export default Header;
