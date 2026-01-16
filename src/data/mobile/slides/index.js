// Slide content components - all content lives here for single-page experience
import React from 'react';
import { motion } from 'framer-motion';
import knight from '../../../images/knightpng.png';
import logo from '../../../images/logo.png';

// Shared back button component
export const BackButton = ({ onBack }) => (
  <motion.button
    onClick={onBack}
    animate={{ borderColor: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'] }}
    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    style={{
      position: 'absolute',
      top: 'clamp(1rem, 4vw, 1.5rem)',
      left: 'clamp(1rem, 4vw, 1.5rem)',
      zIndex: 1001,
      background: 'rgba(0,0,0,0.5)',
      border: '2px solid #ef8616',
      borderRadius: '50%',
      width: 'clamp(2.5rem, 8vw, 3.5rem)',
      height: 'clamp(2.5rem, 8vw, 3.5rem)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ef8616',
      fontSize: 'clamp(16px, 5vw, 24px)'
    }}
  >
    ←
  </motion.button>
);

// Individual slide content components
export const KarmanContent = ({ onBack, onCloseSlide }) => (
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
    {/* Close button - circle with image */}
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center', marginBottom: 'clamp(1rem, 3vw, 3rem)' }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1], borderColor: ['rgba(239, 134, 22, 0.5)', 'rgba(167, 59, 198, 0.5)', 'rgba(239, 134, 22, 0.5)'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        onClick={onCloseSlide}
        style={{ display: 'inline-block', width: 'clamp(70px, 30vw, 220px)', height: 'clamp(70px, 30vw, 220px)', borderRadius: '50%', border: '3px solid rgba(239, 134, 22, 0.5)', overflow: 'hidden', cursor: 'pointer' }}
      >
        <img src={logo} alt="Close" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
    </div>
    <div style={{ position: 'absolute', top: 'calc(clamp(3rem, 10vw, 8.5rem) + clamp(70px, 30vw, 220px) + 3rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2 }}>
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(34, 197, 94)' }}>KARMAN</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>
        Amsterdam-based techno organization, born from a desire to restore the raw, intimate spirit of underground gatherings.
      </p>
    </div>
  </motion.div>
);

export const Code49Content = ({ onBack, onCloseSlide }) => (
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
    {/* Close button - circle with image */}
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center', marginBottom: 'clamp(1rem, 3vw, 3rem)' }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1], borderColor: ['rgba(239, 134, 22, 0.5)', 'rgba(167, 59, 198, 0.5)', 'rgba(239, 134, 22, 0.5)'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        onClick={onCloseSlide}
        style={{ display: 'inline-block', width: 'clamp(70px, 30vw, 220px)', height: 'clamp(70px, 30vw, 220px)', borderRadius: '50%', border: '3px solid rgba(239, 134, 22, 0.5)', overflow: 'hidden', cursor: 'pointer' }}
      >
        <img src={logo} alt="Close" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
    </div>
    <div style={{ position: 'absolute', top: 'calc(clamp(3rem, 10vw, 8.5rem) + clamp(70px, 30vw, 220px) + 3rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2 }}>
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(59, 130, 246)' }}>CODE 49</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>
        De nr.1 Businessclub voor MKB-ondernemers die willen doorschalen in een AI-first economie
      </p>
    </div>
  </motion.div>
);

export const TattooShopContent = ({ onBack, onCloseSlide }) => (
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
    {/* Close button - circle with image */}
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center', marginBottom: 'clamp(1rem, 3vw, 3rem)' }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1], borderColor: ['rgba(239, 134, 22, 0.5)', 'rgba(167, 59, 198, 0.5)', 'rgba(239, 134, 22, 0.5)'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        onClick={onCloseSlide}
        style={{ display: 'inline-block', width: 'clamp(70px, 30vw, 220px)', height: 'clamp(70px, 30vw, 220px)', borderRadius: '50%', border: '3px solid rgba(239, 134, 22, 0.5)', overflow: 'hidden', cursor: 'pointer' }}
      >
        <img src={logo} alt="Close" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
    </div>
    <div style={{ position: 'absolute', top: 'calc(clamp(3rem, 10vw, 8.5rem) + clamp(70px, 30vw, 220px) + 3rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2 }}>
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(168, 85, 247)' }}>TATTOO SHOP</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>
        Our focus goes beyond body art; we channel personal stories into spiritual expressions.
      </p>
    </div>
  </motion.div>
);

export const Slide4Content = ({ onBack, onCloseSlide }) => (
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
    {/* Close button - circle with image */}
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center', marginBottom: 'clamp(1rem, 3vw, 3rem)' }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1], borderColor: ['rgba(239, 134, 22, 0.5)', 'rgba(167, 59, 198, 0.5)', 'rgba(239, 134, 22, 0.5)'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        onClick={onCloseSlide}
        style={{ display: 'inline-block', width: 'clamp(70px, 30vw, 220px)', height: 'clamp(70px, 30vw, 220px)', borderRadius: '50%', border: '3px solid rgba(239, 134, 22, 0.5)', overflow: 'hidden', cursor: 'pointer' }}
      >
        <img src={logo} alt="Close" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
    </div>
    <div style={{ position: 'absolute', top: 'calc(clamp(3rem, 10vw, 8.5rem) + clamp(70px, 30vw, 220px) + 3rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2 }}>
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(249, 115, 22)' }}>Slide 4</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>Description</p>
    </div>
  </motion.div>
);

export const Slide5Content = ({ onBack, onCloseSlide }) => (
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
    {/* Close button - circle with image */}
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center', marginBottom: 'clamp(1rem, 3vw, 3rem)' }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1], borderColor: ['rgba(239, 134, 22, 0.5)', 'rgba(167, 59, 198, 0.5)', 'rgba(239, 134, 22, 0.5)'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        onClick={onCloseSlide}
        style={{ display: 'inline-block', width: 'clamp(70px, 30vw, 220px)', height: 'clamp(70px, 30vw, 220px)', borderRadius: '50%', border: '3px solid rgba(239, 134, 22, 0.5)', overflow: 'hidden', cursor: 'pointer' }}
      >
        <img src={logo} alt="Close" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
    </div>
    <div style={{ position: 'absolute', top: 'calc(clamp(3rem, 10vw, 8.5rem) + clamp(70px, 30vw, 220px) + 3rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2 }}>
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(236, 72, 153)' }}>Slide 5</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>Description</p>
    </div>
  </motion.div>
);

export const Slide6Content = ({ onBack, onCloseSlide }) => (
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
    {/* Close button - circle with image */}
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center', marginBottom: 'clamp(1rem, 3vw, 3rem)' }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1], borderColor: ['rgba(239, 134, 22, 0.5)', 'rgba(167, 59, 198, 0.5)', 'rgba(239, 134, 22, 0.5)'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        onClick={onCloseSlide}
        style={{ display: 'inline-block', width: 'clamp(70px, 30vw, 220px)', height: 'clamp(70px, 30vw, 220px)', borderRadius: '50%', border: '3px solid rgba(239, 134, 22, 0.5)', overflow: 'hidden', cursor: 'pointer' }}
      >
        <img src={logo} alt="Close" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
    </div>
    <div style={{ position: 'absolute', top: 'calc(clamp(3rem, 10vw, 8.5rem) + clamp(70px, 30vw, 220px) + 3rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2 }}>
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(139, 92, 246)' }}>Slide 6</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>Description</p>
    </div>
  </motion.div>
);

export const Slide7Content = ({ onBack, onCloseSlide }) => (
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
    {/* Close button - circle with image */}
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center', marginBottom: 'clamp(1rem, 3vw, 3rem)' }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1], borderColor: ['rgba(239, 134, 22, 0.5)', 'rgba(167, 59, 198, 0.5)', 'rgba(239, 134, 22, 0.5)'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        onClick={onCloseSlide}
        style={{ display: 'inline-block', width: 'clamp(70px, 30vw, 220px)', height: 'clamp(70px, 30vw, 220px)', borderRadius: '50%', border: '3px solid rgba(239, 134, 22, 0.5)', overflow: 'hidden', cursor: 'pointer' }}
      >
        <img src={logo} alt="Close" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
    </div>
    <div style={{ position: 'absolute', top: 'calc(clamp(3rem, 10vw, 8.5rem) + clamp(70px, 30vw, 220px) + 3rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2 }}>
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(14, 165, 233)' }}>Slide 7</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>Description</p>
    </div>
  </motion.div>
);

export const Slide8Content = ({ onBack, onCloseSlide }) => (
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
    {/* Close button - circle with image */}
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center', marginBottom: 'clamp(1rem, 3vw, 3rem)' }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1], borderColor: ['rgba(239, 134, 22, 0.5)', 'rgba(167, 59, 198, 0.5)', 'rgba(239, 134, 22, 0.5)'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        onClick={onCloseSlide}
        style={{ display: 'inline-block', width: 'clamp(70px, 30vw, 220px)', height: 'clamp(70px, 30vw, 220px)', borderRadius: '50%', border: '3px solid rgba(239, 134, 22, 0.5)', overflow: 'hidden', cursor: 'pointer' }}
      >
        <img src={logo} alt="Close" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
    </div>
    <div style={{ position: 'absolute', top: 'calc(clamp(3rem, 10vw, 8.5rem) + clamp(70px, 30vw, 220px) + 3rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2 }}>
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(34, 197, 94)' }}>Slide 8</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>Description</p>
    </div>
  </motion.div>
);

export const RengiFoodsContent = ({ onBack, onCloseSlide }) => (
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
    {/* Close button - circle with image */}
    <div style={{ position: 'absolute', top: 'clamp(3rem, 10vw, 8.5rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2, textAlign: 'center', marginBottom: 'clamp(1rem, 3vw, 3rem)' }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1], borderColor: ['rgba(239, 134, 22, 0.5)', 'rgba(167, 59, 198, 0.5)', 'rgba(239, 134, 22, 0.5)'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        onClick={onCloseSlide}
        style={{ display: 'inline-block', width: 'clamp(70px, 30vw, 220px)', height: 'clamp(70px, 30vw, 220px)', borderRadius: '50%', border: '3px solid rgba(239, 134, 22, 0.5)', overflow: 'hidden', cursor: 'pointer' }}
      >
        <img src={logo} alt="Close" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
    </div>
    <div style={{ position: 'absolute', top: 'calc(clamp(3rem, 10vw, 8.5rem) + clamp(70px, 30vw, 220px) + 3rem)', left: '50%', transform: 'translateX(-50%)', width: 'clamp(16rem, 90vw, 85rem)', zIndex: 2 }}>
      <h1 style={{ fontSize: 'clamp(28px, 8vw, 72px)', marginTop: 0, marginBottom: 'clamp(0.8rem, 2vw, 1.8rem)', color: 'rgb(251, 146, 60)' }}>RENGI FOODS</h1>
      <p style={{ fontSize: 'clamp(14px, 4vw, 28px)', margin: 0, lineHeight: '1.6' }}>
        Rengi Foods captures the vibrant spirit of Korean street food, offering authentic and affordable flavors.
      </p>
    </div>
  </motion.div>
);

export const TeachersContent = ({ onBack, onBackToButton, activeView }) => (
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
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          width="clamp(80.5px, 25.2vw, 151.2px)" height="clamp(80.5px, 25.2vw, 151.2px)" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible', width: 'clamp(80.5px, 25.2vw, 151.2px)', height: 'clamp(80.5px, 25.2vw, 151.2px)', pointerEvents: 'none', scale: 1.5 }}>
          <g style={{ overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
              <clipPath id="triangle-teachers-clip">
                <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" />
              </clipPath>
            </defs>
            <image href={knight} x="36" y="89.5" width="232" height="204" preserveAspectRatio="xMidYMid slice" clipPath="url(#triangle-teachers-clip)" style={{pointerEvents: 'none'}} />
            <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" fill="rgba(0,0,0,0.001)" pointerEvents="all" onClick={() => onBackToButton && onBackToButton('button2')} style={{ cursor: 'pointer' }} />
            <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" fill="none" stroke="rgba(239, 134, 22, 0.75)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" className="breathStrokeButton2" style={{animation: 'breathStrokeButton2 2.5s ease-in-out infinite'}} />
          </g>
        </motion.svg>
      </div>
    </div>
  </div>
);

export const MindContent = ({ onBack, onBackToButton, activeView }) => (
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
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          width="clamp(80.5px, 25.2vw, 151.2px)" height="clamp(80.5px, 25.2vw, 151.2px)" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible', width: 'clamp(80.5px, 25.2vw, 151.2px)', height: 'clamp(80.5px, 25.2vw, 151.2px)', pointerEvents: 'none', scale: 1.5 }}>
          <g style={{ overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
              <clipPath id="triangle-mind-clip">
                <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" />
              </clipPath>
            </defs>
            <image href={knight} x="32" y="129.5" width="232" height="204" preserveAspectRatio="xMidYMid slice" clipPath="url(#triangle-mind-clip)" style={{pointerEvents: 'none'}} />
            <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" fill="rgba(0,0,0,0.001)" pointerEvents="all" onClick={() => onBackToButton && onBackToButton('button3')} style={{ cursor: 'pointer' }} />
            <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" fill="none" stroke="rgba(34, 197, 94, 0.75)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" className="breathStrokeButton3" style={{animation: 'breathStrokeMind 2.5s ease-in-out infinite'}} />
          </g>
        </motion.svg>
      </div>
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
            <image href={knight} x="30" y="100.5" width="232" height="204" preserveAspectRatio="xMidYMid slice" clipPath="url(#triangle-soul-clip)" style={{pointerEvents: 'none'}} />
            <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" fill="rgba(0,0,0,0.001)" pointerEvents="all" onClick={() => onBackToButton && onBackToButton('button1')} style={{ cursor: 'pointer' }} />
            <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" fill="none" stroke="rgba(245, 158, 11, 0.75)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" className="breathStrokeButton1" style={{animation: 'breathStrokeSoul 2.5s ease-in-out infinite'}} />
          </g>
        </motion.svg>
      </div>
    </div>
  </div>
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
  '/soul': SoulContent
};
