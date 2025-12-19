// Slide content components - all content lives here for single-page experience
import React from 'react';

// Shared back button component
export const BackButton = ({ onBack }) => (
  <button
    onClick={onBack}
    style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      zIndex: 1001,
      background: 'rgba(0,0,0,0.5)',
      border: '2px solid #ef8616',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ef8616',
      fontSize: '24px'
    }}
  >
    ←
  </button>
);

// Individual slide content components
export const KarmanContent = ({ onBack }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
    <BackButton onBack={onBack} />
    <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginTop: '80px', marginBottom: '20px', color: 'rgb(34, 197, 94)' }}>KARMAN</h1>
    <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      Amsterdam-based techno organization, born from a desire to restore the raw, intimate spirit of underground gatherings.
    </p>
  </div>
);

export const Code49Content = ({ onBack }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
    <BackButton onBack={onBack} />
    <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginTop: '80px', marginBottom: '20px', color: 'rgb(59, 130, 246)' }}>CODE 49</h1>
    <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      De nr.1 Businessclub voor MKB-ondernemers die willen doorschalen in een AI-first economie
    </p>
  </div>
);

export const TattooShopContent = ({ onBack }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
    <BackButton onBack={onBack} />
    <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginTop: '80px', marginBottom: '20px', color: 'rgb(168, 85, 247)' }}>TATTOO SHOP</h1>
    <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      Our focus goes beyond body art; we channel personal stories into spiritual expressions.
    </p>
  </div>
);

export const Slide4Content = ({ onBack }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
    <BackButton onBack={onBack} />
    <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginTop: '80px', marginBottom: '20px', color: 'rgb(249, 115, 22)' }}>Slide 4</h1>
    <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>Description</p>
  </div>
);

export const Slide5Content = ({ onBack }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
    <BackButton onBack={onBack} />
    <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginTop: '80px', marginBottom: '20px', color: 'rgb(236, 72, 153)' }}>Slide 5</h1>
    <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>Description</p>
  </div>
);

export const Slide6Content = ({ onBack }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
    <BackButton onBack={onBack} />
    <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginTop: '80px', marginBottom: '20px', color: 'rgb(139, 92, 246)' }}>Slide 6</h1>
    <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>Description</p>
  </div>
);

export const Slide7Content = ({ onBack }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
    <BackButton onBack={onBack} />
    <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginTop: '80px', marginBottom: '20px', color: 'rgb(14, 165, 233)' }}>Slide 7</h1>
    <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>Description</p>
  </div>
);

export const Slide8Content = ({ onBack }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
    <BackButton onBack={onBack} />
    <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginTop: '80px', marginBottom: '20px', color: 'rgb(34, 197, 94)' }}>Slide 8</h1>
    <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>Description</p>
  </div>
);

export const RengiFoodsContent = ({ onBack }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
    <BackButton onBack={onBack} />
    <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginTop: '80px', marginBottom: '20px', color: 'rgb(251, 146, 60)' }}>RENGI FOODS</h1>
    <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      Rengi Foods captures the vibrant spirit of Korean street food, offering authentic and affordable flavors.
    </p>
  </div>
);

export const TeachersContent = ({ onBack }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
    <BackButton onBack={onBack} />
    <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginTop: '80px', marginBottom: '20px', color: '#0c0418ff' }}>TEACHERS</h1>
    <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      Empowering educators to inspire the next generation.
    </p>
  </div>
);

export const MindContent = ({ onBack }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
    <BackButton onBack={onBack} />
    <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginTop: '80px', marginBottom: '20px', color: '#22c55e' }}>MIND</h1>
    <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      Nurturing mental growth and consciousness.
    </p>
  </div>
);

export const SoulContent = ({ onBack }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
    <BackButton onBack={onBack} />
    <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginTop: '80px', marginBottom: '20px', color: '#f59e0b' }}>SOUL</h1>
    <p style={{ fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      Connecting with deeper purpose and meaning.
    </p>
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
