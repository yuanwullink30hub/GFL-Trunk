import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../images/logo.png';
import '../styles/logo.css';

const Soul = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
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
          Soul
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 4vw, 24px)',
          maxWidth: '800px',
          margin: '0 auto 60px',
          lineHeight: '1.6',
          color: '#FFFEF0'
        }}>
          Welcome to the Soul page! Connect with your inner self and discover spiritual harmony.
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
                border: '2px solid rgba(34, 197, 94, 0.5)',
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
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  color: '#22c55e'
                }}
              >
                ✨
              </div>
              <h3 style={{
                fontSize: '24px',
                marginBottom: '10px',
                color: '#22c55e'
              }}>
                Soul Journey {item}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#FFFEF0',
                opacity: 0.8
              }}>
                Nurture your spirit and embrace your true essence
              </p>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/')}
          animate={{ borderColor: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
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
        >
          Back to Home
        </motion.button>
      </div>
    </div>
  );
};

export default Soul;
