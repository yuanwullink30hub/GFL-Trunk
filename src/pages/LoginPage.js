import React, { memo } from 'react';

const LoginPage = memo(({ isVisible, onBack }) => {
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
        border: '1px solid rgba(21, 179, 21, 0.3)',
        borderRadius: '0.5rem',
        backgroundColor: 'rgba(21, 128, 61, 0.1)',

        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#86efac',
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
        fontSize: 'max(14px, 0.8vw)',
        gap: '1rem',
        padding: '2rem'
      }}>
        {/* Login page content */}
        <div style={{ fontSize: 'max(18px, 1vw)', fontWeight: 'bold', marginBottom: '1rem' }}>
          LOGIN
        </div>
        <div style={{ fontSize: 'max(13px, 0.7vw)', textAlign: 'center', marginBottom: '1rem' }}>
          Authentication coming soon...
        </div>
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(21, 179, 21, 0.2)',
            border: '1px solid rgba(21, 179, 21, 0.5)',
            color: '#86efac',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
            fontSize: 'max(11px, 0.6vw)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(21, 179, 21, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(21, 179, 21, 0.2)';
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

LoginPage.displayName = 'LoginPage';

export default LoginPage;
