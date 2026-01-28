import React from 'react';
import TechContainer from './TechContainer';
import { Activity, Lock } from 'lucide-react';

// Import garden logos
import karmanLogo from '../../images/slideshow images/karmaneventsPNG.png';
import code49Logo from '../../images/slideshow images/club49-logo.png';
import tattooshopLogo from '../../images/slideshow images/1111logo.png';
import rengiLogo from '../../images/slideshow images/Rengi-logo.png';

const MobileLayout = ({ isExploding, mounted, currentSlide, setCurrentSlide, animationProgress = 0, position = 'top', isMobile, TimeSync }) => {
  // Calculate animation values based on progress (0 = visible, 1 = fully hidden/flown away)
  const containerOpacity = Math.max(0, 1 - animationProgress * 2);
  const containerScale = 1 - (0.25 * animationProgress);

  // If position is 'top', render at the top of the page (above earth wrapper)
  // This is for mobile scrollable layout
  if (position === 'top') {
    return (
      <div 
        className="w-full pointer-events-auto"
        style={{
          opacity: mounted ? containerOpacity : 0,
          transform: `scale(${containerScale})`,
          transformOrigin: 'top center'
        }}
      >
        {/* Logo + Deltawerken Header - Fixed positioning to prevent reflow */}
        <div 
          className="relative w-full"
          style={{
            height: 'clamp(3.5rem, 21vw, 5.6rem)',
            marginTop: 'clamp(2rem, 4vw, 2.5rem)',
            marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)',
            paddingLeft: 'clamp(1rem, 4vw, 1.5rem)',
            paddingRight: 'clamp(1rem, 4vw, 1.5rem)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(0.75rem, 3vw, 1.25rem)'
          }}
        >
          <img 
            src="images/landingpage/logo.png" 
            alt="Delta" 
            style={{
              width: 'clamp(4.55rem, 27.3vw, 7.28rem)', 
              height: 'clamp(4.55rem, 27.3vw, 7.28rem)',
              flexShrink: 0,
              marginRight: '-0.2rem'
            }} 
          />
          <div className="flex flex-col justify-center" style={{height: '100%', marginLeft: '-2rem'}}>
            <h1 style={{
              color: '#FFFEF0',
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              fontSize: 'clamp(1.4rem, 6.24vw, 2.34rem)',
              fontWeight: 600,
              lineHeight: 0.9,
              margin: 0,
              filter: 'brightness(0.9)',
              letterSpacing: 'clamp(0.1em, 0.15vw, 0.15em)'
            }}>
              DELTA<span style={{color: '#f59e0b'}}>WERKEN</span>
            </h1>
            <div className="flex gap-1.5 items-center" style={{marginTop: 'clamp(0.25rem, 1vw, 0.5rem)', marginLeft: '1.2rem'}}>
              <span className="rounded-full bg-green-500 animate-ping" style={{
                width: 'clamp(0.3rem, 0.8vw, 0.5rem)',
                height: 'clamp(0.3rem, 0.8vw, 0.5rem)',
                minWidth: 'clamp(0.3rem, 0.8vw, 0.5rem)',
                minHeight: 'clamp(0.3rem, 0.8vw, 0.5rem)'
              }}></span>
              <span className="text-gray-400 tracking-widest" style={{
                fontSize: 'clamp(0.55rem, 2vw, 0.85rem)',
                fontWeight: '500',
                letterSpacing: '0.05em'
              }}>SCHADUW WERK {'/'}{'/'} V.4.9</span>
            </div>
          </div>
        </div>

        {/* Container sections - flow based */}
        <div className="flex flex-col" style={{
          paddingLeft: 'clamp(1rem, 4vw, 1.5rem)',
          paddingRight: 'clamp(1rem, 4vw, 1.5rem)',
          gap: 'clamp(1.5rem, 3vw, 2.5rem)'
        }}>
          {/* 1. Filosofie */}
          <div style={{minHeight: 'clamp(18rem, 45vh, 24rem)'}}>
            <TechContainer title="FILOSOFIE" variant="purple" className="w-full h-full">
              <div className="w-full h-full flex flex-col items-center justify-start gap-3 p-4 overflow-visible">
                {/* Header */}
                <div className="flex flex-col items-center gap-2 w-full">
                  <h2 style={{
                    fontSize: 'clamp(1.02rem, 4.2vw, 1.5rem)',
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
                  <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <Activity className="w-10 h-10 text-purple-400" />
                  <div className="h-0.5 w-1/2 bg-purple-900/50 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-purple-400 animate-pulse"></div>
                  </div>
                  <div style={{
                    fontFamily: "'Figtree', sans-serif",
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: '#FFFEF0',
                    fontSize: 'clamp(15px, 3.4vw, 20px)',
                    textAlign: 'center'
                  }}>
                   Man en Vrouw gelijkgesteld <br/> De tuinierder moet zich overgeven aan en overkomen van de doorschijnende passie <br />
                
                  </div>
                </div>

                {/* Button */}
                <button
                  className="rounded-sm font-bold tracking-widest transition-all duration-300 hover:scale-105 mt-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(168, 85, 247, 0.2))',
                    border: '1px solid rgba(167, 139, 250, 0.5)',
                    color: '#c4b5fd',
                    fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                    fontSize: 'clamp(0.65rem, 2.2vw, 0.85rem)',
                    padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.8rem, 3.5vw, 1.5rem)',
                    width: 'fit-content'
                  }}
                >
                  LEARN MORE
                </button>
              </div>
            </TechContainer>
          </div>

          {/* Spacing - reduced by 4rem */}
          <div style={{height: '0'}} />

          {/* 2. GardenForLife */}
          <div style={{height: 'clamp(8rem, 18vh, 11rem)', display: 'flex', justifyContent: 'center', paddingLeft: 'clamp(1rem, 4vw, 1.5rem)', paddingRight: 'clamp(1rem, 4vw, 1.5rem)', marginTop: '-3rem'}}>
            <div style={{width: '80%', height: '100%'}}>
              <TechContainer title="GARDENFORLIFE.NL" variant="orange" className="w-full h-full">
                <div className="w-full h-full flex flex-col items-center justify-center gap-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-sm" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34, 197, 94, 0.1) 2px, rgba(34, 197, 94, 0.1) 4px)'}}></div>
                  <div className="absolute inset-0 flex flex-col justify-center items-center gap-1.5 opacity-40">
                    <div className="h-1 bg-green-600/40 rounded" style={{width: '60%'}}></div>
                    <div className="h-0.5 bg-green-500/30 rounded" style={{width: '40%'}}></div>
                    <div className="h-0.5 bg-green-500/30 rounded" style={{width: '50%'}}></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Lock className="w-6 h-6" style={{color: '#f59e0b'}} strokeWidth={1.5} />
                      <span style={{fontSize: 'clamp(9px, 2vw, 12px)', tracking: 'widest', color: 'rgba(245, 158, 11, 0.8)', fontFamily: "'Figtree', sans-serif"}}>LOCKED</span>
                    </div>
                  </div>
                </div>
              </TechContainer>
            </div>
          </div>

          {/* Spacing - reduced by 4rem */}
          <div style={{height: '0'}} />

          {/* 3. Gardens Slideshow */}
          <div style={{height: 'clamp(12rem, 26vh, 16rem)'}}>
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
                    name: 'TATTOO SHOP',
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
                  <div className="w-full h-full flex flex-col items-center justify-between p-3 relative">
                    <div className="w-full flex-1 relative overflow-hidden rounded-sm bg-purple-900/20 border border-purple-500/20 mb-2">
                      {gardensData.map((garden, i) => {
                        let translateX = 0;
                        if (i > currentSlide) translateX = 100;
                        else if (i < currentSlide) translateX = -100;
                        return (
                          <div
                            key={garden.id}
                            className={`absolute inset-0 transition-all duration-500 ${i === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0'}`}
                            style={{transform: `translateX(${translateX}%)`}}
                          >
                            <div className="w-full h-full flex flex-col items-center justify-center" style={{background: `linear-gradient(135deg, ${garden.accentColor}20, ${garden.accentColor}10)`}}>
                              {/* Logo Image */}
                              <img 
                                src={garden.logo} 
                                alt={`${garden.name} logo`}
                                className="object-contain mb-2"
                                style={{
                                  width: 'clamp(5rem, 20vw, 7.5rem)',
                                  height: 'clamp(5rem, 20vw, 7.5rem)',
                                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))'
                                }}
                              />
                              
                              {/* Header */}
                              <div className="text-center">
                                <div style={{
                                  fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                                  fontWeight: 600,
                                  fontSize: 'clamp(0.75rem, 3vw, 1rem)',
                                  color: garden.accentColor,
                                  letterSpacing: '0.1em',
                                  marginBottom: 'clamp(0.15rem, 0.5vw, 0.25rem)'
                                }}>{garden.name}</div>
                                <div style={{
                                  fontSize: 'clamp(0.55rem, 2vw, 0.7rem)',
                                  color: `${garden.accentColor}cc`,
                                  letterSpacing: '0.05em',
                                  marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)'
                                }}>{garden.tagline}</div>
                                <div style={{
                                  fontSize: 'clamp(0.5rem, 1.8vw, 0.65rem)',
                                  color: '#c4b5fd',
                                  padding: '0 1rem',
                                  lineHeight: '1.3'
                                }}>{garden.description}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 justify-center items-center">
                      {gardensData.map((garden, i) => (
                        <div
                          key={garden.id}
                          onClick={() => setCurrentSlide(i)}
                          className="cursor-pointer transition-all duration-300"
                          style={{
                            height: 'clamp(0.4rem, 0.75vh, 0.5rem)',
                            width: i === currentSlide ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.5rem, 1vw, 0.75rem)',
                            backgroundColor: i === currentSlide ? 'rgb(167, 139, 250)' : 'rgba(167, 139, 250, 0.3)'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </TechContainer>
          </div>

          {/* Spacing - reduced for media feed */}
          <div style={{height: '0', marginTop: '-2.5rem'}} />

          {/* 4. Plain Image */}
          <img 
            src="images/landingpage/placeholder.jpg" 
            alt="Media Feed" 
            className="w-full"
            style={{
              height: 'clamp(14rem, 40vh, 20rem)',
              objectFit: 'cover',
              borderRadius: '0.125rem',
              display: 'block',
              margin: '0 auto'
            }}
          />

          {/* Spacing - reduced for global status */}
          <div style={{height: '0', marginTop: '-5.5rem'}} />

          {/* 5. Global Status */}
          <div style={{height: 'clamp(8rem, 15vh, 10rem)'}}>
            <TechContainer title="GLOBAL_STATUS" variant="purple" className="w-full h-full">
              <div className="w-full h-full flex items-center justify-around px-4 opacity-70">
                <div className="flex flex-col items-center">
                  <span style={{
                    fontFamily: "'Figtree', sans-serif",
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: '#FFFEF0',
                    fontSize: 'clamp(10px, 2.5vw, 14px)',
                    textAlign: 'center'
                  }}>MEM</span>
                  <span style={{fontSize: 'clamp(0.9rem, 3vw, 1.25rem)', fontWeight: 'bold', color: 'rgb(196, 181, 253)'}}>64%</span>
                </div>
                <div style={{height: 'clamp(1.5rem, 4vw, 2rem)', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)'}}></div>
                <div className="flex flex-col items-center">
                  <span style={{
                    fontFamily: "'Figtree', sans-serif",
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: '#FFFEF0',
                    fontSize: 'clamp(10px, 2.5vw, 14px)',
                    textAlign: 'center'
                  }}>CPU</span>
                  <span style={{fontSize: 'clamp(0.9rem, 3vw, 1.25rem)', fontWeight: 'bold', color: '#fed7aa'}}>32%</span>
                </div>
                <div style={{height: 'clamp(1.5rem, 4vw, 2rem)', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)'}}></div>
                <div className="flex flex-col items-center">
                  <span style={{
                    fontFamily: "'Figtree', sans-serif",
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: '#FFFEF0',
                    fontSize: 'clamp(10px, 2.5vw, 14px)',
                    textAlign: 'center'
                  }}>TMP</span>
                  <span className="text-[10px] text-gray-400">TMP</span>
                  <span style={{fontSize: 'clamp(0.9rem, 3vw, 1.25rem)', fontWeight: 'bold', color: '#ffffff'}}>45°</span>
                </div>
              </div>
            </TechContainer>
          </div>

          {/* Spacing - reduced for TimeSync */}
          <div style={{height: '0', marginTop: '-5.5rem'}} />

          {/* 6. TimeSync */}
          <div className="flex justify-center" style={{paddingBottom: 'clamp(2rem, 4vw, 3rem)', marginTop: '2.5rem'}}>
            {TimeSync}
          </div>
        </div>
      </div>
    );
  }

  // Bottom section - Button + Data Stream (rendered below earth)
  if (position === 'bottom') {
    return (
      <div 
        className="w-full pointer-events-auto"
        style={{
          opacity: mounted ? containerOpacity : 0,
          transform: `scale(${containerScale})`,
          transformOrigin: 'top center'
        }}
      >
        <div className="flex flex-col" style={{
          paddingLeft: 'clamp(1rem, 4vw, 1.5rem)',
          paddingRight: 'clamp(1rem, 4vw, 1.5rem)',
          paddingTop: 'clamp(1.5rem, 3vw, 2.5rem)',
          paddingBottom: 'clamp(2rem, 4vw, 3rem)',
          gap: 'clamp(1.5rem, 3vw, 2.5rem)'
        }}>
          {/* Action Button - moved up 5rem */}
          <div className="flex justify-center" style={{marginTop: '-4rem'}}>
            <button 
              className="rounded-sm font-bold tracking-widest transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                color: '#fbbf24',
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontSize: 'clamp(0.7rem, 2.5vw, 0.9rem)',
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 4vw, 2rem)'
              }}
            >
              ENTER SYSTEM
            </button>
          </div>

          {/* Bottom spacing */}
          <div style={{height: 'clamp(2rem, 4vw, 3rem)'}} />
        </div>
      </div>
    );
  }

  // Original absolute positioning for desktop/overlay mode
  return null;
};

export default React.memo(MobileLayout);
