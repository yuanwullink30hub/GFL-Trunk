import React, { memo } from 'react';

const DataPage = memo(({ isVisible, onBack }) => {
  // Always render content - let parent wrapper handle exit animations
  // Use CSS opacity transition for smooth fade
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div style={{
        minWidth: '40vw',
        minHeight: '30vh',
        border: '1px solid rgba(34, 211, 238, 0.3)',
        borderRadius: '0.5rem',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a5f3fc',
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
        fontSize: 'max(14px, 0.8vw)',
        gap: '1rem',
        padding: '2rem'
      }}>
        {/* Data/Monitor page content */}
        <div style={{ fontSize: 'max(18px, 1vw)', fontWeight: 'bold', marginBottom: '1rem' }}>
          DATA STREAM
        </div>
        <div style={{ fontSize: 'max(13px, 0.7vw)', textAlign: 'center', marginBottom: '1rem' }}>
          Content coming soon...
        </div>
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(34, 211, 238, 0.2)',
            border: '1px solid rgba(34, 211, 238, 0.5)',
            color: '#a5f3fc',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
            fontSize: 'max(11px, 0.6vw)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(34, 211, 238, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(34, 211, 238, 0.2)';
          }}
        >
          ← TERUG
        </button>
      </div>
    </div>
  );
});

DataPage.displayName = 'DataPage';

export default DataPage;
