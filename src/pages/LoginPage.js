import React, { memo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LoginPage = memo(({ isVisible, onBack }) => {
  const { t } = useLanguage();
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
          {t('pages.loginPage.title')}
        </div>
        <div style={{ fontSize: 'max(13px, 0.7vw)', textAlign: 'center', marginBottom: '1rem' }}>
          {t('pages.loginPage.placeholder')}
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
          {t('pages.loginPage.back')}
        </button>
      </div>
    </div>
  );
});

LoginPage.displayName = 'LoginPage';

export default LoginPage;
