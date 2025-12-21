import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/poetry.css';
import '../styles/buttons.css';
import sun2 from '../images/sun2.PNG';
import dealButton from '../images/Dealbuttonpng.png';

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

        {/* New Button */}
        <button
          onClick={handleEnterSite}
          className="poetry active:scale-95"
          style={{
            animation: 'breathColor 4s ease-in-out infinite, breathBorder 4s ease-in-out infinite, pulsate 4s ease-in-out infinite',
            border: '2px solid',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
            width: 'clamp(120px, 24vw, 360px)',
            height: 'clamp(60px, 12vw, 180px)',
            marginTop: 'calc(20px - 3rem)'
          }}
        >
          <img src={dealButton} alt="Deal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </button>
      </div>
    </div>
  );
};

export default IntroPage;
