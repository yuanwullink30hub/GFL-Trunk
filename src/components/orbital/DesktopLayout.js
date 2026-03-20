import React, { useState, useEffect, useRef, useCallback } from 'react';
import TechContainer from './TechContainer';
import { Activity, Database, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SciFiButton } from '../assessment/dashboardStyles';

// Import garden logos
import karmanLogo from '../../images/slideshow images/karmaneventsPNG.png';
import code49Logo from '../../images/slideshow images/club49-logo.png';
import tattooshopLogo from '../../images/slideshow images/1111logo.png';
import rengiLogo from '../../images/slideshow images/Rengi-logo.png';
import eyeLogo from '../../images/Eyedentity.png';
import blackholeIcon from '../../images/Blackhole.png';

const DesktopLayout = ({ isExploding, mounted, currentSlide, setCurrentSlide, animationProgress = 0, gardenAnimationProgress, verbindingsAnimationProgress, setActiveSection, pauseAutoSlide }) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const { language, toggleLanguage, t } = useLanguage();
  
  // Section lock: on deployed (non-localhost) sites, sections stay locked regardless of passkey.
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const shouldShowLock = !isLocalhost;

  
  // Touch swipe state for Gardens slideshow
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const gardensDataLength = 5; // Total number of garden slides
  const prevSlideRef = useRef(null);
  
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    
    if (diff > swipeThreshold) {
      // Swiped left — forward only
      if (pauseAutoSlide) pauseAutoSlide();
      setCurrentSlide(prev => (prev + 1) % gardensDataLength);
    }
    
    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [setCurrentSlide, pauseAutoSlide]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track previous slide so exit animation always goes left
  useEffect(() => {
    prevSlideRef.current = currentSlide;
  });

  // Calculate animation values based on progress (0 = visible, 1 = fully hidden/flown away)
  // animationProgress goes from 0 to 1 as containers fly away
  // All values in vw/vh for consistent viewport scaling
  const containerOpacity = Math.max(0, 1 - animationProgress * 3.5); // Fades out faster
  
  // Data Stream starts 4 frames later but catches up to same end state
  // 4 frames delay out of ~34 frame range = ~0.118 offset, rescaled to 0-1
  const dataStreamDelay = 0.118;
  const dataStreamProgress = Math.max(0, Math.min(1, (animationProgress - dataStreamDelay) / (1 - dataStreamDelay)));
  const dataStreamOpacity = Math.max(0, 1 - dataStreamProgress * 3.5);
  
  // Gardens (bottomRight) starts 2 frames later
  // 2 frames delay out of ~34 frame range = ~0.059 offset, rescaled to 0-1
  const gardensDelay = 0.059;
  const gardensProgress = Math.max(0, Math.min(1, (animationProgress - gardensDelay) / (1 - gardensDelay)));
  const gardensOpacity = Math.max(0, 1 - gardensProgress * 3.5);
  
  // Each container flies in different direction (converted to vw/vh from 2560x1440 reference)
  // 250px @ 2560w = 9.77vw, 200px @ 1440h = 13.89vh
  const topLeftX = -9.77 * animationProgress * 1.5;      // vw - faster exit
  const topLeftY = -13.89 * animationProgress * 1.5;     // vh
  const bottomRightX = 9.77 * gardensProgress * 1.5;     // vw - Gardens uses delayed progress
  const bottomRightY = 13.89 * gardensProgress * 1.5;    // vh - Gardens uses delayed progress
  
  // Verbindings (bottomCenter): uses progress that starts 1 frame earlier
  const verbProg = verbindingsAnimationProgress != null ? verbindingsAnimationProgress : animationProgress;
  const bottomCenterY = 17.36 * verbProg * 1.5; // vh - faster exit (250px @ 1440h)
  const verbindingsOpacity = Math.max(0, 1 - verbProg * 3.5);
  const verbindingsScale = 1 - (0.35 * verbProg);
  
  // Data Stream flies with its own delayed progress
  const dataStreamX = -9.77 * dataStreamProgress * 1.5;
  const dataStreamY = 13.89 * dataStreamProgress * 1.5;
  const dataStreamScale = 1 - (0.35 * dataStreamProgress);
  
  // Gardens flies with its own delayed progress
  const gardensScale = 1 - (0.35 * gardensProgress);
  
  const containerScale = 1 - (0.35 * animationProgress); // Shrink faster too
  
  // gardenforlife.nl container: uses delayed progress (2 frames later)
  const gardenProg = gardenAnimationProgress != null ? gardenAnimationProgress : animationProgress;
  const gardenOpacity = Math.max(0, 1 - gardenProg * 3.5);
  const gardenTopRightX = 9.77 * gardenProg * 1.5;
  const gardenTopRightY = -13.89 * gardenProg * 1.5;
  const gardenScale = 1 - (0.35 * gardenProg);

  // Language toggle element for TechContainer headerRight
  const langToggle = (
    <button
      onClick={toggleLanguage}
      style={{
        backgroundColor: 'transparent',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '4px',
        cursor: 'pointer',
        padding: '2px 6px',
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        transition: 'all 0.3s ease',
        filter: 'drop-shadow(0 0 0px rgba(139,90,43,0))'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(139,90,43,0.6))'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(139,90,43,0))'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
    >
      <span style={{ fontSize: 'max(9px, 0.5vw)', color: language === 'nl' ? '#f97316' : 'rgba(255,255,255,0.4)', fontWeight: language === 'nl' ? 'bold' : 'normal', transition: 'all 0.3s ease' }}>NL</span>
      <span style={{ fontSize: 'max(7px, 0.4vw)', color: 'rgba(255,255,255,0.3)' }}>|</span>
      <span style={{ fontSize: 'max(9px, 0.5vw)', color: language === 'en' ? '#f97316' : 'rgba(255,255,255,0.4)', fontWeight: language === 'en' ? 'bold' : 'normal', transition: 'all 0.3s ease' }}>EN</span>
    </button>
  );

  return (
    <>
      <style>{`
        .gfl-eye-btn { position: relative; }
        .gfl-eye-btn::before {
          content: 'Identiteit';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          color: rgba(255, 220, 160, 0);
          white-space: nowrap;
          pointer-events: none;
          font-weight: bold;
          letter-spacing: 0.05em;
          transition: color 0.3s ease;
          margin-bottom: 2px;
        }
        .gfl-eye-btn:hover::before { color: rgba(255, 220, 160, 0.9); }
        .gfl-blackhole-btn { position: relative; }
        .gfl-blackhole-btn::before {
          content: 'Inloggen';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          color: rgba(255, 220, 160, 0);
          white-space: nowrap;
          pointer-events: none;
          font-weight: bold;
          letter-spacing: 0.05em;
          transition: color 0.3s ease;
          margin-bottom: 2px;
        }
        .gfl-blackhole-btn:hover::before { color: rgba(255, 220, 160, 0.9); }
      `}</style>
      {/* 1. Top Left - Filosofie */}
      <div 
        className="absolute pointer-events-auto"
        style={{
          top: windowWidth >= 768 && windowWidth < 1024 ? 'calc(15vh + 2.5rem - 2rem)' : windowWidth >= 1024 ? 'calc(15vh + 0.5rem + 0.5rem)' : 'calc(15vh + 2.5rem)',
          left: windowWidth >= 768 && windowWidth < 1024 ? 'calc(4.06vw - 1.5rem)' : 'calc(4.06vw - 2.5rem)',
          minHeight: '32.5vh',
          width: '26vw',
          transform: `translate(${topLeftX}vw, ${topLeftY}vh) scale(${containerScale})`,
          opacity: mounted ? containerOpacity : 0
        }}
      >
        <TechContainer title="FILOSOFIE" variant="purple" className="w-full h-full" style={{ backgroundColor: 'rgba(1, 0, 2, 0.3)' }}>
          <div className="w-full h-full flex flex-col items-center justify-between relative" style={{ padding: '0.8vw' }}>
            {/* Content wrapper */}
            <div style={{ display: 'contents' }}>
            {/* Header */}
            <div className="flex flex-col items-center w-full" style={{ gap: '0.4vw' }}>
              <h2 style={{
                fontSize: 'max(15px, 1.084vw)',
                color: 'rgb(196, 181, 253)',
                margin: 0,
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontWeight: 600,
                lineHeight: 0.9,
                filter: 'brightness(0.9)',
                textAlign: 'center',
                letterSpacing: '0.05em'
              }}>
                DE LUIDE STILTE <br/> EN DE INTENSE KALMTE <br/> WIJZEN MIJ DE WEG <br/> VAN HET HART <br/> NAAR HET HOOFD
              </h2>
              <div style={{ width: '2vw', height: '0.1vh', background: 'linear-gradient(to right, transparent, rgb(168, 85, 247), transparent)' }}></div>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center justify-center flex-1" style={{ gap: '0.8vw' }}>
              <Activity style={{ width: '5vw', height: '5vw', color: 'rgb(192, 132, 252)' }} />
              <div style={{ height: '0.1vh', width: '50%', backgroundColor: 'rgba(88, 28, 135, 0.5)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '33%', backgroundColor: 'rgb(192, 132, 252)' }} className="animate-pulse"></div>
              </div>
              {/* Hide secondary text on tablet sizes (768px-1024px) */}
              <div style={{
                fontFamily: "'Figtree', sans-serif",
                fontWeight: 400,
                lineHeight: 1.5,
                color: '#FFFEF0',
                fontSize: 'max(13px, 0.7vw)',
                textAlign: 'center',
                display: windowWidth >= 768 && windowWidth < 1024 ? 'none' : 'block'
              }}>
                Man en Vrouw gelijkgesteld <br/> De tuinierder moet zich overgeven aan en overkomen van de doorschijnende passie <br />
              </div>
            </div>

            {/* Button */}
            <SciFiButton
              variant="purple"
              size="sm"
              disabled={shouldShowLock}
              onClick={shouldShowLock ? undefined : (e) => setActiveSection('filosofie', e)}
              style={{ transform: 'scaleY(1.04)', marginTop: '0.4rem' }}
            >
              Leer meer
            </SciFiButton>
            </div>{/* end content wrapper */}
          </div>
        </TechContainer>
      </div>


      {/* 3. Top Right - Garden For Life Website */}
      <div 
        className="absolute pointer-events-auto"
        style={{
          top: '12.09vh',
          right: windowWidth >= 768 && windowWidth < 1024 ? 'calc(3.7vw + 2rem)' : windowWidth >= 1024 ? 'calc(3.7vw + 1.5rem + 1rem + 3rem)' : '3.7vw',
          width: '19.01vw',
          height: '21.13vh',
          transform: `translate(${gardenTopRightX}vw, ${gardenTopRightY}vh) scale(${gardenScale})`,
          opacity: mounted ? gardenOpacity : 0
        }}
      >
        <TechContainer title="GARDENFORLIFE.NL" variant="purple" className="w-full h-full">
          <div className="w-full h-full flex flex-col items-center justify-center gap-0 relative overflow-visible">
            {/* Blurred webpage background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-sm" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34, 197, 94, 0.1) 2px, rgba(34, 197, 94, 0.1) 4px)'}}></div>
            
            {/* Decorative lines to simulate webpage content */}
            <div className="absolute inset-0 flex flex-col justify-start opacity-40" style={{ paddingTop: '0.8vw', paddingLeft: '0.5vw', paddingRight: '0.5vw', gap: '0.4vw' }}>
              <div style={{ height: '0.2vw', backgroundColor: 'rgba(22, 163, 74, 0.4)', borderRadius: '2px', width: '75%' }}></div>
              <div style={{ height: '0.1vw', backgroundColor: 'rgba(34, 197, 94, 0.3)', borderRadius: '2px', width: '50%' }}></div>
              <div style={{ height: '0.1vw', backgroundColor: 'rgba(34, 197, 94, 0.3)', borderRadius: '2px', width: '66%' }}></div>
            </div>
            
            {/* Lock Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
              <div className="flex flex-col items-center" style={{ gap: '0.5vw' }}>
                <Lock style={{ width: '1.5vw', height: '1.5vw', color: '#f59e0b' }} strokeWidth={1.5} />
                <span style={{
                  fontFamily: "'Figtree', sans-serif",
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: 'rgba(245, 158, 11, 0.8)',
                  fontSize: 'max(9px, 0.5vw)',
                  letterSpacing: '0.05em'
                }}>{t('desktopLayout.locked')}</span>
              </div>
            </div>
          </div>
        </TechContainer>
      </div>

      {/* 4. Center Right/Bottom - Gardens Slideshow */}
      <div 
        className="absolute pointer-events-auto"
        style={{
          bottom: '15vh',
          right: '3.56vw',
          width: '22.88vw',
          height: windowWidth >= 768 && windowWidth < 1024 ? 'calc(29.5vh * 1.3)' : 'calc(39vh * 1.2)',
          transform: `translate(${bottomRightX}vw, ${bottomRightY}vh) scale(${gardensScale})`,
          opacity: mounted ? gardensOpacity : 0
        }}
      >
        <TechContainer title="GARDENS" variant="purple" className="w-full h-full">
          {(() => {
            const gardensData = [
              {
                id: 'green',
                name: 'ARTIEST',
                description: 'Verbinden met ons platform? Maak de test en benader ons team.',
                color: '#22c55e',
                rgb: '34, 197, 94',
              },
              {
                id: 'blue',
                name: 'ZZP',
                description: 'Verbinden met ons platform? Maak de test en benader ons team.',
                color: '#3b82f6',
                rgb: '59, 130, 246',
              },
              {
                id: 'purple',
                name: 'EENMANSZAAK',
                description: 'Verbinden met ons platform? Maak de test en benader ons team.',
                color: '#a855f7',
                rgb: '168, 85, 247',
              },
              {
                id: 'red',
                name: 'BV',
                description: 'Verbinden met ons platform? Maak de test en benader ons team.',
                color: '#ef4444',
                rgb: '239, 68, 68',
              },
              {
                id: 'orange',
                name: 'INTERNATIONAL',
                description: 'Verbinden met ons platform? Maak de test en benader ons team.',
                color: '#f97316',
                rgb: '249, 115, 22',
              },
            ];
            return (
              <div className="w-full h-full flex flex-col items-center justify-between relative" style={{ padding: '1vw' }}>
                {/* Slideshow Area - Touch swipable */}
                <div 
                  className="w-full relative overflow-hidden rounded-sm border border-purple-500/20" 
                  style={{ 
                    height: 'calc(100% - 2.5vw)', 
                    marginBottom: '0.5vw',
                    touchAction: 'pan-y',
                    visibility: 'visible',
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {gardensData.map((garden, i) => {
                    // Always-right infinite: active=0, previous=−100 (exits left), rest=+100 (wait right)
                    let translateX = 100;
                    if (i === currentSlide) translateX = 0;
                    else if (i === prevSlideRef.current) translateX = -100;
                    return (
                      <div
                        key={garden.id}
                        className={`absolute inset-0 transition-all duration-500 ${i === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0'}`}
                        style={{ transform: `translateX(${translateX}%)` }}
                      >
                        {/* Circle placeholder (logo area) */}
                        <div className="w-full flex flex-col items-center justify-center" style={{
                          height: windowWidth >= 1024 ? '70%' : '70%'
                        }}>
                          <div style={{
                            width: 'max(52px, 5.5vw)',
                            height: 'max(52px, 5.5vw)',
                            borderRadius: '50%',
                            border: `1px solid rgba(${garden.rgb}, 0.5)`,
                            background: `rgba(${garden.rgb}, 0.12)`,
                            boxShadow: `0 0 16px rgba(${garden.rgb}, 0.25)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.5vw',
                          }}>
                            <span style={{
                              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                              fontSize: 'max(7px, 0.38vw)',
                              color: `rgba(${garden.rgb}, 0.6)`,
                              letterSpacing: '0.12em',
                              fontWeight: 700,
                            }}>LOGO</span>
                          </div>
                        </div>

                        {/* Header */}
                        <div className="text-center absolute" style={{
                          top: windowWidth >= 1280 ? '70%' : 'auto',
                          bottom: windowWidth >= 1024 && windowWidth < 1280 ? '6.5vw' : windowWidth >= 768 && windowWidth < 1024 ? '-0.5vw' : 'auto',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          paddingBottom: '0.4vw',
                          marginTop: windowWidth >= 1280 ? '-2rem' : '0',
                          zIndex: 10,
                          display: windowWidth < 768 ? 'none' : 'block'
                        }}>
                          <div style={{
                            fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                            fontWeight: 700,
                            fontSize: 'max(11px, 0.62vw)',
                            color: garden.color,
                            letterSpacing: '0.15em',
                            marginBottom: '0.2vw',
                            whiteSpace: windowWidth >= 1024 ? 'nowrap' : 'normal',
                            maxWidth: windowWidth < 1024 ? '90%' : 'none',
                            textAlign: 'center',
                            opacity: 0.85,
                          }}>
                            {garden.name}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col items-center justify-center relative w-full" style={{
                          height: '30%',
                          padding: '0.4vw 0.8vw',
                          display: windowWidth >= 1024 ? 'flex' : 'none',
                          backgroundColor: 'transparent',
                          borderRadius: '0.2vw'
                        }}>
                          <span style={{
                            fontFamily: "'Figtree', sans-serif",
                            fontWeight: 400,
                            lineHeight: 1.5,
                            color: '#FFFEF0',
                            fontSize: 'max(13px, 0.7vw)',
                            textAlign: 'center',
                            padding: 0,
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {garden.description}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Circle Indicators with Arrow Navigation */}
                <div className="flex justify-center items-center relative" style={{ gap: '0.8vw', zIndex: 100, position: 'relative', visibility: 'visible' }}>
                  {/* Left Arrow */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (pauseAutoSlide) pauseAutoSlide();
                      setCurrentSlide(prev => (prev - 1 + gardensData.length) % gardensData.length);
                    }}
                    className="rounded transition-colors border border-purple-500 bg-transparent hover:border-purple-400 cursor-pointer z-50"
                    style={{ padding: '0.2vw' }}
                    title="Previous slide"
                  >
                    <ChevronLeft style={{ width: '1vw', height: '1vw', color: 'rgb(192, 132, 252)' }} className="pointer-events-none" />
                  </button>
                  
                  {/* Left Indicators */}
                  <div className="flex items-center" style={{ gap: '0.4vw' }}>
                    {gardensData.slice(0, 2).map((garden, i) => (
                      <div
                        key={garden.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pauseAutoSlide) pauseAutoSlide();
                          setCurrentSlide(i);
                        }}
                        className="cursor-pointer transition-all duration-300 z-50"
                        style={{
                          height: '0.15vw',
                          width: '0.5vw',
                          backgroundColor: i === currentSlide ? 'rgb(192, 132, 252)' : 'rgba(168, 85, 247, 0.3)'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Learn More Button */}
                  <SciFiButton
                    type="button"
                    color="#fbbf24"
                    rgb="245, 158, 11"
                    size="sm"
                    onClick={(e) => setActiveSection('gardens', e)}
                    style={{ position: 'relative', zIndex: 100, transform: 'scaleY(1.04)' }}
                  >
                    Zie meer
                  </SciFiButton>
                  
                  {/* Right Indicators (only 2 — total 4 shown, hint there's more) */}
                  <div className="flex items-center" style={{ gap: '0.4vw' }}>
                    {gardensData.slice(2, 4).map((garden, i) => (
                      <div
                        key={garden.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pauseAutoSlide) pauseAutoSlide();
                          setCurrentSlide(i + 2);
                        }}
                        className="cursor-pointer transition-all duration-300 z-50"
                        style={{
                          height: '0.15vw',
                          width: '0.5vw',
                          backgroundColor: i + 2 === currentSlide ? 'rgb(192, 132, 252)' : 'rgba(168, 85, 247, 0.3)'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Right Arrow */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (pauseAutoSlide) pauseAutoSlide();
                      setCurrentSlide(prev => (prev + 1) % gardensData.length);
                    }}
                    className="rounded transition-colors border border-purple-500 bg-transparent hover:border-purple-400 cursor-pointer z-50"
                    style={{ padding: '0.2vw' }}
                    title="Next slide"
                  >
                    <ChevronRight style={{ width: '1vw', height: '1vw', color: 'rgb(192, 132, 252)' }} className="pointer-events-none" />
                  </button>
                </div>
              </div>
            );
          })()} 
        </TechContainer>
      </div>

      {/* 4. Bottom Left - Data Stream */}
      <div 
        className="absolute pointer-events-auto"
        style={{
          bottom: windowWidth >= 768 && windowWidth < 1024 
            ? 'calc(6vh + 8rem - 2rem)' 
            : windowWidth >= 1024
            ? 'calc(6vh + 8rem - 4rem)'
            : 'calc(6vh + 8rem)',
          left: windowWidth >= 768 && windowWidth < 1024 
            ? 'calc(7.5vw + 4.5rem - 4rem - 3rem)' 
            : 'calc(7.5vw + 4.5rem)',
          height: 'auto',
          maxHeight: '18vh',
          transform: `translate(${dataStreamX}vw, ${dataStreamY}vh) scale(${dataStreamScale})`,
          opacity: mounted ? dataStreamOpacity : 0,
          zIndex: 30
        }}
      >
        <TechContainer title="DATA_STREAM" variant="cyan" className="w-full h-full">
          <div className="w-full h-full flex flex-col items-center justify-between relative" style={{ padding: '0.8vw' }}>
            {/* Content wrapper */}
            <div style={{ display: 'contents' }}>
            {/* Header */}
            <div className="flex flex-col items-center w-full" style={{ gap: '0.4vw' }}>
              <h2 style={{
                fontSize: 'max(13px, 0.7vw)',
                color: 'rgb(165, 243, 252)',
                margin: 0,
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontWeight: 600,
                lineHeight: 0.9,
                filter: 'brightness(0.9)',
                textAlign: 'center',
                letterSpacing: '0.05em'
              }}>
                {t('desktopLayout.liveFeed')}
              </h2>
              <div style={{ width: '2vw', height: '0.1vh', background: 'linear-gradient(to right, transparent, rgb(34, 211, 238), transparent)' }}></div>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center justify-center flex-1" style={{ gap: '0.8vw' }}>
              <Database style={{ width: '2vw', height: '2vw', color: 'rgb(165, 243, 252)' }} />
              <div style={{ height: '0.1vh', width: '50%', backgroundColor: 'rgba(34, 211, 238, 0.3)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '60%', backgroundColor: 'rgb(165, 243, 252)' }} className="animate-pulse"></div>
              </div>
              <div style={{
                fontFamily: "'Figtree', sans-serif",
                fontWeight: 400,
                lineHeight: 1.5,
                color: '#FFFEF0',
                fontSize: 'max(13px, 0.7vw)',
                textAlign: 'center'
              }}>
                <span dangerouslySetInnerHTML={{ __html: t('desktopLayout.dataStreamDescription') }} />
              </div>
            </div>

            {/* Button */}
            <SciFiButton
              color="#a5f3fc"
              rgb="34, 211, 238"
              size="sm"
              disabled={shouldShowLock}
              style={{ position: 'relative', zIndex: 100, transform: 'scaleY(1.04)', marginTop: '0.4rem' }}
              onClick={shouldShowLock ? undefined : (e) => setActiveSection('monitor', e)}
            >
              onderzoek
            </SciFiButton>
            </div>{/* end content wrapper */}
          </div>
        </TechContainer>
      </div>

      {/* 5. Center Bottom - Status Strip */}
      <div 
        className="absolute left-0 right-0 flex justify-center pointer-events-none"
        style={{
          bottom: '5vh',
          transform: `translateY(${bottomCenterY}vh) scale(${verbindingsScale})`,
          opacity: mounted ? verbindingsOpacity : 0
        }}
      >
        {/* Desktop Build - 1325px+ */}
        {windowWidth >= 1325 && (
          <div style={{ width: '30vw', position: 'relative', zIndex: 10, transform: 'translateY(2rem)' }} className="pointer-events-auto">
            <TechContainer title="VERBINDINGS_MENU" variant="purple" className="w-full h-full" style={{ height: '14.95vh' }} headerRight={langToggle}>
              <div className="w-full h-full flex items-center justify-around opacity-90 relative" style={{ padding: '0 1vw' }}>
                {/* Left: Logo - Button */}
                <button
                  className="gfl-eye-btn"
                  onClick={(e) => setActiveSection('menu', e)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    padding: 0,
                    filter: 'drop-shadow(0 0 0px rgba(139,90,43,0))',
                    opacity: 1
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(139,90,43,0.8))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(139,90,43,0))'; }}
                >
                  <img src={eyeLogo} alt="Logo" style={{ width: 'max(55px, 3vw)', height: 'auto' }} />
                </button>
                <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                {/* Center: Contact Info */}
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span style={{ fontSize: 'max(13px, 0.7vw)', color: 'white', fontWeight: 'bold' }}>yuanwullink30@gfl.community</span>
                  <span style={{ fontSize: 'max(13px, 0.7vw)', color: 'white', fontWeight: 'bold' }}>Zutphen, NL</span>
                </div>
                <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                {/* Right: Login Button */}
                <div className="flex flex-col items-center justify-center gap-1" style={{ overflow: 'visible' }}>
                  <button
                    className="gfl-blackhole-btn"
                    onClick={(e) => setActiveSection('login', e)}
                    style={{
                    padding: '0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 0 0px rgba(255,200,100,0))'
                  }} onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(255,200,100,0.6))';
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(255,200,100,0))';
                  }}>
                    <img src={blackholeIcon} alt="Login" style={{ width: 'max(70px, 4.1vw)', height: 'auto' }} />
                  </button>
                </div>
              </div>
            </TechContainer>
          </div>
        )}

        {/* Laptop Build - 1100px to 1324px */}
        {windowWidth >= 1100 && windowWidth < 1325 && (
          <div style={{ width: '30vw', position: 'relative', zIndex: 10, transform: 'translateY(0.9rem)' }} className="pointer-events-auto">
            <TechContainer title="VERBINDINGS_MENU" variant="purple" className="w-full h-full" style={{ height: '17.94vh' }} headerRight={langToggle}>
              <div className="w-full h-full flex items-center justify-around opacity-90 relative" style={{ padding: '0 1vw' }}>
                {/* Left: Logo - Button */}
                <button
                  className="gfl-eye-btn"
                  onClick={(e) => setActiveSection('menu', e)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    padding: 0,
                    filter: 'drop-shadow(0 0 0px rgba(139,90,43,0))',
                    opacity: 1
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(139,90,43,0.8))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(139,90,43,0))'; }}
                >
                  <img src={eyeLogo} alt="Logo" style={{ width: 'max(55px, 3vw)', height: 'auto' }} />
                </button>
                <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                {/* Center: Contact Info */}
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span style={{ fontSize: 'max(13px, 0.7vw)', color: 'white', fontWeight: 'bold' }}>yuanwullink30@gfl.community</span>
                  <span style={{ fontSize: 'max(13px, 0.7vw)', color: 'white', fontWeight: 'bold' }}>Zutphen, NL</span>
                </div>
                <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                {/* Right: Login Button */}
                <div className="flex flex-col items-center justify-center gap-1" style={{ overflow: 'visible' }}>
                  <button
                    className="gfl-blackhole-btn"
                    onClick={(e) => setActiveSection('login', e)}
                    style={{
                    padding: '0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 0 0px rgba(255,200,100,0))'
                  }} onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(255,200,100,0.6))';
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(255,200,100,0))';
                  }}>
                    <img src={blackholeIcon} alt="Login" style={{ width: 'max(70px, 4.1vw)', height: 'auto' }} />
                  </button>
                </div>
              </div>
            </TechContainer>
          </div>
        )}

        {/* Tablet Build - 768px to 1099px */}
        {windowWidth >= 768 && windowWidth < 1100 && (
          <div style={{ width: '30vw', position: 'relative', zIndex: 10, transform: 'translateY(1rem)' }} className="pointer-events-auto">
            <TechContainer title="VERBINDINGS_MENU" variant="purple" className="w-full h-full" style={{ height: '17.94vh' }} headerRight={langToggle}>
              <div className="w-full h-full flex items-center justify-evenly opacity-90 relative" style={{ padding: '0 0.5vw' }}>
                {/* Left: Logo - Button */}
                <button
                  className="gfl-eye-btn"
                  onClick={(e) => setActiveSection('menu', e)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    padding: 0,
                    filter: 'drop-shadow(0 0 0px rgba(139,90,43,0))',
                    opacity: 1
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(139,90,43,0.8))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(139,90,43,0))'; }}
                >
                  <img src={eyeLogo} alt="Logo" style={{ width: 'max(45px, 2.5vw)', height: 'auto' }} />
                </button>
                <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                {/* Center: Contact Info */}
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span style={{ fontSize: 'max(11px, 0.6vw)', color: 'white', fontWeight: 'bold' }}>yuanwullink30@gfl.community</span>
                  <span style={{ fontSize: 'max(11px, 0.6vw)', color: 'white', fontWeight: 'bold' }}>Zutphen, NL</span>
                </div>
                <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                {/* Right: Login Button */}
                <div className="flex flex-col items-center justify-center gap-1" style={{ overflow: 'visible' }}>
                  <button
                    className="gfl-blackhole-btn"
                    onClick={(e) => setActiveSection('login', e)}
                    style={{
                    padding: '0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 0 0px rgba(255,200,100,0))'
                  }} onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(255,200,100,0.6))';
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(255,200,100,0))';
                  }}>
                    <img src={blackholeIcon} alt="Login" style={{ width: 'max(55px, 3.2vw)', height: 'auto' }} />
                  </button>
                </div>
              </div>
            </TechContainer>
          </div>
        )}
      </div>

    </>
  );
};

export default React.memo(DesktopLayout);
