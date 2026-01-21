import React from 'react';
import { motion } from 'framer-motion';
import { CornerDownRight } from 'lucide-react';

// HoloCard - Main content card with purple holographic border effect
export const HoloCard = ({ children, className = '', title, noPadding = false }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Main Content - Purple border */}
      <div className="relative h-full bg-transparent border border-purple-500/40 rounded-lg overflow-hidden flex flex-col">
        {/* Content */}
        <div className={`flex-1 ${noPadding ? '' : 'p-6'}`}>
          {children}
        </div>

        {/* Corner Accents - Purple */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500 rounded-tl-md"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500 rounded-br-md"></div>
      </div>
    </div>
  );
};

// GlowButton - Cyberpunk-style button with glow effect
export const GlowButton = ({ children, variant = 'primary', icon, className = '', onClick, ...props }) => {
  const baseStyles = "relative px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 group overflow-hidden";
  
  const variants = {
    primary: "text-black bg-cyan-400 hover:bg-white shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_30px_rgba(0,243,255,0.8)]",
    secondary: "text-cyan-400 border border-cyan-400/50 hover:bg-cyan-400/10 hover:border-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.1)]",
    danger: "text-white bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} onClick={onClick} {...props}>
      {/* Shine effect */}
      <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 group-hover:animate-[shine_1s_ease-in-out]"></div>
      
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
      
      {/* Decorative corner */}
      <CornerDownRight size={12} className="absolute bottom-1 right-1 opacity-50" />
    </button>
  );
};

// TechBadge - Technology tag display
export const TechBadge = ({ label }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium" style={{
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    color: '#FFFEF0',
    border: '1px solid rgba(168, 85, 247, 0.6)',
    boxShadow: '0 0 8px rgba(168, 85, 247, 0.15)'
  }}>
    {label}
  </span>
);

// SectionHeader - Styled section title
export const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-4 relative pl-4 border-l-2" style={{
    borderLeftColor: 'rgba(168, 85, 247, 0.8)',
    backgroundImage: 'linear-gradient(to right, rgba(168, 85, 247, 0.1), transparent)',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    paddingRight: '1rem',
    transform: 'scale(0.8)',
    transformOrigin: 'left center'
  }}>
    <h2 className="text-lg font-bold uppercase tracking-tighter poetry" style={{
      color: '#FFFEF0',
      textShadow: '0 0 10px rgba(168, 85, 247, 0.6)',
      fontSize: 'clamp(0.9rem, 1.8vw, 1.5rem)'
    }}>
      {title}
    </h2>
    {subtitle && <p className="text-slate-400 font-mono text-xs mt-1">{subtitle}</p>}
  </div>
);

// LoadingScreen - Full-page loading animation
export const LoadingScreen = () => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6 }}
    className="min-h-screen bg-black flex flex-col items-center justify-center text-cyan-400 font-mono relative overflow-hidden"
  >
    {/* Grid background */}
    <div className="absolute inset-0 opacity-20 animate-pulse" style={{
      backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.05) 1px, transparent 1px)',
      backgroundSize: '40px 40px'
    }}></div>
    
    <div className="z-10 flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_#00f3ff]"></div>
      <div className="text-xl tracking-widest animate-pulse">INITIALIZING...</div>
    </div>
  </motion.div>
);
