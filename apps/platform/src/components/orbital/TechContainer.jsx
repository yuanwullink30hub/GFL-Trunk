import React from 'react';
import HoloWord from '../HoloWord';

import HoloOverlays from '../HoloOverlays';

const TechContainer = ({
  children,
  className = '',
  style,
  title = "NO_DATA",
  titleSize = 'max(13px, 0.7vw)', // fluid-step override (e.g. the filosofie quote runs one step up)
  variant = 'purple',
  headerRight = null
}) => {
  const accentColor = variant === 'orange' ? '#f59e0b' : '#a855f7';
  const edgeGlow = variant === 'orange' 
    ? 'inset 0 0 12px rgba(245, 158, 11, 0.06), inset 0 0 30px rgba(245, 158, 11, 0.03)'
    : 'inset 0 0 12px rgba(168, 85, 247, 0.06), inset 0 0 30px rgba(168, 85, 247, 0.03)';

  return (
    <div 
      className={`
        relative 
        backdrop-blur-xl 
        rounded-lg
        flex flex-col
        transition-all duration-500 ease-in-out
        overflow-visible
        ${className}
      `}
      style={{
        backgroundColor: 'rgba(2, 0, 3, 0.3)',
        boxShadow: `0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), ${edgeGlow}`,
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

            <HoloOverlays />

      {/* --- Content Area --- */}
      <div className="flex-1 flex flex-col h-full relative z-0 overflow-visible pointer-events-auto" style={{ padding: '0.8vw' }}>
        {/* Title Tag — the same still hologram as DELTAWERKEN in the header, in this frame's accent */}
        <div className={`
          absolute
          tracking-[0.2em] font-bold
          select-none
          left-0 right-0
          flex items-center justify-center
        `} style={{fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", top: '0.4vw', fontSize: titleSize}}>
          <HoloWord tone={variant === 'orange' ? 'orange' : 'purple'}>{title}</HoloWord>
          {headerRight && (
            <div style={{ position: 'absolute', right: '0.6vw', top: '50%', transform: 'translateY(-50%)' }}>
              {headerRight}
            </div>
          )}
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
      
      {/* Noise texture overlay */}
      <div className="absolute inset-0 rounded-lg pointer-events-none bg-[url('/images/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
    </div>
  );
};

export default React.memo(TechContainer);
