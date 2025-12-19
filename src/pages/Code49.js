import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../images/logo.png';
import club49logo from '../images/slideshow images/club49-logo.png';
import '../styles/logo.css';

const Code49 = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff)',
      color: '#FFFEF0',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Logo - Navigate back to main page */}
        <button
          onClick={() => navigate('/')}
          className="logo-btn"
          style={{ marginBottom: '40px' }}
          title="Go to landing page"
        >
          <img src={logo} alt="Garden For Life Logo" className="logo-img logo-md" />
        </button>

        <div style={{
          width: 'clamp(150px, 40vw, 300px)',
          height: 'clamp(150px, 40vw, 300px)',
          margin: '0 auto 40px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid rgba(59, 130, 246, 0.5)'
        }}>
          <img src={club49logo} alt="Code 49" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(0.85)' }} />
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 8vw, 64px)',
          marginBottom: '20px',
          color: 'rgb(167, 59, 198)'
        }}>
          CODE 49
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 4vw, 24px)',
          maxWidth: '800px',
          margin: '0 auto 60px',
          lineHeight: '1.6',
          color: '#FFFEF0'
        }}>
          De nr.1 Businessclub voor MKB-ondernemers die willen doorschalen in een AI-first economie
        </p>

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '60px',
            padding: '15px 40px',
            fontSize: '16px',
            backgroundColor: 'transparent',
            color: '#FFFEF0',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#3b82f6';
            e.target.style.borderColor = '#3b82f6';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.borderColor = '#3b82f6';
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Code49;
