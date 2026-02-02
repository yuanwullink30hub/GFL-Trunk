import React from 'react';

// Sci-Fi themed UI components for the brand detail pages
// Converted from NeonNexus TypeScript to JavaScript

/**
 * HoloCard - Main card container with holographic styling
 */
export const HoloCard = ({ children, className = '', title, noPadding = false }) => {
  return (
    <div className={`relative group ${className}`}>
      {/* Main Content Container */}
      <div className="relative h-full bg-delta-card backdrop-blur-md border border-white/5 rounded-sm overflow-hidden flex flex-col">
        
        {/* Dashed Border Overlay */}
        <div className="absolute inset-0 border border-dashed border-purple-500/30 rounded-sm pointer-events-none"></div>

        {/* Header Bar (Optional) */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5" style={{ backgroundColor: 'rgba(42, 10, 56, 0.5)' }}>
            <h3 
              className="font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2"
              style={{ 
                color: '#ffae00',
                letterSpacing: '0.2em',
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif"
              }}
            >
              {title}
            </h3>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#ffae00' }}></div>
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#bc13fe' }}></div>
              <div className="w-1 h-1 bg-white/20 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 ${noPadding ? '' : 'p-6'}`}>
          {children}
        </div>

        {/* Corner Accents - The "Bracket" look */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: '#ffae00' }}></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r" style={{ borderColor: '#ffae00' }}></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l" style={{ borderColor: '#ffae00' }}></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{ borderColor: '#ffae00' }}></div>
        
        {/* Tech decorative ticks */}
        <div className="absolute top-1/2 left-0 w-1 h-4 -translate-y-1/2" style={{ backgroundColor: 'rgba(188, 19, 254, 0.2)' }}></div>
        <div className="absolute top-1/2 right-0 w-1 h-4 -translate-y-1/2" style={{ backgroundColor: 'rgba(188, 19, 254, 0.2)' }}></div>
      </div>
    </div>
  );
};

/**
 * GlowButton - Sci-fi styled button with glow effects
 */
export const GlowButton = ({ 
  children, 
  variant = 'primary', 
  icon, 
  className = '', 
  onClick,
  ...props 
}) => {
  const baseStyles = "relative px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 group overflow-hidden border border-transparent";
  
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, rgba(255, 174, 0, 0.1), rgba(255, 174, 0, 0.2))',
      border: '1px solid rgba(255, 174, 0, 0.5)',
      color: '#ffae00',
      hoverBg: 'linear-gradient(135deg, rgba(255, 174, 0, 0.8), rgba(255, 174, 0, 0.9))',
      hoverColor: '#000000',
      hoverShadow: '0 0 20px rgba(255, 174, 0, 0.6)'
    },
    secondary: {
      background: 'transparent',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'rgba(255, 255, 255, 0.6)',
      hoverBg: 'transparent',
      hoverColor: '#bc13fe',
      hoverShadow: '0 0 15px rgba(188, 19, 254, 0.4)',
      hoverBorder: '1px solid #bc13fe'
    },
    green: {
      background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.1), rgba(0, 255, 157, 0.2))',
      border: '1px solid rgba(0, 255, 157, 0.5)',
      color: '#00ff9d',
      hoverBg: 'linear-gradient(135deg, rgba(0, 255, 157, 0.8), rgba(0, 255, 157, 0.9))',
      hoverColor: '#000000',
      hoverShadow: '0 0 20px rgba(0, 255, 157, 0.6)'
    }
  };

  const variantStyles = variants[variant] || variants.primary;

  const handleMouseEnter = (e) => {
    e.currentTarget.style.background = variantStyles.hoverBg;
    e.currentTarget.style.color = variantStyles.hoverColor;
    e.currentTarget.style.boxShadow = variantStyles.hoverShadow;
    if (variantStyles.hoverBorder) {
      e.currentTarget.style.border = variantStyles.hoverBorder;
    }
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.background = variantStyles.background;
    e.currentTarget.style.color = variantStyles.color;
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.border = variantStyles.border;
  };

  return (
    <button 
      className={`${baseStyles} ${className}`}
      style={{
        background: variantStyles.background,
        border: variantStyles.border,
        color: variantStyles.color,
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
        letterSpacing: '0.15em'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

/**
 * TechBadge - Small tag/badge component
 */
export const TechBadge = ({ label }) => (
  <span 
    className="inline-flex items-center px-2 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-black border"
    style={{ 
      borderColor: 'rgba(188, 19, 254, 0.4)',
      color: '#bc13fe',
      boxShadow: '0 0 5px rgba(188, 19, 254, 0.1)',
      fontSize: '10px',
      fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif"
    }}
  >
    {label}
  </span>
);

/**
 * SectionHeader - Decorative section header
 */
export const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-6 flex flex-col items-center text-center">
    <h2 
      className="text-2xl md:text-3xl font-bold uppercase tracking-wider mb-2"
      style={{ 
        color: 'white',
        textShadow: '0 0 10px rgba(188, 19, 254, 0.5)',
        letterSpacing: '0.2em',
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif"
      }}
    >
      {title}
    </h2>
    {subtitle && (
      <div className="flex items-center gap-4">
        <div className="h-px w-8" style={{ backgroundColor: 'rgba(255, 174, 0, 0.5)' }}></div>
        <p 
          className="font-mono text-xs tracking-widest uppercase"
          style={{ color: '#ffae00' }}
        >
          {subtitle}
        </p>
        <div className="h-px w-8" style={{ backgroundColor: 'rgba(255, 174, 0, 0.5)' }}></div>
      </div>
    )}
  </div>
);

/**
 * SectorFrame - Decorative frame with curved corner border accents
 */
export const SectorFrame = ({ children, className = '' }) => (
  <div 
    className={`relative h-full w-full rounded-lg backdrop-blur-sm ${className}`} 
    style={{ 
      backgroundColor: 'rgba(8, 2, 12, 0.8)'
    }}
  >
    {/* Top-Left Corner Border */}
    <div className="absolute -top-0.5 -left-0.5 w-4 h-4" style={{
      border: '1.5px solid #ffae00',
      borderRadius: '10px 0 0 0',
      borderBottom: 'none',
      borderRight: 'none'
    }}></div>
    
    {/* Top-Right Corner Border */}
    <div className="absolute -top-0.5 -right-0.5 w-4 h-4" style={{
      border: '1.5px solid #ffae00',
      borderRadius: '0 10px 0 0',
      borderBottom: 'none',
      borderLeft: 'none'
    }}></div>
    
    {/* Bottom-Left Corner Border */}
    <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4" style={{
      border: '1.5px solid #ffae00',
      borderRadius: '0 0 0 10px',
      borderTop: 'none',
      borderRight: 'none'
    }}></div>
    
    {/* Bottom-Right Corner Border */}
    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4" style={{
      border: '1.5px solid #ffae00',
      borderRadius: '0 0 10px 0',
      borderTop: 'none',
      borderLeft: 'none'
    }}></div>
    
    {/* Content */}
    <div className="relative z-10 h-full w-full p-5 flex flex-col">
      {children}
    </div>
  </div>
);

