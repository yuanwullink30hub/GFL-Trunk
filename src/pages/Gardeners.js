import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../images/logo.png';
import '../styles/logo.css';

const Gardeners = () => {
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

        <h1 style={{
          fontSize: 'clamp(32px, 8vw, 64px)',
          marginBottom: '20px',
          color: 'rgb(167, 59, 198)'
        }}>
          Our Gardeners
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 4vw, 24px)',
          maxWidth: '800px',
          margin: '0 auto 60px',
          lineHeight: '1.6',
          color: '#FFFEF0'
        }}>
          Welcome to the Gardeners page! This is where you'll find information about our team and collaborators.
        </p>

        {/* Content Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
          marginTop: '60px'
        }}>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              style={{
                padding: '30px',
                background: 'rgba(167, 59, 198, 0.1)',
                border: '2px solid rgba(239, 134, 22, 0.5)',
                borderRadius: '12px',
                minHeight: '250px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'rgba(239, 134, 22, 0.2)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  color: '#ef8616'
                }}
              >
                🌿
              </div>
              <h3 style={{
                fontSize: '24px',
                marginBottom: '10px',
                color: '#ef8616'
              }}>
                Gardener {item}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#FFFEF0',
                opacity: 0.8
              }}>
                Specialist in sustainable growth and community building
              </p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '80px',
            padding: '15px 40px',
            fontSize: '16px',
            backgroundColor: 'transparent',
            color: '#FAF9F6',
            border: '2px solid #FFFEF0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ef8616';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Gardeners;
