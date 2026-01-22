import React, { useState, useEffect } from 'react';
import HoloEarth from './components/HoloEarth';
import DesktopLayout from './components/DesktopLayout';
import MobileLayout from './components/MobileLayout';
import { ArrowRight } from 'lucide-react';

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};

const TimeSync = ({ isMobile }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });

  const dateString = time.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });

  return (
    <div className={`${isMobile ? 'text-left' : 'text-center'} whitespace-nowrap`}>
      <div className={`tracking-widest ${isMobile ? 'text-xs' : 'text-sm'}`} style={{color: 'rgba(21, 179, 21, 0.8)', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif"}}>TIME SYNC // {dateString} // {timeString}</div>
    </div>
  );
};

const App = () => {
  const [mounted, setMounted] = useState(false);
  const [viewState, setViewState] = useState('orbital'); // 'orbital' | 'transition' | 'system'
  const [currentSlide, setCurrentSlide] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Slideshow auto-advance
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(slideInterval);
  }, []);

  const handleInitialize = () => {
    setViewState('transition');
    // Wait for explosion animation (3s) then show content
    setTimeout(() => {
      setViewState('system');
    }, 3000);
  };

  const handleReset = () => {
    setViewState('orbital');
  };

  const isOrbital = viewState === 'orbital';
  const isSystem = viewState === 'system';
  // If we are in 'transition' or 'system', the earth is exploding/exploded.
  const isExploding = viewState !== 'orbital'; 

  return (
    <main className="relative w-screen h-screen overflow-hidden font-figtree" style={{color: '#FFFEF0'}}>
      {/* --- Background Elements --- */}
      <div className="absolute inset-0 z-0" style={{background: 'transparent'}} />
      
      {/* --- Grid Background --- */}
      <div 
        className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isExploding ? 'opacity-0' : 'opacity-40'}`}
        style={{
          backgroundImage: `
            linear-gradient(rgba(147, 51, 234, 0.15) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(147, 51, 234, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(circle at center, black 0%, transparent 85%)'
        }}
      />
      
      <div className={`absolute bottom-0 w-full h-1/2 bg-[linear-gradient(to_bottom,transparent_0%,rgba(83,26,109,0.1)_100%)] z-0 pointer-events-none transition-opacity duration-1000 ${isSystem ? 'opacity-0' : 'opacity-100'}`} />
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0 pointer-events-none mix-blend-overlay" />

      {/* --- Main 3D Scene --- */}
      <div className="absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-1000">
        <HoloEarth 
          className="w-full h-full" 
          exploding={isExploding}
          isMobile={isMobile}
        />
      </div>

      {/* --- Overlay UI Layer --- */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {/* Header HUD - Flies up on transition */}
        <header 
          className={`absolute top-0 left-0 w-full flex ${isMobile ? 'justify-start' : 'justify-between'} ${isMobile ? 'items-start' : 'items-center'} pointer-events-auto transition-all duration-1000 ease-in-out`}
          style={{
            transform: isExploding ? 'translateY(-9.375rem) scale(0.95)' : 'translateY(0) scale(1)',
            opacity: isExploding ? 0 : 1,
            padding: isMobile ? '0.75rem' : '1.5rem',
            marginLeft: isMobile ? '-0.6rem' : '0'
          }}
        >
          <div className="flex items-center" style={{gap: isMobile ? '0rem' : '1rem', transform: isMobile ? 'translateY(calc(-1 * 0.75rem))' : 'none'}}>
            <img src="images/landingpage/logo.png" alt="Delta" className="w-full h-full" style={{width: isMobile ? 'clamp(3.3rem, 20vw, 24rem)' : '5rem', height: isMobile ? 'clamp(3.3rem, 20vw, 24rem)' : '5rem'}} />
            <div>
              <h1 className="font-bold tracking-[0.2em]" style={{
                color: '#FFFEF0',
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontSize: isMobile ? 'clamp(0.9rem, 5.5vw, 2.2rem)' : '1.5rem',
                lineHeight: '1.1'
              }}>
                DELTA<span style={{color: '#f59e0b'}}>WERKEN</span>
              </h1>
              <div className="flex gap-2 items-center">
                <span className="rounded-full bg-green-500 animate-ping" style={{
                  width: isMobile ? 'clamp(0.3rem, 0.5vw, 0.5rem)' : '0.5rem',
                  height: isMobile ? 'clamp(0.3rem, 0.5vw, 0.5rem)' : '0.5rem',
                  minWidth: isMobile ? 'clamp(0.3rem, 0.5vw, 0.5rem)' : '0.5rem',
                  minHeight: isMobile ? 'clamp(0.3rem, 0.5vw, 0.5rem)' : '0.5rem'
                }}></span>
                <span className="text-gray-400 tracking-widest" style={{
                  fontSize: isMobile ? 'clamp(0.5rem, 2vw, 1rem)' : '0.75rem'
                }}>SYSTEM ONLINE // V.4.9</span>
              </div>
            </div>
          </div>
          
          {!isMobile && <TimeSync isMobile={isMobile} />}
        </header>
        
        {/* Mobile TimeSync - Left sidebar */}
        {isMobile && (
          <div className="absolute pointer-events-auto" style={{
            left: 'clamp(0.5rem, 3vw, 6.5rem)',
            top: 'clamp(2rem, 12vh, 4rem)',
            maxWidth: '85%',
            overflow: 'visible',
            whiteSpace: 'nowrap',
            transform: 'scale(clamp(0.4, 1.6vw, 1.2))',
            transformOrigin: 'top left'
          }}>
            <TimeSync isMobile={isMobile} />
          </div>
        )}

        {/* --- Central Initialize Button (Orbital View Only) --- */}
        <div 
          className={`
            absolute left-0 right-0 flex justify-center
            transition-all duration-500 ease-in-out z-50
            ${isOrbital ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-150 pointer-events-none'}
          `}
          style={{
            bottom: isMobile ? 'clamp(11.5rem, 34.5vh, 19.5rem)' : '20%'
          }}
        >
          <button 
            onClick={handleInitialize}
            className="group relative flex items-center justify-center gap-2 bg-black/40 backdrop-blur-md rounded-sm transition-all duration-300"
            style={{
              border: '1px solid rgba(21, 179, 21, 0.4)',
              padding: isMobile ? 'clamp(0.4rem, 2.5vw, 1.2rem) clamp(0.8rem, 4.5vw, 2.8rem)' : '0.625rem 2rem',
              fontSize: isMobile ? 'clamp(0.8rem, 3.5vw, 1.8rem)' : '1rem',
              gap: isMobile ? 'clamp(0.4rem, 1.8vw, 1.2rem)' : '0.5rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(21, 179, 21, 0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(21, 179, 21, 0.4)'}
          >
            <div className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{backgroundColor: 'rgba(245, 158, 11, 0.1)'}}></div>
            <span className="tracking-[0.25em] font-bold transition-colors" style={{color: 'white', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif"}}>SYNCHRONISEREN</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" style={{
              color: '#f59e0b',
              width: isMobile ? 'clamp(0.9rem, 4.5vw, 1.8rem)' : '1rem',
              height: isMobile ? 'clamp(0.9rem, 4.5vw, 1.8rem)' : '1rem'
            }} />
            
            {/* Button Decorations */}
            <div className="absolute top-0 left-0 border-t border-l" style={{
              width: isMobile ? 'clamp(0.4rem, 1.2vw, 0.9rem)' : '0.5rem',
              height: isMobile ? 'clamp(0.4rem, 1.2vw, 0.9rem)' : '0.5rem',
              borderColor: 'rgba(21, 179, 21, 0.4)'
            }}></div>
            <div className="absolute bottom-0 right-0 border-b border-r" style={{
              width: isMobile ? 'clamp(0.4rem, 1.2vw, 0.9rem)' : '0.5rem',
              height: isMobile ? 'clamp(0.4rem, 1.2vw, 0.9rem)' : '0.5rem',
              borderColor: 'rgba(21, 179, 21, 0.4)'
            }}></div>
          </button>
        </div>

        {/* --- Floating Containers (Orbital View) --- */}
        {/* Desktop Layout */}
        {!isMobile && (
          <DesktopLayout 
            isExploding={isExploding} 
            mounted={mounted} 
            currentSlide={currentSlide} 
            setCurrentSlide={setCurrentSlide} 
          />
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <MobileLayout 
            isExploding={isExploding} 
            mounted={mounted} 
            currentSlide={currentSlide} 
            setCurrentSlide={setCurrentSlide} 
          />
        )}

        {/* --- SYSTEM INNER CONTENT (Shown after Zoom) --- */}
        <div 
           className={`
             absolute inset-0 flex items-center justify-center pointer-events-none
             transition-all duration-1000 delay-500
             ${isSystem ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
           `}
        >
           <div className={`w-[80vw] h-[80vh] flex flex-col items-center justify-center pointer-events-auto ${isSystem ? 'pointer-events-auto' : 'pointer-events-none'}`}>
              
              {/* Back Button - Redesigned */}
              <button 
                onClick={handleReset}
                className={`absolute group flex items-center gap-3 rounded-sm transition-all duration-300 backdrop-blur-sm ${isMobile ? 'top-4 left-4 px-3 py-1.5' : 'top-8 left-8 px-4 py-2'}`}
                style={{
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  background: 'rgba(10, 5, 16, 0.6)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
                  e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                  e.currentTarget.style.background = 'rgba(10, 5, 16, 0.6)';
                }}
              >
                <div className={`flex items-center justify-center ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} style={{color: 'rgba(147, 51, 234, 0.8)'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`group-hover:-translate-x-1 transition-transform ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`}>
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </div>
                <span className={`tracking-[0.2em] uppercase ${isMobile ? 'text-[10px]' : 'text-xs'}`} style={{color: 'rgba(255, 254, 240, 0.7)', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif"}}>ORBIT</span>
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{borderColor: 'rgba(147, 51, 234, 0.5)'}}></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{borderColor: 'rgba(147, 51, 234, 0.5)'}}></div>
              </button>

           </div>
        </div>

      </div>

      {/* --- Footer / Deco --- */}
      <div className={`absolute z-30 select-none transition-opacity duration-500 tracking-widest ${isSystem ? 'opacity-0' : 'opacity-100'}`} style={{
        bottom: '0.5rem',
        left: isMobile ? '0.75rem' : '1.5rem',
        fontSize: isMobile ? '0.625rem' : '0.875rem',
        color: 'rgba(255, 254, 240, 0.2)',
        fontFamily: "'Figtree', sans-serif"
      }}>
        {isMobile ? 'COORD: 13.41° N, 103.87° E' : 'COORD: 13.412469° N, 103.866986° E'}
      </div>
    </main>
  );
};

export default App;
