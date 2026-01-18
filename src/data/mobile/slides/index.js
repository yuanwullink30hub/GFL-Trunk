// Slide content components - all content lives here for single-page experience
import React from 'react';
import { motion } from 'framer-motion';
import holographicbody from '../../../images/holographicbody.png';
import Mindholo from '../../../components/Mindholo';
import Deltawerken from '../../../components/Deltawerken';

// Slideshow images
import karmanevents from '../../../images/slideshow images/karmaneventsPNG.png';
import club49logo from '../../../images/slideshow images/club49-logo.png';
import logo1111 from '../../../images/slideshow images/1111logo.png';
import placeholder4 from '../../../images/slideshow images/placeholder4.svg';
import placeholder5 from '../../../images/slideshow images/placeholder5.svg';
import placeholder6 from '../../../images/slideshow images/placeholder6.svg';
import placeholder7 from '../../../images/slideshow images/placeholder7.svg';
import placeholder8 from '../../../images/slideshow images/placeholder8.svg';
import rengiLogo from '../../../images/slideshow images/Rengi-logo.png';

// Individual slide content components
export const KarmanContent = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{
      opacity: { type: 'tween', duration: 0.6, ease: 'easeInOut' },
      scale: { type: 'tween', duration: 0.6, ease: 'easeInOut' }
    }}
    style={{ position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', background: 'transparent', color: '#FFFEF0', overflow: 'hidden' }}
  >
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center' }}>
      <img src={karmanevents} alt="Karman" style={{ width: 'clamp(120px, 40vw, 280px)', height: 'clamp(120px, 40vw, 280px)', objectFit: 'contain', marginBottom: 'clamp(1rem, 3vw, 2rem)' }} />
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(34, 197, 94)' }}>KARMAN</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>
        Amsterdam-based techno organization, born from a desire to restore the raw, intimate spirit of underground gatherings.
      </p>
    </div>
  </motion.div>
);

export const Code49Content = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{
      opacity: { type: 'tween', duration: 0.6, ease: 'easeInOut' },
      scale: { type: 'tween', duration: 0.6, ease: 'easeInOut' }
    }}
    style={{ position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', background: 'transparent', color: '#FFFEF0', overflow: 'hidden' }}
  >
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center' }}>
      <img src={club49logo} alt="Code 49" style={{ width: 'clamp(120px, 40vw, 280px)', height: 'clamp(120px, 40vw, 280px)', objectFit: 'contain', marginBottom: 'clamp(1rem, 3vw, 2rem)' }} />
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(59, 130, 246)' }}>CODE 49</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>
        De nr.1 Businessclub voor MKB-ondernemers die willen doorschalen in een AI-first economie
      </p>
    </div>
  </motion.div>
);

export const TattooShopContent = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{
      opacity: { type: 'tween', duration: 0.6, ease: 'easeInOut' },
      scale: { type: 'tween', duration: 0.6, ease: 'easeInOut' }
    }}
    style={{ position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', background: 'transparent', color: '#FFFEF0', overflow: 'hidden' }}
  >
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center' }}>
      <img src={logo1111} alt="Tattoo Shop" style={{ width: 'clamp(120px, 40vw, 280px)', height: 'clamp(120px, 40vw, 280px)', objectFit: 'contain', marginBottom: 'clamp(1rem, 3vw, 2rem)' }} />
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(168, 85, 247)' }}>TATTOO SHOP</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>
        Our focus goes beyond body art; we channel personal stories into spiritual expressions.
      </p>
    </div>
  </motion.div>
);

export const Slide4Content = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{
      opacity: { type: 'tween', duration: 0.6, ease: 'easeInOut' },
      scale: { type: 'tween', duration: 0.6, ease: 'easeInOut' }
    }}
    style={{ position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', background: 'transparent', color: '#FFFEF0', overflow: 'hidden' }}
  >
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center' }}>
      <img src={placeholder4} alt="Slide 4" style={{ width: 'clamp(120px, 40vw, 280px)', height: 'clamp(120px, 40vw, 280px)', objectFit: 'contain', marginBottom: 'clamp(1rem, 3vw, 2rem)' }} />
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(249, 115, 22)' }}>Slide 4</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>Description</p>
    </div>
  </motion.div>
);

export const Slide5Content = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{
      opacity: { type: 'tween', duration: 0.6, ease: 'easeInOut' },
      scale: { type: 'tween', duration: 0.6, ease: 'easeInOut' }
    }}
    style={{ position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', background: 'transparent', color: '#FFFEF0', overflow: 'hidden' }}
  >
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center' }}>
      <img src={placeholder5} alt="Slide 5" style={{ width: 'clamp(120px, 40vw, 280px)', height: 'clamp(120px, 40vw, 280px)', objectFit: 'contain', marginBottom: 'clamp(1rem, 3vw, 2rem)' }} />
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(236, 72, 153)' }}>Slide 5</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>Description</p>
    </div>
  </motion.div>
);

export const Slide6Content = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{
      opacity: { type: 'tween', duration: 0.6, ease: 'easeInOut' },
      scale: { type: 'tween', duration: 0.6, ease: 'easeInOut' }
    }}
    style={{ position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', background: 'transparent', color: '#FFFEF0', overflow: 'hidden' }}
  >
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center' }}>
      <img src={placeholder6} alt="Slide 6" style={{ width: 'clamp(120px, 40vw, 280px)', height: 'clamp(120px, 40vw, 280px)', objectFit: 'contain', marginBottom: 'clamp(1rem, 3vw, 2rem)' }} />
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(139, 92, 246)' }}>Slide 6</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>Description</p>
    </div>
  </motion.div>
);

export const Slide7Content = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{
      opacity: { type: 'tween', duration: 0.6, ease: 'easeInOut' },
      scale: { type: 'tween', duration: 0.6, ease: 'easeInOut' }
    }}
    style={{ position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', background: 'transparent', color: '#FFFEF0', overflow: 'hidden' }}
  >
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center' }}>
      <img src={placeholder7} alt="Slide 7" style={{ width: 'clamp(120px, 40vw, 280px)', height: 'clamp(120px, 40vw, 280px)', objectFit: 'contain', marginBottom: 'clamp(1rem, 3vw, 2rem)' }} />
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(14, 165, 233)' }}>Slide 7</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>Description</p>
    </div>
  </motion.div>
);

export const Slide8Content = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{
      opacity: { type: 'tween', duration: 0.6, ease: 'easeInOut' },
      scale: { type: 'tween', duration: 0.6, ease: 'easeInOut' }
    }}
    style={{ position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', background: 'transparent', color: '#FFFEF0', overflow: 'hidden' }}
  >
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center' }}>
      <img src={placeholder8} alt="Slide 8" style={{ width: 'clamp(120px, 40vw, 280px)', height: 'clamp(120px, 40vw, 280px)', objectFit: 'contain', marginBottom: 'clamp(1rem, 3vw, 2rem)' }} />
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(34, 197, 94)' }}>Slide 8</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>Description</p>
    </div>
  </motion.div>
);

export const RengiFoodsContent = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{
      opacity: { type: 'tween', duration: 0.6, ease: 'easeInOut' },
      scale: { type: 'tween', duration: 0.6, ease: 'easeInOut' }
    }}
    style={{ position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', background: 'transparent', color: '#FFFEF0', overflow: 'hidden' }}
  >
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center' }}>
      <img src={rengiLogo} alt="Rengi Foods" style={{ width: 'clamp(120px, 40vw, 280px)', height: 'clamp(120px, 40vw, 280px)', objectFit: 'contain', marginBottom: 'clamp(1rem, 3vw, 2rem)' }} />
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(251, 146, 60)' }}>RENGI FOODS</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>
        Rengi Foods captures the vibrant spirit of Korean street food, offering authentic and affordable flavors.
      </p>
    </div>
  </motion.div>
);

export const TeachersContent = ({ onBack, onBackToButton, activeView }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', background: 'transparent', color: '#FFFEF0', overflow: 'hidden' }}>
    {/* Content placeholder - empty for now */}
  </div>
);

export const MindContent = ({ onBack, onBackToButton, activeView }) => (
  <div style={{ 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    width: '100vw', 
    height: '100vh', 
    background: 'transparent', 
    color: '#FFFEF0', 
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <div style={{
      transform: 'scale(0.85)',
      transformOrigin: 'center center'
    }}>
      <Mindholo nodeCount={200} showScanline={true} />
    </div>
  </div>
);

export const SoulContent = ({ onBack, onBackToButton, activeView }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', background: 'transparent', color: '#FFFEF0', overflow: 'hidden' }}>
    {/* Header with triangle border image */}
    <div style={{
      position: 'absolute',
      top: 'clamp(5rem, 10vw, 7.5rem)',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'clamp(20rem, 90vw, 75rem)',
      zIndex: 2
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
        <motion.svg 
          animate={{ scale: [1.5, 1.62, 1.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
          width="clamp(80.5px, 25.2vw, 151.2px)" height="clamp(80.5px, 25.2vw, 151.2px)" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible', width: 'clamp(80.5px, 25.2vw, 151.2px)', height: 'clamp(80.5px, 25.2vw, 151.2px)', pointerEvents: 'none', scale: 1.5 }}>
          <g style={{ overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
              <clipPath id="triangle-soul-clip">
                <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" />
              </clipPath>
            </defs>
            <image href={holographicbody} x="30" y="100.5" width="232" height="204" preserveAspectRatio="xMidYMid slice" clipPath="url(#triangle-soul-clip)" style={{pointerEvents: 'none'}} />
            <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" fill="none" stroke="rgba(245, 158, 11, 0.75)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" className="breathStrokeButton1" style={{animation: 'breathStrokeSoul 2.5s ease-in-out infinite'}} />
          </g>
        </motion.svg>
      </div>
    </div>
  </div>
);

export const DeltawerkenContent = ({ onBack, onBackToButton, activeView }) => (
  <Deltawerken onBack={onBack} />
);

// Map route to content component
export const slideContentMap = {
  '/karman': KarmanContent,
  '/code49': Code49Content,
  '/tattooshop': TattooShopContent,
  '/slide4': Slide4Content,
  '/slide5': Slide5Content,
  '/slide6': Slide6Content,
  '/slide7': Slide7Content,
  '/slide8': Slide8Content,
  '/rengifoods': RengiFoodsContent,
  '/teachers': TeachersContent,
  '/mind': MindContent,
  '/soul': SoulContent,
  '/deltawerken': DeltawerkenContent
};
