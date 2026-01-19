import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../images/logo.png';
import placeholder7 from '../images/slideshow images/placeholder7.svg';
import '../styles/logo.css';

const Slide7 = () => {
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

        <div style={{
          width: 'clamp(150px, 40vw, 300px)',
          height: 'clamp(150px, 40vw, 300px)',
          margin: '0 auto 40px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid rgba(14, 165, 233, 0.5)'
        }}>
          <img src={placeholder7} alt="Slide 7" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 8vw, 64px)',
          marginBottom: '20px',
          color: 'rgb(167, 59, 198)'
        }}>
          Slide 7
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 4vw, 24px)',
          maxWidth: '800px',
          margin: '0 auto 60px',
          lineHeight: '1.6',
          color: '#FFFEF0'
        }}>
          Description for Slide 7 - Coming soon.
        </p>

        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/')}
          animate={{ borderColor: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            padding: '15px 40px',
            fontSize: '16px',
            backgroundColor: 'transparent',
            color: '#FFFEF0',
            border: '2px solid #0ea5e9',
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

export default Slide7;
