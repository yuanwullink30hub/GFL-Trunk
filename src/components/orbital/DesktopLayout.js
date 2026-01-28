import React, { useState, useEffect } from 'react';
import TechContainer from './TechContainer';
import { Activity, Database, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

// Import garden logos
import karmanLogo from '../../images/slideshow images/karmaneventsPNG.png';
import code49Logo from '../../images/slideshow images/club49-logo.png';
import tattooshopLogo from '../../images/slideshow images/1111logo.png';
import rengiLogo from '../../images/slideshow images/Rengi-logo.png';

const DesktopLayout = ({ isExploding, mounted, currentSlide, setCurrentSlide, animationProgress = 0 }) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Calculate animation values based on progress (0 = visible, 1 = fully hidden/flown away)
  // animationProgress goes from 0 to 1 as containers fly away
  // All values in vw/vh for consistent viewport scaling
  const containerOpacity = Math.max(0, 1 - animationProgress * 3.5); // Fades out faster
  
  // Each container flies in different direction (converted to vw/vh from 2560x1440 reference)
  // 250px @ 2560w = 9.77vw, 200px @ 1440h = 13.89vh
  const topLeftX = -9.77 * animationProgress * 1.5;      // vw - faster exit
  const topLeftY = -13.89 * animationProgress * 1.5;     // vh
  const topRightX = 9.77 * animationProgress * 1.5;      // vw
  const topRightY = -13.89 * animationProgress * 1.5;    // vh
  const bottomRightX = 9.77 * animationProgress * 1.5;   // vw
  const bottomRightY = 13.89 * animationProgress * 1.5;  // vh
  const bottomLeftX = -9.77 * animationProgress * 1.5;   // vw
  const bottomLeftY = 13.89 * animationProgress * 1.5;   // vh - faster exit
  const bottomCenterY = 17.36 * animationProgress * 1.5; // vh - faster exit (250px @ 1440h)
  
  const containerScale = 1 - (0.35 * animationProgress); // Shrink faster too

  return (
    <>
      {/* 1. Top Left - Filosofie */}
      <div 
        className="absolute pointer-events-auto"
        style={{
          top: windowWidth >= 768 && windowWidth < 1024 ? 'calc(15vh + 2.5rem - 2rem)' : 'calc(15vh + 2.5rem)',
          left: windowWidth >= 768 && windowWidth < 1024 ? 'calc(4.06vw - 1.5rem)' : 'calc(4.06vw - 2.5rem)',
          minHeight: '32.5vh',
          width: '26vw',
          transform: `translate(${topLeftX}vw, ${topLeftY}vh) scale(${containerScale})`,
          opacity: mounted ? containerOpacity : 0
        }}
      >
        <TechContainer title="FILOSOFIE" variant="purple" className="w-full h-full">
          <div className="w-full h-full flex flex-col items-center justify-between" style={{ padding: '0.8vw' }}>
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
            <button
              className="rounded-sm font-bold tracking-widest transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(168, 85, 247, 0.2))',
                border: '0.05vw solid rgba(167, 139, 250, 0.5)',
                color: '#c4b5fd',
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontSize: 'max(8.5px, 0.45vw)',
                padding: '0.4vw 0.8vw',
                width: 'fit-content',
                borderRadius: '0.1vw'
              }}
            >
              LEARN MORE
            </button>
          </div>
        </TechContainer>
      </div>


      {/* 3. Top Right - Garden For Life Website */}
      <div 
        className="absolute pointer-events-auto"
        style={{
          top: '12.09vh',
          right: windowWidth >= 768 && windowWidth < 1024 ? 'calc(3.7vw + 2rem)' : windowWidth >= 1024 && windowWidth < 1280 ? 'calc(3.7vw + 1.5rem)' : '3.7vw',
          width: '19.01vw',
          height: '21.13vh',
          transform: `translate(${topRightX}vw, ${topRightY}vh) scale(${containerScale})`,
          opacity: mounted ? containerOpacity : 0
        }}
      >
        <TechContainer title="GARDENFORLIFE.NL" variant="orange" className="w-full h-full">
          <div className="w-full h-full flex flex-col items-center justify-center gap-0 relative overflow-hidden">
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
                }}>LOCKED</span>
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
          height: windowWidth >= 768 && windowWidth < 1024 ? 'calc(29.5vh * 1.3)' : windowWidth >= 1024 && windowWidth < 1280 ? 'calc(39vh * 1.2)' : '39vh',
          transform: `translate(${bottomRightX}vw, ${bottomRightY}vh) scale(${containerScale})`,
          opacity: mounted ? containerOpacity : 0
        }}
      >
        <TechContainer title="GARDENS" variant="purple" className="w-full h-full">
          {(() => {
            const gardensData = [
              {
                id: 'karman',
                name: 'KARMAN',
                tagline: 'Underground Techno Events',
                description: 'Amsterdam-based techno organization, born from a desire to restore the raw, intimate spirit of underground gatherings.',
                accentColor: '#8b5cf6',
                logo: karmanLogo
              },
              {
                id: 'code49',
                name: 'CODE49',
                tagline: 'AI Solutions',
                description: 'Cutting-edge software development company specializing in AI-driven solutions and advanced technology integration.',
                accentColor: '#06b6d4',
                logo: code49Logo
              },
              {
                id: 'tattooshop',
                name: 'ELEVEN ELEVEN TATTOOS',
                tagline: 'Artistic Expression & Body Art',
                description: 'A premier tattoo studio specializing in custom designs, traditional and modern styles.',
                accentColor: '#ec4899',
                logo: tattooshopLogo
              },
              {
                id: 'rengifoods',
                name: 'RENGI FOODS',
                tagline: 'Sustainable Organic Nutrition',
                description: 'Dedicated to providing the highest quality organic and sustainably-sourced food products.',
                accentColor: '#10b981',
                logo: rengiLogo
              }
            ];
            return (
              <div className="w-full h-full flex flex-col items-center justify-between relative" style={{ padding: '1vw' }}>
                {/* Slideshow Area */}
                <div className="w-full relative overflow-visible rounded-sm border border-purple-500/20" style={{ 
                  height: 'calc(100% - 2vw)', 
                  marginBottom: '0.8vw'
                }}>
                  {/* Slides */}
                  {gardensData.map((garden, i) => {
                    let translateX = 0;
                    if (i > currentSlide) {
                      translateX = 100;
                    } else if (i < currentSlide) {
                      translateX = -100;
                    }
                    return (
                      <div
                        key={garden.id}
                        className={`absolute inset-0 transition-all duration-500 ${i === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0'}`}
                        style={{transform: `translateX(${translateX}%)`}}
                      >
                        {/* Garden Card Content */}
                        <div className="w-full flex flex-col items-center justify-center relative" style={{
                          height: windowWidth >= 1024 ? '70%' : '70%'
                        }}>
                          
                          {/* Logo Image */}
                          <img 
                            src={garden.logo} 
                            alt={`${garden.name} logo`}
                            className="object-contain"
                            style={{
                              width: (() => {
                                const baseSize = 7;
                                let scale = 1;
                                
                                if (windowWidth >= 1280) {
                                  // Desktop
                                  if (garden.id === 'code49') scale = 1.2;
                                  else if (garden.id === 'tattooshop') scale = 2.5;
                                  else if (garden.id === 'rengifoods') scale = 1.25;
                                  else if (garden.id === 'karman') scale = 1.2;
                                } else if (windowWidth >= 1024) {
                                  // Laptop
                                  if (garden.id === 'tattooshop') scale = 2.2;
                                  else if (garden.id === 'rengifoods') scale = 1.5;
                                  else if (garden.id === 'code49') scale = 1.45;
                                  else if (garden.id === 'karman') scale = 1.25;
                                } else if (windowWidth >= 768) {
                                  // Tablet
                                  if (garden.id === 'rengifoods') scale = 1.2;
                                  else if (garden.id === 'karman') scale = 1.5;
                                  else if (garden.id === 'code49') scale = 1.5;
                                  else if (garden.id === 'tattooshop') scale = 3;
                                }
                                
                                return `calc(${baseSize}vw * ${scale})`;
                              })(),
                              height: (() => {
                                const baseSize = 7;
                                let scale = 1;
                                
                                if (windowWidth >= 1280) {
                                  // Desktop
                                  if (garden.id === 'code49') scale = 1.2;
                                  else if (garden.id === 'tattooshop') scale = 2.5;
                                  else if (garden.id === 'rengifoods') scale = 1.25;
                                  else if (garden.id === 'karman') scale = 1.15;
                                } else if (windowWidth >= 1024) {
                                  // Laptop
                                  if (garden.id === 'tattooshop') scale = 2.2;
                                  else if (garden.id === 'rengifoods') scale = 1.5;
                                  else if (garden.id === 'code49') scale = 1.45;
                                  else if (garden.id === 'karman') scale = 1.25;
                                } else if (windowWidth >= 768) {
                                  // Tablet
                                  if (garden.id === 'rengifoods') scale = 1.2;
                                  else if (garden.id === 'karman') scale = 1.5;
                                  else if (garden.id === 'code49') scale = 1.5;
                                  else if (garden.id === 'tattooshop') scale = 3;
                                }
                                
                                return `calc(${baseSize}vw * ${scale})`;
                              })(),
                              marginBottom: '0.5vw',
                               transform: (() => {
                                 if (windowWidth >= 1280) {
                                   // Desktop
                                   if (garden.id === 'tattooshop') return 'translateY(-4rem)';
                                   else if (garden.id === 'karman') return 'translateY(-1rem)';
                                   else if (garden.id === 'rengifoods') return 'translateY(-1.2rem)';
                                   else if (garden.id === 'code49') return 'translateY(-1rem)';
                                   return 'translateY(0)';
                                } else if (windowWidth >= 1024) {
                                  // Laptop
                                  if (garden.id === 'tattooshop') return 'translateY(-3.5rem)';
                                  else if (garden.id === 'karman') return 'translateY(-0.8rem)';
                                  else if (garden.id === 'code49') return 'translateY(-0.6rem)';
                                  else if (garden.id === 'rengifoods') return 'translateY(-0.8rem)';
                                  return 'translateY(0)';
                                } else if (windowWidth >= 768) {
                                  // Tablet
                                  return 'translateY(0)';
                                }
                              })(),
                              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))'
                            }}
                          />
                        </div>
                        
                        {/* Header - Positioned between logo and description */}
                        <div className="text-center absolute" style={{
                          top: windowWidth >= 768 && windowWidth < 1024 ? 'auto' : windowWidth >= 1024 && windowWidth < 1280 ? 'auto' : '70%',
                          bottom: windowWidth >= 768 && windowWidth < 1024 ? '-0.5vw' : windowWidth >= 1024 && windowWidth < 1280 ? '6.5vw' : 'auto',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          paddingBottom: windowWidth >= 768 && windowWidth < 1024 ? '0.6vw' : '0.4vw',
                          paddingTop: windowWidth >= 768 && windowWidth < 1024 ? '0.4vw' : '0',
                          marginTop: windowWidth >= 1280 ? '-2rem' : '0',
                          zIndex: 10,
                          display: windowWidth < 768 ? 'none' : 'block'
                        }}>
                          <div style={{
                            fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                            fontWeight: 600,
                            fontSize: windowWidth >= 768 && windowWidth < 1024 ? 'clamp(10px, 1.8vw, 16px)' : 'max(18px, 0.96vw)',
                            color: garden.accentColor,
                            letterSpacing: '0.1em',
                            marginBottom: '0.2vw',
                            whiteSpace: windowWidth >= 1024 ? 'nowrap' : 'normal',
                            maxWidth: windowWidth < 1024 ? '90%' : 'none'
                          }}>
                            {(() => {
                              // Tablet: show only "TATTOOS"
                              if (garden.id === 'tattooshop' && windowWidth >= 768 && windowWidth < 1024) {
                                return 'TATTOOS';
                              }
                              // Tablet: show only "RENGI"
                              if (garden.id === 'rengifoods' && windowWidth >= 768 && windowWidth < 1024) {
                                return 'RENGI';
                              }
                              // Laptop: show only "TATTOOS" (remove ELEVEN ELEVEN)
                              if (garden.id === 'tattooshop' && windowWidth >= 1024 && windowWidth < 1280) {
                                return 'TATTOOS';
                              }
                              return garden.name;
                            })()}
                          </div>
                        </div>
                        
                        {/* Description */}
                        <div className="flex flex-col items-center justify-center relative" style={{ 
                          height: windowWidth >= 1024 ? '30%' : '30%',
                          padding: '0.4vw 0.8vw',
                          display: windowWidth >= 1024 ? 'flex' : 'none'
                        }}>
                          <span style={{
                            fontFamily: "'Figtree', sans-serif",
                            fontWeight: 400,
                            lineHeight: 1.5,
                            color: '#FFFEF0',
                            fontSize: 'max(13px, 0.7vw)',
                            textAlign: 'center',
                            backgroundColor: 'rgb(25, 5, 41)',
                            padding: '0.4vw 0.8vw',
                            borderRadius: '0.2vw'
                          }}>
                            {garden.description}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Circle Indicators with Arrow Navigation */}
                <div className="flex justify-center items-center z-50 relative" style={{ gap: '0.8vw' }}>
                  {/* Left Arrow */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(prev => (prev - 1 + gardensData.length) % gardensData.length);
                    }}
                    className="rounded transition-colors border border-purple-500 bg-transparent hover:border-purple-400 cursor-pointer z-50"
                    style={{ padding: '0.2vw' }}
                    title="Previous slide"
                  >
                    <ChevronLeft style={{ width: '1vw', height: '1vw', color: 'rgb(192, 132, 252)' }} className="pointer-events-none" />
                  </button>
                  
                  {/* Indicators */}
                  <div className="flex items-center" style={{ gap: '0.4vw' }}>
                    {gardensData.map((garden, i) => (
                      <div
                        key={garden.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentSlide(i);
                        }}
                        className="cursor-pointer transition-all duration-300 z-50"
                        style={{
                          height: '0.15vw',
                          width: i === currentSlide ? '1vw' : '0.5vw',
                          backgroundColor: i === currentSlide ? 'rgb(192, 132, 252)' : 'rgba(168, 85, 247, 0.3)'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Right Arrow */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
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
          bottom: window.innerWidth >= 768 && window.innerWidth < 1024 
            ? 'calc(6vh + 8rem - 2rem)' 
            : window.innerWidth >= 1100 && window.innerWidth <= 1300 && window.innerHeight >= 650 && window.innerHeight <= 800 
            ? 'calc(6vh + 8rem - 3rem)' 
            : 'calc(6vh + 8rem)',
          left: window.innerWidth >= 768 && window.innerWidth < 1024 
            ? 'calc(7.5vw + 4.5rem - 4rem - 3rem)' 
            : window.innerWidth >= 1100 && window.innerWidth <= 1300 && window.innerHeight >= 650 && window.innerHeight <= 800 
            ? 'calc(7.5vw + 4.5rem + -3rem)' 
            : 'calc(7.5vw + 4.5rem)',
          width: '18.25vw',
          height: 'auto',
          maxHeight: '18vh',
          transform: `translate(${bottomLeftX}vw, ${bottomLeftY}vh) scale(${containerScale})`,
          opacity: mounted ? containerOpacity : 0
        }}
      >
        <TechContainer title="DATA_STREAM" variant="cyan" className="w-full h-full">
          <div className="w-full h-full flex flex-col items-center justify-between" style={{ padding: '0.8vw' }}>
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
                LIVE FEED
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
                Real-time system metrics <br /> and data streams flowing live
              </div>
            </div>

            {/* Button */}
            <button
              className="rounded-sm font-bold tracking-widest transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.3), rgba(34, 211, 238, 0.2))',
                border: '0.05vw solid rgba(34, 211, 238, 0.5)',
                color: '#a5f3fc',
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontSize: 'max(8.5px, 0.45vw)',
                padding: '0.4vw 0.8vw',
                width: 'fit-content',
                borderRadius: '0.1vw'
              }}
            >
              MONITOR
            </button>
          </div>
        </TechContainer>
      </div>

      {/* 5. Center Bottom - Status Strip */}
      <div 
        className="absolute left-0 right-0 flex justify-center pointer-events-auto"
        style={{
          bottom: '5vh',
          transform: `translateY(${bottomCenterY}vh) scale(${containerScale})`,
          opacity: mounted ? containerOpacity : 0
        }}
      >
        <div style={{ width: '30vw', height: '10vh' }}>
          <TechContainer title="GLOBAL_STATUS" variant="purple" className="w-full h-full">
            <div className="w-full h-full flex items-center justify-around opacity-70" style={{ padding: '0 1vw' }}>
              <div className="flex flex-col items-center">
                <span style={{ fontSize: 'max(9.1px, 0.5vw)', color: 'rgb(156, 163, 175)' }}>MEM</span>
                <span style={{ fontSize: 'max(18.2px, 1vw)', fontWeight: 'bold', color: 'rgb(216, 180, 254)' }}>64%</span>
              </div>
              <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
              <div className="flex flex-col items-center">
                <span style={{ fontSize: 'max(9.1px, 0.5vw)', color: 'rgb(156, 163, 175)' }}>CPU</span>
                <span style={{ fontSize: 'max(18.2px, 1vw)', fontWeight: 'bold', color: '#fed7aa' }}>32%</span>
              </div>
              <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
              <div className="flex flex-col items-center">
                <span style={{ fontSize: 'max(9.1px, 0.5vw)', color: 'rgb(156, 163, 175)' }}>TMP</span>
                <span style={{ fontSize: 'max(18.2px, 1vw)', fontWeight: 'bold', color: 'white' }}>45°</span>
              </div>
            </div>
          </TechContainer>
        </div>
      </div>
    </>
  );
};

export default React.memo(DesktopLayout);
