import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../images/logo.png';
import karmanevents from '../images/slideshow images/karmaneventsPNG.png';
import '../styles/logo.css';

const Karman = () => {
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
          border: '3px solid rgba(34, 197, 94, 0.5)'
        }}>
          <img src={karmanevents} alt="Karman Events" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.3)' }} />
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 8vw, 64px)',
          marginBottom: '20px',
          color: 'rgb(167, 59, 198)'
        }}>
          KARMAN
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 4vw, 24px)',
          maxWidth: '800px',
          margin: '0 auto 60px',
          lineHeight: '1.6',
          color: '#FFFEF0'
        }}>
          Amsterdam-based techno organization, born from a desire to restore the raw, intimate spirit of underground gatherings. Nights defined by music, energy, and togetherness.
        </p>

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="breathBorderAnimation"
          style={{
            marginTop: '60px',
            padding: '15px 40px',
            fontSize: '16px',
            backgroundColor: 'transparent',
            color: '#FFFEF0',
            border: '2px solid #22c55e',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#22c55e';
            e.target.style.borderColor = '#22c55e';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.borderColor = '#22c55e';
          }}
        >
          Back to Home
        </motion.button>
      </div>
    </div>
  );
};

export default Karman;
