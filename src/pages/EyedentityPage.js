import React, { memo } from 'react';

const EyedentityPage = memo(({ isVisible, onBack }) => {
  // Content only renders fully when visible or animating toward it
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // No background - transparent over grid
      }}
    >
      {/* Render content when visible, placeholder when not */}
      {isVisible ? (
      <div style={{
        minWidth: '40vw',
        minHeight: '30vh',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '0.5rem',
        backgroundColor: 'rgba(30, 30, 30, 0.2)',

        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
        fontSize: 'max(14px, 0.8vw)',
        gap: '1rem',
        padding: '2rem'
      }}>
        {/* Eyedentity/Menu page content */}
        <div style={{ fontSize: 'max(18px, 1vw)', fontWeight: 'bold', marginBottom: '1rem' }}>
          EYEDENTITY
        </div>
        <div style={{ fontSize: 'max(13px, 0.7vw)', textAlign: 'center', marginBottom: '1rem' }}>
          Welcome to Eyedentity
        </div>
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
            fontSize: 'max(11px, 0.6vw)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ← TERUG
        </button>
      </div>
      ) : (
        <div style={{ width: '40vw', height: '30vh' }} />
      )}
    </div>
  );
});

EyedentityPage.displayName = 'EyedentityPage';

export default EyedentityPage;
