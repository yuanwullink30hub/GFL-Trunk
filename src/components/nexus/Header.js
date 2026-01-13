import React from 'react';
import '../../styles/text.css';

export const Header = ({ timestamp }) => {
  return (
    <header className="relative z-30 flex justify-between items-start uppercase tracking-widest text-cyan-500/80 md:pl-0" style={{
      fontSize: 'clamp(0.795rem, 3.634vw, 1.704rem)',
      gap: 'clamp(0.25rem, 1vw, 1rem)',
      marginLeft: '1rem'
    }}>
      {/* System Status Container - positioned under back button on mobile */}
      <div className="absolute left-4 top-14 md:relative md:top-auto md:left-auto flex flex-col" style={{
        gap: 'clamp(0.25rem, 0.5vw, 0.5rem)',
        left: 0,
        top: 'calc(3.5rem)'
      }}>
        <div className="flex items-center" style={{
          gap: 'clamp(0.5rem, 1vw, 1.5rem)'
        }}>
          <span className="bg-cyan-500/20 border border-cyan-500/40" style={{
            padding: 'clamp(0.125rem, 0.5vw, 0.375rem) clamp(0.25rem, 1vw, 0.75rem)',
            fontSize: 'clamp(0.5rem, 1vw, 0.75rem)'
          }}>SYSTEM STATUS: ACTIVE</span>
          <span className="opacity-60" style={{
            fontSize: 'clamp(0.5rem, 1vw, 0.75rem)'
          }}>X-LEVEL: 78.4</span>
        </div>
        <div className="h-[1px] bg-gradient-to-r from-cyan-500/40 to-transparent" style={{
          width: 'clamp(4rem, 15vw, 12rem)'
        }} />
      </div>

      {/* Center: Main Title */}
      <div className="flex flex-row items-center" style={{
        gap: 'clamp(0.5rem, 1vw, 1.5rem)',
        marginLeft: '3rem'
      }}>
        <div className="border-b border-r border-cyan-500/50 transform rotate-45" style={{
          width: 'clamp(1rem, 2vw, 1.5rem)',
          height: 'clamp(1rem, 2vw, 1.5rem)',
          transform: 'rotate(45deg)',
          flexShrink: 0
        }} />
        <div className="flex flex-col" style={{
          gap: 'clamp(0.25rem, 0.5vw, 0.5rem)'
        }}>
          <h1 className="font-bold tracking-[0.5em] text-white" style={{
            fontSize: 'clamp(0.75rem, 1.5vw, 1.25rem)',
            margin: 0
          }}>DELTA</h1>
          <div className="h-px bg-gradient-to-r from-cyan-500/40 to-cyan-500/40" style={{
            width: 'clamp(2rem, 4vw, 4rem)'
          }} />
          <div className="flex flex-row items-center" style={{
            gap: 'clamp(0.25rem, 0.5vw, 0.5rem)'
          }}>
            <h1 className="font-bold tracking-[0.5em] text-white" style={{
              fontSize: 'clamp(0.75rem, 1.5vw, 1.25rem)',
              margin: 0
            }}>WERKEN</h1>
            <h1 className="font-bold tracking-[0.5em] text-white" style={{
              fontSize: 'clamp(0.75rem, 1.5vw, 1.25rem)',
              margin: 0
            }}>4.9</h1>
          </div>
        </div>
      </div>

      {/* Right: Time & Encryption */}
      <div className="flex flex-col items-end" style={{
        gap: 'clamp(0.25rem, 0.5vw, 0.5rem)',
        fontSize: 'clamp(0.5rem, 0.75vw, 0.7rem)',
        flexShrink: 0
      }}>
        <div className="text-right" style={{
          whiteSpace: 'nowrap'
        }}>
          <div>TIME_SYNC: {timestamp}</div>
          <div className="text-amber-500/80 flicker">ENCRYPT: RSA_4096</div>
        </div>
      </div>
    </header>
  );
};;

export default Header;
