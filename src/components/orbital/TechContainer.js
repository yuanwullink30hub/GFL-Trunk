import React from 'react';

const TechContainer = ({ 
  children, 
  className = '', 
  style, 
  title = "NO_DATA",
  variant = 'purple'
}) => {
  const accentColor = variant === 'orange' ? 'border-[#f59e0b]' : 'border-purple-500';
  const textColor = variant === 'orange' ? 'text-[#f59e0b]' : 'text-purple-400';

  return (
    <div 
      className={`
        relative 
        backdrop-blur-md 
        bg-[#0f0716]/40 
        border border-opacity-30 
        ${accentColor} 
        rounded-sm
        shadow-[0_0_15px_rgba(0,0,0,0.5)] 
        flex flex-col
        transition-all duration-500 ease-in-out
        hover:bg-[#0f0716]/60
        hover:border-opacity-60
        hover:shadow-[0_0_25px_rgba(0,0,0,0.7)]
        ${className}
      `}
      style={style}
    >
      {/* --- HUD Corners --- */}
      {/* Top Left */}
      <div className={`absolute -top-[1px] -left-[1px] border-t-2 border-l-2 ${accentColor} z-10`} style={{ width: '0.8vw', height: '0.8vw' }} />
      {/* Bottom Right */}
      <div className={`absolute -bottom-[1px] -right-[1px] border-t-2 border-l-2 ${accentColor} z-10`} style={{ width: '0.8vw', height: '0.8vw' }} />
      
      {/* --- Header Decoration --- */}
      <div className="absolute top-0 flex" style={{ right: '1.5vw', gap: '0.2vw', height: '0.2vw' }}>
        <div className={`${variant === 'orange' ? 'bg-[#f59e0b]' : 'bg-purple-500'}`} style={{opacity: 0.5, width: '0.8vw'}}></div>
        <div className={`${variant === 'orange' ? 'bg-[#f59e0b]' : 'bg-purple-500'}`} style={{opacity: 0.3, width: '0.4vw'}}></div>
        <div className={`${variant === 'orange' ? 'bg-[#f59e0b]' : 'bg-purple-500'}`} style={{opacity: 0.2, width: '0.2vw'}}></div>
      </div>

      {/* --- Content Area --- */}
      <div className="flex-1 flex flex-col h-full relative z-0 overflow-hidden" style={{ padding: '0.8vw' }}>
        {/* Title Tag */}
        <div className={`
          absolute 
          tracking-[0.2em] font-bold 
          ${textColor} opacity-80 select-none
          left-0 right-0
        `} style={{fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", top: '0.4vw', fontSize: 'max(13px, 0.7vw)', textAlign: 'center'}}>
          {title}
        </div>
        
        {/* Inner Content Placeholder */}
        <div className="flex-1 w-full h-full border border-dashed border-white/5 rounded-sm flex items-center justify-center" style={{ marginTop: '1.2vw' }}>
            {children || (
                <div className="flex flex-col items-center" style={{ gap: '0.4vw' }}>
                    <div className={`rounded-full border border-t-transparent animate-spin ${accentColor}`} style={{ width: '1.5vw', height: '1.5vw' }} />
                    <span style={{color: 'rgba(255, 254, 240, 0.3)', fontFamily: "'Figtree', sans-serif", letterSpacing: '0.1em', fontSize: 'max(9.1px, 0.5vw)'}}>INITIALIZING...</span>
                </div>
            )}
        </div>
      </div>
      
      {/* Scanline overlay inside container */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
    </div>
  );
};

export default React.memo(TechContainer);
