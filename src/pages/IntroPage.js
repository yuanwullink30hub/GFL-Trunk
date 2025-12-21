import React from 'react';
import { useNavigate } from 'react-router-dom';

const IntroPage = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();

  const handleEnterSite = () => {
    navigate('/landing');
  };

  return (
    <div className={`w-full h-screen overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ${
      darkMode 
        ? 'bg-[#26163e] text-white'
        : 'bg-[#f5f5f5] text-[#26163e]'
    }`}>
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 p-2 rounded-full transition-all duration-300 ${
          darkMode
            ? 'bg-white/10 hover:bg-white/20'
            : 'bg-black/10 hover:bg-black/20'
        }`}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.828-2.828a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm.707 5.657a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707zM9 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      {/* Content Container */}
      <div className="w-full max-w-2xl px-6 text-center">
        {/* Header */}
        <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
          Garden For Life
        </h1>

        {/* Text Container */}
        <div className={`mb-12 space-y-4 ${darkMode ? 'text-white/80' : 'text-[#26163e]/80'}`}>
          <p className="text-lg md:text-xl leading-relaxed">
            Welcome to a curated collection of stories, experiences, and visions that celebrate the art of living authentically.
          </p>
          <p className="text-base md:text-lg leading-relaxed">
            Explore ventures born from passion, creativity, and a commitment to meaningful connections.
          </p>
        </div>

        {/* Enter Button */}
        <button
          onClick={handleEnterSite}
          className={`px-8 py-3 md:px-10 md:py-4 text-lg md:text-xl font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            darkMode
              ? 'bg-gradient-to-r from-orange-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/50'
              : 'bg-gradient-to-r from-orange-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/50'
          }`}
        >
          Enter Site
        </button>
      </div>
    </div>
  );
};

export default IntroPage;
