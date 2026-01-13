import React from 'react';
import '../../styles/text.css';

export const Footer = () => {
  return (
    <footer className="relative z-30 flex items-center justify-between uppercase bg-black/40" style={{
      height: 'clamp(2rem, 8vh, 6rem)',
      padding: 'clamp(0.5rem, 1vw, 2rem) clamp(0.75rem, 2vw, 2rem)',
      fontSize: 'clamp(0.795rem, 3.634vw, 1.704rem)',
      borderTop: '1px solid rgba(21, 179, 21, 0.1)',
      color: 'rgba(21, 179, 21, 0.5)'
    }}>
      <div className="flex items-center" style={{
        gap: 'clamp(0.5rem, 1.5vw, 1.5rem)'
      }}>
        <div className="flex flex-col leading-tight">
          <span className="text-white/20" style={{
            fontSize: 'clamp(0.5rem, 0.7vw, 0.7rem)'
          }}>SCHADUW WERK</span>
          <span className="text-amber-500/80 truncate" style={{
            fontSize: 'clamp(0.55rem, 0.8vw, 0.8rem)'
          }}>FM/MF=MF/FM</span>
        </div>
        <div style={{
          height: 'clamp(0.75rem, 2vh, 1.5rem)',
          width: '1px',
          backgroundColor: 'rgba(21, 179, 21, 0.1)'
        }} />
        <div className="flex items-center hidden sm:flex" style={{
          gap: 'clamp(0.25rem, 0.5vw, 0.5rem)'
        }}>
           <div className="rounded-full animate-pulse" style={{
             width: 'clamp(0.5rem, 1vw, 0.75rem)',
             height: 'clamp(0.5rem, 1vw, 0.75rem)',
             backgroundColor: 'rgba(21, 179, 21, 0.8)'
           }} />
           <span className="tracking-tighter" style={{
             fontSize: 'clamp(0.5rem, 0.7vw, 0.7rem)'
           }}>SYNC_OK</span>
        </div>
      </div>

      {/* Center Icon */}
      <div className="hidden md:flex items-center" style={{
        gap: 'clamp(1rem, 3vw, 2.5rem)'
      }}>
        <div className="flex items-center justify-center" style={{
          width: 'clamp(1rem, 2.5vw, 1.5rem)',
          height: 'clamp(1rem, 2.5vw, 1.5rem)',
          transform: 'rotate(45deg)',
          border: '1px solid rgba(21, 179, 21, 0.2)'
        }}>
           <div className="border border-rose-500/30 flex items-center justify-center" style={{
             width: 'clamp(0.65rem, 1.5vw, 1rem)',
             height: 'clamp(0.65rem, 1.5vw, 1rem)'
           }}>
              <div style={{
                width: 'clamp(0.4rem, 0.8vw, 0.6rem)',
                height: 'clamp(0.4rem, 0.8vw, 0.6rem)',
                backgroundColor: 'rgba(21, 179, 21, 0.8)'
              }} />
           </div>
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="tracking-[0.2em] opacity-40" style={{
            fontSize: 'clamp(0.45rem, 0.65vw, 0.6rem)'
          }}>SECURE_L7</span>
        </div>
      </div>

      <div className="flex items-center text-right" style={{
        gap: 'clamp(0.5rem, 1vw, 1rem)'
      }}>
        <div className="flex flex-col leading-tight">
          <span className="text-white/20" style={{
            fontSize: 'clamp(0.5rem, 0.7vw, 0.7rem)'
          }}>LOAD</span>
          <span className="font-mono" style={{
            fontSize: 'clamp(0.55rem, 0.8vw, 0.8rem)',
            color: 'rgba(21, 179, 21, 0.7)'
          }}>1.2 TB/S</span>
        </div>
        <div className="grid grid-cols-2" style={{
          gap: 'clamp(0.125rem, 0.3vw, 0.25rem)',
          transform: 'scale(clamp(0.65, 1.5vw, 1.25))'
        }}>
          <div className="flex items-center justify-center" style={{
            width: 'clamp(0.65rem, 1.5vw, 1rem)',
            height: 'clamp(0.65rem, 1.5vw, 1rem)',
            border: '1px solid rgba(21, 179, 21, 0.2)'
          }}>
            <div className="bg-rose-500/40" style={{
              width: 'clamp(0.3rem, 0.6vw, 0.5rem)',
              height: 'clamp(0.3rem, 0.6vw, 0.5rem)'
            }} />
          </div>
          <div className="flex items-center justify-center" style={{
            width: 'clamp(0.65rem, 1.5vw, 1rem)',
            height: 'clamp(0.65rem, 1.5vw, 1rem)',
            border: '1px solid rgba(21, 179, 21, 0.2)'
          }}>
            <div className="bg-amber-500/40" style={{
              width: 'clamp(0.3rem, 0.6vw, 0.5rem)',
              height: 'clamp(0.3rem, 0.6vw, 0.5rem)'
            }} />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
