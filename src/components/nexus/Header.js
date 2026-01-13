import React from 'react';
import '../../styles/text.css';

export const Header = ({ timestamp }) => {
  return (
    <header className="relative z-30 border-b border-cyan-500/10 pb-3 md:pb-4">
      {/* Top Row - System Identification */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Logo/Identifier */}
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 md:w-8 md:h-8">
              <div className="absolute inset-0 border border-cyan-500/40 transform rotate-45" />
              <div className="absolute inset-1 border border-amber-500/40 transform rotate-45" />
              <div className="absolute inset-2 bg-cyan-500/20 transform rotate-45" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] md:text-xs font-bold text-white tracking-[0.3em] uppercase">NEXUS</span>
              <span className="text-[7px] md:text-[8px] text-cyan-400/60 tracking-[0.2em]">VISUAL_SYS</span>
            </div>
          </div>
          
          <div className="h-4 w-px bg-cyan-500/20 hidden md:block" />
          
          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[8px] text-green-400/80 uppercase tracking-wider">Online</span>
          </div>
        </div>

        {/* Center Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-[8px] md:text-[10px] text-white/30 uppercase tracking-[0.4em]">Data_Core</span>
          <span className="text-[6px] md:text-[7px] text-cyan-400/40 font-mono">{timestamp}</span>
        </div>

        {/* Right Side - Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-1">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="w-2 h-2 border border-cyan-500/30 flex items-center justify-center"
              >
                <div className={`w-0.5 h-0.5 ${i === 1 ? 'bg-green-500' : i === 2 ? 'bg-amber-500' : 'bg-cyan-500'}`} />
              </div>
            ))}
          </div>
          
          <div className="flex flex-col items-end leading-none">
            <span className="text-[7px] md:text-[8px] text-white/40 uppercase">NODE</span>
            <span className="text-[9px] md:text-[10px] text-cyan-400 font-mono">4.8-P</span>
          </div>
        </div>
      </div>

      {/* Bottom Row - Navigation/Metrics Bar */}
      <div className="flex items-center justify-between text-[6px] md:text-[7px] text-white/30 uppercase tracking-[0.15em] mt-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-4 md:gap-8">
          <span className="hover:text-cyan-400 transition-colors cursor-pointer">Overview</span>
          <span className="hover:text-cyan-400 transition-colors cursor-pointer text-cyan-400">Core_View</span>
          <span className="hover:text-cyan-400 transition-colors cursor-pointer hidden sm:inline">Analytics</span>
          <span className="hover:text-cyan-400 transition-colors cursor-pointer hidden md:inline">Config</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-amber-500/60">UPLINK: 98.4%</span>
          <span className="hidden sm:inline">LATENCY: 12ms</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
