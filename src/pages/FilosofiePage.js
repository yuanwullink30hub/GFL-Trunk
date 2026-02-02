import React, { memo } from 'react';

const FilosofiePage = memo(({ isVisible, onBack }) => {
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
        border: '1px solid rgba(167, 139, 250, 0.3)',
        borderRadius: '0.5rem',
        backgroundColor: 'rgba(88, 28, 135, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#c4b5fd',
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
        fontSize: 'max(14px, 0.8vw)',
        gap: '1rem',
        padding: '2rem'
      }}>
        {/* Filosofie page content */}
        <div style={{ fontSize: 'max(18px, 1vw)', fontWeight: 'bold', marginBottom: '1rem' }}>
          FILOSOFIE
        </div>
        <div style={{ fontSize: 'max(13px, 0.7vw)', textAlign: 'center', marginBottom: '1rem' }}>
          Content coming soon...
        </div>
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(167, 139, 250, 0.2)',
            border: '1px solid rgba(167, 139, 250, 0.5)',
            color: '#c4b5fd',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
            fontSize: 'max(11px, 0.6vw)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(167, 139, 250, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(167, 139, 250, 0.2)';
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

FilosofiePage.displayName = 'FilosofiePage';

export default FilosofiePage;
