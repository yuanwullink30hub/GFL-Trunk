import React from 'react';
import TechContainer from './TechContainer';

const MobileLayout = ({ isExploding, mounted, currentSlide, setCurrentSlide, animationProgress = 0 }) => {
  // Calculate animation values based on progress (0 = visible, 1 = fully hidden/flown away)
  const containerOpacity = Math.max(0, 1 - animationProgress * 2);
  const translateY = 150 * animationProgress; // pixels to move down
  const containerScale = 1 - (0.25 * animationProgress);

  return (
    <>
      {/* Mobile - Full Width Gardens Slideshow at Bottom (below scroll prompt) */}
      <div 
        className="absolute pointer-events-auto"
        style={{
          bottom: 'clamp(0.5rem, 3vh, 2rem)',
          left: '3vw',
          right: '3vw',
          height: 'clamp(8rem, 18vh, 12rem)',
          transform: `translateY(${translateY}px) scale(${containerScale})`,
          opacity: mounted ? containerOpacity : 0
        }}
      >
        <TechContainer title="GARDENS" variant="purple" className="w-full h-full">
          <div className="w-full h-full flex flex-col items-center justify-between p-3 relative">
            <div className="w-full flex-1 relative overflow-hidden rounded-sm bg-purple-900/20 border border-purple-500/20 mb-2">
              {[...Array(6)].map((_, i) => {
                let translateX = 0;
                if (i > currentSlide) translateX = 100;
                else if (i < currentSlide) translateX = -100;
                return (
                  <div
                    key={i}
                    className={`absolute inset-0 transition-all duration-500 ${i === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0'}`}
                    style={{transform: `translateX(${translateX}%)`}}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-green-900/40 to-green-700/30 flex items-center justify-center">
                      <div className="text-center">
                        <div style={{fontSize: 'clamp(0.75rem, 2vw, 1rem)', color: 'rgb(74, 222, 128)', fontWeight: '600', letterSpacing: '0.1em', marginBottom: '0.25rem'}}>GARDEN {i + 1}</div>
                        <div style={{fontSize: 'clamp(0.6rem, 1.5vw, 0.875rem)', color: 'rgba(134, 239, 172, 0.7)'}}>
                          {['Botanical Research Lab', 'Hydroponic Station', 'Organic Growth Zone', 'Neural Garden', 'Bio-Culture Center', 'Genesis Sector'][i]}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 justify-center items-center">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
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
        </TechContainer>
      </div>
    </>
  );
};

export default MobileLayout;
