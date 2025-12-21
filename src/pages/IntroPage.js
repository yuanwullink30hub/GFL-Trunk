import React from 'react';
import { useNavigate } from 'react-router-dom';
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
        className="absolute top-6 right-6 flex items-center gap-2 p-2 hover:opacity-80 transition-opacity duration-300"
        title="Go to login"
      >
        <span className="text-sm md:text-base font-medium">aanmelden</span>
        <img src={sun2} alt="Login" style={{ width: '40px', height: '40px' }} />
      </button>

      {/* Content Container */}
      <div className="w-full max-w-2xl px-6 text-center">
        {/* Header */}
        <h1 className="poetry text-2xl md:text-3xl mb-8">
          GEBASEERD OP HET WARE LEVEN!
        </h1>

        {/* Text Container */}
        <div className={`mb-12 space-y-4 ${darkMode ? 'text-white/80' : 'text-[#26163e]/80'}`}>
          <p className="text-base md:text-xl leading-relaxed">
            De externe terugknop is uitgeschakeld. <br/> Bij ons dus alleen voorwaartse beweging.  <br/>  Gebruik de interne software om te navigeren.

        
          </p>
          <p className="text-base md:text-lg leading-relaxed">
           Wij nemen volledige verantwoordelijkheid voor onze content en verzekeren dat de tijd die je hier spendeert waardevol is.
          </p>
        </div>

        {/* Enter Button */}
        <button
          onClick={handleEnterSite}
          className="poetry px-8 py-3 md:px-10 md:py-4 text-lg md:text-xl font-semibold rounded-lg border-2 active:scale-95"
          style={{
            animation: 'breathColor 4s ease-in-out infinite, breathBorder 4s ease-in-out infinite, pulsate 4s ease-in-out infinite'
          }}
        >
          DEAL
        </button>
      </div>
    </div>
  );
};

export default IntroPage;
