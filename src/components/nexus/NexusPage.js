import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { VisualCore } from './VisualCore';
import { WaveAnalysis } from './WaveAnalysis';
import { Footer } from './Footer';
import '../../styles/text.css';

export const NexusPage = ({ onBack }) => {
  const [timestamp, setTimestamp] = useState(new Date().toISOString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col font-mono text-cyan-400 selection:bg-cyan-500/30 touch-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&display=swap');
        
        .nexus-container {
          font-family: 'Figtree', sans-serif;
        }

        .glow-cyan { text-shadow: 0 0 10px rgba(34, 211, 238, 0.5); }
        .glow-amber { text-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }
        .border-glow-cyan { box-shadow: 0 0 15px rgba(34, 211, 238, 0.2); }
        
        .scanline {
            width: 100%;
            height: 2px;
            background: rgba(167, 59, 198, 0.1);
            position: absolute;
            z-index: 50;
            pointer-events: none;
            animation: scanline 8s linear infinite;
        }

        @keyframes scanline {
            0% { top: 0; }
            100% { top: 100%; }
        }

        .flicker {
            animation: flicker 2s infinite;
        }

        @keyframes flicker {
            0% { opacity: 0.8; }
            5% { opacity: 0.5; }
            10% { opacity: 0.9; }
            15% { opacity: 0.6; }
            20% { opacity: 1; }
            100% { opacity: 0.9; }
        }
      `}</style>

      {/* Visual FX Layers */}
      <div className="scanline" />
      
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-50 px-3 py-1.5 border border-cyan-500/30 bg-black/60 text-cyan-400 text-[10px] uppercase tracking-wider hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300"
        >
          ← Back
        </button>
      )}
      
      {/* Main Unified Holographic Container */}
      <div className="nexus-container relative flex-1 m-2 md:m-4 border border-white/10 z-20 flex flex-col overflow-hidden bg-black/20">
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/20 pointer-events-none" />

        <div className="p-3 md:p-4 shrink-0">
          <Header timestamp={timestamp} />
        </div>

        {/* Responsive Content Flow */}
        <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 px-3 md:px-6 pb-1 md:pb-2 overflow-hidden">
          {/* Main Visual Core - Top on Mobile, Left on Desktop */}
          <div className="flex-[2] md:flex-[3] relative border border-white/5 overflow-hidden flex items-center justify-center min-h-[300px]">
             <div className="absolute top-2 left-2 px-2 py-0.5 border border-white/10 bg-black/40 text-[7px] md:text-[9px] text-white/40 uppercase tracking-widest z-10">
                Core_Node_View
             </div>
             <VisualCore />
          </div>

          {/* Metrics Panel - Bottom on Mobile, Right on Desktop */}
          <div className="flex-1 min-h-0 flex flex-col border-t md:border-t-0 md:border-l border-white/5 pt-1 md:pt-0 md:pl-4 overflow-hidden">
             <WaveAnalysis />
          </div>
        </div>

        <div className="shrink-0">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default NexusPage;
