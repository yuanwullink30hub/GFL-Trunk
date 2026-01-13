import React, { useState, useEffect } from 'react';
import '../../styles/text.css';
import '../../styles/poetry.css';
import { gpuAccel } from '../../config/animationStyles';
import { throttle } from '../../utils/performanceUtils';

export const Header = ({ timestamp, loginName = 'Onbekend' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: '50%', y: '50%' });

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 1200);
  };

  // Throttle modal open calculations for performance
  const throttledModalOpen = React.useMemo(
    () => throttle((e) => {
      // Always get the flex container parent that holds both button and arrow
      const containerElement = e.currentTarget.parentElement;
      
      // Calculate from the flex container to ensure consistent origin for both button and arrow
      const rect = containerElement.getBoundingClientRect();
      
      // Calculate center of button group, moved left 5rem (1rem additional) and up 3.5rem (2rem additional)
      const centerXPercent = (((rect.left - 80) + rect.width / 2) / window.innerWidth) * 100;
      const centerYPercent = (((rect.top - 120) + rect.height / 2) / window.innerHeight) * 100;
      
      setZoomOrigin({ x: `${centerXPercent}%`, y: `${centerYPercent}%` });
      setIsModalOpen(true);
    }, 50),
    []
  );

  const handleModalOpen = (e) => {
    throttledModalOpen(e);
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
      <header className="relative z-30 uppercase tracking-widest flex flex-col justify-center" style={{ color: 'rgba(21, 179, 21, 0.8)',
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
          <h1 className="font-bold tracking-[0.3em] text-white poetry" style={{
            fontSize: 'clamp(0.9rem, 1.8vw, 1.5rem)'
          }}>DELTA</h1>
          <div className="h-px" style={{ backgroundImage: 'linear-gradient(to right, rgba(21, 179, 21, 0.4), rgba(21, 179, 21, 0.4))',
            width: 'clamp(2rem, 4vw, 4rem)'
          }} />
          <h1 className="font-bold tracking-[0.3em] text-white poetry" style={{
            fontSize: 'clamp(0.9rem, 1.8vw, 1.5rem)'
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
              onClick={handleModalOpen}
              className="border cursor-pointer transition-all duration-200"
              style={{
                backgroundColor: 'rgba(21, 179, 21, 0.2)',
                borderColor: 'rgba(21, 179, 21, 0.4)',
                padding: 'clamp(0.125rem, 0.5vw, 0.375rem) clamp(0.25rem, 1vw, 0.75rem)',
                fontSize: 'clamp(0.5rem, 1vw, 0.75rem)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(21, 179, 21, 0.3)';
                e.target.style.borderColor = 'rgba(21, 179, 21, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(21, 179, 21, 0.2)';
                e.target.style.borderColor = 'rgba(21, 179, 21, 0.4)';
              }} 
            >
              GEBRUIKSAANWIJZING
            </span>
            <div 
              onClick={handleModalOpen}
              className="transform rotate-45 cursor-pointer transition-all duration-200"
              style={{
                borderBottom: '1px solid rgba(21, 179, 21, 0.5)',
                borderRight: '1px solid rgba(21, 179, 21, 0.5)',
                width: 'clamp(1rem, 2vw, 1.5rem)',
                height: 'clamp(1rem, 2vw, 1.5rem)',
                transform: 'translate(0, -0.25rem) rotate(45deg)',
                padding: 'clamp(0.5rem, 1vw, 0.75rem)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(21, 179, 21, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(21, 179, 21, 0.5)';
              }} 
            />
          </div>
          <div className="h-[1px] pointer-events-none" style={{
            backgroundImage: 'linear-gradient(to right, rgba(21, 179, 21, 0.4), transparent)',
            width: 'clamp(4rem, 15vw, 12rem)'
          }} />
        </div>

        {/* Right: Time & Encryption - absolutely positioned at top right */}
        <div className="absolute flex flex-col items-end pointer-events-none" style={{
          position: 'absolute',
          top: '0.4rem',
          right: 0,
          gap: 'clamp(0.25rem, 0.5vw, 0.5rem)',
          fontSize: 'clamp(0.5rem, 0.75vw, 0.7rem)'
        }}>
          <div className="text-right poetry" style={{
            paddingBottom: 'clamp(0.25rem, 0.5vw, 0.75rem)'
          }}>
            <div>TIME_SYNC: {timestamp}</div>
            <div className="text-amber-500/80 flicker" style={{ marginTop: '0.04rem' }}>IDENTITEIT: {loginName}</div>
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
            perspectiveOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`,
            animation: isClosing 
              ? 'zoomBackdropOut 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
              : 'zoomBackdrop 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            zIndex: 100,
            ...gpuAccel.heavy
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: 'rgba(21, 179, 21, 0.4)',
              border: '1px solid rgba(21, 179, 21, 0.4)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: '32px',
              width: '37.8rem',
              maxWidth: '90vw',
              maxHeight: '68vh',
              overflowY: 'auto',
              animation: isClosing 
              ? 'zoomOut 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
              : 'zoomIn 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              transformStyle: 'preserve-3d',
              transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`,
              zIndex: 10000,
              ...gpuAccel.heavy
            }}
          >
            <div className="text" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              color: '#15B315'
            }}>
              <h2 style={{
                color: '#15B315',
                fontWeight: 'bold',
                fontSize: '18px',
                marginBottom: '16px'
              }}>GEBRUIKSAANWIJZING</h2>
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
              <div style={{
                color: 'rgba(21, 179, 21, 0.6)',
                fontSize: 'clamp(16px, 4vw, 24px)',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(21, 179, 21, 0.2)',
                textAlign: 'center'
              }}>
                Klik buiten dit venster om te sluiten.
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
