import React from 'react';

const TechContainer = ({ 
  children, 
  className = '', 
  style, 
  title = "NO_DATA",
  variant = 'purple'
}) => {
  const accentColor = variant === 'orange' ? '#f59e0b' : '#a855f7';
  const textColor = variant === 'orange' ? 'text-[#f59e0b]' : 'text-purple-400';

  return (
    <div 
      className={`
        relative 
        backdrop-blur-md 
        rounded-lg
        shadow-[0_0_15px_rgba(0,0,0,0.5)] 
        flex flex-col
        transition-all duration-500 ease-in-out
        hover:shadow-[0_0_25px_rgba(0,0,0,0.7)]
        overflow-visible
        ${className}
      `}
      style={{
        backgroundColor: 'rgba(8, 2, 12, 0.8)',
        overflow: 'visible',
        ...style
      }}
    >
      {/* Top-Left Corner Border */}
      <div className="absolute -top-0.5 -left-0.5 w-4 h-4" style={{
        border: '1.5px solid ' + accentColor,
        borderRadius: '10px 0 0 0',
        borderBottom: 'none',
        borderRight: 'none'
      }}></div>
      
      {/* Top-Right Corner Border */}
      <div className="absolute -top-0.5 -right-0.5 w-4 h-4" style={{
        border: '1.5px solid ' + accentColor,
        borderRadius: '0 10px 0 0',
        borderBottom: 'none',
        borderLeft: 'none'
      }}></div>
      
      {/* Bottom-Left Corner Border */}
      <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4" style={{
        border: '1.5px solid ' + accentColor,
        borderRadius: '0 0 0 10px',
        borderTop: 'none',
        borderRight: 'none'
      }}></div>
      
      {/* Bottom-Right Corner Border */}
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4" style={{
        border: '1.5px solid ' + accentColor,
        borderRadius: '0 0 10px 0',
        borderTop: 'none',
        borderLeft: 'none'
      }}></div>

      {/* --- Content Area --- */}
      <div className="flex-1 flex flex-col h-full relative z-0 overflow-visible pointer-events-auto" style={{ padding: '0.8vw' }}>
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
        <div className="flex-1 w-full h-full border border-dashed border-white/5 rounded-sm flex items-center justify-center pointer-events-auto overflow-visible" style={{ marginTop: '1.2vw' }}>
            {children || (
                <div className="flex flex-col items-center" style={{ gap: '0.4vw' }}>
                    <div className="rounded-full border border-t-transparent animate-spin" style={{ borderColor: accentColor, width: '1.5vw', height: '1.5vw' }} />
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
