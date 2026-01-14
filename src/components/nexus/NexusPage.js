import React, { useState, useEffect, useRef } from 'react';
import { Header } from './Header';
import { VisualCore } from './VisualCore';
import { WaveAnalysis } from './WaveAnalysis';
import { Footer } from './Footer';
import sun2 from '../../images/illustrativesun.png';
import '../../styles/text.css';

export const NexusPage = ({ onBack }) => {
  const [timestamp, setTimestamp] = useState(new Date().toISOString());
  const [timezone, setTimezone] = useState(null);
  const [activeLabel, setActiveLabel] = useState(null);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const visualCoreRef = useRef(null);
  
  // Track metric values for completion tracking
  const [metricValues, setMetricValues] = useState({
    radius: { '01_MSR': '', '02_DEV': '', '03_FLD': '', '04_SYN': '' },
    syncAlign: { '01_ALN': '', '02_PHS': '', '03_FRQ': '', '04_COH': '' },
    dataLink: { '01_CHN': '', '02_BND': '', '03_SIG': '', '04_PKT': '' }
  });

  // Track label completions and sync percentage
  const [completedLabels, setCompletedLabels] = useState({
    radius: false,
    syncAlign: false,
    dataLink: false
  });
  
  const [syncPercentage, setSyncPercentage] = useState(0);
  const [animatingLabel, setAnimatingLabel] = useState(null);
  const [showCompletionGlow, setShowCompletionGlow] = useState(false);
  const [showButtonGlow, setShowButtonGlow] = useState(false);

  // Trigger button glow after fade-in animation completes plus 0.5s delay
  useEffect(() => {
    const glowTimer = setTimeout(() => {
      setShowButtonGlow(true);
    }, 4100);
    return () => clearTimeout(glowTimer);
  }, []);

  // Monitor label completions for state tracking only (not animation)
  useEffect(() => {
    // Check if a label is complete
    const isLabelComplete = (label) => {
      if (!metricValues[label]) return false;
      return Object.values(metricValues[label]).every(v => v.trim() !== '');
    };

    const newCompleted = {
      radius: isLabelComplete('radius'),
      syncAlign: isLabelComplete('syncAlign'),
      dataLink: isLabelComplete('dataLink')
    };

    // Update completed labels state without triggering animation
    // Animation will be triggered by handleSendLabel button click instead
    if (newCompleted.radius && !completedLabels.radius) {
      setCompletedLabels(prev => ({ ...prev, radius: true }));
    }
    if (newCompleted.syncAlign && !completedLabels.syncAlign) {
      setCompletedLabels(prev => ({ ...prev, syncAlign: true }));
    }
    if (newCompleted.dataLink && !completedLabels.dataLink) {
      setCompletedLabels(prev => ({ ...prev, dataLink: true }));
    }
  }, [metricValues, completedLabels]);

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

  // Handle metric value updates
  const handleMetricChange = (label, metricId, value) => {
    setMetricValues(prev => ({
      ...prev,
      [label]: {
        ...prev[label],
        [metricId]: value
      }
    }));
  };

  // Handle sending/confirming a label
  const handleSendLabel = (label) => {
    // Trigger animation when button is clicked
    setAnimatingLabel(label);
    
    // Mark label as completed in VisualCore
    if (visualCoreRef.current) {
      visualCoreRef.current.markLabelSent(label);
    }
    
    // Update sync percentage based on which label was sent
    setTimeout(() => {
      if (label === 'radius') {
        setSyncPercentage(33);
      } else if (label === 'syncAlign') {
        setSyncPercentage(66);
      } else if (label === 'dataLink') {
        setSyncPercentage(99);
      }
      setAnimatingLabel(null);
    }, 1500); // Animation duration
    
    // Move to next label
    const labelOrder = ['radius', 'syncAlign', 'dataLink'];
    const currentIndex = labelOrder.indexOf(label);
    
    if (currentIndex < labelOrder.length - 1) {
      // Move to next label
      const nextLabel = labelOrder[currentIndex + 1];
      setTimeout(() => {
        setActiveLabel(nextLabel);
      }, 1500); // Wait for animation to complete
    } else {
      // All labels complete - clear active label and show completion glow after animation
      setTimeout(() => {
        setActiveLabel(null);
        setShowCompletionGlow(true);
      }, 1500);
    }
  };

  // Callback for when a label is sent - called by VisualCore
  const onLabelSentCallback = (label) => {
    // VisualCore will handle updating its own completedLabels state
    // This is just a notification hook if needed
  };

  // Callback for when user closes the GEBRUIKSAANWIJZING modal
  const handleModalClosed = () => {
    setHasReadInstructions(true);
    setActiveLabel('radius'); // Show first label forms when blur disappears
  };

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col font-mono touch-none" style={{ color: '#15B315' }}>
      {/* Sun Logo - Persistent across content */}
      <button
        onClick={() => window.location.href = '/login'}
        className="absolute right-6 p-2 hover:opacity-80 transition-opacity duration-300"
        style={{ top: 'calc(1.5rem + 0.4rem)', zIndex: 60, filter: 'none', mixBlendMode: 'screen', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
        title="Go to login"
      >
        <img src={sun2} alt="Login" style={{ width: '55px', height: '55px', transformOrigin: 'center', rotate: '-30deg', pointerEvents: 'none', display: 'block', filter: 'none' }} />
      </button>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&display=swap');
        
        .nexus-container {
          font-family: 'Figtree', sans-serif;
        }

        .glow-cyan { text-shadow: 0 0 10px rgba(21, 179, 21, 0.5); }
        .glow-amber { text-shadow: 0 0 10px rgba(251, 191, 36, 0.7); }
        .border-glow-cyan { box-shadow: 0 0 15px rgba(21, 179, 21, 0.2); }
        
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

        @keyframes flowToApex {
            0% {
                transform: translate(-50%, 0) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, calc(-100vh + clamp(1%, 2vh, 8%) + 80px + 25rem)) scale(0.1);
                opacity: 0;
            }
        }

        .floating-wave-analysis {
            animation: flowToApex 1s linear forwards;
            transform-origin: center center;
            pointer-events: none;
        }
      `}</style>

      {/* Visual FX Layers */}
      <div className="scanline" />
      
      {/* Main Unified Holographic Container */}
      <div className="nexus-container relative flex-1 border border-white/10 z-20 flex flex-col overflow-hidden bg-black/20" style={{
        margin: 'clamp(0.5rem, 1.5vw, 1.5rem)',
        touchAction: 'manipulation'
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
          <Header timestamp={timestamp} onModalStateChange={setIsModalOpen} onModalClosed={handleModalClosed} showButtonGlow={showButtonGlow} />
        </div>

        {/* Responsive Content Flow */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden" style={{
          gap: 'clamp(0.5rem, 1.5vw, 1.5rem)',
          padding: `clamp(2rem, 3vw, 3rem) clamp(0.75rem, 2vw, 2rem) clamp(0.25rem, 0.75vw, 1rem) clamp(0.75rem, 2vw, 2rem)`,
          marginTop: '-5rem'
        }}>
          {/* Main Visual Core - Top on Mobile, Left on Desktop */}
          <div className="flex-[2] md:flex-[3] relative overflow-visible flex items-center justify-center" style={{
            minHeight: 'clamp(8rem, 30vh, 22rem)',
            marginBottom: '-100px'
          }}>
             <div className="absolute top-0 left-0 border border-white/10 bg-black/40 text-white/40 uppercase tracking-widest z-10" style={{
               padding: 'clamp(0.25rem, 0.5vw, 0.375rem) clamp(0.5rem, 1vw, 0.75rem)',
               fontSize: 'clamp(0.35rem, 0.55vw, 0.5rem)'
             }}>
                CORE_NODE_YUGENESIS
             </div>
             <VisualCore ref={visualCoreRef} activeLabel={activeLabel} onLabelClick={setActiveLabel} onLabelSent={onLabelSentCallback} metricValues={metricValues} allLabelsComplete={showCompletionGlow} syncPercentage={syncPercentage} hasReadInstructions={hasReadInstructions} />
          </div>

          {/* Metrics Panel - Bottom on Mobile, Right on Desktop */}
          <div className="flex-1 min-h-0 flex flex-col border-t md:border-t-0 md:border-l border-white/5" style={{
            paddingTop: 'clamp(0.25rem, 0.75vw, 0.5rem)',
            paddingLeft: 'clamp(0, 2vw, 1rem)'
          }}>
             <WaveAnalysis activeLabel={activeLabel} metricValues={metricValues} onMetricChange={handleMetricChange} onSendLabel={handleSendLabel} hasReadInstructions={hasReadInstructions} />
          </div>
        </div>

        <div className="shrink-0">
          <Footer />
        </div>
      </div>

      {/* Floating Wave Analysis Animation */}
      {animatingLabel && (
        <div 
          className="floating-wave-analysis fixed left-1/2 pointer-events-none z-40"
          style={{
            width: 'clamp(250px, 25vw, 350px)',
            top: '40%',
            transformOrigin: 'center center',
          }}
        >
          <div className="relative flex flex-col h-auto w-full border border-green-500/40 bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-sm p-3">
            {/* Animated Border Glow */}
            <div className="absolute inset-0 border border-green-500/20 rounded-sm pointer-events-none" />
            
            {/* Copy of WaveAnalysis Header */}
            <div className="flex items-center justify-between shrink-0 mb-3 relative z-10">
              <div className="border-l-2 border-green-500/60 bg-green-500/5 px-2 py-1">
                <span className="font-bold text-green-500 uppercase tracking-[0.2em] poetry text-xs">
                  Telemetry_Stream
                </span>
              </div>
              <span className="text-green-500/40 text-xs">SURGE</span>
            </div>
            
            {/* Simplified metric rows with glow effect */}
            <div className="flex-1 overflow-hidden space-y-2">
              {[1, 2, 3, 4].map((idx) => (
                <div 
                  key={idx} 
                  className="border border-green-500/20 bg-green-500/5 p-2 animate-pulse"
                  style={{
                    animation: `pulse 0.8s ease-in-out infinite`,
                    animationDelay: `${idx * 0.1}s`
                  }}
                >
                  <div className="h-2 bg-green-500/30 rounded-full w-full" />
                </div>
              ))}
            </div>
            
            {/* Bottom accent */}
            <div className="mt-2 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
          </div>
        </div>
      )}
    </div>
  );
};

export default NexusPage;
