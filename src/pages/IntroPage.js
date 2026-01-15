import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/poetry.css';
import '../styles/buttons.css';
import sun2 from '../images/illustrativesun.png';
import lock from '../images/Lock-PNG-Images.png';
import key from '../images/KEY-PNG-Images.png';
import Deltawerken from './Deltawerken';
import MobileAppContent from '../data/mobile/App';
import generalData from '../data.json';
import mobileData from '../data/mobile/data.json';

const IntroPage = ({ darkMode, setDarkMode }) => {
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [showNewContent, setShowNewContent] = React.useState(false);
  const [showLandingPage, setShowLandingPage] = React.useState(false);
  const [introFadingOut, setIntroFadingOut] = React.useState(false);
  const [contentVisible, setContentVisible] = React.useState(false);
  const [landingPageVisible, setLandingPageVisible] = React.useState(false);
  const [sunButtonVisible, setSunButtonVisible] = React.useState(true);
  const [scrollDirection, setScrollDirection] = React.useState('up');
  const [showQuickMenu, setShowQuickMenu] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

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
    setIntroFadingOut(true);
    // Wait for intro to fully fade out before showing landing page
    setTimeout(() => {
      setShowLandingPage(true);
      // Small delay then fade in the content
      setTimeout(() => {
        setLandingPageVisible(true);
      }, 100);
    }, 600);
  };

  const handleDuplicateButtonClick = () => {
    requestFullscreen();
    setIntroFadingOut(true);
    // Wait for intro to fully fade out before showing new content
    setTimeout(() => {
      setShowNewContent(true);
      // Small delay then fade in the content
      setTimeout(() => {
        setContentVisible(true);
      }, 100);
    }, 600);
  };

  return (
    <>
    <div className={`w-full h-screen overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ${
      darkMode 
        ? 'text-white'
        : 'text-[#26163e]'
    }`}
    style={{
      background: 'linear-gradient(to bottom, #1d0900ff, #0a0504ff, #0d0811ff, #2b0c3dff, #170720ff)',
      overflow: 'hidden',
      position: 'relative'
    }}>


      {/* Sun Logo with Quick Menu */}
      <div style={{
        position: 'fixed',
        right: '1.5rem',
        top: 'calc(1.5rem + 0.4rem)',
        zIndex: 10000
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
                <span style={{ fontSize: '18px' }}>⛶</span>
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
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
                <span style={{ fontSize: '18px' }}>🔐</span>
                <span>Aanmelden</span>
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
      </div>

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
        animate={{ opacity: introFadingOut ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        aanmelden
      </motion.span>

      {/* Content Container */}
      <motion.div 
        className="w-full max-w-2xl px-6 text-center" 
        initial={{ opacity: 1 }}
        animate={{ opacity: introFadingOut ? 0 : 1 }}
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

        {/* Small Overlaying Image Container */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(4.2rem, 21vw, 15.75rem)',
            height: 'clamp(4.2rem, 21vw, 15.75rem)',
            marginTop: 'calc(20px - 3rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'transparent'
          }}
        >
        {/* Circle Button with Triangle Inside */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'transparent'
          }}
        >
          {/* Overlay Image - Orbiting */}
          <motion.div
            style={{
              position: 'absolute',
              zIndex: 10,
              width: '75%',
              height: '75%',
              top: '50%',
              left: '50%',
              transformOrigin: '0 0',
              pointerEvents: 'auto',
              cursor: 'pointer'
            }}
            onClick={handleEnterSite}
            animate={{ rotate: 360, scale: [1, 1.08, 1] }}
            transition={{
              rotate: { duration: 9, repeat: Infinity, ease: 'linear', delay: 0.3 },
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 'calc(-37.5% + 2rem)',
                right: 'calc(-37.5% + 1.5rem)'
              }}
            >
            <img
              src={lock}
              alt="Overlay"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 10px rgba(239, 134, 22, 0.6))'
              }}
            />
            </div>
          </motion.div>

          {/* Circle Button */}
          <button
            onClick={handleEnterSite}
            className="poetry active:scale-95"
            style={{
              position: 'absolute',
              animation: 'breathColor 4s ease-in-out infinite 0.3s, breathBorder 4s ease-in-out infinite 0.3s, pulsate 4s ease-in-out infinite 0.3s',
              border: '2px solid',
              borderColor: '#ef8616',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
              width: '100%',
              height: '100%',
              boxShadow: '0 0 20px rgba(239, 134, 22, 0.6), inset 0 0 20px rgba(239, 134, 22, 0.2), 0 0 40px rgba(167, 59, 198, 0.3)'
            }}
          >
          </button>

          {/* Triangle Inside Container */}
          <motion.svg
            width="107%"
            height="107%"
            viewBox="1 50 300 300"
            preserveAspectRatio="xMidYMid meet"
            style={{
              display: 'block',
              cursor: 'pointer',
              position: 'absolute'
            }}
            animate={{ scale: [1, 1.08, 1], rotate: 360 }}
            transition={{
              rotate: { duration: 9, repeat: Infinity, ease: 'linear', delay: 0.3 },
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }
            }}
          >
            <motion.path
              d="M 141 71 Q 151 56 161 71 L 272 263 Q 272 277 257 277 L 45 277 Q 30 277 30 263 L 141 71 Z"
              fill="none"
              stroke="#ef8616"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
              animate={{ stroke: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(239, 134, 22, 0.8)) drop-shadow(0 0 16px rgba(167, 59, 198, 0.4))'
              }}
            />
            {/* Letter W inside triangle */}
            <motion.path
              d="M 269 261 L 215 168 L 151 273 L 87 168 L 34 261"
              fill="none"
              stroke="#ef8616"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
              animate={{ stroke: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(239, 134, 22, 0.8)) drop-shadow(0 0 16px rgba(167, 59, 198, 0.4))'
              }}
            />
            {/* Hidden clickable path - only on localhost */}
            <path
              d="M 141 71 Q 151 56 161 71 L 272 263 Q 272 277 257 277 L 45 277 Q 30 277 30 263 L 141 71 Z"
              fill="rgba(0,0,0,0.001)"
              pointerEvents={window.location.hostname === 'localhost' ? 'all' : 'none'}
              onClick={() => {
                if (window.location.hostname === 'localhost') {
                  handleEnterSite();
                }
              }}
              style={{ cursor: window.location.hostname === 'localhost' ? 'pointer' : 'default' }}
            />
          </motion.svg>
        </div>
        </div>

        {/* Duplicate Triangle Container - Static, 5rem below */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(4.2rem, 21vw, 15.75rem)',
            height: 'clamp(4.2rem, 21vw, 15.75rem)',
            marginTop: '5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'transparent'
          }}
        >
          {/* Image Overlay */}
          <motion.div
            style={{
              position: 'absolute',
              zIndex: 10,
              width: '37.5%',
              height: '37.5%',
              top: 'calc(-37.5% + 2rem)',
              right: 'calc(-37.5% + 3.1rem)',
              pointerEvents: 'none'
            }}
          >
            <img
              src={key}
              alt="Overlay"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 10px rgba(65, 105, 225, 0.6))'
              }}
            />
          </motion.div>

          <motion.svg
            width="107%"
            height="107%"
            viewBox="1 50 300 300"
            preserveAspectRatio="xMidYMid meet"
            style={{
              display: 'block',
              cursor: 'pointer',
              position: 'absolute'
            }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }
            }}
          >
            <path
              d="M 141 71 Q 151 56 161 71 L 272 263 Q 272 277 257 277 L 45 277 Q 30 277 30 263 L 141 71 Z"
              fill="rgba(0,0,0,0.001)"
              pointerEvents="all"
              onClick={handleDuplicateButtonClick}
              style={{ cursor: 'pointer' }}
            />
            <motion.path
              d="M 141 71 Q 151 56 161 71 L 272 263 Q 272 277 257 277 L 45 277 Q 30 277 30 263 L 141 71 Z"
              fill="none"
              stroke="#ef8616"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
              animate={{ stroke: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(239, 134, 22, 0.8)) drop-shadow(0 0 16px rgba(167, 59, 198, 0.4))'
              }}
            />
            {/* Letter W inside triangle */}
            <motion.path
              d="M 269 261 L 215 168 L 151 273 L 87 168 L 34 261"
              fill="none"
              stroke="#ef8616"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
              animate={{ stroke: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(239, 134, 22, 0.8)) drop-shadow(0 0 16px rgba(167, 59, 198, 0.4))'
              }}
            />
          </motion.svg>
        </div>

      </motion.div>

      {/* New Content - Nexus Visual System */}
      {showNewContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: contentVisible ? 1 : 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, #1d0900ff, #0a0504ff, #0d0811ff, #2b0c3dff, #170720ff)',
            pointerEvents: 'auto',
            zIndex: 9998
          }}
        >
          <Deltawerken onBack={() => {
            setContentVisible(false);
            setTimeout(() => {
              setShowNewContent(false);
              setIntroFadingOut(false);
            }, 500);
          }} />
        </motion.div>
      )}

    </div>

    {/* Landing Page Content - Portal to document.body for proper scrolling */}
    {showLandingPage && createPortal(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: landingPageVisible ? 1 : 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          minHeight: '100vh',
          pointerEvents: landingPageVisible ? 'auto' : 'none',
          zIndex: 9999
        }}
      >
        <div className={`min-h-screen transition-all duration-300 ${
          darkMode 
            ? 'bg-gradient-to-br from-[#26163e] via-[#26163e] to-[#26163e] text-white'
            : 'bg-gradient-to-br from-[#26163e] via-[#26163e] to-[#26163e] text-white'
        }`}>
          <MobileAppContent 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            data={data} 
            scrollDirection={scrollDirection}
            onBack={() => {
              setLandingPageVisible(false);
              setTimeout(() => {
                setShowLandingPage(false);
                setIntroFadingOut(false);
                setSunButtonVisible(true);
              }, 500);
            }}
          />
        </div>
      </motion.div>,
      document.body
    )}
    </>

  );
};

export default IntroPage;
