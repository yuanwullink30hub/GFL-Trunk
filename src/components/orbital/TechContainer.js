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
      <div className={`absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 ${accentColor} z-10`} />
      {/* Bottom Right */}
      <div className={`absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 ${accentColor} z-10`} />
      
      {/* --- Header Decoration --- */}
      <div className="absolute top-0 right-8 flex gap-1 h-1">
        <div className={`w-4 ${variant === 'orange' ? 'bg-[#f59e0b]' : 'bg-purple-500'}`} style={{opacity: 0.5}}></div>
        <div className={`w-2 ${variant === 'orange' ? 'bg-[#f59e0b]' : 'bg-purple-500'}`} style={{opacity: 0.3}}></div>
        <div className={`w-1 ${variant === 'orange' ? 'bg-[#f59e0b]' : 'bg-purple-500'}`} style={{opacity: 0.2}}></div>
      </div>

      {/* --- Content Area --- */}
      <div className="p-4 flex-1 flex flex-col h-full relative z-0 overflow-hidden">
        {/* Title Tag */}
        <div className={`
          absolute top-2 left-2 
          text-[14px] tracking-[0.2em] font-bold 
          ${textColor} opacity-80 select-none
        `} style={{fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif"}}>
          {`// ${title}`}
        </div>
        
        {/* Inner Content Placeholder */}
        <div className="mt-6 flex-1 w-full h-full border border-dashed border-white/5 rounded-sm flex items-center justify-center">
            {children || (
                <div className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full border border-t-transparent animate-spin ${accentColor}`} />
                    <span className="text-sm" style={{color: 'rgba(255, 254, 240, 0.3)', fontFamily: "'Figtree', sans-serif", letterSpacing: '0.1em'}}>INITIALIZING...</span>
                </div>
            )}
        </div>
      </div>
      
      {/* Scanline overlay inside container */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
    </div>
  );
};

export default TechContainer;
