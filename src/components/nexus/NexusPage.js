import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { VisualCore } from './VisualCore';
import { WaveAnalysis } from './WaveAnalysis';
import { Footer } from './Footer';
import '../../styles/text.css';

export const NexusPage = ({ onBack }) => {
  const [timestamp, setTimestamp] = useState(new Date().toISOString());
  const [timezone, setTimezone] = useState(null);

  useEffect(() => {
    // Fetch user's timezone from IP once on mount
    const fetchTimezone = async () => {
      try {
        const response = await fetch('https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyDummy', {
          method: 'POST'
        }).catch(() => {
          // Fallback to ipapi.co if Google fails
          return fetch('https://ipapi.co/json/');
        });
        
        const data = await response.json();
        const tz = data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(tz);
      } catch (error) {
        // Use browser's default timezone
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
    };

    fetchTimezone();

    // Update timestamp every second locally
    const timer = setInterval(() => {
      if (timezone) {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        
        const now = new Date();
        const localDateTime = formatter.format(now);
        setTimestamp(localDateTime);
      } else {
        setTimestamp(new Date().toISOString());
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timezone]);

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
          className="absolute z-50 border border-cyan-500/30 bg-black/60 text-cyan-400 uppercase tracking-wider hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300"
          style={{
            top: 'clamp(0.5rem, 1vw, 1rem)',
            left: 'clamp(0.5rem, 1vw, 1rem)',
            padding: 'clamp(0.39rem, 0.78vw, 0.65rem) clamp(0.65rem, 1.3vw, 0.975rem)',
            fontSize: 'clamp(0.65rem, 0.975vw, 0.845rem)'
          }}
        >
          ← Back
        </button>
      )}
      
      {/* Main Unified Holographic Container */}
      <div className="nexus-container relative flex-1 border border-white/10 z-20 flex flex-col overflow-hidden bg-black/20" style={{
        margin: 'clamp(0.5rem, 1.5vw, 1.5rem)'
      }}>
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 border-t-2 border-l-2 border-white/20 pointer-events-none" style={{
          width: 'clamp(1rem, 3vw, 2rem)',
          height: 'clamp(1rem, 3vw, 2rem)'
        }} />
        <div className="absolute top-0 right-0 border-t-2 border-r-2 border-white/20 pointer-events-none" style={{
          width: 'clamp(1rem, 3vw, 2rem)',
          height: 'clamp(1rem, 3vw, 2rem)'
        }} />
        <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-white/20 pointer-events-none" style={{
          width: 'clamp(1rem, 3vw, 2rem)',
          height: 'clamp(1rem, 3vw, 2rem)'
        }} />
        <div className="absolute bottom-0 right-0 border-b-2 border-r-2 border-white/20 pointer-events-none" style={{
          width: 'clamp(1rem, 3vw, 2rem)',
          height: 'clamp(1rem, 3vw, 2rem)'
        }} />

        <div className="shrink-0" style={{
          padding: 'clamp(0.5rem, 1.5vw, 1.5rem)'
        }}>
          <Header timestamp={timestamp} />
        </div>

        {/* Responsive Content Flow */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden" style={{
          gap: 'clamp(0.5rem, 1.5vw, 1.5rem)',
          padding: `clamp(2rem, 3vw, 3rem) clamp(0.75rem, 2vw, 2rem) clamp(0.25rem, 0.75vw, 1rem) clamp(0.75rem, 2vw, 2rem)`
        }}>
          {/* Main Visual Core - Top on Mobile, Left on Desktop */}
          <div className="flex-[2] md:flex-[3] relative border border-white/5 overflow-hidden flex items-center justify-center" style={{
            minHeight: 'clamp(12rem, 40vh, 30rem)'
          }}>
             <div className="absolute top-0 left-0 border border-white/10 bg-black/40 text-white/40 uppercase tracking-widest z-10" style={{
               padding: 'clamp(0.25rem, 0.5vw, 0.375rem) clamp(0.5rem, 1vw, 0.75rem)',
               fontSize: 'clamp(0.35rem, 0.55vw, 0.5rem)'
             }}>
                Core_Node_View
             </div>
             <VisualCore />
          </div>

          {/* Metrics Panel - Bottom on Mobile, Right on Desktop */}
          <div className="flex-1 min-h-0 flex flex-col border-t md:border-t-0 md:border-l border-white/5" style={{
            paddingTop: 'clamp(0.25rem, 0.75vw, 0.5rem)',
            paddingLeft: 'clamp(0, 2vw, 1rem)'
          }}>
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
