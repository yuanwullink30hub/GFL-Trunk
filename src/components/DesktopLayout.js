import React from 'react';
import TechContainer from './TechContainer';
import { Activity, Database, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

const DesktopLayout = ({ isExploding, mounted, currentSlide, setCurrentSlide }) => {
  return (
    <>
      {/* 1. Top Left - Analytics */}
      <div 
        className="absolute top-[15%] left-[5%] w-[20vw] h-[25vh] transition-all duration-1000 ease-in-out pointer-events-auto"
        style={{
          transform: !isExploding && mounted ? 'translate(0, 0) scale(1)' : 'translate(-250px, -200px) scale(0.75)',
          opacity: !isExploding && mounted ? 1 : 0
        }}
      >
        <TechContainer title="SECTOR_ANALYTICS" variant="purple" className="w-full h-full">
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-50">
            <Activity className="w-8 h-8 text-purple-400" />
            <div className="h-1 w-2/3 bg-purple-900/50 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-purple-400 animate-pulse"></div>
            </div>
          </div>
        </TechContainer>
      </div>

      {/* 2. Bottom Left - Database/Logs */}
      <div 
        className="absolute bottom-[10%] left-[8%] w-[18vw] h-[35vh] transition-all duration-1000 ease-in-out pointer-events-auto"
        style={{
          transform: !isExploding && mounted ? 'translate(0, 0) scale(1)' : 'translate(-250px, 200px) scale(0.75)',
          opacity: !isExploding && mounted ? 1 : 0,
          transitionDelay: '100ms'
        }}
      >
        <TechContainer title="DATA_STREAM" variant="orange" className="w-full h-full">
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-50">
            <Database className="w-8 h-8" style={{color: '#f59e0b'}} />
            <div className="text-[10px] font-mono text-center" style={{color: '#fed7aa'}}>
              packet_loss: 0%<br/>
              encryption: AES-256<br/>
              latency: 12ms
            </div>
          </div>
        </TechContainer>
      </div>

      {/* 3. Top Right - Garden For Life Website */}
      <div 
        className="absolute top-[20%] right-[5%] w-[18vw] h-[20vh] transition-all duration-1000 ease-in-out pointer-events-auto"
        style={{
          transform: !isExploding && mounted ? 'translate(0, 0) scale(1)' : 'translate(250px, -200px) scale(0.75)',
          opacity: !isExploding && mounted ? 1 : 0,
          transitionDelay: '200ms'
        }}
      >
        <TechContainer title="GARDENFORLIFE.NL" variant="orange" className="w-full h-full">
          <div className="w-full h-full flex flex-col items-center justify-center gap-0 relative overflow-hidden">
            {/* Blurred webpage background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-sm" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34, 197, 94, 0.1) 2px, rgba(34, 197, 94, 0.1) 4px)'}}></div>
            
            {/* Decorative lines to simulate webpage content */}
            <div className="absolute inset-0 flex flex-col justify-start pt-3 px-2 gap-1.5 opacity-40">
              <div className="h-1 bg-green-600/40 rounded w-3/4"></div>
              <div className="h-0.5 bg-green-500/30 rounded w-1/2"></div>
              <div className="h-0.5 bg-green-500/30 rounded w-2/3"></div>
            </div>
            
            {/* Lock Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Lock className="w-6 h-6" style={{color: '#f59e0b'}} strokeWidth={1.5} />
                <span className="text-[10px] tracking-widest" style={{color: 'rgba(245, 158, 11, 0.8)', fontFamily: "'Figtree', sans-serif"}}>LOCKED</span>
              </div>
            </div>
          </div>
        </TechContainer>
      </div>

      {/* 4. Center Right/Bottom - Gardens Slideshow */}
      <div 
        className="absolute bottom-[15%] right-[10%] w-[22vw] h-[30vh] transition-all duration-1000 ease-in-out pointer-events-auto"
        style={{
          transform: !isExploding && mounted ? 'translate(0, 0) scale(1)' : 'translate(250px, 200px) scale(0.75)',
          opacity: !isExploding && mounted ? 1 : 0,
          transitionDelay: '300ms'
        }}
      >
        <TechContainer title="GARDENS" variant="purple" className="w-full h-full">
          <div className="w-full h-full flex flex-col items-center justify-between p-4 relative">
            {/* Slideshow Area */}
            <div className="w-full flex-1 relative overflow-hidden rounded-sm bg-purple-900/20 border border-purple-500/20 mb-3">
              {/* Slides */}
              {[...Array(6)].map((_, i) => {
                let translateX = 0;
                if (i > currentSlide) {
                  translateX = 100;
                } else if (i < currentSlide) {
                  translateX = -100;
                }
                return (
                  <div
                    key={i}
                    className={`absolute inset-0 transition-all duration-500 ${i === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0'}`}
                    style={{transform: `translateX(${translateX}%)`}}
                  >
                    {/* Garden Image Placeholder */}
                    <div className="w-full h-3/4 bg-gradient-to-br from-green-900/40 to-green-700/30 flex items-center justify-center relative">
                      <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.3) 0%, transparent 50%)'}}></div>
                      <div className="text-center z-10">
                        <div className="text-xs text-green-400 tracking-widest mb-1" style={{fontFamily: "'Figtree', sans-serif"}}>GARDEN {i + 1}</div>
                        <div className="text-[10px] text-green-300/70" style={{fontFamily: "'Figtree', sans-serif"}}>Sector {String(i).padStart(2, '0')}</div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="h-1/4 bg-black/40 backdrop-blur-sm px-2 py-1.5 flex items-center justify-center border-t border-purple-500/20">
                      <span className="text-[9px] text-purple-300/80 text-center leading-tight" style={{fontFamily: "'Figtree', sans-serif"}}>
                        {['Botanical Research Lab', 'Hydroponic Station', 'Organic Growth Zone', 'Neural Garden', 'Bio-Culture Center', 'Genesis Sector'][i]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Circle Indicators with Arrow Navigation */}
            <div className="flex gap-3 justify-center items-center z-50 relative">
              {/* Left Arrow */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(prev => (prev - 1 + 6) % 6);
                }}
                className="p-1 rounded transition-colors border border-purple-500 bg-transparent hover:border-purple-400 cursor-pointer z-50"
                title="Previous slide"
              >
                <ChevronLeft className="w-4 h-4 text-purple-400 pointer-events-none" />
              </button>
              
              {/* Indicators */}
              <div className="flex gap-2 items-center">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(i);
                    }}
                    className={`cursor-pointer transition-all duration-300 h-0.5 z-50 ${i === currentSlide ? 'w-4 bg-purple-400' : 'w-2 bg-purple-500/30 hover:bg-purple-500/50'}`}
                  />
                ))}
              </div>
              
              {/* Right Arrow */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(prev => (prev + 1) % 6);
                }}
                className="p-1 rounded transition-colors border border-purple-500 bg-transparent hover:border-purple-400 cursor-pointer z-50"
                title="Next slide"
              >
                <ChevronRight className="w-4 h-4 text-purple-400 pointer-events-none" />
              </button>
            </div>
          </div>
        </TechContainer>
      </div>

      {/* 5. Center Bottom - Status Strip */}
      <div 
        className="absolute bottom-[5%] left-0 right-0 flex justify-center transition-all duration-1000 ease-in-out pointer-events-auto"
        style={{
          transform: !isExploding && mounted ? 'translateY(0) scale(1)' : 'translateY(250px) scale(0.75)',
          opacity: !isExploding && mounted ? 1 : 0,
          transitionDelay: '500ms'
        }}
      >
        <div className="w-[30vw] h-[10vh]">
          <TechContainer title="GLOBAL_STATUS" variant="purple" className="w-full h-full">
            <div className="w-full h-full flex items-center justify-around px-4 opacity-70">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400">MEM</span>
                <span className="text-lg font-bold text-purple-300">64%</span>
              </div>
              <div className="h-8 w-[1px] bg-white/10"></div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400">CPU</span>
                <span className="text-lg font-bold" style={{color: '#fed7aa'}}>32%</span>
              </div>
              <div className="h-8 w-[1px] bg-white/10"></div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400">TMP</span>
                <span className="text-lg font-bold text-white">45°</span>
              </div>
            </div>
          </TechContainer>
        </div>
      </div>
    </>
  );
};

export default DesktopLayout;