/**
 * TabButton - Tab navigation button
 */
export const TabButton = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all border-b-2 flex-1 justify-center
      ${active 
        ? 'border-b-2' 
        : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'}
    `}
    style={{
      borderBottomColor: active ? '#ffae00' : 'transparent',
      color: active ? '#ffae00' : 'rgba(255, 255, 255, 0.4)',
      backgroundColor: active ? 'rgba(255, 174, 0, 0.05)' : 'transparent',
      fontSize: '10px',
      fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
      letterSpacing: '0.1em'
    }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

/**
 * IconButton - Small circular icon button
 */
export const IconButton = ({ icon, onClick, variant = 'default', className = '' }) => {
  const variants = {
    default: {
      border: 'rgba(255, 255, 255, 0.2)',
      color: 'rgba(255, 255, 255, 0.5)',
      hoverColor: '#ffae00',
      hoverBorder: '#ffae00',
      hoverShadow: '0 0 20px rgba(255, 174, 0, 0.6)'
    },
    green: {
      border: 'rgba(0, 255, 157, 0.5)',
      color: 'rgba(0, 255, 157, 0.7)',
      hoverColor: '#00ff9d',
      hoverBorder: '#00ff9d',
      hoverShadow: '0 0 20px rgba(0, 255, 157, 0.6)'
    },
    purple: {
      border: 'rgba(188, 19, 254, 0.5)',
      color: 'rgba(188, 19, 254, 0.7)',
      hoverColor: '#bc13fe',
      hoverBorder: '#bc13fe',
      hoverShadow: '0 0 20px rgba(188, 19, 254, 0.6)'
    }
  };

  const style = variants[variant] || variants.default;

  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 flex items-center justify-center transition-all rounded-lg group ${className}`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        border: `1px solid ${style.border}`,
        color: style.color
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = style.hoverColor;
        e.currentTarget.style.borderColor = style.hoverBorder;
        e.currentTarget.style.boxShadow = style.hoverShadow;
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = style.color;
        e.currentTarget.style.borderColor = style.border;
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {icon}
    </button>
  );
};

/**
 * LoadingSpinner - Sci-fi loading animation
 */
export const LoadingSpinner = ({ message = 'SYNCHRONIZING...' }) => (
  <div 
    className="min-h-screen flex flex-col items-center justify-center font-mono"
    style={{ backgroundColor: '#030005', color: '#ffae00' }}
  >
    <div className="mb-4 animate-spin" style={{ animationDuration: '20s' }}>
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="#bc13fe" strokeWidth="1.5">
        <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
      </svg>
    </div>
    <div 
      className="text-xs tracking-widest animate-pulse"
      style={{ letterSpacing: '0.5em' }}
    >
      {message}
    </div>
  </div>
);

/**
 * Modal - Overlay modal component
 */
export const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer animate-fadeIn"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div 
        className="cursor-default animate-zoomIn"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '400px' }}
      >
        {children}
      </div>
    </div>
  );
};

export default {
  HoloCard,
  GlowButton,
  TechBadge,
  SectionHeader,
  SectorFrame,
  TabButton,
  IconButton,
  LoadingSpinner,
  Modal
};
