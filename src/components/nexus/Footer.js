import React from 'react';
import '../../styles/text.css';

export const Footer = () => {
  return (
    <footer className="relative z-30 h-16 md:h-20 border-t border-cyan-500/10 flex items-center justify-between px-4 md:px-8 text-[7px] md:text-[9px] text-cyan-400/50 uppercase bg-black/40">
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex flex-col leading-tight">
          <span className="text-white/20 text-[9px] md:text-[11px]">NODE</span>
          <span className="text-amber-500/80 truncate text-[10px] md:text-[13px]">v4.8-P</span>
        </div>
        <div className="h-4 w-px bg-cyan-500/10 hidden md:block" />
        <div className="flex items-center gap-1">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 animate-pulse" />
           <span className="tracking-tighter hidden sm:inline text-[9px] md:text-[11px]">SYNC_OK</span>
        </div>
      </div>

      {/* Center Icon */}
      <div className="hidden md:flex items-center gap-6">
        <div className="w-6 h-6 border border-cyan-500/20 flex items-center justify-center transform rotate-45">
           <div className="w-3 h-3 border border-rose-500/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-cyan-400/60" />
           </div>
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[8px] md:text-[10px] tracking-[0.2em] opacity-40">SECURE_L7</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 text-right">
        <div className="flex flex-col leading-tight">
          <span className="text-white/20 text-[9px] md:text-[11px]">LOAD</span>
          <span className="text-cyan-400/70 font-mono text-[10px] md:text-[13px]">1.2 TB/S</span>
        </div>
        <div className="grid grid-cols-2 gap-0.5 scale-100 md:scale-125">
          <div className="w-2.5 h-2.5 border border-cyan-500/20 flex items-center justify-center">
            <div className="w-1 h-1 bg-rose-500/40" />
          </div>
          <div className="w-2.5 h-2.5 border border-cyan-500/20 flex items-center justify-center">
            <div className="w-1 h-1 bg-amber-500/40" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
