import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/poetry.css';
import '../styles/buttons.css';
import sun2 from '../images/illustrativesun.png';
import Deltawerken from './Deltawerken';
import MobileAppContent from '../data/mobile/App';
import HoloButton from './HoloButton';
import generalData from '../data.json';
import mobileData from '../data/mobile/data.json';

const IntroPage = ({ darkMode, setDarkMode }) => {
  // Simplified state: only track which view is active, not separate show/visible states
  const [activeView, setActiveView] = React.useState('intro'); // 'intro' | 'landing' | 'deltawerken'
  const [sunButtonVisible, setSunButtonVisible] = React.useState(true);
  const [scrollDirection] = React.useState('up');
  const [showQuickMenu, setShowQuickMenu] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [landingResetTrigger, setLandingResetTrigger] = React.useState(0);

  // Track fullscreen state
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setShowQuickMenu(false);
      return;
    }
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    }
    setShowQuickMenu(false);
  };

  // Merge data for MobileAppContent
  const data = {
    basics: {
      ...generalData.basics,
      pages: mobileData.basics.pages
    }
  };

  React.useEffect(() => {
    // Preload main app assets for faster transition
    const preloadAssets = () => {
      // Preload key images
      const imagesToPreload = [
        '/images/Holographichearth.png',
        '/images/holographicbody.png',
        '/images/Holographicmind.PNG'
      ];

      imagesToPreload.forEach((src) => {
        const img = new Image();
        img.src = src;
      });

      // Preload videos
      const videosToPreload = [
        '/videos/KnightHD_2.mp4',
        '/videos/hologramknightwebkit .webm',
        '/videos/Holographicheader.mp4'
      ];

      videosToPreload.forEach((src) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'video';
        link.href = src;
        document.head.appendChild(link);
      });
    };

    preloadAssets();
  }, []);

  const requestFullscreen = () => {
    // Skip fullscreen on localhost (development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return;
    }
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  const handleEnterSite = () => {
    requestFullscreen();
    setActiveView('landing');
  };

  return (
    <>
    {/* Sun Logo with Quick Menu - Outside main content so it's always accessible */}
    {createPortal(
      <div style={{
        position: 'fixed',
        right: '1.5rem',
        top: 'calc(1.5rem + 0.4rem)',
        zIndex: 100000
      }}>
        <motion.button
          onClick={() => setShowQuickMenu(!showQuickMenu)}
          className="p-2 hover:opacity-80 transition-opacity duration-300"
          title="Quick menu"
          initial={{ opacity: 1 }}
          animate={{ opacity: sunButtonVisible ? 1 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ pointerEvents: sunButtonVisible ? 'auto' : 'none' }}
        >
          <img src={sun2} alt="Menu" style={{ width: '55px', height: '55px', transformOrigin: 'center', rotate: '-30deg', pointerEvents: 'none', display: 'block' }} />
        </motion.button>
        
        {/* Quick Menu Dropdown */}
        <AnimatePresence>
          {showQuickMenu && sunButtonVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '65px',
                right: '0',
                backgroundColor: 'rgba(21, 10, 36, 0.95)',
                borderRadius: '12px',
                padding: '8px',
                minWidth: '160px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(124, 58, 237, 0.3)'
              }}
            >
              <button
                onClick={toggleFullscreen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(124, 58, 237, 0.2)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ display: 'block' }}>
                  {/* Open square with gaps on left and right sides */}
                  <path d="M 2 2 L 7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 11 2 L 16 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 16 2 L 16 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 16 11 L 16 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 16 16 L 11 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 7 16 L 2 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 2 16 L 2 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 2 7 L 2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>{isFullscreen ? 'Exit' : 'Scherm'}</span>
              </button>
              
              <button
                onClick={() => {
                  window.location.href = '/login';
                  setShowQuickMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(124, 58, 237, 0.2)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ display: 'block' }}>
                  {/* Open triangle with gaps at corners */}
                  <path d="M 9 2 L 5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 9 2 L 13 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 3 15 L 7 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 11 15 L 15 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 4 10 L 2 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 14 10 L 16 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Login</span>
              </button>
              
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  setLandingResetTrigger(prev => prev + 1);
                  setActiveView('landing');
                  window.scrollTo(0, 0);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(124, 58, 237, 0.2)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ display: 'block' }}>
                  {/* Dashed circle */}
                  <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" fill="none" />
                </svg>
                <span>Garden</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Click outside to close menu */}
        {showQuickMenu && (
          <div
            onClick={() => setShowQuickMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: -1
            }}
          />
        )}
      </div>,
      document.body
    )}

    <div className={`w-full h-screen overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ${
      darkMode 
        ? 'text-white'
        : 'text-[#26163e]'
    }`}
    style={{
      background: 'transparent',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1
    }}>


      {/* Aanmelden Text - Fades with intro */}
      <motion.span
        className="absolute poetry font-bold tracking-[0.15em] uppercase"
        style={{ 
          top: 'calc(1.5rem + 0.4rem + 0.5rem + 1.1rem + 0.45rem)',
          right: 'calc(1.5rem + 55px + 0.5rem - 0.4rem)',
          transform: 'translateY(-0.07rem)',
          color: '#FFFEF0', 
          fontSize: '0.604rem',
          pointerEvents: 'none'
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: activeView !== 'intro' ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        aanmelden
      </motion.span>

      {/* Content Container */}
      <motion.div 
        className="w-full max-w-2xl px-6 text-center" 
        initial={{ opacity: 1 }}
        animate={{ opacity: activeView !== 'intro' ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {/* Header */}
        <h1 className="poetry text-2xl md:text-3xl mb-8" style={{
          background: 'linear-gradient(to bottom, #772905ff, #360464ff 50%, #56056eff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'brightness(1.62)'
        }}>
          <span style={{ display: 'block', fontSize: '0.72em' }}>GEBOUWD OP HET</span>
          <span>WARE LEVEN!</span>
        </h1>

        {/* Text Container */}
        <div className={`mb-12 space-y-4`} style={{
          width: '100%',
          fontSize: 'clamp(0.795rem, 3.634vw, 1.704rem)',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}>
          <p className="text" style={{
            width: '100%',
            fontSize: 'clamp(0.795rem, 3.634vw, 1.704rem)',
            marginTop: '9px',
            marginBottom: '0',
            paddingBottom: '25px',
            whiteSpace: 'nowrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.4',
            backgroundColor: 'transparent',
            color: '#FFFEF0'
          }}>
            De externe terugknop is uitgeschakeld. <br/> Bij ons dus alleen voorwaartse beweging. <br/> Gebruik de interne software om te navigeren.
          </p>
          <p className="text" style={{
            width: '100%',
            fontSize: 'clamp(0.795rem, 3.634vw, 1.704rem)',
            marginBottom: '0',
            paddingBottom: '25px',
            whiteSpace: 'nowrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.4',
            backgroundColor: 'transparent',
            color: '#FFFEF0'
          }}>
           Wij nemen volledige verantwoordelijkheid voor onze <br/> content en verzekeren dat de tijd die je hier spendeert <br/> waardevol is.
          </p>
        </div>

        {/* Primary HoloButton (Enter Site) with VR Container Frame */}
        <div
          style={{
            marginTop: 'calc(20px - 3rem)',
            width: 'clamp(5.67rem, 28.35vw, 21.26rem)',
            height: 'clamp(5.67rem, 28.35vw, 21.26rem)',
            position: 'relative'
          }}
        >
          {/* VR Placeholder Container Frame - Circular */}
          <div
            style={{
              position: 'absolute',
              inset: '-18%',
              borderRadius: '50%',
              pointerEvents: 'none',
              overflow: 'hidden'
            }}
          >
            {/* Circular border with 6 thick segments at edges, thin connecting lines */}
            <svg
              width="100%"
              height="100%"
              style={{
                position: 'absolute',
                inset: 0
              }}
              viewBox="0 0 100 100"
            >
              {/* Background fill */}
              <circle cx="50" cy="50" r="48" fill="rgba(0, 0, 0, 0.2)" />
              {/* Thin connecting circle */}
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
              {/* 6 thick segments at 60-degree intervals */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <path
                  key={i}
                  d={`M ${50 + 48 * Math.cos((angle - 15) * Math.PI / 180)} ${50 + 48 * Math.sin((angle - 15) * Math.PI / 180)} A 48 48 0 0 1 ${50 + 48 * Math.cos((angle + 15) * Math.PI / 180)} ${50 + 48 * Math.sin((angle + 15) * Math.PI / 180)}`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ))}
            </svg>
            {/* Grid Pattern - fills entire circular container */}
            <svg
              width="100%"
              height="100%"
              style={{
                position: 'absolute',
                inset: 0
              }}
            >
              <defs>
                <pattern id="vrGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
                </pattern>
                <clipPath id="circleClip">
                  <circle cx="50%" cy="50%" r="50%" />
                </clipPath>
              </defs>
              <rect width="100%" height="100%" fill="url(#vrGrid)" clipPath="url(#circleClip)" />
            </svg>
          </div>

          <HoloButton
            size="100%"
            rotation={30}
            onClick={handleEnterSite}
          />
        </div>

      </motion.div>

      {/* Deltawerken Content - AnimatePresence ensures full unmount after exit */}
      <AnimatePresence mode="wait">
        {activeView === 'deltawerken' && (
          <motion.div
            key="deltawerken"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'transparent',
              pointerEvents: 'auto',
              zIndex: 9998
            }}
          >
            <Deltawerken onBack={() => {
              setActiveView('intro');
              setSunButtonVisible(true);
            }} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>

    {/* Landing Page Content - Portal with AnimatePresence for full unmount */}
    {createPortal(
      <AnimatePresence mode="wait">
        {activeView === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              minHeight: '100vh',
              pointerEvents: 'auto',
              zIndex: 9999,
              background: 'transparent'
            }}
          >
            <div className={`min-h-screen transition-all duration-300 text-white`}
              style={{ background: 'transparent' }}
            >
              <MobileAppContent 
                key={`landing-${landingResetTrigger}`}
                darkMode={darkMode} 
                setDarkMode={setDarkMode} 
                data={data} 
                scrollDirection={scrollDirection}
                onDeltawerken={() => {
                  setActiveView('deltawerken');
                }}
                onBack={() => {
                  setActiveView('intro');
                  setSunButtonVisible(true);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>

  );
};

export default IntroPage;
