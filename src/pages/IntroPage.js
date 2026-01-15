import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/poetry.css';
import '../styles/buttons.css';
import sun2 from '../images/illustrativesun.png';
import lock from '../images/Lock-PNG-Images.png';
import key from '../images/KEY-PNG-Images.png';
import Deltawerken from './Deltawerken';

const IntroPage = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [showNewContent, setShowNewContent] = React.useState(false);

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
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/welcome');
    }, 500);
  };

  const handleDuplicateButtonClick = () => {
    requestFullscreen();
    setShowNewContent(true);
  };

  return (
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
      {/* Transition Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isTransitioning ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000000',
          zIndex: 9999,
          pointerEvents: 'none'
        }}
      />

      {/* Login Button */}
      <button
        onClick={() => window.location.href = '/login'}
        className="absolute right-6 flex items-center gap-2 p-2 hover:opacity-80 transition-opacity duration-300"
        style={{ top: 'calc(1.5rem + 0.4rem)' }}
        title="Go to login"
      >
        <span className="poetry font-bold tracking-[0.15em] uppercase" style={{ transform: 'translateY(-0.07rem) translateX(1.08rem)', color: '#FFFEF0', fontSize: '0.604rem' }}>aanmelden</span>
        <img src={sun2} alt="Login" style={{ width: '55px', height: '55px', transformOrigin: 'center', rotate: '-30deg', pointerEvents: 'none', display: 'block' }} />
      </button>

      {/* Content Container */}
      <div className="w-full max-w-2xl px-6 text-center" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
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

        {/* New Content - Nexus Visual System */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showNewContent ? 1 : 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, #1d0900ff, #0a0504ff, #0d0811ff, #2b0c3dff, #170720ff)',
            pointerEvents: showNewContent ? 'auto' : 'none',
            zIndex: 9998
          }}
        >
          {showNewContent && (
            <Deltawerken onBack={() => setShowNewContent(false)} />
          )}
        </motion.div>
      </div>
    </div>

  );
};

export default IntroPage;
