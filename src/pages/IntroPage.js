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
        ? 'bg-[#26163e] text-white'
        : 'bg-[#f5f5f5] text-[#26163e]'
    }`}>
      {/* Login Button */}
      <button
        onClick={() => window.location.href = '/login'}
        className="absolute right-6 flex items-center gap-2 p-2 hover:opacity-80 transition-opacity duration-300"
        style={{ top: 'calc(1.5rem + 0.4rem)' }}
        title="Go to login"
      >
        <span className="text-sm md:text-base font-medium" style={{ transform: 'translateY(0.3rem) translateX(0.6rem)' }}>aanmelden</span>
        <img src={sun2} alt="Login" style={{ width: '40px', height: '40px' }} />
      </button>

      {/* Content Container */}
      <div className="w-full max-w-2xl px-6 text-center" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {/* Header */}
        <h1 className="poetry text-2xl md:text-3xl mb-8">
          GEBASEERD OP HET WARE LEVEN!
        </h1>

        {/* Text Container */}
        <div className={`mb-12 space-y-4`}>
          <p className="text" style={{
            width: '100%',
            fontSize: 'clamp(14px, 3.5vw, 28px)',
            marginTop: '45px',
            marginBottom: '0',
            paddingBottom: '25px',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.4',
            backgroundColor: 'transparent'
          }}>
            De externe terugknop is uitgeschakeld. <br/> Bij ons dus alleen voorwaartse beweging. <br/> Gebruik de interne software om te navigeren.
          </p>
          <p className="text" style={{
            width: '100%',
            fontSize: 'clamp(14px, 3.5vw, 28px)',
            marginTop: '0',
            marginBottom: '0',
            paddingBottom: '25px',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.4',
            backgroundColor: 'transparent'
          }}>
           Wij nemen volledige verantwoordelijkheid voor onze content en verzekeren dat de tijd die je hier spendeert waardevol is.
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
              animation: 'breathColor 4s ease-in-out infinite, breathBorder 4s ease-in-out infinite, pulsate 4s ease-in-out infinite',
              border: '2px solid',
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
              rotate: { duration: 9, repeat: Infinity, ease: 'linear', delay: 0 },
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0 }
            }}
          >
            <path
              d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z"
              fill="rgba(0,0,0,0.001)"
              pointerEvents="all"
              onClick={handleEnterSite}
              style={{ cursor: 'pointer' }}
            />
            <motion.path
              d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
              animate={{ stroke: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
            />
          </motion.svg>

          {/* Square Button */}
          <button
            onClick={handleEnterSite}
            className="poetry active:scale-95"
            style={{
              position: 'absolute',
              animation: 'breathColor 4s ease-in-out infinite, breathBorder 4s ease-in-out infinite, pulsate 4s ease-in-out infinite',
              border: '2px solid',
              borderRadius: '0',
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
        </div>
      </div>
    </div>
  );
};

export default IntroPage;
