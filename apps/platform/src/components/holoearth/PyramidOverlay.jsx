import React from 'react';

const PyramidOverlay = ({ animate = false, scrollProgress = 0 }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-8 flex flex-col justify-between z-10">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 tracking-tighter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
            HOLO<span className="text-white">PYRAMID</span>
          </h1>
          <p className="text-xs text-purple-300/70 tracking-[0.2em] mt-1">SYSTEM ANALYZER V.4.0.2</p>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-orange-400 font-mono border border-orange-500/30 px-2 py-1 bg-orange-900/20 rounded">
            {animate ? 'SEQUENCE: EXTRACTION' : 'SEQUENCE: IDLE'}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex justify-between items-end">
        <div className="w-48">
          <div className="h-[2px] w-full bg-gray-800 relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-cyan-500 transition-all duration-300 ease-out"
              style={{ width: `${scrollProgress * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
            <span>INIT</span>
            <span>COMPLETE</span>
          </div>
        </div>

        <div className="flex gap-4 text-xs font-mono text-gray-400">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></div>
             <span>CORE ACTIVE</span>
           </div>
        </div>
      </div>
      
      {/* Scanlines Effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(255,255,255,0),
            rgba(255,255,255,0) 50%,
            rgba(0,0,0,0.15) 50%,
            rgba(0,0,0,0.15)
          )`,
          backgroundSize: '100% 4px'
        }}
      ></div>
    </div>
  );
};

export default PyramidOverlay;
