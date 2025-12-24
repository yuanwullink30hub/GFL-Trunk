import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/poetry.css';
import '../styles/buttons.css';
import sun2 from '../images/sun2.PNG';

const IntroPage = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();

  const handleEnterSite = () => {
    navigate('/welcome');
  };

  return (
    <div className={`w-full h-screen overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ${
      darkMode 
        ? 'text-white'
        : 'text-[#26163e]'
    }`}
    style={{
      background: 'linear-gradient(to bottom, #1d0900ff, #0a0504ff, #0d0811ff, #2b0c3dff, #170720ff)',
      overflow: 'hidden'
    }}>
      {/* Login Button */}
      <button
        onClick={() => window.location.href = '/login'}
        className="absolute right-6 flex items-center gap-2 p-2 hover:opacity-80 transition-opacity duration-300"
        style={{ top: 'calc(1.5rem + 0.4rem)' }}
        title="Go to login"
      >
        <span className="text-sm md:text-base font-medium" style={{ transform: 'translateY(0.3rem) translateX(0.6rem)', color: '#FFFEF0' }}>aanmelden</span>
        <img src={sun2} alt="Login" style={{ width: '40px', height: '40px' }} />
      </button>

      {/* Content Container */}
      <div className="w-full max-w-2xl px-6 text-center" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {/* Header */}
        <h1 className="poetry text-2xl md:text-3xl mb-8" style={{
          background: 'linear-gradient(to bottom, #772905ff, #360464ff 50%, #56056eff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'brightness(1.8)'
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

        {/* Circle Button with Triangle Inside */}
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
              height: '100%'
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
            <path
              d="M 141 71 Q 151 56 161 71 L 272 263 Q 272 277 257 277 L 45 277 Q 30 277 30 263 L 141 71 Z"
              fill="rgba(0,0,0,0.001)"
              pointerEvents="all"
              onClick={handleEnterSite}
              style={{ cursor: 'pointer' }}
            />
            <motion.path
              d="M 141 71 Q 151 56 161 71 L 272 263 Q 272 277 257 277 L 45 277 Q 30 277 30 263 L 141 71 Z"
              fill="none"
              stroke="#ef8616"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
              animate={{ stroke: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />

            {/* Letter W inside triangle */}
            <motion.path
              d="M 269 261 L 215 168 L 151 273 L 87 168 L 34 261"
              fill="none"
              stroke="#ef8616"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
              animate={{ stroke: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
          </motion.svg>
        </div>
      </div>
    </div>
  );
};

export default IntroPage;
