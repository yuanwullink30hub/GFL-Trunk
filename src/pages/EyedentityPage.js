import React, { useState, useEffect } from 'react';

const EyedentityPage = ({ isVisible, onBack }) => {
  const [showContent, setShowContent] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowContent(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
      setIsExiting(false);
    }
  }, [isVisible]);

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      onBack();
    }, 1500);
  };

  if (!isVisible && !isExiting) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: showContent && !isExiting ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.85)',
        zIndex: 95,
        opacity: showContent && !isExiting ? 1 : 0,
        pointerEvents: showContent && !isExiting ? 'auto' : 'none',
        transition: 'opacity 1.5s ease, transform 1.5s ease',
      }}
    >
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
          onClick={handleBack}
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
          ← BACK
        </button>
      </div>
    </div>
  );
};

export default EyedentityPage;
